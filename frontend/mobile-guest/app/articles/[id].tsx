import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { guestApi } from '@/lib/api';
import { ChevronLeft, Share2, Clock, Eye } from 'lucide-react-native';

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    // Gọi API lấy chi tiết (Backend sẽ tự động viewCount++ ở bước này) [cite: 153]
    const { data: article, isLoading } = useQuery({
        queryKey: ['article', id],
        queryFn: () => guestApi.getArticleDetail(id as string),
    });

    const onShare = async () => {
        if (!article) return;
        try {
            await Share.share({
                message: `${article.title} - Đọc thêm tại BICAP: https://bicap.vn/articles/${article.id}`,
            });
        } catch (error) {
            console.log('Lỗi chia sẻ:', error);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#22c55e" size="large" />
            </View>
        );
    }

    if (!article) return null;

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View className="relative">
                    <Image
                        source={{ uri: article.imageUrl || 'https://via.placeholder.com/400x300' }}
                        className="w-full h-72 bg-gray-100"
                    />
                    {/* Nút Back [cite: 154] */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 bg-black/30 p-2 rounded-full"
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    {/* Nút Share [cite: 156] */}
                    <TouchableOpacity
                        onPress={onShare}
                        className="absolute top-12 right-4 bg-black/30 p-2 rounded-full"
                    >
                        <Share2 size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Content Section [cite: 154, 155] */}
                <View className="px-5 py-6 -mt-6 bg-white rounded-t-3xl">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg overflow-hidden">
                            {article.category}
                        </Text>
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center">
                                <Clock size={14} color="#9ca3af" />
                                <Text className="text-gray-500 text-sm ml-1">
                                    {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Eye size={14} color="#9ca3af" />
                                <Text className="text-gray-500 text-sm ml-1">{article.viewCount} lượt xem</Text>
                            </View>
                        </View>
                    </View>

                    <Text className="text-2xl font-bold text-gray-900 leading-8 mb-6">
                        {article.title}
                    </Text>

                    {/* Render Nội dung (Giả định backend trả về plain text hoặc HTML đơn giản) */}
                    <Text className="text-gray-700 text-base leading-7">
                        {article.content}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}