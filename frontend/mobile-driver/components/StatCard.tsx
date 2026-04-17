import React from "react";
import { View, Text } from "react-native";

interface Props {
  title: string;
  value: string | number;
  icon: string;
  color?: string; // Tailwind bg class
}

export function StatCard({ title, value, icon, color = "bg-green-50" }: Props) {
  return (
    <View className={`flex-1 rounded-2xl ${color} p-4 mr-3`}>
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{title}</Text>
    </View>
  );
}