const Board = require('../models/board.model');
const { sendSMS } = require('./sms.service');

let matchmakingQueue = [];

const addUserToQueue = (userId) => {
  matchmakingQueue.push(userId);
};

const processMatchmakingQueue = (io) => {
  console.log('Processing matchmaking queue...');
  while (matchmakingQueue.length >= 2) {
    const player1 = matchmakingQueue.shift();
    const player2 = matchmakingQueue.shift();
    createGameBoard(io, player1, player2);
  }

  if (matchmakingQueue.length === 1) {
    const unmatchedPlayer = matchmakingQueue.shift();
    sendSMS(unmatchedPlayer, 'No opponent found at the moment. Please try again later.');
  }
};

const createGameBoard = async (io, player1, player2) => {
  try {
    const board = new Board({
      players: [player1, player2],
    });
    await board.save();

    io.to(player1).emit('opponent-found', { opponent: player2, boardId: board._id });
    io.to(player2).emit('opponent-found', { opponent: player1, boardId: board._id });
  } catch (error) {
    console.error('Error creating game board:', error);
  }
};

module.exports = {
  addUserToQueue,
  processMatchmakingQueue,
};
