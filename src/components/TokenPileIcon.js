import React, {memo, useMemo} from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
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
  yellow: {
    idPrefix: 'y',
    shadowColor: '#5a3e00',
    headStops: [
      {offset: '0%', color: '#FFE97A'},
      {offset: '40%', color: '#FFD000'},
      {offset: '100%', color: '#A07800'},
    ],
    bodyStops: [
      {offset: '0%', color: '#B08800'},
      {offset: '25%', color: '#FFD000'},
      {offset: '55%', color: '#FFE566'},
      {offset: '100%', color: '#A07800'},
    ],
    baseStops: [
      {offset: '0%', color: '#FFD000'},
      {offset: '100%', color: '#8C6A00'},
    ],
    neckColor: '#FFD000',
    neckHighlight: '#FFE566',
  },
  red: {
    idPrefix: 'r',
    shadowColor: '#3a0000',
    headStops: [
      {offset: '0%', color: '#FFB3B3'},
      {offset: '40%', color: '#E00000'},
      {offset: '100%', color: '#7A0000'},
    ],
    bodyStops: [
      {offset: '0%', color: '#8B0000'},
      {offset: '25%', color: '#E00000'},
      {offset: '55%', color: '#FF6666'},
      {offset: '100%', color: '#7A0000'},
    ],
    baseStops: [
      {offset: '0%', color: '#E00000'},
      {offset: '100%', color: '#5C0000'},
    ],
    neckColor: '#E00000',
    neckHighlight: '#FF6666',
  },
  green: {
    idPrefix: 'g',
    shadowColor: '#0a2a00',
    headStops: [
      {offset: '0%', color: '#B3FFB3'},
      {offset: '40%', color: '#00C800'},
      {offset: '100%', color: '#005500'},
    ],
    bodyStops: [
      {offset: '0%', color: '#004A00'},
      {offset: '25%', color: '#00C800'},
      {offset: '55%', color: '#7CFF63'},
      {offset: '100%', color: '#005500'},
    ],
    baseStops: [
      {offset: '0%', color: '#00C800'},
      {offset: '100%', color: '#003300'},
    ],
    neckColor: '#00C800',
    neckHighlight: '#7CFF63',
  },
  blue: {
    idPrefix: 'b',
    shadowColor: '#00102a',
    headStops: [
      {offset: '0%', color: '#B3D9FF'},
      {offset: '40%', color: '#0077E0'},
      {offset: '100%', color: '#001A5C'},
    ],
    bodyStops: [
      {offset: '0%', color: '#001f4d'},
      {offset: '25%', color: '#0077E0'},
      {offset: '55%', color: '#8BD2FF'},
      {offset: '100%', color: '#001A5C'},
    ],
    baseStops: [
      {offset: '0%', color: '#0077E0'},
      {offset: '100%', color: '#001040'},
    ],
    neckColor: '#0077E0',
    neckHighlight: '#8BD2FF',
  },
  default: {
    idPrefix: 'd',
    shadowColor: '#2f2f2f',
    headStops: [
      {offset: '0%', color: '#f4f4f4'},
      {offset: '40%', color: '#a5a5a5'},
      {offset: '100%', color: '#5f5f5f'},
    ],
    bodyStops: [
      {offset: '0%', color: '#5f5f5f'},
      {offset: '25%', color: '#a5a5a5'},
      {offset: '55%', color: '#d0d0d0'},
      {offset: '100%', color: '#5f5f5f'},
    ],
    baseStops: [
      {offset: '0%', color: '#a5a5a5'},
      {offset: '100%', color: '#3f3f3f'},
    ],
    neckColor: '#a5a5a5',
    neckHighlight: '#d0d0d0',
  },
};

const TokenPileIcon = ({color, size = 24}) => {
  const variant = useMemo(() => {
    const normalizedColor = typeof color === 'string' ? color.toLowerCase() : '';
    const variantKey = COLOR_VARIANT_MAP[normalizedColor] ?? 'default';
    return PILE_VARIANTS[variantKey];
  }, [color]);

  const p = variant.idPrefix;
  const headGradId = `${p}Head`;
  const bodyGradId = `${p}Body`;
  const baseGradId = `${p}Base`;
  const headGlassId = `${p}Glass`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 200"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <RadialGradient id={headGradId} cx="38%" cy="32%" r="60%">
          {variant.headStops.map(s => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </RadialGradient>

        <LinearGradient id={bodyGradId} x1="0" y1="0" x2="1" y2="0">
          {variant.bodyStops.map(s => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>

        <LinearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
          {variant.baseStops.map(s => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>

        <RadialGradient id={headGlassId} cx="35%" cy="28%" r="45%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.75" />
          <Stop offset="60%" stopColor="white" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </RadialGradient>

      </Defs>

      {/* Ground shadow */}
      <Ellipse cx="60" cy="183" rx="34" ry="8" fill={variant.shadowColor} opacity={0.28} />

      {/* Base platform */}
      <Rect x="24" y="162" width="72" height="14" rx="7" fill={`url(#${baseGradId})`} />
      <Rect x="26" y="162" width="68" height="3" rx="3" fill="white" opacity={0.22} />

      {/* Stem */}
      <Path
        d="M46 162 C46 140 50 128 54 118 L66 118 C70 128 74 140 74 162 Z"
        fill={`url(#${bodyGradId})`}
      />
      <Rect x="56" y="120" width="8" height="40" rx="4" fill="white" opacity={0.18} />

      {/* Neck collar */}
      <Ellipse cx="60" cy="118" rx="14" ry="5" fill={variant.neckColor} />
      <Ellipse cx="60" cy="117" rx="13" ry="3.5" fill={variant.neckHighlight} />

      {/* Head sphere */}
      <Circle cx="60" cy="88" r="30" fill={`url(#${headGradId})`} />
      <Circle cx="60" cy="88" r="30" fill={`url(#${headGlassId})`} />

      {/* Specular highlights */}
      <Ellipse
        cx="51"
        cy="72"
        rx="7"
        ry="5"
        fill="white"
        opacity={0.55}
        transform="rotate(-15 51 72)"
      />
      <Ellipse
        cx="49"
        cy="70"
        rx="3"
        ry="2"
        fill="white"
        opacity={0.9}
        transform="rotate(-15 49 70)"
      />

      {/* Bottom shadow on head */}
      <Path
        d="M34 98 A30 30 0 0 0 86 98 Q60 115 34 98 Z"
        fill={variant.shadowColor}
        opacity={0.18}
      />
    </Svg>
  );
};

export default memo(TokenPileIcon);
