export const Colors = {
  primary:        '#C26B52',
  primaryLight:   '#D4856E',
  primaryDark:    '#A85A42',
  bg:             '#F5F0EB',
  surface:        '#EDE9E3',
  surfaceInput:   '#FFFFFF',
  textPrimary:    '#1A1714',
  textSecondary:  '#7A7169',
  textOnPrimary:  '#FFFFFF',
  border:         '#D4CFCA',
  borderSelected: '#C26B52',
  error:          '#C0392B',
  success:        '#4A7C5F',
} as const;

export const Spacing = {
  s1:  4,
  s2:  8,
  s3:  12,
  s4:  16,
  s5:  20,
  s6:  24,
  s8:  32,
  s10: 40,
  s12: 48,
  s16: 64,
} as const;

export const Radii = {
  sm:   6,
  md:   12,
  lg:   20,
  full: 9999,
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   28,
  '2xl': 36,
  '3xl': 44,
} as const;

export const LineHeight = {
  xs:   16,
  sm:   18,
  base: 22,
  md:   24,
  lg:   28,
  xl:   36,
  '2xl': 44,
  '3xl': 52,
} as const;

export const FontFamily = {
  serif: 'Georgia',
  sans:  'System',
} as const;
