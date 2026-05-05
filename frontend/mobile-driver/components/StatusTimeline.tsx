import React from 'react';
import { View, Text } from 'react-native';

interface StatusHistoryItem {
  id: string;
  status: string;
  note?: string;
  location?: string;
  createdAt: string;
}

interface StatusTimelineProps {
  history: StatusHistoryItem[];
}

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Đã phân công',
  PICKED_UP: 'Đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-500',
  PICKED_UP: 'bg-indigo-500',
  IN_TRANSIT: 'bg-yellow-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <Text className="text-gray-500 italic text-sm">
        Chưa có lịch sử trạng thái.
      </Text>
    );
  }

  return (
    <View className="flex-col pb-2">
      {history.map((item, index) => {
        const isLast = index === history.length - 1;
        const colorClass = STATUS_COLORS[item.status] || 'bg-gray-400';
        const label = STATUS_LABELS[item.status] || item.status;

        return (
          <View key={item.id} className="flex-row items-start relative">
            {/* Timeline Line */}
            {!isLast && (
              <View className="absolute left-[11px] top-[14px] bottom-[-24px] w-[2px] bg-gray-200" />
            )}

            {/* Timeline Dot */}
            <View className="w-6 items-center mt-1 z-10">
              <View className={`w-3 h-3 rounded-full ${colorClass} ring-4 ring-white`} />
            </View>

            {/* Content */}
            <View className="flex-1 ml-3 pb-6">
              <Text className="text-sm font-semibold text-gray-900">{label}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {new Date(item.createdAt).toLocaleString('vi-VN')}
              </Text>
              {item.location ? (
                <Text className="text-xs text-gray-600 mt-1 flex-row items-center">
                  📍 {item.location}
                </Text>
              ) : null}
              {item.note ? (
                <Text className="text-xs text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-md">
                  📝 {item.note}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
