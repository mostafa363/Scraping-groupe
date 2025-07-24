// src/theme.js

// 1. Import the `extendTheme` function
import { extendTheme } from '@chakra-ui/react';

// 2. Add your color mode config
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 3. Extend the theme
const theme = extendTheme({ config });

export default theme;