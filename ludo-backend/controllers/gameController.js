const Game = require('../models/Game');
const Player = require('../models/Player');
const matchmakingService = require('../services/matchmakingService');
const gameService = require('../services/gameService');
const smsService = require('../services/smsService');

// Join matchmaking queue
const joinMatchmaking = async (req, res) => {
  try {
    const { userId, name, phoneNumber } = req.body;

    if (!userId || !name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, name, phoneNumber'
      });
    }

    // Create or update player
    let player = await Player.findOne({ userId });
    if (!player) {
      player = new Player({
        userId,
        name,
        phoneNumber,
        isOnline: true
      });
      await player.save();
    } else {
      player.name = name;
      player.phoneNumber = phoneNumber;
      player.isOnline = true;
      player.lastSeen = new Date();
      await player.save();
    }

    // Add to matchmaking queue
    const result = await matchmakingService.addToQueue({
      userId,
      name,
      phoneNumber,
      socketId: null // Will be set when socket connects
    });

    res.json({
      success: true,
      message: 'Added to matchmaking queue',
      queuePosition: result.queuePosition,
      estimatedWaitTime: result.estimatedWaitTime
    });

  } catch (error) {
    console.error('Error in joinMatchmaking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get game status
const getGameStatus = async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId });
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      game: {
        roomId: game.roomId,
        gameState: game.gameState,
        timerState: game.timerState,
        player1: game.player1,
        player2: game.player2,
        winner: game.winner,
        createdAt: game.createdAt,
        startedAt: game.startedAt
      }
    });

  } catch (error) {
    console.error('Error in getGameStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Pause game
const pauseGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const result = await gameService.pauseGame(roomId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in pauseGame:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Resume game
const resumeGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    const result = await gameService.resumeGame(roomId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in resumeGame:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Make a move
const makeMove = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, move } = req.body;

    const result = await gameService.makeMove(roomId, userId, move);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in makeMove:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const players = await Player.find({})
      .sort({ 'stats.winRate': -1, 'stats.gamesWon': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('userId name stats');

    const totalPlayers = await Player.countDocuments({});

    res.json({
      success: true,
      leaderboard: players,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPlayers / parseInt(limit)),
        totalPlayers
      }
    });

  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get player statistics
const getPlayerStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const player = await Player.findOne({ userId });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      player: {
        userId: player.userId,
        name: player.name,
        stats: player.stats,
        currentGame: player.currentGame,
        isOnline: player.isOnline,
        lastSeen: player.lastSeen
      }
    });

  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// End game
const endGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { winnerId, reason = 'completed' } = req.body;

    const result = await gameService.endGame(roomId, winnerId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in endGame:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  joinMatchmaking,
  getGameStatus,
  pauseGame,
  resumeGame,
  makeMove,
  getLeaderboard,
  getPlayerStats,
  endGame
};
