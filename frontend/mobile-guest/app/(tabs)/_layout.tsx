import { Tabs } from 'expo-router';
import { Home, Search, QrCode, Newspaper } from 'lucide-react-native';

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {

    const insets = useSafeAreaInsets();

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#22c55e',
            headerShown: false,
            tabBarStyle: { height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom }
        }}>
            <Tabs.Screen name="index" options={{
                title: 'Trang chủ',
                tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            }} />
            <Tabs.Screen name="search" options={{
                title: 'Tìm kiếm',
                tabBarIcon: ({ color }) => <Search size={24} color={color} />,
            }} />
            <Tabs.Screen name="scan" options={{
                title: 'Quét QR',
                tabBarIcon: ({ color }) => <QrCode size={28} color={color} />,
            }} />
            <Tabs.Screen name="news" options={{
                title: 'Tin tức',
                tabBarIcon: ({ color }) => <Newspaper size={24} color={color} />,
            }} />
        </Tabs>
    );
}