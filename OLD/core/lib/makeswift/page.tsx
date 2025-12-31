import { Page as MakeswiftPage } from '@makeswift/runtime/next';
// import { notFound } from 'next/navigation';
// import { connection } from 'next/server';

// import { getPageSnapshot } from './client';

export async function Page({ path, locale }: { path: string; locale: string }) {
  if (process.env.CATALYST_STUB_MODE === 'true') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-10 text-center text-sm text-gray-500">
        <p>
          Makeswift content is unavailable in stub mode. Rendering placeholder for <code>{path}</code>.
        </p>
      </div>
    );
  }

  // const snapshot = await getPageSnapshot({ path, locale });

  // if (snapshot == null) {
  //   // This is a temporary solution to fix the issue where non-published pages are not editable in the builder.
  //   await connection();

  //   return notFound();
  // }

  return <MakeswiftPage snapshot={{
    "document": {
      "id": "UGFnZTo5MjdhMmUxNC1kZTJjLTQxYjUtYmQzZS05ZjVlNGQ0ZjUzMTQ=",
      "site": {
        "id": "U2l0ZTpmNGZiNmM1ZC1mZGE2LTQyNGMtYWZjYS0wYjhmZGNjNTk2Nzk=",
        // @ts-ignore
        "__typename": "Site"
      },
      "data": {
        "key": "3116a47c-c83f-454c-ac66-d6628189b651",
        "props": {
          "children": {
            "@@makeswift/type": "prop-controllers::grid::v1",
            "value": {
              "columns": [
                {
                  "deviceId": "desktop",
                  "value": {
                    "count": 12,
                    "spans": [
                      [
                        12
                      ]
                    ]
                  }
                }
              ],
              "elements": [
                {
                  "key": "6b88fdb8-5a3a-472d-8465-2ca91aae1505",
                  "props": {
                    "link": {
                      "payload": {
                        "openInNewTab": false,
                        "url": `https://ashera-aeon-reservation.pages.dev${path}`
                      },
                      "type": "OPEN_URL"
                    }
                  },
                  "type": "react-page-embed"
                }
              ]
            }
          }
        },
        "type": "./components/Root/index.js"
      },
      "snippets": [],
      "fonts": [],
      "meta": {
        "title": "Ashera Design",
        "description": "Discover Ashera's luxury writing instruments, handcrafted from aerospace-grade titanium and exquisite natural woods. Elevate your writing experience with the AEON, AEON Oleatus Fountain Pen, Phi Ballpoint Pen, and Twist Pencil—each featuring titanium grips, elegant wood bodies, and meticulous craftsmanship. Sustainable, limited edition, and designed for timeless elegance",
        "socialImage": null,
        "favicon": null
      },
      "seo": {
        "canonicalUrl": null,
        "isIndexingBlocked": null
      },
      "hreflangs": [],
      "localizedPages": [],
      "locale": null,
      "__typename": "Page"
    },
    "cacheData": {
      "apiResources": {
        "Swatch": [],
        "File": [],
        "Typography": [],
        "Table": [],
        "PagePathnameSlice": [],
        "GlobalElement": [],
        "LocalizedGlobalElement": []
      },
      "localizedResourcesMap": {}
    }
  }} />;
}
