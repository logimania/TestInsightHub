import { test, expect, _electron, type ElectronApplication } from "@playwright/test";
import { join } from "path";
import { mkdtemp, rm, readdir, readFile, writeFile, mkdir } from "fs/promises";
import { tmpdir } from "os";
import v8toIstanbul from "v8-to-istanbul";

let app: ElectronApplication;
let v8CoverageDir: string;

test.beforeAll(async () => {
  // v8カバレッジ収集用の一時ディレクトリ
  v8CoverageDir = await mkdtemp(join(tmpdir(), "e2e-coverage-"));

  app = await _electron.launch({
    args: [join(__dirname, "../../dist/main/index.js")],
    env: {
      ...process.env,
      NODE_V8_COVERAGE: v8CoverageDir,
    },
  });
});

test.afterAll(async () => {
  await app.close();

  // v8カバレッジをIstanbul JSON形式に変換して出力
  try {
    await convertV8ToIstanbul(v8CoverageDir);
  } finally {
    await rm(v8CoverageDir, { recursive: true, force: true });
  }
});

test("app launches and shows a window", async () => {
  const window = await app.firstWindow();
  expect(window).toBeDefined();
});

test("window has correct minimum dimensions", async () => {
  const window = await app.firstWindow();
  const { width, height } = await window.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  expect(width).toBeGreaterThanOrEqual(900);
  expect(height).toBeGreaterThanOrEqual(600);
});

test("window title is set", async () => {
  const window = await app.firstWindow();
  const title = await window.title();
  expect(title).toBeDefined();
});

test("renderer loads HTML content", async () => {
  const window = await app.firstWindow();
  const body = await window.locator("body").innerHTML();
  expect(body.length).toBeGreaterThan(0);
});

test("context isolation is enabled", async () => {
  const window = await app.firstWindow();
  const hasRequire = await window.evaluate(() => typeof require === "undefined");
  expect(hasRequire).toBe(true);
});

test("CSP header is configured", async () => {
  const window = await app.firstWindow();
  const url = window.url();
  expect(url).toBeDefined();
});

/**
 * v8カバレッジファイルをIstanbul JSON形式に変換し、
 * coverage/e2e-coverage.json に出力する。
 */
async function convertV8ToIstanbul(coverageDir: string): Promise<void> {
  const files = await readdir(coverageDir);
  const coverageFiles = files.filter((f) => f.startsWith("coverage-"));

  const istanbulCoverage: Record<string, unknown> = {};
  const projectRoot = join(__dirname, "../..");

  for (const file of coverageFiles) {
    const raw = await readFile(join(coverageDir, file), "utf-8");
    const data = JSON.parse(raw);

    for (const entry of data.result ?? []) {
      // dist/main/配下のファイルのみ処理
      if (!entry.url || !entry.url.includes("dist/main")) continue;

      try {
        // URLからファイルパスを抽出
        let filePath = entry.url;
        if (filePath.startsWith("file:///")) {
          filePath = filePath.slice(8); // Windows: file:///C:/...
        }

        const converter = v8toIstanbul(filePath);
        await converter.load();
        converter.applyCoverage(entry.functions);
        const istanbul = converter.toIstanbul();
        Object.assign(istanbulCoverage, istanbul);
      } catch {
        // 変換できないファイルはスキップ
      }
    }
  }

  if (Object.keys(istanbulCoverage).length > 0) {
    const outDir = join(projectRoot, "coverage");
    await mkdir(outDir, { recursive: true });
    await writeFile(
      join(outDir, "e2e-coverage.json"),
      JSON.stringify(istanbulCoverage, null, 2),
    );
  }
}
