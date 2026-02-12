import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';

interface QueueMessage {
    id: string;
    data: any;
    attemptCount: number;
}

@Injectable()
export class QueueConsumerService implements OnModuleInit, OnModuleDestroy {
    private intervalId: NodeJS.Timeout;
    private readonly MAIN_QUEUE = 'meeting:notifications';
    private readonly DLQ = 'meeting:notifications:dlq';
    private readonly MAX_RETRIES = 3;
    private readonly POLL_INTERVAL_MS = 2000; // Poll every 2 seconds

    constructor(
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    onModuleInit() {
        this.startConsuming();
    }

    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private startConsuming() {
        console.log('Consumer started');

        this.intervalId = setInterval(async () => {
            await this.consumeMessage();
        }, this.POLL_INTERVAL_MS);
    }

    private async consumeMessage() {
        try {
            // Get one message from queue
            const messageJson = await this.redis.lpop(this.MAIN_QUEUE);

            if (!messageJson) {
                return; // Queue is empty
            }

            const message: QueueMessage = JSON.parse(messageJson);
            console.log(` Processing message ${message.id}, attempt ${message.attemptCount + 1}`);

            try {
                // === YOUR BUSINESS LOGIC ===
                await this.handleMeetingNotification(message);
                // ===========================

                console.log(`✅ Message ${message.id} processed successfully`);
                // Message consumed successfully - deleted from Redis via LPOP

            } catch (error) {
                console.error(`❌ Error processing message ${message.id}:`, error.message);

                // Increment attempt count
                message.attemptCount = (message.attemptCount || 0) + 1;

                if (message.attemptCount >= this.MAX_RETRIES) {
                    // Send to DLQ
                    await this.sendToDLQ(message, error.message);
                } else {
                    // Retry - push back to queue
                    console.log(`🔄 Retrying message ${message.id} (${message.attemptCount}/${this.MAX_RETRIES})`);
                    await this.redis.rpush(this.MAIN_QUEUE, JSON.stringify(message));
                }
            }

        } catch (error) {
            console.error('❌ Consumer error:', error);
        }
    }

    /**
     * Handle meeting notification - Your business logic
     */
    private async handleMeetingNotification(data: any) {
        // Send WhatsApp notification
        const success = await this.sendWhatsAppNotification(data);

        if (!success) {
            throw new Error('WhatsApp webhook failed');
        }

        // Update database
        await this.updateNotificationStatus(data.id, 'sent');
    }

    /**
     * Send WhatsApp notification
     */
    private async sendWhatsAppNotification(data: any): Promise<boolean> {
        try {
            console.log(`📱 Sending WhatsApp to ${data.consultantPhone}: Meeting at ${data.meetingTime}`);

            // Your actual WhatsApp API call here
            // const response = await axios.post('whatsapp-api-url', {...});
            // return response.status === 200;

            if (Math.random() < 0.2) {
                throw new Error('WhatsApp API error');
            }

            return true;
        } catch (error) {
            console.error('WhatsApp failed:', error.message);
            return false;
        }
    }

    /**
     * Update notification status
     */
    private async updateNotificationStatus(id: string, status: string) {
        console.log(`📝 Updated meeting ${id} status: ${status}`);
        // here we need to update notification
    }

    /**
     * Send message to DLQ
     */
    private async sendToDLQ(message: QueueMessage, reason: string) {
        const dlqEntry = {
            originalMessage: message,
            reason,
            failedAt: new Date().toISOString(),
        };

        await this.redis.rpush(this.DLQ, JSON.stringify(dlqEntry));
        console.log(`💀 Message ${message.id} sent to DLQ: ${reason}`);
    }

    /**
     * Retry messages from DLQ
     */
    async retryFromDLQ(count: number = 1): Promise<number> {
        let retriedCount = 0;

        for (let i = 0; i < count; i++) {
            const dlqEntryJson = await this.redis.lpop(this.DLQ);

            if (!dlqEntryJson) break;

            const dlqEntry = JSON.parse(dlqEntryJson);
            const message = dlqEntry.originalMessage;

            // Reset attempt count
            message.attemptCount = 0;

            await this.redis.rpush(this.MAIN_QUEUE, JSON.stringify(message));
            retriedCount++;

            console.log(`♻️ Retried message ${message.id} from DLQ`);
        }

        return retriedCount;
    }
}