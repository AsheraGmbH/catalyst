export function exists<T>(value: T | null | undefined): value is T {
  return value != null;
}

export const BACKGROUND_IMAGE = 'https://res.cloudinary.com/giftie/image/upload/v1756736319/background_xyz123.avif';
