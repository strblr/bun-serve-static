import { file as bunFile } from "bun";
import path from "path";

export interface ServeStaticOptions {
  fallback?: string | ((req: Request) => Response | Promise<Response>);
  mapping?: Record<string, string>;
}

export function serveStatic(
  root: string,
  { fallback, mapping }: ServeStaticOptions = {}
) {
  root = path.resolve(root);
  fallback =
    typeof fallback === "string" ? path.join(root, fallback) : fallback;

  const fallbackOrNull = async (req: Request) => {
    if (!fallback) return null;
    if (typeof fallback === "function") return fallback(req);
    const file = bunFile(fallback);
    if (!(await file.exists())) return null;
    return new Response(file);
  };

  return async (req: Request) => {
    const { pathname } = new URL(req.url);
    const mappedPathname = mapping?.[pathname] ?? pathname;
    const filePath = decodeUriDeep(mappedPathname);
    if (!filePath) return fallbackOrNull(req);
    const absolutePath = path.join(root, filePath);
    if (!absolutePath.startsWith(root)) return fallbackOrNull(req);
    const file = bunFile(absolutePath);
    if (!(await file.exists())) return fallbackOrNull(req);
    return new Response(file);
  };
}

function decodeUriDeep(uri: string) {
  try {
    for (let i = 0; i < 3; i++) {
      const decoded = decodeURIComponent(uri);
      if (decoded === uri) {
        return decoded;
      }
      uri = decoded;
    }
  } catch {}
  return null;
}
