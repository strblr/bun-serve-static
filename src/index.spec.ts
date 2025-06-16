import { expect, test } from "bun:test";
import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import { serveStatic } from "./index";

test("serveStatic serves files from root directory", async () => {
  const testDir = path.join(__dirname, "test-static");
  const testFile = path.join(testDir, "test.txt");

  await mkdir(testDir, { recursive: true });
  await writeFile(testFile, "Hello World");

  const handler = serveStatic(testDir);
  const req = new Request("http://localhost/test.txt");
  const response = await handler(req);

  expect(response).toBeInstanceOf(Response);
  expect(await response?.text()).toBe("Hello World");

  await rm(testDir, { recursive: true });
});

test("serveStatic serves index file when no path specified", async () => {
  const testDir = path.join(__dirname, "test-static");
  const indexFile = path.join(testDir, "index.html");

  await mkdir(testDir, { recursive: true });
  await writeFile(indexFile, "<h1>Index Page</h1>");

  const handler = serveStatic(testDir, "index.html");
  const req = new Request("http://localhost/");
  const response = await handler(req);

  expect(response).toBeInstanceOf(Response);
  expect(await response?.text()).toBe("<h1>Index Page</h1>");

  await rm(testDir, { recursive: true });
});

test("serveStatic returns index when file doesn't exist", async () => {
  const testDir = path.join(__dirname, "test-static");
  const indexFile = path.join(testDir, "index.html");

  await mkdir(testDir, { recursive: true });
  await writeFile(indexFile, "<h1>Index Page</h1>");

  const handler = serveStatic(testDir, "index.html");
  const req = new Request("http://localhost/nonexistent.txt");
  const response = await handler(req);

  expect(response).toBeInstanceOf(Response);
  expect(await response?.text()).toBe("<h1>Index Page</h1>");

  await rm(testDir, { recursive: true });
});

test("serveStatic returns null when no index and file doesn't exist", async () => {
  const testDir = path.join(__dirname, "test-static");

  await mkdir(testDir, { recursive: true });

  const handler = serveStatic(testDir);
  const req = new Request("http://localhost/nonexistent.txt");
  const response = await handler(req);

  expect(response).toBeNull();

  await rm(testDir, { recursive: true });
});

test("serveStatic prevents directory traversal attacks", async () => {
  const testDir = path.join(__dirname, "test-static");
  const parentFile = path.join(__dirname, "secret.txt");

  await mkdir(testDir, { recursive: true });
  await writeFile(parentFile, "Secret content");

  const handler = serveStatic(testDir);
  const req = new Request("http://localhost/../secret.txt");
  const response = await handler(req);

  expect(response).toBeNull();

  await rm(testDir, { recursive: true });
  await rm(parentFile);
});

test("serveStatic handles URL encoded paths", async () => {
  const testDir = path.join(__dirname, "test-static");
  const testFile = path.join(testDir, "test file.txt");

  await mkdir(testDir, { recursive: true });
  await writeFile(testFile, "Encoded path content");

  const handler = serveStatic(testDir);
  const req = new Request("http://localhost/test%20file.txt");
  const response = await handler(req);

  expect(response).toBeInstanceOf(Response);
  expect(await response?.text()).toBe("Encoded path content");

  await rm(testDir, { recursive: true });
});

test("serveStatic handles deeply encoded URIs", async () => {
  const testDir = path.join(__dirname, "test-static");

  await mkdir(testDir, { recursive: true });

  const handler = serveStatic(testDir);
  // Test with deeply encoded path that should be rejected
  const req = new Request(
    "http://localhost/%252E%252E%252F%252E%252E%252Fsecret.txt"
  );
  const response = await handler(req);

  expect(response).toBeNull();

  await rm(testDir, { recursive: true });
});

test("serveStatic returns null for malformed URIs", async () => {
  const testDir = path.join(__dirname, "test-static");

  await mkdir(testDir, { recursive: true });

  const handler = serveStatic(testDir);
  const req = new Request("http://localhost/%");
  const response = await handler(req);

  expect(response).toBeNull();

  await rm(testDir, { recursive: true });
});
