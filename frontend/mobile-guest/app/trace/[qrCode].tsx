import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTrace } from '@/hooks/useTrace';
import { SeasonTimeline } from '@/components/SeasonTimeline';
import { BlockchainBadge } from '@/components/BlockchainBadge';
import { Share2, MapPin, Warehouse } from 'lucide-react-native';

export default function TraceScreen() {
    const { qrCode } = useLocalSearchParams<{ qrCode: string }>();
    const { data: trace, isLoading, error } = useTrace(qrCode);

    const onShare = async () => {
        try {
            await Share.share({
                message: `Truy xuất nguồn gốc sản phẩm BICAP: https://bicap.vn/trace/${qrCode}`,
            });
        } catch (err) {
            console.log(err);
        }
    };

    if (isLoading) return <ActivityIndicator className="flex-1" size="large" color="#22c55e" />;

    if (error || !trace) {
        return (
            <View className="flex-1 justify-center items-center p-6">
                <Text className="text-lg text-gray-500 text-center">
                    404: Không tìm thấy thông tin sản phẩm - QR Code không hợp lệ [cite: 45]
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="px-4 py-6">
                {/* Farm Info */}
                <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <View className="flex-row items-center mb-4">
                        <Warehouse size={24} color="#22c55e" />
                        <View className="ml-3">
                            {/* Đã sửa thành trace.farmInfo.farmName */}
                            <Text className="text-xl font-bold text-gray-900">{trace.farmInfo?.farmName}</Text>
                            <View className="flex-row items-center mt-1">
                                <MapPin size={12} color="#6b7280" />
                                {/* Đã sửa thành trace.farmInfo.province */}
                                <Text className="text-gray-500 text-xs ml-1">{trace.farmInfo?.province}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Huy hiệu: Vì không có txHash, ta hiện thông báo dựa trên biến verified của backend */}
                    {trace.verified ? (
                        <View className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <Text className="text-blue-800 font-bold text-center">✅ Dữ liệu được bảo vệ bởi VeChain</Text>
                        </View>
                    ) : null}
                </View>

                {/* Timeline Section */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-gray-800">Lịch sử canh tác</Text>
                    <Share2 size={20} color="#22c55e" onPress={onShare} />
                </View>

                {/* Đã đổi tên mảng thành trace.timeline */}
                <SeasonTimeline updates={trace.timeline || []} />
            </View>
        </ScrollView>
    );
}