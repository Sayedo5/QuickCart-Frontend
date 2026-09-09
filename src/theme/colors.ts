export const palette = {
  primary: '#FF6B35',
  primaryPressed: '#E66030',
  /** @deprecated Use `colors.primarySoft` so the tint adapts to dark mode. */
  primarySoft: '#FFF1EB',
  secondary: '#2EC4B6',
  secondaryPressed: '#29B0A4',
  /** @deprecated Use `colors.secondarySoft`. */
  secondarySoft: '#E5F8F6',
  error: '#E53935',
  /** @deprecated Use `colors.errorSoft`. */
  errorSoft: '#FDECEA',
  warning: '#FFB020',
  /** @deprecated Use `colors.warningSoft`. */
  warningSoft: '#FFF6E5',
  star: '#FFB800',
  white: '#FFFFFF',
  black: '#000000',
  disabled: '#E0E0E0',
  disabledText: '#A0A0A0',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  divider: string;
  skeleton: string;
  skeletonHighlight: string;
  overlay: string;
  inputBackground: string;
  tabBar: string;
  disabled: string;
  disabledText: string;
  /** Tinted backgrounds for selected / highlighted states. Readable with `text` in both themes. */
  primarySoft: string;
  secondarySoft: string;
  errorSoft: string;
  warningSoft: string;
  /** Text colours that sit on the soft tints above. */
  onSecondarySoft: string;
  onWarningSoft: string;
};

export const lightColors: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F5',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9A9A9A',
  border: '#ECECEC',
  divider: '#F0F0F0',
  skeleton: '#EBEBEB',
  skeletonHighlight: '#F7F7F7',
  overlay: 'rgba(0,0,0,0.45)',
  inputBackground: '#F4F4F5',
  tabBar: '#FFFFFF',
  disabled: '#E0E0E0',
  disabledText: '#A0A0A0',
  primarySoft: '#FFF1EB',
  secondarySoft: '#E5F8F6',
  errorSoft: '#FDECEA',
  warningSoft: '#FFF6E5',
  onSecondarySoft: '#1F8F85',
  onWarningSoft: '#9A6200',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1C1C1E',
  surfaceAlt: '#262628',
  text: '#F5F5F5',
  textSecondary: '#A8A8A8',
  textTertiary: '#7A7A7A',
  border: '#2C2C2E',
  divider: '#262628',
  skeleton: '#2A2A2C',
  skeletonHighlight: '#353537',
  overlay: 'rgba(0,0,0,0.6)',
  inputBackground: '#262628',
  tabBar: '#1C1C1E',
  disabled: '#3A3A3C',
  disabledText: '#8A8A8A',
  primarySoft: 'rgba(255,107,53,0.18)',
  secondarySoft: 'rgba(46,196,182,0.18)',
  errorSoft: 'rgba(229,57,53,0.20)',
  warningSoft: 'rgba(255,176,32,0.18)',
  onSecondarySoft: '#5FE0D3',
  onWarningSoft: '#FFC85C',
};
