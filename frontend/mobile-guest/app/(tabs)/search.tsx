import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, ActivityIndicator, Text, TouchableOpacity, Modal, Pressable, Image } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { guestApi } from "@/lib/api";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function SearchScreen() {
    const router = useRouter();
    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [activeProvince, setActiveProvince] = useState("Tất cả");

    // Kỹ thuật Debounce: Chờ 0.5s sau khi người dùng dừng gõ mới cập nhật từ khóa
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(keyword), 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
        queryKey: ["products-search", debouncedKeyword, activeProvince],
        queryFn: ({ pageParam = 0 }) => guestApi.getProducts({
            keyword: debouncedKeyword,
            province: activeProvince === "Tất cả" ? undefined : activeProvince,
            page: pageParam,
            size: 10
        }),
        getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.number + 1,
        initialPageParam: 0,
    });

    const allProducts = data?.pages.flatMap((page) => page.content) ?? [];

    return (
        <View className="flex-1 bg-white pt-14">
            {/* Search Header */}
            <View className="px-4 flex-row items-center mb-4">
                <View className="flex-1 bg-gray-100 rounded-2xl flex-row items-center px-4 py-3">
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        placeholder="Tìm theo tên, loại..."
                        className="ml-2 flex-1 text-gray-800"
                        value={keyword}
                        onChangeText={setKeyword}
                        autoCapitalize="none"
                    />
                </View>
                <TouchableOpacity
                    onPress={() => setFilterVisible(true)}
                    className="ml-3 p-3 bg-green-50 rounded-2xl"
                >
                    <SlidersHorizontal size={20} color="#22c55e" />
                </TouchableOpacity>
            </View>

            {/* Hiển thị Loading khi đang gõ */}
            {isLoading && <ActivityIndicator color="#22c55e" className="my-4" />}

            {/* Product Grid */}
            <FlatList
                data={allProducts}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                keyExtractor={(item) => item.id}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#22c55e" className="my-4" /> : null}
                renderItem={({ item }) => (
                    // CẬP NHẬT GIAO DIỆN CARD SẢN PHẨM GIỐNG HỆT TRANG CHỦ
                    <TouchableOpacity
                        onPress={() => router.push(`/products/${item.id}`)}
                        className="bg-white rounded-3xl p-3 w-[48%] mb-4 border border-gray-100 shadow-sm"
                    >
                        <View className="w-full h-32 bg-gray-100 rounded-2xl mb-2 overflow-hidden">
                            <Image source={{ uri: item.imageUrl }} className="w-full h-full" />
                        </View>
                        <Text className="font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-green-600 font-bold mt-1">{item.price.toLocaleString()}đ</Text>
                        <Text className="text-gray-400 text-[10px] mt-1">📍 {item.province}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Modal Lọc Bottom Sheet */}
            <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <Pressable className="flex-1" onPress={() => setFilterVisible(false)} />
                    <View className="bg-white rounded-t-3xl p-6 h-1/2">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold">Lọc sản phẩm</Text>
                            <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                <X size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <Text className="font-bold text-gray-700 mb-3">Tỉnh thành</Text>
                        <View className="flex-row flex-wrap gap-3">
                            {["Tất cả", "Hà Nội", "Lâm Đồng", "Hòa Bình"].map((prov) => (
                                <TouchableOpacity
                                    key={prov}
                                    onPress={() => setActiveProvince(prov)}
                                    className={`px-4 py-2 rounded-full border ${activeProvince === prov ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={activeProvince === prov ? "text-white font-bold" : "text-gray-600"}>{prov}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => setFilterVisible(false)}
                            className="mt-auto bg-green-600 py-4 rounded-2xl items-center"
                        >
                            <Text className="text-white font-bold text-lg">Áp dụng bộ lọc</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}