const matchmakingService = require('../services/matchmaking.service');

const joinMatchmaking = (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  matchmakingService.addUserToQueue(userId);
  res.status(200).json({ message: 'Joined matchmaking queue' });
};

module.exports = {
  joinMatchmaking,
};
