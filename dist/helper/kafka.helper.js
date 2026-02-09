"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
const logger_1 = __importDefault(require("../winston/logger"));
class KafkaHelper {
    constructor() {
        this.kafka = null;
        this.producer = null;
        this.consumer = null;
        this.groupId = `user-service-${process.env.NODE_ENV || 'development'}`;
    }
    /**
     * Initializes Kafka connection, producer, and consumer
     */
    async connect(config) {
        try {
            this.kafka = new kafkajs_1.Kafka({
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
            logger_1.default.info('Kafka Producer and Consumer connected successfully.');
            // Subscribe to default topic
            await this.consumer.subscribe({
                topic: 'user-service',
                fromBeginning: false
            });
            // Start consuming messages
            this.consumeMessages();
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Kafka. Please check if KAFKA_BROKER is correct and reachable.', error);
            throw error;
        }
    }
    /**
     * Disconnects Kafka producer and consumer
     */
    async disconnect() {
        try {
            if (this.producer) {
                await this.producer.disconnect();
                logger_1.default.info('Kafka Producer disconnected.');
            }
            if (this.consumer) {
                await this.consumer.disconnect();
                logger_1.default.info('Kafka Consumer disconnected.');
            }
        }
        catch (error) {
            logger_1.default.error('Error disconnecting Kafka:', error);
        }
    }
    /**
     * Produces messages to a specific topic
     */
    async produceMessage(topic, messages) {
        if (!this.producer) {
            logger_1.default.error('Kafka Producer not initialized. Cannot produce message.');
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
        }
        catch (error) {
            logger_1.default.error(`Error producing message to topic ${topic}:`, error);
        }
    }
    /**
     * Internal method to run the consumer
     */
    async consumeMessages() {
        if (!this.consumer)
            return;
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value)
                        return;
                    const data = JSON.parse(message.value.toString());
                    logger_1.default.debug(`Received message from topic ${topic}:`, data);
                    switch (topic) {
                        case 'user-service':
                            // Handle user-service messages
                            break;
                        default:
                            logger_1.default.warn(`Unhandled topic: ${topic}`);
                    }
                }
                catch (error) {
                    logger_1.default.error('Error processing Kafka message:', error);
                }
            }
        });
    }
}
exports.default = new KafkaHelper();
//# sourceMappingURL=kafka.helper.js.map