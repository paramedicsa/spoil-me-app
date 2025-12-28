// Minimal ambient declarations to satisfy TypeScript in the app for Supabase Deno functions

declare module 'https://deno.land/std@0.170.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module 'std/server' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}
