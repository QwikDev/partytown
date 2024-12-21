import type { QwikIntrinsicElements } from "@qwik.dev/core";
import { Slot, component$ } from "@qwik.dev/core";
import { CodeSnippet } from "../CodeSnippet/CodeSnippet";
import { CopyButton } from "../CopyButton/CopyButton";

export const components: Record<string, any> = {
  pre: component$<
    QwikIntrinsicElements["div"] & {
      __rawString__?: string;
    }
  >(({ __rawString__ }) => {
    return (
      <div class="relative">
        <pre class="mb-4 mt-6 max-h-[650px] overflow-x-auto rounded-lg border bg-zinc-950 p-6 text-white dark:bg-zinc-900">
          <CopyButton
            class="absolute right-4 top-4 rounded p-1 text-white hover:bg-zinc-900"
            code={__rawString__ || ""}
          />
          <Slot />
        </pre>
      </div>
    );
  }),
  code: component$<QwikIntrinsicElements["code"]>(({ ...props }) => {
    return (
      <code {...props}>
        <Slot />
      </code>
    );
  }),
  CodeSnippet,
};
