const {
  MATCHMAKING_CONTESTS,
  MATCHMAKING_WAIT_TIME_SECONDS,
  createRoomCode,
  normalizeContestState,
  pairPlayersForRound,
} = require('../matchmakingEngine');

describe('matchmakingEngine', () => {
  it('exposes configured contest boards', () => {
    expect(MATCHMAKING_CONTESTS).toEqual([
      expect.objectContaining({id: 'starter-50', prizePool: 1}),
      expect.objectContaining({id: 'classic-100', prizePool: 100}),
      expect.objectContaining({id: 'pro-250', prizePool: 250}),
      expect.objectContaining({id: 'elite-500', prizePool: 500}),
    ]);
  });

  it('reuses an active collecting round while its timer is still running', () => {
    const contest = normalizeContestState({
      contestId: 'classic-100',
      contest: {
        id: 'classic-100',
        prizePool: 100,
        entryFee: 'FREE',
        activeRoundId: 'classic-100-1000-12345',
        activeRoundStartedAt: 1000,
        activeRoundEndsAt: 1000 + MATCHMAKING_WAIT_TIME_SECONDS * 1000,
        activePlayerCount: 3,
        status: 'collecting',
        updatedAt: 1200,
      },
      now: 1500,
      randomFn: () => 0.42,
    });

    expect(contest).toEqual(
      expect.objectContaining({
        activeRoundId: 'classic-100-1000-12345',
        activePlayerCount: 3,
        status: 'collecting',
      }),
    );
  });

  it('creates a fresh collecting round when the previous one is idle or empty', () => {
    const contest = normalizeContestState({
      contestId: 'pro-250',
      contest: {
        id: 'pro-250',
        prizePool: 250,
        entryFee: 'FREE',
        activeRoundId: 'old-round',
        activeRoundStartedAt: 1000,
        activeRoundEndsAt: 1200,
        activePlayerCount: 0,
        status: 'idle',
        updatedAt: 1200,
      },
      now: 2000,
      randomFn: () => 0,
    });

    expect(contest).toEqual(
      expect.objectContaining({
        activeRoundId: 'pro-250-2000-00000',
        activeRoundStartedAt: 2000,
        activeRoundEndsAt: 2000 + MATCHMAKING_WAIT_TIME_SECONDS * 1000,
        activePlayerCount: 0,
        status: 'collecting',
      }),
    );
  });

  it('randomly pairs players in twos and leaves one unmatched when needed', () => {
    const {pairs, unmatchedPlayer} = pairPlayersForRound(
      [
        {userId: 'user-1'},
        {userId: 'user-2'},
        {userId: 'user-3'},
        {userId: 'user-4'},
        {userId: 'user-5'},
      ],
      (() => {
        const values = [0.8, 0.2, 0.7, 0.1];
        let index = 0;
        return () => values[index++];
      })(),
    );

    expect(pairs).toEqual([
      [{userId: 'user-2'}, {userId: 'user-4'}],
      [{userId: 'user-3'}, {userId: 'user-1'}],
    ]);
    expect(unmatchedPlayer).toEqual({userId: 'user-5'});
  });

  it('creates six-digit numeric room codes', () => {
    const roomCode = createRoomCode();

    expect(roomCode).toMatch(/^\d{6}$/);
  });
});
