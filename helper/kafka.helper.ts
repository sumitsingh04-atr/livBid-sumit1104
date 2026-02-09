import { Kafka, Producer, Consumer, KafkaConfig } from 'kafkajs';
import logger from '../winston/logger';

class KafkaHelper {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private readonly groupId = `user-service-${process.env.NODE_ENV || 'development'}`;

  /**
   * Initializes Kafka connection, producer, and consumer
   */
  public async connect(config: { brokers: string[] }) {
    try {
      this.kafka = new Kafka({
        brokers: config.brokers,
        clientId: 'user-service',
        retry: {
          initialRetryTime: 300,
          retries: 10
        }
      });

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ 
        groupId: this.groupId,
        maxWaitTimeInMs: 100 
      });

      await Promise.all([
        this.producer.connect(),
        this.consumer.connect()
      ]);

      logger.info('Kafka Producer and Consumer connected successfully.');

      // Subscribe to default topic
      await this.consumer.subscribe({
        topic: 'user-service',
        fromBeginning: false
      });

      // Start consuming messages
      this.consumeMessages();

      return true;
    } catch (error) {
      logger.error('Failed to connect to Kafka. Please check if KAFKA_BROKER is correct and reachable.', error);
      throw error;
    }
  }

  /**
   * Disconnects Kafka producer and consumer
   */
  public async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka Producer disconnected.');
      }
      if (this.consumer) {
        await this.consumer.disconnect();
        logger.info('Kafka Consumer disconnected.');
      }
    } catch (error) {
      logger.error('Error disconnecting Kafka:', error);
    }
  }

  /**
   * Produces messages to a specific topic
   */
  public async produceMessage(topic: string, messages: any[]) {
    if (!this.producer) {
      logger.error('Kafka Producer not initialized. Cannot produce message.');
      return;
    }

    try {
      const kafkaMessages = messages.map(msg => ({
        value: JSON.stringify(msg)
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages
      });
    } catch (error) {
      logger.error(`Error producing message to topic ${topic}:`, error);
    }
  }

  /**
   * Internal method to run the consumer
   */
  private async consumeMessages() {
    if (!this.consumer) return;

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          
          const data = JSON.parse(message.value.toString());
          logger.debug(`Received message from topic ${topic}:`, data);

          switch (topic) {
            case 'user-service':
              // Handle user-service messages
              break;
            default:
              logger.warn(`Unhandled topic: ${topic}`);
          }
        } catch (error) {
          logger.error('Error processing Kafka message:', error);
        }
      }
    });
  }
}

export default new KafkaHelper();


