import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { guestApi } from '@/lib/api';
import { Clock, Eye } from 'lucide-react-native';

const CATEGORIES = ['Tất cả', 'Thông báo', 'Canh tác bền vững', 'An toàn thực phẩm', 'Công nghệ'];

export default function NewsScreen() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('Tất cả');

    // Lấy dữ liệu phân trang từ API [cite: 147, 151]
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['articles', activeCategory],
        queryFn: ({ pageParam = 0 }) =>
            guestApi.getArticles({
                category: activeCategory === 'Tất cả' ? undefined : activeCategory,
                page: pageParam,
                size: 10
            }),
        getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
        initialPageParam: 0,
    });

    const allArticles = data?.pages.flatMap((page) => page.content) ?? [];

    return (
        <View className="flex-1 bg-gray-50 pt-14">
            <View className="px-4 mb-4">
                <Text className="text-2xl font-bold text-gray-900">Tin tức & Kiến thức</Text>
            </View>

            {/* Category Filter Chips [cite: 149, 150] */}
            <View className="mb-4">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveCategory(item)}
                            className={`mr-3 px-5 py-2 rounded-full border ${activeCategory === item
                                ? 'bg-green-600 border-green-600'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <Text className={activeCategory === item ? 'text-white font-bold' : 'text-gray-600'}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Articles List [cite: 147] */}
            {isLoading ? (
                <ActivityIndicator className="mt-10" color="#22c55e" size="large" />
            ) : (
                <FlatList
                    data={allArticles}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    onEndReached={() => hasNextPage && fetchNextPage()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#22c55e" className="my-4" /> : null}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/articles/${item.id}`)}
                            className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-100 flex-row"
                        >
                            <Image
                                source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                                className="w-24 h-24 rounded-2xl bg-gray-100"
                            />
                            <View className="flex-1 ml-4 justify-between py-1">
                                <View>
                                    <Text className="text-green-600 text-[10px] font-bold uppercase mb-1">{item.category}</Text>
                                    <Text className="text-gray-900 font-bold text-base leading-5" numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </View>
                                <View className="flex-row items-center justify-between mt-2">
                                    <View className="flex-row items-center">
                                        <Clock size={12} color="#9ca3af" />
                                        <Text className="text-gray-400 text-xs ml-1">
                                            {new Date(item.publishedAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Eye size={12} color="#9ca3af" />
                                        <Text className="text-gray-400 text-xs ml-1">{item.viewCount}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}