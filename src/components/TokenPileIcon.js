import React, {
  memo,
  useMemo,
} from 'react';

import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
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
  red: {
    idPrefix: 'r',
    shadowColor: '#3a0000',
    bodyStops: ['#b01010', '#e82020', '#ff5a2a', '#e82020', '#8a0a0a'],
    headStops: ['#ff6a40', '#ee2020', '#8a0a0a'],
    rimStops: ['#cc1a1a', '#6a0808'],
    highlightColor: '#ff3030',
  },
  yellow: {
    idPrefix: 'y',
    shadowColor: '#5e4300',
    bodyStops: ['#b68800', '#e8bc12', '#ffe76a', '#e8bc12', '#926400'],
    headStops: ['#fff1a0', '#ffd11f', '#9e7200'],
    rimStops: ['#d2a800', '#745200'],
    highlightColor: '#fff0a3',
  },
  green: {
    idPrefix: 'g',
    shadowColor: '#0d3315',
    bodyStops: ['#06702b', '#0da944', '#53df7b', '#0da944', '#04521f'],
    headStops: ['#79ef9b', '#17bc52', '#04521f'],
    rimStops: ['#11a242', '#03421a'],
    highlightColor: '#8effaf',
  },
  blue: {
    idPrefix: 'b',
    shadowColor: '#071f5e',
    bodyStops: ['#1248ba', '#2274ff', '#63b5ff', '#2274ff', '#0b2f88'],
    headStops: ['#72c6ff', '#2f8cff', '#0b2f88'],
    rimStops: ['#2c79ff', '#082b78'],
    highlightColor: '#9fd4ff',
  },
  default: {
    idPrefix: 'd',
    shadowColor: '#343434',
    bodyStops: ['#6c6c6c', '#9a9a9a', '#d8d8d8', '#9a9a9a', '#4a4a4a'],
    headStops: ['#f5f5f5', '#a0a0a0', '#4a4a4a'],
    rimStops: ['#9a9a9a', '#4a4a4a'],
    highlightColor: '#ffffff',
  },
};

const BODY_SHAPE = `
  M 100 30
  C 122 30, 138 46, 138 68
  C 138 82, 131 94, 120 101
  C 133 108, 143 118, 150 130
  C 162 150, 168 174, 168 200
  C 168 230, 162 255, 155 268
  C 148 281, 138 288, 130 291
  L 70 291
  C 62 288, 52 281, 45 268
  C 38 255, 32 230, 32 200
  C 32 174, 38 150, 50 130
  C 57 118, 67 108, 80 101
  C 69 94, 62 82, 62 68
  C 62 46, 78 30, 100 30
  Z
`;

const BODY_HIGHLIGHT = `
  M 55 105
  C 62 100, 72 95, 82 100
  C 90 104, 96 112, 98 125
  C 100 140, 98 160, 94 180
  C 90 200, 84 222, 80 240
  C 76 258, 74 272, 72 282
  C 65 278, 54 265, 46 245
  C 40 228, 35 208, 35 190
  C 35 168, 40 145, 48 128
  C 51 119, 53 111, 55 105
  Z
`;

const TokenPileIcon = ({color, size = 20}) => {
  const variant = useMemo(() => {
    const normalizedColor = typeof color === 'string' ? color.toLowerCase() : '';
    const variantKey = COLOR_VARIANT_MAP[normalizedColor] ?? 'default';
    return PILE_VARIANTS[variantKey];
  }, [color]);

  const p = variant.idPrefix;
  const bodyGradId = `${p}BodyGrad`;
  const headGradId = `${p}HeadGrad`;
  const headHighlightId = `${p}HeadHighlight`;
  const bodyHighlightId = `${p}BodyHighlight`;
  const rimGradId = `${p}RimGrad`;
  const bodyClipId = `${p}BodyClip`;
  const iconWidth = size * (200 / 340);

  return (
    <Svg
      width={iconWidth}
      height={size}
      viewBox="0 0 200 340"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <LinearGradient id={bodyGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={variant.bodyStops[0]} />
          <Stop offset="30%" stopColor={variant.bodyStops[1]} />
          <Stop offset="55%" stopColor={variant.bodyStops[2]} />
          <Stop offset="75%" stopColor={variant.bodyStops[3]} />
          <Stop offset="100%" stopColor={variant.bodyStops[4]} />
        </LinearGradient>

        <RadialGradient id={headGradId} cx="42%" cy="38%" r="55%">
          <Stop offset="0%" stopColor={variant.headStops[0]} />
          <Stop offset="35%" stopColor={variant.headStops[1]} />
          <Stop offset="100%" stopColor={variant.headStops[2]} />
        </RadialGradient>

        <RadialGradient id={headHighlightId} cx="38%" cy="32%" r="35%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <Stop offset="60%" stopColor="#ffffff" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>

        <LinearGradient id={bodyHighlightId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="25%" stopColor="#ffffff" stopOpacity="0.35" />
          <Stop offset="45%" stopColor="#ffffff" stopOpacity="0.6" />
          <Stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>

        <LinearGradient id={rimGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={variant.rimStops[0]} />
          <Stop offset="100%" stopColor={variant.rimStops[1]} />
        </LinearGradient>

        <ClipPath id={bodyClipId}>
          <Path d={BODY_SHAPE} />
        </ClipPath>
      </Defs>

      <Ellipse cx="100" cy="306" rx="62" ry="10" fill="#00000033" />

      <Ellipse cx="100" cy="295" rx="68" ry="12" fill={`url(#${rimGradId})`} />
      <Ellipse cx="100" cy="293" rx="68" ry="11" fill={variant.bodyStops[1]} />

      <Path d={BODY_SHAPE} fill={`url(#${bodyGradId})`} />

      <Path
        d={BODY_HIGHLIGHT}
        clipPath={`url(#${bodyClipId})`}
        fill={`url(#${bodyHighlightId})`}
        opacity={0.6}
      />

      <Ellipse cx="100" cy="101" rx="22" ry="6" fill="#00000033" />

      <Circle cx="100" cy="68" r="38" fill={`url(#${headGradId})`} />
      <Circle cx="100" cy="68" r="38" fill={`url(#${headHighlightId})`} />

      <Ellipse
        cx="88"
        cy="55"
        rx="9"
        ry="7"
        fill="#ffffff"
        opacity={0.5}
        transform="rotate(-20 88 55)"
      />

      <Ellipse cx="100" cy="289" rx="55" ry="5" fill={variant.highlightColor} opacity={0.3} />
    </Svg>
  );
};

export default memo(TokenPileIcon);
