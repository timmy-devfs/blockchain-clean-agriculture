// ============================================================
// KafkaConfig.ts — Quản lý kết nối Kafka message queue
//
// Kafka là gì?
//   Hệ thống "hộp thư" trung gian giữa các microservice
//
//   Không dùng Kafka (gọi trực tiếp):
//     farm-service → gọi thẳng → blockchain-service
//     Vấn đề: nếu blockchain-service đang bận → request bị mất
//
//   Dùng Kafka:
//     farm-service → gửi message vào Kafka → blockchain-service đọc khi rảnh
//     Lợi ích: message không bao giờ bị mất dù service tạm thời offline
//
// Khái niệm cần biết:
//   Topic   : "kênh" chứa message (ví dụ: 'bicap.season.created')
//   Producer: service gửi message (farm-service)
//   Consumer: service đọc message (blockchain-service)
//   Group ID: tên nhóm consumer — Kafka dùng để track đã đọc đến đâu
//
// Biến môi trường KAFKA_ENABLED:
//   true  → kết nối Kafka thật (dùng khi có docker-compose chạy Kafka)
//   false → bỏ qua Kafka (dùng khi dev một mình, chỉ test VeChain)
// ============================================================

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

// Danh sách topic mà blockchain-service lắng nghe
const TOPICS = {
  // Khi Farm Manager tạo vụ mùa mới → ghi SeasonRecord lên FarmTrace.sol
  SEASON_CREATED:  'bicap.season.created',
  // Khi Farm Manager cập nhật tiến trình → thêm update vào blockchain
  SEASON_UPDATED:  'bicap.season.updated',
  // Khi Farm Manager xuất vụ mùa → tạo QR Code + chứng nhận blockchain
  SEASON_EXPORTED: 'bicap.season.exported',
} as const;

// Kiểu hàm xử lý message
type Handler = (payload: EachMessagePayload) => Promise<void>;

export class KafkaConfig {
  private static _instance: KafkaConfig;

  // Consumer: đối tượng dùng để đọc message từ Kafka topics
  private consumer: Consumer | null = null;

  // Map lưu cặp {tên topic → hàm xử lý message}
  private handlers = new Map<string, Handler>();

  // Cờ đánh dấu consumer đang chạy hay chưa
  private _running = false;

  // Khởi tạo Kafka client
  private readonly kafka = new Kafka({
    clientId: 'blockchain-service',
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),

    // Dev: retry=0 để fail nhanh, không spam log lỗi khi Kafka chưa chạy
    // Production: retry=5 để tự phục hồi khi Kafka tạm thời down
    retry: {
      retries: process.env.NODE_ENV === 'production' ? 5 : 0,
    },

    // Dev: timeout ngắn để biết lỗi nhanh (3 giây)
    // Production: timeout dài hơn (10 giây) để Kafka có thời gian phục hồi
    connectionTimeout: process.env.NODE_ENV === 'production' ? 10_000 : 3_000,
  });

  private constructor() {}

  static getInstance(): KafkaConfig {
    if (!KafkaConfig._instance) KafkaConfig._instance = new KafkaConfig();
    return KafkaConfig._instance;
  }

  // Kết nối đến Kafka broker
  async connect(): Promise<void> {
    // KAFKA_ENABLED=false → bỏ qua Kafka hoàn toàn
    // Dùng khi dev một mình, chỉ muốn test VeChain mà không cần chạy Docker
    if (process.env.KAFKA_ENABLED === 'false') {
      console.warn('[KafkaConfig] Kafka disabled (KAFKA_ENABLED=false) — skipping connection');
      return;
    }

    try {
      this.consumer = this.kafka.consumer({
        // Group ID: Kafka dùng để biết đã xử lý message đến đâu
        // Nếu service restart → tiếp tục từ chỗ đã đọc, không đọc lại từ đầu
        groupId: 'blockchain-service',
      });

      await this.consumer.connect();
      console.log("[KafkaConfig] Consumer connected — group: 'blockchain-service'");
    } catch (err) {
      // Không throw — service vẫn start được dù Kafka offline
      // Chỉ log warning, không phải lỗi nghiêm trọng
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[KafkaConfig] Kafka unavailable: ${msg}`);
      console.warn('[KafkaConfig] Service running without Kafka — set KAFKA_ENABLED=false to suppress this warning');
    }
  }

  // Subscribe topics và bắt đầu lắng nghe message
  async startConsumers(): Promise<void> {
    // consumer = null nghĩa là chưa kết nối được (Kafka offline hoặc bị disabled)
    if (!this.consumer) return;

    // Đăng ký handler stub cho từng topic
    // Hiện tại chỉ log — implement đầy đủ tại task BICAP-021
    this.handlers.set(TOPICS.SEASON_CREATED,  this._stub('SeasonCreated'));
    this.handlers.set(TOPICS.SEASON_UPDATED,  this._stub('SeasonUpdated'));
    this.handlers.set(TOPICS.SEASON_EXPORTED, this._stub('SeasonExported'));

    const topics = [...this.handlers.keys()];
    await this.consumer.subscribe({
      topics,
      fromBeginning: false, // false = chỉ đọc message MỚI từ thời điểm service start
    });
    console.log(`[KafkaConfig] Subscribed to: ${topics.join(', ')}`);

    this._running = true;

    // Vòng lặp liên tục đọc message từ Kafka
    await this.consumer.run({
      eachMessage: async (payload) => {
        const handler = this.handlers.get(payload.topic);
        if (handler) await handler(payload);
      },
    });
  }

  // Stub handler — chỉ log, chưa xử lý thật
  // Sẽ thay bằng logic thật ở BICAP-021
  private _stub(name: string): Handler {
    return async (payload) => {
      console.log(`[${name}Consumer] Received from ${payload.topic} — stub, implement at BICAP-021`);
    };
  }

  isRunning(): boolean { return this._running; }

  // Đóng kết nối khi service shutdown
  async disconnect(): Promise<void> {
    if (this.consumer) await this.consumer.disconnect();
  }
}