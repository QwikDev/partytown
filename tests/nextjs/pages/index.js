import Head from 'next/head';
import Script from 'next/script';
import { Partytown } from '@qwik.dev/partytown/react';

export default function Home() {
  return (
    <>
      <Head>
        <title>Next.js</title>
        <link
          rel="icon"
          id="favicon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎉</text></svg>"
        />
        <Partytown debug={true} />
      </Head>

      <main>
        <h1>Next.js with 🎉</h1>

        <p id="output-script" suppressHydrationWarning />

        <p id="output-next-script" suppressHydrationWarning />

        <Script
          type="text/partytown"
          dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('output-next-script').textContent = 'passed';
            `,
          }}
        />

        <script
          type="text/partytown"
          dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('output-script').textContent = 'passed';
              document.body.classList.add('completed');
            `,
          }}
        />
      </main>
    </>
  );
}
