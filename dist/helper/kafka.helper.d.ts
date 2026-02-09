declare class KafkaHelper {
    private kafka;
    private producer;
    private consumer;
    private readonly groupId;
    /**
     * Initializes Kafka connection, producer, and consumer
     */
    connect(config: {
        brokers: string[];
    }): Promise<boolean>;
    /**
     * Disconnects Kafka producer and consumer
     */
    disconnect(): Promise<void>;
    /**
     * Produces messages to a specific topic
     */
    produceMessage(topic: string, messages: any[]): Promise<void>;
    /**
     * Internal method to run the consumer
     */
    private consumeMessages;
}
declare const _default: KafkaHelper;
export default _default;
//# sourceMappingURL=kafka.helper.d.ts.map