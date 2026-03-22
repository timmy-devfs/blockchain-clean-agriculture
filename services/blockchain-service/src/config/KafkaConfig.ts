import { Kafka } from 'kafkajs';
import { createLogger } from '../utils/logger';

const logger = createLogger('KafkaConfig');

const kafka = new Kafka({
  clientId: 'blockchain-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  retry: { retries: 5 },
});

export const consumer = kafka.consumer({ groupId: 'blockchain-service' });

export async function initKafka() {
  await consumer.connect();
  logger.info('Kafka consumer connected');
  // Các topic subscribe sẽ ở task BIC-021
}