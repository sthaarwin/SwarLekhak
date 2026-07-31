import { MD3LightTheme, configureFonts } from 'react-native-paper';

const govBlueDark = '#003366';
const primary = '#003f87';
const background = '#f8f9fa';
const surface = '#f8f9fa';
const surfaceContainerLow = '#f3f4f5';
const surfaceContainer = '#edeeef';
const surfaceContainerHigh = '#e7e8e9';
const surfaceContainerHighest = '#e1e3e4';
const surfaceContainerLowest = '#ffffff';
const onSurface = '#191c1d';
const onSurfaceVariant = '#424752';
const secondary = '#5b5f62';
const secondaryContainer = '#dde0e3';
const tertiary = '#004c17';
const tertiaryContainer = '#006722';
const tertiaryFixed = '#d7f0dc';
const outline = '#727784';
const outlineVariant = '#c2c6d4';
const borderSubtle = '#DEE2E6';
const textMuted = '#6C757D';
const textMain = '#212529';
const error = '#ba1a1a';
const errorContainer = '#ffdad6';

const feedbackSuccess = '#2e7d32';
const feedbackWarning = '#b26a00';
const feedbackInfo = '#00639b';
const accentWarm = '#b3541e';

export const colors = {
  govBlueDark,
  primary,
  background,
  surface,
  surfaceContainerLow,
  surfaceContainer,
  surfaceContainerHigh,
  surfaceContainerHighest,
  surfaceContainerLowest,
  onSurface,
  onSurfaceVariant,
  secondary,
  secondaryContainer,
  tertiary,
  tertiaryContainer,
  tertiaryFixed,
  outline,
  outlineVariant,
  borderSubtle,
  textMuted,
  textMain,
  error,
  errorContainer,
  feedbackSuccess,
  feedbackWarning,
  feedbackInfo,
  accentWarm,
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onTertiary: '#ffffff',
  primaryFixed: '#d7e2ff',
  inversePrimary: '#acc7ff',
  inverseSurface: '#2e3132',
  inverseOnSurface: '#f0f1f2',
};

export const spacing = {
  base: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  inlineGutter: 12,
  sectionPadding: 24,
  containerMargin: 20,
  stackGap: 16,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typeScale = {
  display: { fontSize: 34, fontWeight: '800' as const, lineHeight: 42 },
  pageTitle: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
  sectionTitle: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  cardTitle: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyEmphasis: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primary,
    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    secondaryContainer: colors.secondaryContainer,
    tertiary: colors.tertiary,
    onTertiary: colors.onTertiary,
    tertiaryContainer: colors.tertiaryContainer,
    background: colors.background,
    onBackground: colors.onSurface,
    surface: colors.surface,
    onSurface: colors.onSurface,
    surfaceVariant: colors.surfaceContainer,
    onSurfaceVariant: colors.onSurfaceVariant,
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
    error: colors.error,
    onError: '#ffffff',
    errorContainer: colors.errorContainer,
    elevation: {
      level0: 'transparent',
      level1: colors.surfaceContainerLow,
      level2: colors.surfaceContainer,
      level3: colors.surfaceContainerHigh,
      level4: colors.surfaceContainerHighest,
      level5: colors.surfaceContainerHighest,
    },
  },
  roundness: 8,
};

export default theme;
