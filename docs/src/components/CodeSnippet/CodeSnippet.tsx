import type { PropsOf } from "@qwik.dev/core";
import { component$, useComputed$ } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";
import { Highlight } from "../Highlight/Highlight";

const codeSnippets: Record<string, { default: string }> = import.meta.glob(`/src/**/snippets/*`, {
  query: "?raw",
  eager: true,
});

type CodeSnippetProps = PropsOf<"div"> & {
  name: string;
};

export const CodeSnippet = component$<CodeSnippetProps>(({ name }) => {
  const location = useLocation();

  const codeSnippet = useComputed$(() => {
    let fileExtension = ".tsx";
    if (name.endsWith(".tsx") || name.endsWith(".ts") || name.endsWith(".css")) {
      fileExtension = "";
    }
    const snippetPath = `/src/routes${location.url.pathname}snippets/${name}${fileExtension}`;
    const code = codeSnippets[snippetPath];
    return code?.default || "";
  });

  return (
    <div class="shadow-3xl mb-6 rounded-md border shadow-lg">
      <Highlight code={codeSnippet.value || ""} />
    </div>
  );
});
