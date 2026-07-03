/**
 * src/constants/index.ts
 * 디자인 시스템 토큰 - 토스(Toss) 스타일
 *
 * THEME: 토스 스타일 디자인 시스템 (메인)
 *   - 흰색/연그레이 배경, 브랜드 블랙(#111111) 액센트, 그레이 텍스트 위계
 *   - 라운드 사각(버튼/입력/카드), 플랫한 서피스, 절제된 그림자
 * COLORS / FONTS / SPACING: 하위 호환용 (기존 컴포넌트가 참조)
 */

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

// ─────────────────────────────────────────
// THEME (토스 스타일 디자인 시스템 토큰)
// ─────────────────────────────────────────
export const THEME = {
  colors: {
    // 배경 (토스: 흰색 / 연그레이) — 키 이름은 하위 호환 유지
    bgTop: '#FFFFFF',
    bgMid: '#F7F8FA',
    bgBot: '#F7F8FA',

    // 서피스
    surface: '#FFFFFF',
    // ※ 반투명 오버레이용(이미지/컬러 위) — 불투명화 금지
    surfaceTransparent: 'rgba(255, 255, 255, 0.7)',

    // 텍스트 위계 (토스)
    textMain: '#191F28',
    textSub: '#4E5968',
    textMuted: '#8B95A1',
    textPlaceholder: '#B0B8C1',

    // 액센트 (브랜드 블랙 유지)
    accentSoft: '#F2F4F6',
    accentDark: '#111111',
    tagBg: '#F2F4F6',

    // 보더 / 구분선 (토스 헤어라인)
    border: '#E5E8EB',
    divider: '#F2F4F6',

    // 시스템
    iosGreen: '#34C759',
    iosGray: '#E9E9EA',
    error: '#FF3B30',

    // 알림 아이콘
    heart: '#FF5E5E',
    heartBg: '#FFF0F0',
    bookmark: '#F2A541',
    bookmarkBg: '#FFF8E6',
    star: '#9B51E0',
    starBg: '#F4F0FF',
    userBlue: '#5E81FF',
    userBlueBg: '#F0F4FF',

    // 설정 아이콘
    iconBlue: '#007AFF',
    iconRed: '#FF3B30',
    iconPurple: '#AF52DE',
    iconOrange: '#FF9500',
    iconGray: '#8E8E93',
  },

  radius: {
    xl: 24,
    lg: 20,
    md: 16,
    sm: 12,
    button: 14, // 라운드 사각 버튼/입력 (토스 CTA)
    pill: 999, // 칩/아바타 등 완전 둥근 요소 전용
  },

  // 그림자 — 스타일에서는 ...THEME.shadow.soft 로 spread하거나,
  // native/web 분기가 필요하면 아래 shadowStyle('soft') 헬퍼를 사용
  shadow: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    float: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
    },
    nav: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 8,
    },
  },

  // React Native Web용 boxShadow
  shadowWeb: {
    soft: { boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' },
    float: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' },
    nav: { boxShadow: '0px -2px 8px rgba(0,0,0,0.04)' },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  font: {
    size: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      xxxl: 28,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
  },
} as const;

/**
 * 그림자 Platform 분기 헬퍼 — StyleSheet에서 ...shadowStyle('soft') 로 사용.
 * Platform.select({ native, web }) spread는 boxShadow union 때문에 ViewStyle과
 * 타입이 안 맞으므로(TS2769), 분기가 필요할 땐 반드시 이 헬퍼를 쓴다.
 */
export const shadowStyle = (level: keyof typeof THEME.shadow): ViewStyle =>
  Platform.OS === 'web'
    ? (THEME.shadowWeb[level] as unknown as ViewStyle)
    : (THEME.shadow[level] as ViewStyle);

// ─────────────────────────────────────────
// 하위 호환 export (기존 컴포넌트용)
// ─────────────────────────────────────────
export const COLORS = {
  primary: THEME.colors.accentDark,
  primaryLight: THEME.colors.accentSoft,
  secondary: THEME.colors.heart,
  background: THEME.colors.bgBot,
  white: THEME.colors.surface,
  black: THEME.colors.textMain,
  gray: {
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: THEME.colors.textPlaceholder,
    500: THEME.colors.textMuted,
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  success: THEME.colors.iosGreen,
  warning: '#FFD43B',
  error: THEME.colors.error,
} as const;

export const FONTS = {
  size: THEME.font.size,
  weight: THEME.font.weight,
} as const;

export const SPACING = THEME.spacing;

// ─────────────────────────────────────────
// 지도 기본 설정
// ─────────────────────────────────────────
export const MAP_DEFAULTS = {
  center: {
    latitude: 37.5666805,
    longitude: 126.9784147,
  },
  zoom: 14,
} as const;

// ─────────────────────────────────────────
// 태그 표시 이름 (한국어)
// ─────────────────────────────────────────
export const TAG_LABELS: Record<string, string> = {
  cafe: '카페',
  restaurant: '맛집',
  park: '공원',
  museum: '박물관',
  gallery: '갤러리',
  shopping: '쇼핑',
  nature: '자연',
  historic: '역사',
  nightlife: '나이트라이프',
  hidden_gem: '숨은 명소',
};

// ─────────────────────────────────────────
// API 설정
// ─────────────────────────────────────────
export const API_CONFIG = {
  timeout: 10000,
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
} as const;
