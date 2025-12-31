"use client";

import React, { useEffect, useState, useRef } from "react";
import { Image } from "~/components/image";

const BUILDER_RUNTIME_SRC = "https://cdn.builder.io/js/webcomponents";
const BUILDER_CDN_ORIGIN = "https://cdn.builder.io";

export default function BuilderIoPage({ id }: { id?: string })
{
  const [html, setHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch and process raw HTML on id change
  useEffect(() =>
  {
    if (!id) return;
    const script = document.getElementById(`__server_content__${id}`);
    const content = script?.textContent;
    if (content)
    {
      setHtml(content);
    }
  }, [id]);

  // After HTML is rendered, inject the video script
  useEffect(() =>
  {
    if (!html || !containerRef.current) return;

    const div = containerRef.current.querySelector("div.video-container");
    if (div)
    {
      const VIDEO_SCRIPT = require("./video-script.js").default;
      const next = div.nextElementSibling;
      const isInjected =
        next &&
        next.tagName.toLowerCase() === "script";

      if (!isInjected)
      {
        const scriptEl = document.createElement("script");
        scriptEl.innerHTML = VIDEO_SCRIPT;
        div.parentNode?.insertBefore(scriptEl, div.nextSibling);
      }
    }
  }, [html]);

  useEffect(() =>
  {
    if (!html || !containerRef.current) return;

    const container = containerRef.current;
    const hasBuilderMarkers =
      html.includes("builder-") ||
      !!container.querySelector(
        "[data-builder-block-id], [builder-block], builder-component, .builder-component",
      );

    if (!hasBuilderMarkers) return;

    const win = window as typeof window & { __builderRuntimeQueued?: boolean };
    if (win.__builderRuntimeQueued) return;

    if (document.querySelector(`script[src="${BUILDER_RUNTIME_SRC}"]`))
    {
      win.__builderRuntimeQueued = true;
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleHandle: number | undefined;

    const scope = window as unknown as {
      requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const loadRuntime = () =>
    {
      if (win.__builderRuntimeQueued) return;
      win.__builderRuntimeQueued = true;

      const head = document.head;

      if (!document.querySelector(`link[rel="preconnect"][href="${BUILDER_CDN_ORIGIN}"]`))
      {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = BUILDER_CDN_ORIGIN;
        link.crossOrigin = "";
        head.appendChild(link);
      }

      if (!document.querySelector(`script[src="${BUILDER_RUNTIME_SRC}"]`))
      {
        const scriptEl = document.createElement("script");
        scriptEl.src = BUILDER_RUNTIME_SRC;
        scriptEl.async = true;
        head.appendChild(scriptEl);
      }

      cleanup();
    };

    const onInteraction = () => loadRuntime();

    const cleanup = () =>
    {
      if (typeof timeoutId !== "undefined")
      {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (typeof idleHandle !== "undefined" && scope.cancelIdleCallback)
      {
        scope.cancelIdleCallback(idleHandle);
        idleHandle = undefined;
      }

      window.removeEventListener("scroll", onInteraction);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };

    if (scope.requestIdleCallback)
    {
      idleHandle = scope.requestIdleCallback(loadRuntime, { timeout: 2000 });
    }
    else
    {
      timeoutId = setTimeout(loadRuntime, 1500);
    }

    window.addEventListener("scroll", onInteraction, { once: true, passive: true });
    window.addEventListener("pointerdown", onInteraction, { once: true, passive: true });
    window.addEventListener("keydown", onInteraction, { once: true, passive: true });

    return cleanup;
  }, [html]);

  if (!html)
  {
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

  // Render the HTML inside a container ref for post-processing
  return (
    <div
      className="bg-asheraBackground"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
