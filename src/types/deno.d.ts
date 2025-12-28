// Minimal Deno global declarations for TypeScript checks in Node environment
declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}
