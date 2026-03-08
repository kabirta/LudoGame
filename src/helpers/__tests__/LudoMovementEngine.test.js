import {
  canPieceMove,
  getMovableTokens,
  HOME_BONUS,
  HOME_ENTRY_POSITION,
  boardPath,
  capturePawn,
  checkHome,
  createToken,
  getBoardTileForPosition,
  movePawn,
  rollDice,
  shouldGrantExtraRoll,
  updateScore,
} from '../LudoMovementEngine';

describe('LudoMovementEngine', () => {
  it('creates a 56-tile board path', () => {
    expect(boardPath).toHaveLength(56);
    expect(boardPath[0]).toBe(1);
    expect(boardPath[55]).toBe(56);
  });

  it('rollDice returns a value between 1 and 6', () => {
    expect(rollDice(() => 0)).toBe(1);
    expect(rollDice(() => 0.5)).toBe(4);
    expect(rollDice(() => 0.999)).toBe(6);
  });

  it('starts a pawn on the colored start tile with score 0', () => {
    const pawn = createToken('A1', 1);

    expect(pawn.position).toBe(0);
    expect(pawn.positionIndex).toBe(0);
    expect(pawn.pos).toBe(1);
    expect(pawn.score).toBe(0);
  });

  it('moves a pawn forward and starts scoring only after leaving the start tile', () => {
    const pawn = movePawn(createToken('A1', 1), 4, 1);

    expect(pawn.position).toBe(4);
    expect(pawn.positionIndex).toBe(4);
    expect(pawn.pos).toBe(5);
    expect(pawn.isHome).toBe(false);
    expect(pawn.score).toBe(4);
  });

  it('awards the +56 home bonus when a pawn reaches home', () => {
    const pawnAtHome = checkHome(
      updateScore({
        ...createToken('A1', 1),
        position: HOME_ENTRY_POSITION,
        pos: 0,
      }),
    );

    expect(pawnAtHome.isHome).toBe(true);
    expect(pawnAtHome.position).toBe(HOME_ENTRY_POSITION);
    expect(pawnAtHome.positionIndex).toBe(HOME_ENTRY_POSITION);
    expect(pawnAtHome.score).toBe(HOME_ENTRY_POSITION + HOME_BONUS);
  });

  it('does not allow a home-stretch pawn to overshoot home', () => {
    const almostHomePawn = updateScore({
      ...createToken('A1', 1),
      position: 53,
      positionIndex: 53,
      pos: 113,
    });

    expect(canPieceMove(almostHomePawn, 3)).toBe(true);
    expect(canPieceMove(almostHomePawn, 4)).toBe(false);
  });

  it('ignores finished home pawns when collecting movable pieces', () => {
    const finishedPawn = checkHome(
      updateScore({
        ...createToken('A1', 1),
        position: HOME_ENTRY_POSITION,
        pos: 0,
      }),
    );
    const stretchPawn = updateScore({
      ...createToken('A2', 1),
      position: 53,
      positionIndex: 53,
      pos: 113,
    });

    const movablePieces = getMovableTokens([finishedPawn, stretchPawn], 4);

    expect(movablePieces).toHaveLength(0);
  });

  it('enters the red home lane immediately after the home-entry square', () => {
    expect(getBoardTileForPosition(1, 50)).toBe(51);
    expect(getBoardTileForPosition(1, 51)).toBe(111);
    expect(getBoardTileForPosition(1, 55)).toBe(115);
    expect(getBoardTileForPosition(1, 56)).toBe(0);
  });

  it('captures an opponent on an unsafe tile and sends it back to start', () => {
    const movingPawn = movePawn(createToken('A1', 1), 4, 1);
    const opponentPawn = updateScore({
      ...createToken('B1', 2),
      position: 4,
      positionIndex: 4,
      pos: 5,
    });

    const {capturedPawns, opponentPawns} = capturePawn(movingPawn, [opponentPawn]);

    expect(capturedPawns).toHaveLength(1);
    expect(opponentPawns[0].position).toBe(0);
    expect(opponentPawns[0].positionIndex).toBe(0);
    expect(opponentPawns[0].pos).toBe(27);
    expect(opponentPawns[0].score).toBe(0);
  });

  it('does not capture on a safe tile', () => {
    const movingPawn = movePawn(createToken('A1', 1), 13, 1);
    const opponentPawn = updateScore({
      ...createToken('B1', 2),
      position: 13,
      positionIndex: 13,
      pos: 14,
    });

    const {capturedPawns, opponentPawns} = capturePawn(movingPawn, [opponentPawn]);

    expect(capturedPawns).toHaveLength(0);
    expect(opponentPawns[0].position).toBe(13);
    expect(opponentPawns[0].score).toBe(13);
  });

  it('grants an extra roll after a capture', () => {
    expect(shouldGrantExtraRoll({diceNo: 3, capturedCount: 1})).toBe(true);
  });

  it('grants an extra roll after reaching home', () => {
    expect(
      shouldGrantExtraRoll({diceNo: 3, capturedCount: 0, reachedHome: true}),
    ).toBe(true);
  });

  it('does not grant an extra roll for a normal non-six move', () => {
    expect(shouldGrantExtraRoll({diceNo: 3, capturedCount: 0})).toBe(false);
  });
});
