import React, {memo, useMemo} from 'react';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import {Colors} from '../constants/Colors';

const COLOR_VARIANT_MAP = {
  [Colors.red]: 'red',
  [Colors.green]: 'green',
  [Colors.yellow]: 'yellow',
  [Colors.blue]: 'blue',
  red: 'red',
  green: 'green',
  yellow: 'yellow',
  blue: 'blue',
};

const PILE_VARIANTS = {
  green: {
    idPrefix: 'g',
    shadow: '#0b5200',
    bodyStops: [
      {offset: '0%', color: '#7CFF63'},
      {offset: '45%', color: '#2ED400'},
      {offset: '100%', color: '#0F7500'},
    ],
  },
  red: {
    idPrefix: 'r',
    shadow: '#400000',
    bodyStops: [
      {offset: '0%', color: '#FF8A8A'},
      {offset: '45%', color: '#E00000'},
      {offset: '100%', color: '#6B0000'},
    ],
  },
  blue: {
    idPrefix: 'b',
    shadow: '#001f4d',
    bodyStops: [
      {offset: '0%', color: '#8BD2FF'},
      {offset: '45%', color: '#0077E0'},
      {offset: '100%', color: '#002E6B'},
    ],
  },
  yellow: {
    idPrefix: 'y',
    shadow: '#6b5200',
    bodyStops: [
      {offset: '0%', color: '#FFF27A'},
      {offset: '45%', color: '#FFD400'},
      {offset: '100%', color: '#9C7B00'},
    ],
  },
  default: {
    idPrefix: 'd',
    shadow: '#2f2f2f',
    bodyStops: [
      {offset: '0%', color: '#f4f4f4'},
      {offset: '45%', color: '#a5a5a5'},
      {offset: '100%', color: '#5f5f5f'},
    ],
  },
};

const HIGHLIGHT_STOPS = [
  {offset: '0%', color: 'white', opacity: 0.9},
  {offset: '100%', color: 'white', opacity: 0},
];

const PILE_BODY_PATH = `
M30 170
C30 145 45 120 52 105
C56 97 56 88 50 80
C45 73 45 62 60 62
C75 62 75 73 70 80
C64 88 64 97 68 105
C75 120 90 145 90 170 Z
`;

const TokenPileIcon = ({color, size = 24}) => {
  const variant = useMemo(() => {
    const normalizedColor = typeof color === 'string' ? color.toLowerCase() : '';
    const variantKey = COLOR_VARIANT_MAP[normalizedColor] ?? 'default';
    return PILE_VARIANTS[variantKey];
  }, [color]);

  const bodyGradientId = `${variant.idPrefix}Body`;
  const highlightGradientId = `${variant.idPrefix}Highlight`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 200"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <LinearGradient id={bodyGradientId} x1="0" y1="0" x2="0" y2="1">
          {variant.bodyStops.map(stop => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </LinearGradient>

        <LinearGradient
          id={highlightGradientId}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          {HIGHLIGHT_STOPS.map(stop => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>

      <Ellipse
        cx="60"
        cy="175"
        rx="42"
        ry="16"
        fill={variant.shadow}
        opacity={0.25}
      />
      <Path d={PILE_BODY_PATH} fill={`url(#${bodyGradientId})`} />
      <Ellipse
        cx="48"
        cy="90"
        rx="10"
        ry="60"
        fill={`url(#${highlightGradientId})`}
      />
    </Svg>
  );
};

export default memo(TokenPileIcon);
