export const fonts = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  headingMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
};

/**
 * Poppins has tall ascenders, so heading/button line heights are kept at
 * ~1.45× the font size to avoid clipped glyphs on Android.
 */
export const typography = {
  display: { fontFamily: fonts.headingBold, fontSize: 32, lineHeight: 44 },
  h1: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 36 },
  h2: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 32 },
  h3: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 27 },
  h4: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 24 },
  title: { fontFamily: fonts.headingMedium, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  bodySemiBold: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  bodySmMedium: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  bodySmSemiBold: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  captionMedium: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  button: { fontFamily: fonts.heading, fontSize: 15, lineHeight: 22 },
} as const;

export type TypographyVariant = keyof typeof typography;
