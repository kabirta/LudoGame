import React, {
  memo,
  useCallback,
  useMemo,
} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  useDispatch,
  useSelector,
} from 'react-redux';

import {Colors} from '../../constants/Colors';
import {
  ArrowSpot,
  SafeSpots,
  StarSpots,
} from '../../helpers/PlotData';
import {selectCurrentPositions} from '../../redux/reducers/gameSelectors';
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
    // Example: dispatch(movePiece({ playerNo, pieceId, position: id }));
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isSafeSpot ? color : 'white' },
      ]}
    >
      {/* Star Spot Icon */}
      {isStarSpot && (
        <Ionicons name="star-outline" size={RFValue(16)} color={color} />
      )}

      {/* Arrow Spot Icon */}
      {isArrowSpot && (
        <Ionicons
          name="arrow-forward-outline"
          size={RFValue(16)}
          color="grey"
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
        />
      )}

      {/* Render Player Pieces */}
      <View style={styles.pieceContainer}>
        {piecesAtPosition.map((piece, index) => {
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
            playerLetter === 'A'
              ? Colors.red
              : playerLetter === 'B'
              ? Colors.green
              : playerLetter === 'C'
              ? Colors.yellow
              : Colors.blue;

          return (
            <View
              key={piece.id}
              style={[
                styles.pieceContainer,
                {
                  transform: [
                    {
                      scale: piecesAtPosition.length === 1 ? 1 : 0.7,
                    },
                    {
                      translateX:
                        piecesAtPosition.length === 1
                          ? 0
                          : index * 2 === 0
                          ? -5
                          : 6,
                    },
                  ],
                },
              ]}
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

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.4,
    borderColor: Colors.borderColor,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceContainer: {
    position: 'absolute',
    top: 2,
    zIndex: 99,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export default memo(Cell);
