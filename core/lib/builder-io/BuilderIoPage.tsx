"use client";

import React, { useEffect, useState } from "react";
import { Image } from "~/components/image";

export default function BuilderIoPage({ id }: { id?: string })
{
  const [html, setHtml] = useState<string | null>(null);

  // Fetch and process raw HTML on id change
  useEffect(() => {
    if (!id) return;
    const script = document.getElementById(`__server_content__${id}`);
    const content = script?.textContent;
    if (content) {
      try {
        // Parse JSON string back to HTML
        const parsedHtml = JSON.parse(content);
        setHtml(parsedHtml);
      } catch {
        // Fallback: if parsing fails, use content as-is (for backwards compatibility)
        setHtml(content);
      }
    }
  }, [id]);

  if (!html) {
    return (
      <div className="flex h-screen items-center flex-col justify-center">
        <Image
          src="/white-spinner.svg"
          alt="Loading..."
          width={60}
          height={60}
        />
        <p className="text-lg font-semibold text-white">Loading Content</p>
      </div>
    );
  }

  // Render the HTML (SSR HTML only, no Builder runtime)
  return (
    <div
      className="bg-asheraBackground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
