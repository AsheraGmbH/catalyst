import { DM_Serif_Text, Inter, Lato, Playfair_Display, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-family-body',
});

const dmSerifText = DM_Serif_Text({
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
  variable: '--font-family-heading',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-family-mono',
});

export const lato = Lato({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-family-lato',
});

export const playfairDisplay = Playfair_Display({
  display: 'swap',
  subsets: ['latin'],
  weight: '500',
  variable: '--font-family-playfair-display',
});

export const fonts = [inter, dmSerifText, robotoMono, lato, playfairDisplay];
