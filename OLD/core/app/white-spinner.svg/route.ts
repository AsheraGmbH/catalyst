import { promises as fs } from 'fs';
import path from 'path';

export const GET = async () => {
  // get white-spinner from file ./white-spinner.svg and turn it into a buffer
  const whiteSpinnerPath = path.join(process.cwd(), 'app', 'white-spinner.svg', 'white-spinner.svg');
  const whiteSpinnerBuffer = await fs.readFile(whiteSpinnerPath);
  
  return new Response(whiteSpinnerBuffer, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
};

export const dynamic = 'force-static';