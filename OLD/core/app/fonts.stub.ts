const createStubFont = (variable: string) => ({
  className: variable.replace(/^--/, ''),
  variable,
});

export const inter = createStubFont('--font-family-inter');
export const dmSerifText = createStubFont('--font-family-dm-serif-text');
export const robotoMono = createStubFont('--font-family-roboto-mono');
export const lato = createStubFont('--font-family-lato');
export const playfairDisplay = createStubFont('--font-family-playfair-display');

export const fonts = [inter, dmSerifText, robotoMono];
