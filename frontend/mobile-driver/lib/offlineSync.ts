import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { shipmentApi } from './api';

const QUEUE_KEY = 'BICAP_OFFLINE_ACTION_QUEUE';

export interface OfflineAction {
  id: string;
  type: 'pickup' | 'deliver' | 'status_update';
  payload: any;
  timestamp: number;
}

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

export const syncOfflineQueue = async () => {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueStr) return;

    const queue: OfflineAction[] = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`🚀 [SYNC] Bắt đầu đồng bộ ${queue.length} lệnh offline...`);
    const remainingQueue: OfflineAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === 'pickup') {
          await shipmentApi.pickup(action.payload.id, action.payload.qrCode, action.payload.photoUri);
        } else if (action.type === 'deliver') {
          await shipmentApi.deliver(action.payload.id, action.payload.recipientName, action.payload.photoUri);
        }
        console.log(`✅ [SYNC] Đồng bộ thành công lệnh: ${action.type}`);
      } catch (error) {
        console.error(`⚠️ [SYNC] Đồng bộ thất bại lệnh ${action.type}`, error);
        remainingQueue.push(action);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (error) {
    console.error("❌ [SYNC] Lỗi quá trình xử lý hàng đợi:", error);
  }
};