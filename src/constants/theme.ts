import { DefaultTheme, type Theme } from '@react-navigation/native';

export const palette = {
  navy: '#0A2342',
  slate: '#2A4666',
  ink: '#132338',
  paper: '#EED8BA',
  cloud: '#FFF8EF',
  mist: '#B9CCE0',
  signal: '#C94D13',
  mint: '#3F8C6C',
  rose: '#C44A5B',
  gold: '#A97510',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  section: 22,
  cardTitle: 18,
  body: 15,
  small: 13,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0B1A2E',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

export const appTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.navy,
    background: palette.paper,
    card: palette.cloud,
    text: palette.ink,
    border: palette.mist,
    notification: palette.signal,
  },
};
