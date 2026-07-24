/// <reference types="vite/client" />

declare module "cloudmr-ux/results/Logs" {
  export const Logs: () => import("react").JSX.Element | null;
}

declare module "cloudmr-ux/results/PreprocessJob" {
  export function processJobZip(
    file: File,
    fileAlias: string,
  ): Promise<File | undefined>;
}
