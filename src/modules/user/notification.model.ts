import { Schema, Document, Types } from "mongoose";



/**
 * Mongoose notification Schema
 */
export const Notification = new Schema({
    hostId: { type: String, required: true },
    redisKey: { type: String, required: true },
    whatsAppMessageId: {type: String},
    tenantId: { type: String, required: true },
    notificationData: {type: JSON, required: true},
    date: {
        type: Date,
        default: Date.now,
    },
});

/**
 * Mongoose Notification Document
 */
export interface INotification extends Document {
    /**
     * UUID
     */
    readonly _id: Types.ObjectId;

    /**
     * HostId
     */
    readonly hostId: string;
    /**
     * WhatsAppMessageId 
     */
    readonly WhatsAppMessageId: string;
    /**
     * TenantId
     */
    readonly tenantId: string;

    /**
     * NotificationData
     */
    readonly NotificationData: string;
    /**
     * Date
     */
    readonly date: Date;


}
