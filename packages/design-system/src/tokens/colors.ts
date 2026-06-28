export const colors = {
  blue: {
    900: '#002751',
    800: '#004174',
    700: '#1a4b76',
  },
  cyan: {
    500: '#009fe3',
    400: '#00a9e6',
  },
  gray: {
    500: '#818080',
  },
  black: '#1d1d1b',
  white: '#ffffff',
} as const

export type Colors = typeof colors
