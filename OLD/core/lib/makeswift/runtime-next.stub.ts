import type { ReactNode } from 'react';

export class Makeswift {
  constructor(..._args: unknown[]) {}

  async getPageSnapshot() {
    return null;
  }

  async getComponentSnapshot() {
    return null;
  }
}

export function MakeswiftComponent(_props: Record<string, unknown>) {
  return null;
}

export function ReactRuntimeProvider({ children }: { children: ReactNode; previewMode?: boolean; runtime?: unknown }) {
  return children as ReactNode;
}

export function RootStyleRegistry({ children }: { children: ReactNode }) {
  return children as ReactNode;
}

export function Page(_props: Record<string, unknown>) {
  return null;
}
