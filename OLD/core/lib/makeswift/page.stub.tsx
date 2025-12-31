interface PageProps {
  path: string;
  locale: string;
}

export async function Page({ path }: PageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-10 text-center text-sm text-gray-500">
      <p>
        Makeswift content is unavailable in stub mode. Rendering placeholder for <code>{path}</code>.
      </p>
    </div>
  );
}
