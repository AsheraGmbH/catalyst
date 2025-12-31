export const MakeswiftComponentType = new Proxy(
  {},
  {
    get: () => 'stub',
  },
) as Record<string, string>;
