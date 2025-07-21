const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    userId: {
      type: String,
      required: true
    },
    socketId: String,
    phoneNumber: String,
    name: String
  },
  player2: {
    userId: {
      type: String,
      required: true
    },
    socketId: String,
    phoneNumber: String,
    name: String
  },
  gameState: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'completed', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: String,
    default: null
  },
  timerState: {
    isPaused: {
      type: Boolean,
      default: false
    },
    timeRemaining: {
      type: Number,
      default: 480 // 8 minutes in seconds
    },
    pausedAt: Date,
    resumedAt: Date
  },
  gameData: {
    // Store game board state, moves, etc.
    currentPlayer: {
      type: String,
      default: null
    },
    moves: [{
      player: String,
      move: Object,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
gameSchema.index({ roomId: 1 });
gameSchema.index({ 'player1.userId': 1 });
gameSchema.index({ 'player2.userId': 1 });
gameSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
