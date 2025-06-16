import { file as bunFile } from "bun";
import path from "path";

export function serveStatic(root: string, index?: string) {
  root = path.resolve(root);
  index = index && path.join(root, index);

  const indexOrNull = async () => {
    if (!index) return null;
    const file = bunFile(index);
    if (!(await file.exists())) return null;
    return new Response(file);
  };

  return async (req: Request) => {
    const filePath = decodeUriDeep(new URL(req.url).pathname);
    if (!filePath) return indexOrNull();
    const absolutePath = path.join(root, filePath);
    if (!absolutePath.startsWith(root)) return indexOrNull();
    const file = bunFile(absolutePath);
    if (!(await file.exists())) return indexOrNull();
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
