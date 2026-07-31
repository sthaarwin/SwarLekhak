import { MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

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
const secondary = '#565f71';
const secondaryContainer = '#dde0e3';
const tertiary = '#004c17';
const tertiaryContainer = '#d7f0dc';
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

const fontConfig = configureFonts({
  config: {
    displayLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
    displayMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 45, lineHeight: 52, letterSpacing: 0 },
    displaySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 36, lineHeight: 44, letterSpacing: 0 },
    headlineLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 32, lineHeight: 40, letterSpacing: 0 },
    headlineMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 28, lineHeight: 36, letterSpacing: 0 },
    headlineSmall: { fontFamily: 'System', fontWeight: '400', fontSize: 24, lineHeight: 32, letterSpacing: 0 },
    titleLarge: { fontFamily: 'System', fontWeight: '500', fontSize: 22, lineHeight: 28, letterSpacing: 0 },
    titleMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
    titleSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    labelLarge: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    labelMedium: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
    labelSmall: { fontFamily: 'System', fontWeight: '500', fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
    bodyLarge: { fontFamily: 'System', fontWeight: '400', fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
    bodyMedium: { fontFamily: 'System', fontWeight: '400', fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
    bodySmall: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  },
});

const theme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary,
    onPrimary: '#ffffff',
    primaryContainer: '#d7e2ff',
    onPrimaryContainer: '#001435',
    secondary,
    onSecondary: '#ffffff',
    secondaryContainer,
    onSecondaryContainer: '#131c2b',
    tertiary,
    onTertiary: '#ffffff',
    tertiaryContainer,
    onTertiaryContainer: '#002108',
    error,
    onError: '#ffffff',
    errorContainer,
    onErrorContainer: '#410002',
    background,
    onBackground: onSurface,
    surface,
    onSurface,
    surfaceVariant: surfaceContainer,
    onSurfaceVariant,
    outline,
    outlineVariant,
    inverseSurface: colors.inverseSurface,
    inverseOnSurface: colors.inverseOnSurface,
    inversePrimary: colors.inversePrimary,
    elevation: {
      level0: 'transparent',
      level1: surfaceContainerLow,
      level2: surfaceContainer,
      level3: surfaceContainerHigh,
      level4: surfaceContainerHighest,
      level5: surfaceContainerHighest,
    },
    surfaceDisabled: 'rgba(25, 28, 29, 0.12)',
    onSurfaceDisabled: 'rgba(25, 28, 29, 0.38)',
    backdrop: 'rgba(25, 28, 29, 0.4)',
  },
};

export default theme;
