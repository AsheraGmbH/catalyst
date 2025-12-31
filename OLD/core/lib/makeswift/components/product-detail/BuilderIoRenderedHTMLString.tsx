"use server";
import BuilderIoServer from './BuilderIoServer';

export default async function BuilderIoRenderedHTMLString({ slug }: { slug: string })
{
    const element = await BuilderIoServer({slug});

    return <script id={`__server_content__${slug}`} type="application/json" dangerouslySetInnerHTML={{ __html: element }} />;
}