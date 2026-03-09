import React, {
  memo,
  useMemo,
} from 'react';

import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeDropShadow,
  Filter,
  G,
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
    headStops:  ['#FFE97A', '#FFD000', '#A07800'],
    bodyStops:  ['#B08800', '#FFD000', '#FFE566', '#A07800'],
    baseStops:  ['#FFD000', '#8C6A00'],
    neckColor:  '#FFD000',
    neckHighlight: '#FFE566',
    headBottomShadow: '#7a5500',
  },
  red: {
    idPrefix: 'r',
    shadowColor: '#3a0000',
    headStops:  ['#FF9999', '#E00000', '#7A0000'],
    bodyStops:  ['#8B0000', '#E00000', '#FF6666', '#7A0000'],
    baseStops:  ['#E00000', '#5C0000'],
    neckColor:  '#E00000',
    neckHighlight: '#FF6666',
    headBottomShadow: '#5a0000',
  },
  green: {
    idPrefix: 'g',
    shadowColor: '#0a2a00',
    headStops:  ['#99FFB3', '#00C800', '#005500'],
    bodyStops:  ['#004A00', '#00C800', '#7CFF63', '#005500'],
    baseStops:  ['#00C800', '#003300'],
    neckColor:  '#00C800',
    neckHighlight: '#7CFF63',
    headBottomShadow: '#003a00',
  },
  blue: {
    idPrefix: 'b',
    shadowColor: '#00102a',
    headStops:  ['#99CCFF', '#0077E0', '#001A5C'],
    bodyStops:  ['#001f4d', '#0077E0', '#8BD2FF', '#001A5C'],
    baseStops:  ['#0077E0', '#001040'],
    neckColor:  '#0077E0',
    neckHighlight: '#8BD2FF',
    headBottomShadow: '#001640',
  },
  default: {
    idPrefix: 'd',
    shadowColor: '#2f2f2f',
    headStops:  ['#f4f4f4', '#a5a5a5', '#5f5f5f'],
    bodyStops:  ['#5f5f5f', '#a5a5a5', '#d0d0d0', '#5f5f5f'],
    baseStops:  ['#a5a5a5', '#3f3f3f'],
    neckColor:  '#a5a5a5',
    neckHighlight: '#d0d0d0',
    headBottomShadow: '#3f3f3f',
  },
};

const TokenPileIcon = ({color, size = 20, width: widthProp}) => {
  const variant = useMemo(() => {
    const normalizedColor = typeof color === 'string' ? color.toLowerCase() : '';
    const variantKey = COLOR_VARIANT_MAP[normalizedColor] ?? 'default';
    return PILE_VARIANTS[variantKey];
  }, [color]);

  const p = variant.idPrefix;
  const headGradId  = `${p}HG`;
  const bodyGradId  = `${p}BG`;
  const baseGradId  = `${p}SG`;
  const headGlassId = `${p}GL`;
  const rimLightId = `${p}RL`;
  const shadowId = `${p}SH`;
  const iconWidth = widthProp ?? size * (160 / 200);

  return (
    <Svg
      width={iconWidth}
      height={size}
      viewBox="0 0 160 200"
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <RadialGradient id={headGradId} cx="38%" cy="32%" r="60%">
          <Stop offset="0%"   stopColor={variant.headStops[0]} />
          <Stop offset="40%"  stopColor={variant.headStops[1]} />
          <Stop offset="100%" stopColor={variant.headStops[2]} />
        </RadialGradient>

        <LinearGradient id={bodyGradId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor={variant.bodyStops[0]} />
          <Stop offset="25%"  stopColor={variant.bodyStops[1]} />
          <Stop offset="55%"  stopColor={variant.bodyStops[2]} />
          <Stop offset="100%" stopColor={variant.bodyStops[3]} />
        </LinearGradient>

        <LinearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={variant.baseStops[0]} />
          <Stop offset="100%" stopColor={variant.baseStops[1]} />
        </LinearGradient>

        <RadialGradient id={headGlassId} cx="35%" cy="28%" r="45%">
          <Stop offset="0%"   stopColor="white" stopOpacity="0.75" />
          <Stop offset="60%"  stopColor="white" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </RadialGradient>

        <LinearGradient id={rimLightId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor="#fff6b0" stopOpacity="0.5" />
          <Stop offset="50%"  stopColor="#fff6b0" stopOpacity="0" />
          <Stop offset="100%" stopColor="#fff6b0" stopOpacity="0.18" />
        </LinearGradient>

        <Filter id={shadowId} x="-30%" y="-10%" width="160%" height="140%">
          <FeDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor={variant.headBottomShadow}
            floodOpacity={0.45}
          />
        </Filter>
      </Defs>

      <Ellipse cx="80" cy="183" rx="52" ry="9" fill={variant.shadowColor} opacity={0.28} />

      <G filter={`url(#${shadowId})`}>
        <Rect x="20" y="160" width="120" height="18" rx="12" fill={`url(#${baseGradId})`} />
        <Rect x="17" y="160" width="106" height="4" rx="4" fill="white" opacity={0.22} />

        <Path
          d="M54 160 C52 138 55 126 59 116 L101 116 C105 126 108 138 106 160 Z"
          fill={`url(#${bodyGradId})`}
        />
        <Rect x="76" y="118" width="10" height="40" rx="5" fill="white" opacity={0.18} />

        <Ellipse cx="80" cy="116" rx="24" ry="7" fill={variant.neckColor} />
        <Ellipse cx="80" cy="114" rx="22" ry="5" fill={variant.neckHighlight} />

        <Circle cx="80" cy="78" r="40" fill={`url(#${headGradId})`} />
        <Circle cx="80" cy="78" r="40" fill={`url(#${headGlassId})`} />
        <Circle
          cx="80"
          cy="78"
          r="40"
          fill="none"
          stroke={`url(#${rimLightId})`}
          strokeWidth="5"
        />

        <Ellipse
          cx="67"
          cy="59"
          rx="12"
          ry="8"
          fill="white"
          opacity={0.45}
          transform="rotate(-15 67 59)"
        />
        <Ellipse
          cx="65"
          cy="57"
          rx="5"
          ry="3.5"
          fill="white"
          opacity={0.88}
          transform="rotate(-15 65 57)"
        />
        <Ellipse
          cx="63"
          cy="55"
          rx="2"
          ry="1.4"
          fill="white"
          opacity={1}
          transform="rotate(-15 63 55)"
        />

        <Path
          d="M48 92 A40 40 0 0 0 112 92 Q80 112 48 92 Z"
          fill={variant.headBottomShadow}
          opacity={0.18}
        />
      </G>
    </Svg>
  );
};

export default memo(TokenPileIcon);
