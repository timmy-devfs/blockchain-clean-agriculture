import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
// import api from '@/lib/api'; // Import api của em để gọi backend

export function useFirebaseMessaging() {
    useEffect(() => {
        async function setupFirebaseMessaging() {
            // 1. Xin quyền nhận thông báo (Bắt buộc cho iOS và Android 13+)
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.log('Khách hàng đã từ chối nhận thông báo!');
                return;
            }

            console.log('✅ Đã cấp quyền Push Notification!');

            // 2. Lấy FCM Token từ Firebase
            try {
                const token = await messaging().getToken();
                console.log('🔥 FCM TOKEN CỦA BẠN LÀ:', token);

                // 🚀 3. Gửi Token lên Backend Java của em
                // await api.post('/api/notify/tokens', {
                //   token: token,
                //   deviceType: 'MOBILE',
                //   userId: null
                // });
                // console.log('Đã lưu token lên server!');

            } catch (error) {
                console.error('❌ Lỗi khi lấy token:', error);
            }
        }

        setupFirebaseMessaging();

        // 4. Lắng nghe sự kiện Token bị làm mới (Refresh)
        // Firebase thỉnh thoảng sẽ đổi token vì lý do bảo mật, em cần bắt sự kiện này để báo cho Backend
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(newToken => {
            console.log('🔄 Token đã được Firebase làm mới:', newToken);
            // Gọi API cập nhật lại token mới lên Backend ở đây...
        });

        // 5. Lắng nghe thông báo khi App ĐANG MỞ (Foreground)
        // Lưu ý: Firebase không tự hiện popup khi app đang bật, em phải tự bắt và dùng Alert (hoặc Toast)
        const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
            console.log('🔔 [Foreground] Nhận được thông báo:', remoteMessage);
            // Có thể dùng Alert.alert để hiển thị cho tài xế
            // Alert.alert(remoteMessage.notification?.title || 'Thông báo', remoteMessage.notification?.body || '');
        });

        return () => {
            unsubscribeTokenRefresh();
            unsubscribeOnMessage();
        };
    }, []);
}