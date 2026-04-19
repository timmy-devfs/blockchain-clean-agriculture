import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Zap, ZapOff } from 'lucide-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  // Xử lý xin quyền Camera khi mở Tab
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-center text-gray-700 text-base mb-4">
          Chúng tôi cần quyền truy cập Camera để quét mã nguồn gốc nông sản.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-green-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-center">Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hàm cốt lõi: Xử lý dữ liệu khi quét trúng mã QR
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let finalSeasonId = data;

      // Xử lý bóc tách URL từ Backend của Hậu sinh ra
      // Ví dụ data: "http://192.168.1.x:8090/api/chain/trace/SS-2024-001"
      if (data.includes('/api/chain/trace/')) {
        const parts = data.split('/');
        finalSeasonId = parts[parts.length - 1]; // Lấy phần tử cuối cùng
      }
      // Xử lý bóc tách link Frontend (Nếu mã in trên bao bì là link web)
      else if (data.includes('/trace/')) {
        const parts = data.split('/trace/');
        finalSeasonId = parts[1];
      }

      console.log("Mã gốc quét được:", data);
      console.log("Season ID đã trích xuất:", finalSeasonId);

      // Chuyển hướng sang trang Truy xuất nguồn gốc
      router.push({
        pathname: "/trace/[qrCode]",
        params: { qrCode: finalSeasonId }
      });

      // Reset trạng thái sau 2 giây để người dùng ấn Back ra quét mã khác được luôn
      setTimeout(() => setScanned(false), 2000);

    } catch (error) {
      Alert.alert("Lỗi mã QR", "Mã QR không hợp lệ hoặc không thuộc hệ thống BICAP.");
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* 1. Camera để độc lập, KHÔNG chứa children bên trong */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torchEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* 2. Khung Viewfinder nổi lên trên (Absolute) */}
      <View style={StyleSheet.absoluteFillObject} className="z-10 pointer-events-none bg-black/60">
        <View className="flex-1 items-center justify-center">
          <View className="w-72 h-72 border-2 border-green-500 rounded-3xl bg-transparent" />
          <Text className="text-white mt-8 text-center px-10 text-base font-medium">
            Hướng Camera vào mã QR trên bao bì sản phẩm
          </Text>
        </View>
      </View>

      {/* 3. Nút Flash nổi lên trên */}
      <TouchableOpacity
        onPress={() => setTorchEnabled(!torchEnabled)}
        className="absolute bottom-16 self-center bg-black/50 p-4 rounded-full border border-white/30 z-20"
      >
        {torchEnabled ? <Zap color="#fef08a" size={28} /> : <ZapOff color="white" size={28} />}
      </TouchableOpacity>
    </View>
  );
}