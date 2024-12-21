import type { QwikIntrinsicElements } from "@qwik.dev/core";
import { $, component$, useSignal, useTask$ } from "@qwik.dev/core";
import { CheckIcon } from "../Icons/CheckIcon";
import { CopyIcon } from "../Icons/CopyIcon";

type CopyButtonProps = QwikIntrinsicElements["button"] & {
  code: string;
  src?: string;
};
export async function copyToClipboardWithMeta(value: string) {
  navigator.clipboard.writeText(value);
}

export const CopyButton = component$<CopyButtonProps>(({ code, ...props }) => {
  const hasCopied = useSignal(false);

  useTask$(({ track }) => {
    track(() => hasCopied.value);
    setTimeout(
      $(() => {
        hasCopied.value = false;
      }),
      2000,
    );
  });

  return (
    <button
      {...props}
      class="relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50"
      onClick$={() => {
        copyToClipboardWithMeta(code);
        hasCopied.value = true;
      }}
    >
      <span class="sr-only">Copy</span>
      {hasCopied.value ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
});
