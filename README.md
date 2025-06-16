# bun-serve-static

Simple static asset handler for `Bun.serve`.

## Installation

```bash
bun add bun-serve-static
```

## Basic Usage

### 1. Serve a directory of static assets

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./public") // serve everything under ./public
});
```

### 2. Serve a directory and fall back to a file (e.g. `index.html`)

Passing a file path as second argument tells the handler to serve that file whenever the requested
asset cannot be found or the request falls outside the configured root.
This is handy for single-page applications that rely on client-side routing.
The file path is relative to the configured root.

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./dist", "index.html")
});
```

### 3. Custom fallback response

If you pass a **function** as the second argument it will be invoked whenever the
requested file cannot be found or the resolved path falls outside the configured
root. The function receives the original `Request` and must return a `Response`
or a `Promise<Response>`.

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic(
    "./public",
    () => new Response("Nothing to see here", { status: 404 })
  )
});
```

## Advanced usage

The returned handler is just a function, so you can compose it inside more complex `fetch` definitions.  
In the following example we first try to serve a static asset. If the handler returns `null`, we fall back to handling an API route and finally a generic _404_ response.

```ts
import { serveStatic } from "bun-serve-static";

// Create the static handler (once)
const servePublic = serveStatic("./public");

Bun.serve({
  port: 3000,
  async fetch(req) {
    // 1. Try to serve a file from ./public
    const staticRes = await servePublic(req);
    if (staticRes) return staticRes;

    // 2. Custom logic when no file was found
    if (req.method === "GET" && new URL(req.url).pathname === "/api/hello") {
      return new Response(JSON.stringify({ hello: "world" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Not Found", { status: 404 });
  }
});
```

## API

```ts
serveStatic(
  root: string,
  fallback?: string | ((req: Request) => Response | Promise<Response>)
): (req: Request) => Promise<Response | null>
```

| Parameter  | Type                                                         | Description                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`     | `string`                                                     | Path to the directory whose contents should be exposed. Relative paths are resolved to absolute paths.                                                                                                                                           |
| `fallback` | `string \| (req: Request) => Response \| Promise<Response>`? | Optional. If a **string**, the file (relative to `root`) will be served when the asset is not found or the request is outside `root`. If a **function**, it will be executed in those cases and must return a `Response` (or `Promise` thereof). |

The returned function is a **Bun fetch handler** that you can pass directly to `Bun.serve` or use inside a more sophisticated fetch handler.

If the requested asset is not found or falls outside the configured root **and** no valid fallback is configured, the handler returns a promise that resolves to `null`.

## Contributions

Feel free to open issues for bugs, feature requests, or questions. Contributions of all kinds are welcome!
