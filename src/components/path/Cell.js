// ✅ EXPO CONVERTED
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../../constants/Colors';
import { ArrowSpot, SafeSpots, StarSpots } from '../../helpers/PlotData';
import { handleForwardThunk } from '../../redux/reducers/GameAction';
import { selectCurrentPositions } from '../../redux/reducers/gameSelectors';
import Pile from '../Pile';

const Cell = ({ id, color }) => {
  const dispatch = useDispatch();
  const plottedPieces = useSelector(selectCurrentPositions);

  const isSafeSpot = useMemo(() => SafeSpots.includes(id), [id]);
  const isStarSpot = useMemo(() => StarSpots.includes(id), [id]);
  const isArrowSpot = useMemo(() => ArrowSpot.includes(id), [id]);

  const piecesAtPosition = useMemo(
    () => plottedPieces.filter(item => item.pos === id),
    [plottedPieces, id]
  );

  const handlePress = useCallback((playerNo, pieceId) => {
    dispatch(handleForwardThunk(playerNo, pieceId));
  }, [dispatch]);

  return (
    <View
      className="border-[0.4px] border-[#4f6e82] w-full h-full justify-center items-center"
      style={{ backgroundColor: isSafeSpot ? color : 'white' }}
    >
      {/* Star Spot Icon */}
      {isStarSpot && (
        <Ionicons name="star-outline" size={20} color="grey" />
      )}

      {/* Arrow Spot Icon */}
      {isArrowSpot && (
        <Ionicons
          name="arrow-forward-outline"
          style={{
            transform: [
              {
                rotate:
                  id === 38
                    ? '180deg'
                    : id === 25
                    ? '90deg'
                    : id === 51
                    ? '-90deg'
                    : '0deg',
              },
            ],
          }}
          size={12}
          color={color}
        />
      )}

      {/* Render Player Pieces */}
      <View pointerEvents="box-none" style={styles.piecesLayer}>
        {piecesAtPosition?.map((piece, index) => {
          const playerLetter = piece.id.slice(0, 1);
          const playerNo =
            playerLetter === 'A'
              ? 1
              : playerLetter === 'B'
              ? 2
              : playerLetter === 'C'
              ? 3
              : 4;

          const pieceColor =
            piece.id.slice(0, 1) === 'A'
              ? Colors.red
              : piece.id.slice(0, 1) === 'B'
              ? Colors.yellow
              : piece.id.slice(0, 1) === 'C'
              ? Colors.yellow
              : Colors.blue;

          return (
            <View
              key={piece.id}
              pointerEvents="box-none"
              className="z-[99]"
              style={{
                ...styles.pieceWrapper,
                transform: [
                  { scale: piecesAtPosition?.length === 1 ? 1 : 0.7 },
                  {
                    translateX:
                      piecesAtPosition.length === 1
                        ? 0
                        : index * 2 === 0
                        ? -6
                        : 6,
                  },
                  {
                    translateY:
                      piecesAtPosition.length === 1
                        ? 0
                        : index < 2
                        ? -6
                        : 6,
                  },
                ],
              }}
            >
              <Pile
                cell={true}
                player={playerNo}
                onPress={() => handlePress(playerNo, piece.id)}
                pieceId={piece.id}
                color={pieceColor}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default memo(Cell);

const styles = StyleSheet.create({
  piecesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ⚠️ INLINE FALLBACK: backgroundColor — computed from isSafeSpot ? color : 'white'
// ⚠️ INLINE FALLBACK: transform (scale, translateX, translateY) — computed animation values
// ⚠️ INLINE FALLBACK: Ionicons arrow transform[rotate] — directional rotation must be inline
