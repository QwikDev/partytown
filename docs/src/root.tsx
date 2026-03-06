import { component$ } from "@qwik.dev/core";
import { isDev } from "@qwik.dev/core/build";
import { QwikRouterProvider, RouterOutlet } from "@qwik.dev/router";

import "./global.scss";
import { RouterHead } from "./components/RouterHead/RouterHead";

export default component$(() => {
  /**
   * The root of a QwikRouter site always start with the <QwikRouterProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikRouterProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <RouterHead />
      </head>
      <body lang="en" class="m-auto max-w-[1376px]">
        <RouterOutlet />
      </body>
    </QwikRouterProvider>
  );
});
