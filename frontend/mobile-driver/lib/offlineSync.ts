import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { shipmentApi } from './api';

const QUEUE_KEY = 'BICAP_OFFLINE_ACTION_QUEUE';

// 1. Định nghĩa cấu trúc của một "Lệnh" (Command Pattern)
export interface OfflineAction {
  id: string; // Khóa chính (dùng timestamp)
  type: 'pickup' | 'deliver' | 'status_update'; // Các loại hành động
  payload: any; // Chứa { shipmentId, qrCode, photoUri, recipientName... }
  timestamp: number;
}

// 2. Hàm đẩy Lệnh vào Hàng đợi (Dùng khi mất mạng)
export const addActionToQueue = async (action: OfflineAction): Promise<boolean> => {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: OfflineAction[] = queueStr ? JSON.parse(queueStr) : [];
    
    queue.push(action);
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log("📥 [OFFLINE] Đã lưu lệnh vào hàng đợi:", action.id);
    return true;
  } catch (error) {
    console.error("❌ [OFFLINE] Lỗi khi lưu offline:", error);
    return false;
  }
};

// 3. Hàm xử lý đồng bộ (Gọi tự động khi có mạng trở lại)
export const syncOfflineQueue = async () => {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return; // Nếu vẫn rớt mạng thì bỏ qua

  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueStr) return;

    const queue: OfflineAction[] = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`🚀 [SYNC] Bắt đầu đồng bộ ${queue.length} lệnh offline...`);
    
    const remainingQueue: OfflineAction[] = []; // Chứa lệnh bị lỗi server để thử lại sau

    for (const action of queue) {
      try {
        if (action.type === 'pickup') {
          await shipmentApi.pickup(action.payload.id, action.payload.qrCode, action.payload.photoUri);
        } else if (action.type === 'deliver') {
          await shipmentApi.deliver(action.payload.id, action.payload.recipientName, action.payload.photoUri);
        }
        // Thêm status_update sau này...
        
        console.log(`✅ [SYNC] Đồng bộ thành công lệnh: ${action.type}`);
      } catch (error) {
        console.error(`⚠️ [SYNC] Đồng bộ thất bại lệnh ${action.type}`, error);
        remainingQueue.push(action); // Gặp lỗi thì giữ lại trong máy
      }
    }

    // Cập nhật lại hàng đợi mới (xóa những cái đã gửi xong)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    
  } catch (error) {
    console.error("❌ [SYNC] Lỗi quá trình xử lý hàng đợi:", error);
  }
};