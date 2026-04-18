import React, { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import NetInfo from "@react-native-community/netinfo";
import { addActionToQueue } from "@/lib/offlineSync";

import { usePickupShipment, useDeliverShipment, useShipmentDetail } from "@/hooks/useShipments";

type ScanStep = "SCAN" | "INFO" | "CAPTURE" | "PREVIEW";

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shipmentId?: string; actionType?: string }>();

  const shipmentId = params.shipmentId || "MOCK_SHIPMENT_ID_123";
  const actionType = params.actionType || "deliver";

  const { data: shipment, isLoading: isLoadingShipment } = useShipmentDetail(shipmentId);

  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("SCAN");
  const [qrData, setQrData] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [enableTorch, setEnableTorch] = useState(false);

  const [recipientName, setRecipientName] = useState<string>("");

  const cameraRef = useRef<CameraView>(null);

  const { mutateAsync: pickupAsync, isPending: isPickingUp } = usePickupShipment();
  const { mutateAsync: deliverAsync, isPending: isDelivering } = useDeliverShipment();
  const isPending = isPickingUp || isDelivering;

  const MOCK_SHIPMENT = {
    farmName: "Trang trại Hữu cơ Đà Lạt (Dữ liệu Test)",
    retailerName: "Siêu thị Co.op Mart Q1 (Dữ liệu Test)"
  };
  const activeShipment = shipment || MOCK_SHIPMENT;

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900 px-6">
        <Text className="text-white text-center text-lg mb-6">BICAP Driver cần quyền truy cập Camera.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-green-500 py-3 px-6 rounded-xl">
          <Text className="text-white font-bold text-base">Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (step !== "SCAN") return;
    setQrData(data);
    setStep("INFO");
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (photo && photo.uri) {
          setPhotoUri(photo.uri);
          setStep("PREVIEW");
        }
      } catch (error) {
        Alert.alert("Lỗi", "Không thể chụp ảnh, vui lòng thử lại.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!shipmentId || !photoUri || !qrData) return;

    const finalRecipientName = recipientName.trim() || activeShipment?.retailerName;
    const netState = await NetInfo.fetch();

    if (!netState.isConnected) {
      // ⚠️ MẤT MẠNG -> LƯU VÀO OFFLINE QUEUE
      const actionPayload = actionType === "pickup" 
        ? { id: shipmentId, qrCode: qrData, photoUri }
        : { id: shipmentId, recipientName: finalRecipientName, photoUri };

      await addActionToQueue({
        id: `offline_${Date.now()}`,
        type: actionType as "pickup" | "deliver",
        payload: actionPayload,
        timestamp: Date.now()
      });

      Alert.alert("Mất mạng 📡", "Đã lưu dữ liệu. Sẽ tự động gửi khi có mạng lại.", [{ text: "OK", onPress: () => router.back() }]);
      return;
    }

    // ─── BƯỚC 2: CÓ MẠNG -> GỌI API NHƯ BÌNH THƯỜNG ──────────────────────
    try {
      if (actionType === "pickup") {
        await pickupAsync({ id: shipmentId, qrCode: qrData, photoUri });
        Alert.alert("Thành công", "Đã xác nhận nhận hàng tại Farm.");
      } else if (actionType === "deliver") {
        await deliverAsync({ id: shipmentId, recipientName: finalRecipientName, photoUri });
        Alert.alert("Thành công", `Đã giao hàng thành công cho: ${finalRecipientName}`);
      }

      setTimeout(() => { router.back(); }, 500);

    } catch (error: any) {
      Alert.alert(
        "Lỗi Server (Test Mode)",
        `Đã mô phỏng ${actionType === 'pickup' ? 'Nhận hàng' : 'Giao hàng'} thất bại do chưa bật Backend. Dữ liệu chưa được lưu.`
      );
    }
  };

  const resetState = () => {
    setQrData(null);
    setPhotoUri(null);
    setRecipientName("");
    setStep("SCAN");
  };

  if (step === "PREVIEW" && photoUri) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-1 bg-black">
          <Image source={{ uri: photoUri }} className="flex-1" resizeMode="contain" />

          {/* Form nhập tên người nhận */}
          {actionType === 'deliver' && (
            <View className="absolute bottom-32 left-0 right-0 px-6">
              <View className="bg-white/95 p-4 rounded-2xl shadow-lg">
                <Text className="text-gray-800 font-semibold mb-2">
                  Tên người nhận thực tế <Text className="text-gray-400 font-normal text-xs">(Không bắt buộc)</Text>
                </Text>
                <TextInput
                  className="bg-gray-100 px-4 py-3 rounded-xl text-base text-gray-900 border border-gray-200"
                  placeholder={`Mặc định: ${activeShipment.retailerName}`}
                  placeholderTextColor="#9ca3af"
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
              </View>
            </View>
          )}

          <View className="absolute bottom-10 left-0 right-0 px-6 flex-row justify-between">
            <TouchableOpacity onPress={() => setStep("CAPTURE")} disabled={isPending} className={`py-4 px-8 rounded-2xl flex-1 mr-2 items-center ${isPending ? 'bg-gray-600' : 'bg-gray-800'}`}>
              <Text className="text-white font-bold">Chụp lại</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} disabled={isPending} className={`py-4 px-8 rounded-2xl flex-1 ml-2 items-center justify-center flex-row ${isPending ? 'bg-green-300' : 'bg-green-500'}`}>
              {isPending ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Gửi xác nhận</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={enableTorch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={step === "SCAN" ? handleBarcodeScanned : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text className="text-white text-base font-semibold mt-12 text-center">
              {step === "SCAN" && "Di chuyển QR vào giữa khung hình"}
              {step === "INFO" && "Kiểm tra thông tin hàng hóa"}
              {step === "CAPTURE" && "Hãy chụp ảnh hàng hóa thực tế"}
            </Text>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={[styles.viewfinder, (step === "CAPTURE" || step === "INFO") && { borderColor: 'transparent' }]}>
              {step === "SCAN" && (
                <>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </>
              )}
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
            {(step === "SCAN" || step === "CAPTURE") && (
              <TouchableOpacity onPress={() => setEnableTorch(!enableTorch)} className={`p-4 rounded-full absolute right-6 top-6 ${enableTorch ? 'bg-yellow-400' : 'bg-gray-800/80'}`}>
                <Ionicons name={enableTorch ? "flash" : "flash-off"} size={24} color={enableTorch ? "black" : "white"} />
              </TouchableOpacity>
            )}
            {step === "CAPTURE" && (
              <TouchableOpacity onPress={takePicture} className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 mt-10 justify-center items-center shadow-lg">
                <View className="w-16 h-16 rounded-full bg-white border-2 border-black" />
              </TouchableOpacity>
            )}
            {step === "CAPTURE" && (
              <TouchableOpacity onPress={resetState} className="absolute bottom-10">
                <Text className="text-red-400 font-semibold text-base">Hủy (Quay lại)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {step === "INFO" && (
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-50">
            <View className="items-center mb-4"><View className="w-12 h-1.5 bg-gray-300 rounded-full" /></View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Xác nhận thông tin</Text>

            <View className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm text-gray-500">Mã QR đã quét:</Text>
                <Text className="text-xs text-red-500 font-bold px-2 py-0.5 bg-red-100 rounded-md">TEST MODE</Text>
              </View>
              <View className="bg-gray-200 p-3 rounded-lg mb-3 border border-gray-300">
                <Text className="font-mono text-gray-800 text-xs leading-5">{qrData}</Text>
              </View>

              <Text className="text-sm text-gray-500 mb-1">
                {actionType === 'pickup' ? 'Nơi nhận hàng (Farm):' : 'Nơi giao hàng (Retailer):'}
              </Text>

              {isLoadingShipment ? (
                <ActivityIndicator size="small" color="#22c55e" className="self-start mt-1" />
              ) : (
                <Text className="font-semibold text-gray-800">
                  {actionType === 'pickup' ? activeShipment.farmName : activeShipment.retailerName}
                </Text>
              )}
            </View>

            <View className="flex-row">
              <TouchableOpacity onPress={resetState} className="flex-1 bg-gray-100 py-4 rounded-xl items-center mr-2">
                <Text className="text-gray-600 font-bold">Quét lại</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep("CAPTURE")} className="flex-1 bg-green-500 py-4 rounded-xl items-center ml-2">
                <Text className="text-white font-bold">Tiếp tục chụp ảnh</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const overlayColor = "rgba(0,0,0,0.6)";
const styles = StyleSheet.create({
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: overlayColor, justifyContent: "flex-start" },
  middleRow: { flexDirection: "row", height: 250 },
  sideOverlay: { flex: 1, backgroundColor: overlayColor },
  viewfinder: { width: 250, height: 250, backgroundColor: "transparent", position: "relative" },
  bottomOverlay: { flex: 1, backgroundColor: overlayColor, alignItems: "center" },
  corner: { position: "absolute", width: 40, height: 40, borderColor: "#22c55e" },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
});