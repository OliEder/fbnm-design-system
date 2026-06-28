export const typography = {
  fontFamily: {
    display: ['INSOLENT', 'Arial Black', 'sans-serif'],
    body:    ['ALLER', 'Arial', 'sans-serif'],
    caption: ['Montserrat', 'Arial', 'sans-serif'],
  },
  fontSize: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  lineHeight: {
    tight:   1.2,
    snug:    1.375,
    normal:  1.5,
    caption: 1.2,
  },
} as const

export type Typography = typeof typography
