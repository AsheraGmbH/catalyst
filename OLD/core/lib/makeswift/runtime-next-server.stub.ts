export type Font = {
  family: string;
  label?: string;
  variants?: Array<{ weight?: string; style?: string }>;
};

export function DraftModeScript(_props: Record<string, unknown>) {
  return null;
}

export async function getSiteVersion() {
  return null;
}

export function MakeswiftApiHandler(_siteApiKey: string | undefined, _options: Record<string, unknown>) {
  return async function handler() {
    return new Response('Makeswift API is unavailable in stub mode.', { status: 501 });
  };
}
