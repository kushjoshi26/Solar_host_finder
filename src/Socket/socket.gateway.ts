import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisGeoHelper } from '../modules/redis/redis-geo.helper';
import { UseGuards } from '@nestjs/common';
import { SocketAuthGuard } from './socket-auth.guard';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
@UseGuards(SocketAuthGuard)
export class SocketGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly geoHelper: RedisGeoHelper) { }

    handleConnection(client: Socket) {
        console.log('Client connected:', client.id);
    }

    async handleDisconnect(client: Socket) {
        console.log('Client disconnected:', client.id);

        // Optional: remove from geo when disconnected
        const tenantId = client.handshake.query.tenantId as string;
        // Geo:teanat :livelocation 


        if (tenantId) {
            const key = `geo:${tenantId}`;
            await this.geoHelper.removeLocation(key, tenantId);
        }
    }

    @SubscribeMessage('updateLocation')
    async handleMessage(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket,
    ) {
        // need to add validation for the data.city and lat and long.
        console.log('Received:', data);
        const user = client.data.user;
        const tenantId = user.tenantId;
        const key = `geo:${tenantId}:${data.city}`;
        await this.geoHelper.addOrUpdateTenantLocation(
            key,
            data.longitude,
            data.latitude,
        );
        // Send confirmation to sender
        client.emit('locationUpdated', { success: true });
    }
}