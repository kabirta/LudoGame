import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private players: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove player from the map
    for (const [playerId, socket] of this.players.entries()) {
      if (socket.id === client.id) {
        this.players.delete(playerId);
        break;
      }
    }
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(client: Socket, playerId: string) {
    this.players.set(playerId, client);
    client.join(`game_${playerId}`);
  }

  notifyGameCreated(player1Id: string, player2Id: string, gameId: string) {
    const player1Socket = this.players.get(player1Id);
    const player2Socket = this.players.get(player2Id);

    if (player1Socket) {
      player1Socket.emit('gameCreated', { gameId, opponentId: player2Id });
    }

    if (player2Socket) {
      player2Socket.emit('gameCreated', { gameId, opponentId: player1Id });
    }
  }
}
