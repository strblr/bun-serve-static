# bun-serve-static

Simple static asset handler for `Bun.serve`.

## Installation

```bash
bun add bun-serve-static
```

## Usage

### 1. Serve a directory of static assets

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./public") // serve everything under ./public
});
```

### 2. Fall back to a file (e.g. `index.html`)

Provide a `fallback` property in the options object to serve a specific file whenever the requested
asset cannot be found or the request falls outside the configured root. This is handy for
single-page applications that rely on client-side routing. The file path is **relative** to the
configured root.

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./dist", { fallback: "index.html" })
});
```

### 3. Custom fallback response

Instead of a string you can provide a **function** as the `fallback`. It will be invoked whenever the
requested file cannot be found or the resolved path falls outside the configured root. The function
receives the original `Request` and must return a `Response` (or `Promise<Response>`).

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./public", {
    fallback: () => new Response("Nothing to see here", { status: 404 })
  })
});
```

### 4. Path mapping

Use the `mapping` option to alias or redirect incoming paths to different files before they are looked up on disk. Each key in the mapping object represents the request pathname; its value is the file path (relative to `root`) that should be served instead.

```ts
import { serveStatic } from "bun-serve-static";

Bun.serve({
  port: 3000,
  fetch: serveStatic("./public", {
    mapping: {
      "/api/data": "/actual-file.txt",
      "/old-path": "/actual-file.txt"
    }
  })
});
```

### 5. Complex logic

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
  options?: {
    fallback?: string | ((req: Request) => Response | Promise<Response>);
    mapping?: Record<string, string>;
  }
): (req: Request) => Promise<Response | null>
```

| Parameter          | Type                                                         | Description                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`             | `string`                                                     | Path to the directory whose contents should be exposed. Relative paths are resolved to absolute paths.                                                                                                                                           |
| `options`          | `object?`                                                    | Optional configuration object.                                                                                                                                                                                                                   |
| `options.fallback` | `string \| (req: Request) => Response \| Promise<Response>?` | Optional. If a **string**, the file (relative to `root`) will be served when the asset is not found or the request is outside `root`. If a **function**, it will be executed in those cases and must return a `Response` (or `Promise` thereof). |
| `options.mapping`  | `Record<string, string>?`                                    | Optional path mapping. If provided, each incoming pathname is first looked up in the mapping record and, if present, replaced with the mapped value before resolving against the file system.                                                    |

The returned function is a **Bun fetch handler** that you can pass directly to `Bun.serve` or use inside a more sophisticated fetch handler.

If the requested asset is not found or falls outside the configured root **and** no valid fallback is configured, the handler returns a promise that resolves to `null`.

## Contributions

Feel free to open issues for bugs, feature requests, or questions. Contributions of all kinds are welcome!
