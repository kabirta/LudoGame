const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// @route   POST /api/game/join-matchmaking
// @desc    Join matchmaking queue
// @access  Public
router.post('/join-matchmaking', gameController.joinMatchmaking);

// @route   GET /api/game/status/:roomId
// @desc    Get game status
// @access  Public
router.get('/status/:roomId', gameController.getGameStatus);

// @route   POST /api/game/pause/:roomId
// @desc    Pause game timer
// @access  Public
router.post('/pause/:roomId', gameController.pauseGame);

// @route   POST /api/game/resume/:roomId
// @desc    Resume game timer
// @access  Public
router.post('/resume/:roomId', gameController.resumeGame);

// @route   POST /api/game/move/:roomId
// @desc    Make a game move
// @access  Public
router.post('/move/:roomId', gameController.makeMove);

// @route   GET /api/game/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', gameController.getLeaderboard);

// @route   GET /api/game/player/:userId/stats
// @desc    Get player statistics
// @access  Public
router.get('/player/:userId/stats', gameController.getPlayerStats);

// @route   POST /api/game/end/:roomId
// @desc    End game
// @access  Public
router.post('/end/:roomId', gameController.endGame);

module.exports = router;
