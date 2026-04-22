import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  if (!permission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900 px-6">
        <Text className="text-white text-center text-lg mb-6">
          Ứng dụng cần quyền truy cập Camera.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-green-500 py-3 px-6 rounded-xl"
        >
          <Text className="text-white font-bold text-base">Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── LOGIC CỐT LÕI: Giữ nguyên từ file 2 ────────────────────────────────
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      let finalSeasonId = data;

      if (data.includes('/api/chain/trace/')) {
        const parts = data.split('/');
        finalSeasonId = parts[parts.length - 1];
      } else if (data.includes('/trace/')) {
        const parts = data.split('/trace/');
        finalSeasonId = parts[1];
      }

      console.log('Mã gốc quét được:', data);
      console.log('Season ID đã trích xuất:', finalSeasonId);

      router.push({
        pathname: '/trace/[qrCode]',
        params: { qrCode: finalSeasonId },
      });

      setTimeout(() => setScanned(false), 2000);
    } catch (error) {
      Alert.alert('Lỗi mã QR', 'Mã QR không hợp lệ hoặc không thuộc hệ thống BICAP.');
      setTimeout(() => setScanned(false), 2000);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {/* Camera phủ toàn màn hình */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchEnabled}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* ─── Overlay layout: giống cấu trúc file 1 ─────────────────────── */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            {scanned
              ? 'Đã quét! Đang xử lý...'
              : 'Hướng Camera vào mã QR trên bao bì sản phẩm'}
          </Text>
        </View>

        {/* Middle row */}
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />

          {/* Viewfinder với 4 góc xanh */}
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.sideOverlay} />
        </View>

        {/* Bottom */}
        <View style={styles.bottomOverlay}>
          {/* Nút Flash — giữ logic toggle từ file 2 */}
          <TouchableOpacity
            onPress={() => setTorchEnabled(!torchEnabled)}
            style={[
              styles.torchButton,
              torchEnabled && styles.torchButtonActive,
            ]}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-off'}
              size={24}
              color={torchEnabled ? 'black' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const overlayColor = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: overlayColor,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  viewfinder: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: overlayColor,
    alignItems: 'center',
    paddingTop: 24,
  },
  torchButton: {
    padding: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(30,30,30,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  torchButtonActive: {
    backgroundColor: '#facc15',
  },
  // 4 góc xanh — giống hệt file 1
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#22c55e',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
});