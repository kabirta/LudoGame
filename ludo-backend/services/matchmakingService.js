const Game = require('../models/Game');
const smsService = require('./smsService');
const { v4: uuidv4 } = require('uuid');

// In-memory queue for matchmaking (in production, use Redis)
let matchmakingQueue = [];

class MatchmakingService {
  constructor() {
    this.queue = [];
    this.processingInterval = null;
    this.startProcessing();
  }

  // Add player to matchmaking queue
  async addToQueue(playerData) {
    try {
      // Check if player is already in queue
      const existingIndex = this.queue.findIndex(p => p.userId === playerData.userId);
      if (existingIndex !== -1) {
        // Update existing player data
        this.queue[existingIndex] = { ...this.queue[existingIndex], ...playerData };
        return {
          success: true,
          queuePosition: existingIndex + 1,
          estimatedWaitTime: this.calculateEstimatedWaitTime()
        };
      }

      // Add new player to queue
      this.queue.push({
        ...playerData,
        joinedAt: new Date(),
        id: uuidv4()
      });

      console.log(`👤 Player ${playerData.name} (${playerData.userId}) joined matchmaking queue`);
      console.log(`📊 Current queue size: ${this.queue.length}`);

      // Try to process matches immediately
      await this.processMatches();

      return {
        success: true,
        queuePosition: this.queue.length,
        estimatedWaitTime: this.calculateEstimatedWaitTime()
      };

    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  // Remove player from queue
  removeFromQueue(userId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(p => p.userId !== userId);
    const removed = initialLength !== this.queue.length;
    
    if (removed) {
      console.log(`👋 Player ${userId} removed from matchmaking queue`);
    }
    
    return removed;
  }

  // Process matches from the queue
  async processMatches() {
    try {
      while (this.queue.length >= 2) {
        // Take first two players
        const player1 = this.queue.shift();
        const player2 = this.queue.shift();

        // Create game room
        const roomId = this.generateRoomId();
        await this.createGameRoom(roomId, player1, player2);

        console.log(`🎮 Match created: ${player1.name} vs ${player2.name} in room ${roomId}`);
      }

      // Handle unmatched player (odd number case)
      if (this.queue.length === 1) {
        await this.handleUnmatchedPlayer();
      }

    } catch (error) {
      console.error('Error processing matches:', error);
    }
  }

  // Handle unmatched player
  async handleUnmatchedPlayer() {
    const unmatchedPlayer = this.queue[0];
    
    if (unmatchedPlayer && unmatchedPlayer.phoneNumber) {
      try {
        // Send SMS to unmatched player
        await smsService.sendUnmatchedPlayerSMS(unmatchedPlayer.phoneNumber);
        
        // Remove from queue
        this.queue.shift();
        
        console.log(`📱 SMS sent to unmatched player: ${unmatchedPlayer.name}`);
      } catch (error) {
        console.error('Error handling unmatched player:', error);
      }
    }
  }

  // Create game room in database
  async createGameRoom(roomId, player1, player2) {
    try {
      const newGame = new Game({
        roomId,
        player1: {
          userId: player1.userId,
          socketId: player1.socketId,
          phoneNumber: player1.phoneNumber,
          name: player1.name
        },
        player2: {
          userId: player2.userId,
          socketId: player2.socketId,
          phoneNumber: player2.phoneNumber,
          name: player2.name
        },
        gameState: 'waiting',
        gameData: {
          currentPlayer: player1.userId // Player 1 starts first
        },
        startedAt: new Date()
      });

      await newGame.save();

      // Emit to both players via Socket.IO if they have socketIds
      if (global.io) {
        if (player1.socketId) {
          global.io.to(player1.socketId).emit('gameFound', {
            roomId,
            opponent: {
              userId: player2.userId,
              name: player2.name
            },
            yourTurn: true
          });
        }

        if (player2.socketId) {
          global.io.to(player2.socketId).emit('gameFound', {
            roomId,
            opponent: {
              userId: player1.userId,
              name: player1.name
            },
            yourTurn: false
          });
        }
      }

      return newGame;

    } catch (error) {
      console.error('Error creating game room:', error);
      throw error;
    }
  }

  // Generate unique room ID
  generateRoomId() {
    return 'room_' + uuidv4().substring(0, 8);
  }

  // Calculate estimated wait time
  calculateEstimatedWaitTime() {
    const queueLength = this.queue.length;
    if (queueLength === 0) return 0;
    if (queueLength === 1) return 30; // 30 seconds for next player
    return Math.ceil(queueLength / 2) * 10; // 10 seconds per match creation
  }

  // Start periodic processing
  startProcessing() {
    if (!this.processingInterval) {
      this.processingInterval = setInterval(async () => {
        if (this.queue.length > 0) {
          await this.processMatches();
        }
      }, 5000); // Process every 5 seconds
    }
  }

  // Stop periodic processing
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Get current queue status
  getQueueStatus() {
    return {
      totalPlayers: this.queue.length,
      players: this.queue.map(p => ({
        userId: p.userId,
        name: p.name,
        joinedAt: p.joinedAt
      }))
    };
  }

  // Update player socket ID when they connect
  updatePlayerSocket(userId, socketId) {
    const playerIndex = this.queue.findIndex(p => p.userId === userId);
    if (playerIndex !== -1) {
      this.queue[playerIndex].socketId = socketId;
      return true;
    }
    return false;
  }
}

// Export singleton instance
module.exports = new MatchmakingService();
