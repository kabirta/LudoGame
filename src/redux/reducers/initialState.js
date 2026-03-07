import {boardPath, createToken} from '../../helpers/LudoMovementEngine';

const player1InitialState = [
    createToken('A1', 1),
    createToken('A2', 1),
    createToken('A3', 1),
    createToken('A4', 1),
];

const player2InitialState = [
    createToken('B1', 2),
    createToken('B2', 2),
    createToken('B3', 2),
    createToken('B4', 2),
];

const player3InitialState = [
    createToken('C1', 3),
    createToken('C2', 3),
    createToken('C3', 3),
    createToken('C4', 3),
];

const player4InitialState = [
    createToken('D1', 4),
    createToken('D2', 4),
    createToken('D3', 4),
    createToken('D4', 4),
];

const currentPositionsInitialState = [...player1InitialState, ...player2InitialState]
    .filter(piece => typeof piece.pos === 'number' && piece.pos > 0 && !piece.isHome)
    .map(piece => ({
        id: piece.id,
        pos: piece.pos,
    }));

export const initialState = {
    player1: player1InitialState,
    player2: player2InitialState,
    player3: player3InitialState,
    player4: player4InitialState,
    boardPath,
    scores: {
        player1: 0,
        player2: 0,
    },
    consecutiveSixes: {
        player1: 0,
        player2: 0,
        player3: 0,
        player4: 0,
    },
    settings: {
        musicEnabled: false,
        soundEnabled: true,
        vibrationEnabled: true,
        emojisEnabled: true,
    },
    chancePlayer: 1,
    diceNo: 1,
    isDiceRolled: false,
    pileSelectionPlayer: -1,
    cellSelectionPlayer: -1,
    touchDiceBlock: false,
    currentPositions: currentPositionsInitialState,
    fireworks:false,
    winner: null,
};
