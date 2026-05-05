import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink, ShieldCheck } from 'lucide-react-native';

export const BlockchainBadge = ({ txHash }: { txHash: string }) => {
    const openExplorer = () => {
        const url = `https://explore.vechain.org/transactions/${txHash}`;
        Linking.openURL(url);
    };

    return (
        <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
            <View className="flex-row items-center mb-2">
                <ShieldCheck size={20} color="#2563eb" />
                <Text className="ml-2 font-bold text-blue-800">Đã xác thực Blockchain</Text>
            </View>
            <Text className="text-xs text-blue-600 font-mono mb-3" numberOfLines={1}>
                {txHash}
            </Text>
            <TouchableOpacity
                onPress={openExplorer}
                className="flex-row items-center justify-center bg-blue-600 py-2 rounded-xl"
            >
                <Text className="text-white text-xs font-semibold mr-2">Kiểm tra trên VeChain</Text>
                <ExternalLink size={14} color="white" />
            </TouchableOpacity>
        </View>
    );
};