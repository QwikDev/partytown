import { component$ } from "@qwik.dev/core";

export const ChevronIcon = component$(() => {
  return (
    <svg
      class="-mr-1 h-5 w-5 rounded-xl stroke-black p-1 dark:stroke-white"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clip-rule="evenodd"
      />
    </svg>
  );
});
