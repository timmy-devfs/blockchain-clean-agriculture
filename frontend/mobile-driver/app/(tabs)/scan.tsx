import React from "react";
import { View, Text } from "react-native";

// Placeholder — BIC-037 sẽ implement đầy đủ QR scanner
export default function ScanScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-900">
      <Text className="text-6xl mb-4">📷</Text>
      <Text className="text-white text-lg font-semibold">Quét QR Code</Text>
      <Text className="text-gray-400 text-sm mt-2 text-center px-8">
        Tính năng này sẽ được triển khai đầy đủ trong BIC-037
      </Text>
    </View>
  );
}