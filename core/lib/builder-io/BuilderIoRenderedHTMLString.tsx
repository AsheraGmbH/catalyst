"use server";
import BuilderIoServer from './BuilderIoServer';

export default async function BuilderIoRenderedHTMLString({ slug }: { slug: string })
{
    // Skip entirely during build to prevent Next.js from trying to process HTML
    // Check multiple conditions to reliably detect build phase
    // Vercel sets VERCEL=1 during build, and VERCEL_ENV is only set at runtime
    const isBuildPhase = 
        process.env.NEXT_PHASE === 'phase-production-build' ||
        (process.env.VERCEL === '1' && !process.env.VERCEL_ENV) ||
        (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) ||
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.__NEXT_PRIVATE_PREBUNDLED_REACT;
    
    if (isBuildPhase) {
        // Return empty fragment during build to completely skip rendering
        // Using fragment instead of null to avoid React warnings
        return <></>;
    }

    try {
        const element = await BuilderIoServer({slug});
        
        // Return empty script if no HTML content (prevents build errors)
        if (!element || element.trim() === '') {
            return <script id={`__server_content__${slug}`} type="application/json" />;
        }

        // Store HTML as JSON string in script tag to prevent Next.js from processing it during build
        // The client component will parse it back to HTML
        const jsonContent = JSON.stringify(element);

        return <script id={`__server_content__${slug}`} type="application/json" dangerouslySetInnerHTML={{ __html: jsonContent }} />;
    } catch (error) {
        // During build, if Builder.io fetch fails, return empty script to prevent build errors
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
            console.warn(`[BuilderIoRenderedHTMLString] Error for slug ${slug} (build time):`, error);
        } else {
            console.error(`[BuilderIoRenderedHTMLString] Error for slug ${slug}:`, error);
        }
        return <script id={`__server_content__${slug}`} type="application/json" />;
    }
}
