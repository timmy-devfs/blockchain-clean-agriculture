import { Kafka, Producer, Partitioners, EachMessagePayload } from 'kafkajs';
import { createLogger } from '../utils/logger';

const logger = createLogger('KafkaConfig');

const kafka = new Kafka({
  clientId: 'blockchain-service',
  brokers:  (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  retry:    { retries: 5 },
});

export const consumer = kafka.consumer({ groupId: 'blockchain-service' });

// Producer — dùng để gửi test messages
const producer: Producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

const TOPICS = {
  SEASON_CREATED:  'bicap.season.created',
  SEASON_UPDATED:  'bicap.season.updated',
  SEASON_EXPORTED: 'bicap.season.exported',
} as const;

type Handler = (payload: EachMessagePayload) => Promise<void>;
const handlers = new Map<string, Handler>();

export async function initKafka(): Promise<void> {
  // Kết nối consumer
  await consumer.connect();
  logger.info('Kafka consumer connected');

  // Kết nối producer
  await producer.connect();
  logger.info('Kafka producer connected');

  // Import consumers thật từ BICAP-021
  const { handleSeasonCreated }  = await import('../kafka/consumers/SeasonCreatedConsumer');
  const { handleSeasonUpdated }  = await import('../kafka/consumers/SeasonUpdatedConsumer');
  const { handleSeasonExported } = await import('../kafka/consumers/SeasonExportedConsumer');

  handlers.set(TOPICS.SEASON_CREATED,  handleSeasonCreated);
  handlers.set(TOPICS.SEASON_UPDATED,  handleSeasonUpdated);
  handlers.set(TOPICS.SEASON_EXPORTED, handleSeasonExported);

  const topics = [...handlers.keys()];
  await consumer.subscribe({ topics, fromBeginning: false });
  logger.info(`Subscribed to: ${topics.join(', ')}`);

  if (process.env.KAFKA_CONSUME === 'false') {
    logger.info('Consuming paused (KAFKA_CONSUME=false)');
    return;
  }

  logger.info('Consuming started...');

  await consumer.run({
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload;
      logger.info(`← ${topic} | partition: ${partition}`);

      const handler = handlers.get(topic);
      if (!handler) return;

      try {
        await handler(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Handler error [${topic}]: ${msg}`);
        // Gửi vào Dead Letter Queue
        try {
          await producer.send({
            topic: 'bicap.dlq.blockchain',
            messages: [{
              key:   message.key?.toString() ?? '',
              value: JSON.stringify({
                originalTopic:   topic,
                originalMessage: message.value?.toString() ?? '',
                error:           msg,
                timestamp:       new Date().toISOString(),
              }),
            }],
          });
        } catch { /* ignore DLQ errors */ }
      }
    },
  });
}

// Gửi test message — dùng cho test endpoints trong index.ts
export async function sendTestMessage(
  topic: string,
  payload: Record<string, unknown>
): Promise<void> {
  await producer.send({
    topic,
    messages: [{ key: 'test-key', value: JSON.stringify(payload) }],
  });
  logger.info(`Test message sent → '${topic}'`);
}

export async function disconnectKafka(): Promise<void> {
  await consumer.disconnect();
  await producer.disconnect();
  logger.info('Kafka disconnected');
}