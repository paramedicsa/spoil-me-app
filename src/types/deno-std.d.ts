// Declarations to satisfy TypeScript for Deno std/http modules used by Supabase functions

declare module 'https://deno.land/std@0.170.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module 'std/server' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}
