import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

interface TimelineItem {
    status: string;
    note: string;         // Backend trả về note
    timestamp: string;    // Backend trả về timestamp
}

export const SeasonTimeline = ({ updates }: { updates: TimelineItem[] }) => {
    return (
        <View className="mt-4">
            {updates.map((item, index) => (
                <View key={index} className="flex-row mb-6">
                    <View className="items-center mr-4">
                        <View className="bg-green-100 rounded-full p-1">
                            <CheckCircle2 size={20} color="#22c55e" />
                        </View>
                        {index !== updates.length - 1 && <View className="w-0.5 flex-1 bg-green-200 my-1" />}
                    </View>

                    <View className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="text-xs text-gray-400 mb-1">
                            {/* Chuyển timestamp của backend thành ngày giờ VN */}
                            {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </Text>
                        <Text className="font-bold text-gray-800 text-base">{item.status}</Text>
                        {/* Hiển thị note thay vì description */}
                        <Text className="text-gray-600 text-sm mt-1">{item.note}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};