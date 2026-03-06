import React, { memo, useMemo } from 'react';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

import pileIconConfig from '../assets/config/pileIcon.json';
import { Colors } from '../constants/Colors';

const COLOR_VARIANT_MAP = {
  [Colors.red]: 'red',
  [Colors.green]: 'green',
  [Colors.yellow]: 'yellow',
  [Colors.blue]: 'blue',
};

const TokenPileIcon = ({ color, size = 24 }) => {
  const variant = useMemo(() => {
    const normalizedColor = typeof color === 'string' ? color.toLowerCase() : color;
    const key = COLOR_VARIANT_MAP[normalizedColor];
    return pileIconConfig.variants[key] || pileIconConfig.variants.default;
  }, [color]);

  const sortedPieces = useMemo(
    () => [...pileIconConfig.layout.pieces].sort((a, b) => a.z - b.z),
    [],
  );

  const baseSize = pileIconConfig.size;
  const scale = size / baseSize;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${baseSize} ${baseSize}`}>
      {sortedPieces.map((piece, index) => {
        const bodyX = piece.x - piece.bodyW / 2;
        const bodyY = piece.y - piece.bodyH / 2 + piece.headR * 0.6;
        return (
          <React.Fragment key={`${piece.x}-${piece.y}-${index}`}>
            <Ellipse
              cx={piece.x}
              cy={piece.y + piece.bodyH / 2 + 1}
              rx={(piece.bodyW / 2) * 0.9}
              ry={2.6 * scale}
              fill={variant.shadow}
              opacity={0.3}
            />
            <Rect
              x={bodyX}
              y={bodyY}
              width={piece.bodyW}
              height={piece.bodyH}
              rx={piece.bodyW / 2}
              fill={variant.body}
              stroke={variant.stroke}
              strokeWidth={1}
            />
            <Circle
              cx={piece.x}
              cy={piece.y - piece.bodyH / 2 + piece.headR * 0.9}
              r={piece.headR}
              fill={variant.head}
              stroke={variant.stroke}
              strokeWidth={1}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

export default memo(TokenPileIcon);
