// ✅ EXPO CONVERTED
import React, { memo, useCallback, useEffect, useMemo } from 'react';

import LottieView from 'lottie-react-native';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';

import Fireworks from '../assets/animation/firework.json';
import { Colors } from '../constants/Colors';
import { deviceHeight } from '../constants/Scaling';
import { selectFireworks } from '../redux/reducers/gameSelectors';
import { updateFireworks } from '../redux/reducers/gameSlice';
import Pile from './Pile';

const FourTriangles = ({ player1, player2, player3, player4 }) => {
  const size = 300;
  const isFirework = useSelector(selectFireworks);
  const [blast, setBlast] = React.useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isFirework) {
      setBlast(true);
      const timer = setTimeout(() => {
        setBlast(false);
        dispatch(updateFireworks(false));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isFirework, dispatch]);

  const playersData = useMemo(() => [
    { player: player1, playerNo: 1, top: 55, left: 15, pieceColor: Colors.red, translate: 'translateX' },
    { player: player3, playerNo: 3, bottom: 55, left: 15, pieceColor: Colors.yellow, translate: 'translateX' },
    { player: player2, playerNo: 2, top: 20, left: -2, pieceColor: Colors.yellow, translate: 'translateY' },
    { player: player4, playerNo: 4, top: 20, left: -2, pieceColor: Colors.blue, translate: 'translateY' },
  ], [player1, player2, player3, player4]);

  const renderLayerPieces = useCallback(
    (data, index) => (
      <PlayerPieces
        key={index}
        player={data.player.filter(item => item.isHome)}
        style={{
          top: data.top,
          bottom: data.bottom,
          left: data.left,
          right: data.right,
        }}
        pieceColor={data.pieceColor}
        playerNo={data.playerNo}
        translate={data.translate}
      />
    ),
    [],
  );

  const PlayerPieces = React.memo(({ player, style, pieceColor, playerNo, translate }) => {
    return (
      <View
        className="justify-center items-center absolute"
        style={[
          { width: deviceHeight * 0.063, height: deviceHeight * 0.032 },
          style,
        ]}
      >
        {player.map((piece, index) => (
          <View
            key={piece.id}
            style={{
              top: 0,
              zIndex: 99,
              position: 'absolute',
              bottom: 0,
              transform: [{ scale: 0.5 }, { [translate]: 14 * index }],
            }}
          >
            <Pile
              cell={true}
              player={playerNo}
              onPress={() => {}}
              pieceId={piece.id}
              color={pieceColor}
            />
          </View>
        ))}
      </View>
    );
  });

  return (
    <View className="items-center justify-center border-[0.8px] border-[#4f6e82] w-[20%] h-full overflow-hidden bg-white">
      {blast && (
        <LottieView
          source={Fireworks}
          autoPlay
          loop
          hardwareAccelerationAndroid
          speed={1}
          className="w-full h-full absolute z-[1]"
        />
      )}

      <Svg height={size} width={size - 5}>
        {/* Top Triangle - Yellow */}
        <Polygon
          points={`0,0 ${size / 2},${size / 2} ${size},0`}
          fill={Colors.yellow}
        />
        {/* Right Triangle - Blue */}
        <Polygon
          points={`${size},0 ${size},${size} ${size / 2},${size / 2}`}
          fill={Colors.blue}
        />
        {/* Bottom Triangle - Red */}
        <Polygon
          points={`0,${size} ${size / 2},${size / 2} ${size},${size}`}
          fill={Colors.red}
        />
        {/* Left Triangle - Green */}
        <Polygon
          points={`0,0 ${size / 2},${size / 2} 0,${size}`}
          fill={Colors.green}
        />
      </Svg>

      {playersData.map(renderLayerPieces)}
    </View>
  );
};

export default memo(FourTriangles);

// ⚠️ INLINE FALLBACK: PlayerPieces width/height (deviceHeight * 0.063/0.032) — computed device dimensions
// ⚠️ INLINE FALLBACK: style prop (top/bottom/left/right) on PlayerPieces — dynamic positional values
// ⚠️ INLINE FALLBACK: transform (scale, dynamic key translateX/Y) — dynamic game piece transforms
