import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- hoisted mocks --------------------------------------------------------

const {
  mockBrowserWindow,
  mockBrowserWindowInstance,
  mockApp,
  mockShell,
  mockSession,
  mockRegisterAllHandlers,
} = vi.hoisted(() => {
  const mockWebContents = {
    setWindowOpenHandler: vi.fn(),
  };

  const mockInstance = {
    on: vi.fn(),
    show: vi.fn(),
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    webContents: mockWebContents,
  };

  const MockBrowserWindow = vi.fn(() => mockInstance);
  (MockBrowserWindow as any).getAllWindows = vi.fn(() => []);

  const mockOnHeadersReceived = vi.fn();

  return {
    mockBrowserWindowInstance: mockInstance,
    mockBrowserWindow: MockBrowserWindow,
    mockApp: {
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      quit: vi.fn(),
    },
    mockShell: {
      openExternal: vi.fn(),
    },
    mockSession: {
      defaultSession: {
        webRequest: {
          onHeadersReceived: mockOnHeadersReceived,
        },
      },
    },
    mockRegisterAllHandlers: vi.fn(),
  };
});

vi.mock("electron", () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  shell: mockShell,
  session: mockSession,
}));

vi.mock("../../../src/main/ipc", () => ({
  registerAllHandlers: mockRegisterAllHandlers,
}));

// ---------------------------------------------------------------------------

describe("src/main/index.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ELECTRON_RENDERER_URL;
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.ELECTRON_RENDERER_URL;
  });

  async function importModule(): Promise<void> {
    await import("../../../src/main/index");
    // flush the whenReady().then() microtask
    await new Promise((r) => setTimeout(r, 0));
  }

  // ---- app lifecycle -----------------------------------------------------

  describe("app.whenReady", () => {
    it("calls setupCSP and createWindow on ready", async () => {
      await importModule();

      expect(mockSession.defaultSession.webRequest.onHeadersReceived).toHaveBeenCalledTimes(1);
      expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
    });

    it("registers an 'activate' handler on app", async () => {
      await importModule();

      expect(mockApp.on).toHaveBeenCalledWith("activate", expect.any(Function));
    });

    it("creates a new window on activate when no windows exist", async () => {
      await importModule();

      const activateCb = mockApp.on.mock.calls.find(
        ([event]: [string]) => event === "activate",
      )?.[1];
      expect(activateCb).toBeDefined();

      (mockBrowserWindow.getAllWindows as ReturnType<typeof vi.fn>).mockReturnValue([]);
      activateCb();

      // 1 from initial + 1 from activate
      expect(mockBrowserWindow).toHaveBeenCalledTimes(2);
    });

    it("does not create a new window on activate when windows exist", async () => {
      await importModule();

      const activateCb = mockApp.on.mock.calls.find(
        ([event]: [string]) => event === "activate",
      )?.[1];

      (mockBrowserWindow.getAllWindows as ReturnType<typeof vi.fn>).mockReturnValue([{}]);
      activateCb();

      // only 1 from initial ready
      expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
    });
  });

  describe("app window-all-closed", () => {
    it("registers a window-all-closed handler", async () => {
      await importModule();

      expect(mockApp.on).toHaveBeenCalledWith("window-all-closed", expect.any(Function));
    });

    it("quits app on window-all-closed when not darwin", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "win32" });

      await importModule();

      const closedCb = mockApp.on.mock.calls.find(
        ([event]: [string]) => event === "window-all-closed",
      )?.[1];
      closedCb();

      expect(mockApp.quit).toHaveBeenCalled();

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("does not quit app on window-all-closed when darwin", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", { value: "darwin" });

      await importModule();

      const closedCb = mockApp.on.mock.calls.find(
        ([event]: [string]) => event === "window-all-closed",
      )?.[1];
      closedCb();

      expect(mockApp.quit).not.toHaveBeenCalled();

      Object.defineProperty(process, "platform", { value: originalPlatform });
    });
  });

  // ---- createWindow ------------------------------------------------------

  describe("createWindow", () => {
    it("creates a BrowserWindow with correct options", async () => {
      await importModule();

      expect(mockBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1280,
          height: 800,
          minWidth: 900,
          minHeight: 600,
          show: false,
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
          }),
        }),
      );
    });

    it("registers a ready-to-show handler that calls show()", async () => {
      await importModule();

      const readyToShowCb = mockBrowserWindowInstance.on.mock.calls.find(
        ([event]: [string]) => event === "ready-to-show",
      )?.[1];
      expect(readyToShowCb).toBeDefined();

      readyToShowCb();
      expect(mockBrowserWindowInstance.show).toHaveBeenCalled();
    });

    it("sets window open handler that calls shell.openExternal", async () => {
      await importModule();

      const handler =
        mockBrowserWindowInstance.webContents.setWindowOpenHandler.mock.calls[0][0];
      const result = handler({ url: "https://example.com" });

      expect(mockShell.openExternal).toHaveBeenCalledWith("https://example.com");
      expect(result).toEqual({ action: "deny" });
    });

    it("calls registerAllHandlers with mainWindow", async () => {
      await importModule();

      expect(mockRegisterAllHandlers).toHaveBeenCalledWith(mockBrowserWindowInstance);
    });

    it("loads URL from ELECTRON_RENDERER_URL in dev mode", async () => {
      process.env.ELECTRON_RENDERER_URL = "http://localhost:5173";

      await importModule();

      expect(mockBrowserWindowInstance.loadURL).toHaveBeenCalledWith(
        "http://localhost:5173",
      );
      expect(mockBrowserWindowInstance.loadFile).not.toHaveBeenCalled();
    });

    it("loads file in production mode", async () => {
      await importModule();

      const loadFilePath = mockBrowserWindowInstance.loadFile.mock.calls[0][0] as string;
      expect(loadFilePath).toContain("renderer");
      expect(loadFilePath).toContain("index.html");
      expect(mockBrowserWindowInstance.loadURL).not.toHaveBeenCalled();
    });
  });

  // ---- setupCSP ----------------------------------------------------------

  describe("setupCSP", () => {
    it("registers onHeadersReceived callback", async () => {
      await importModule();

      expect(
        mockSession.defaultSession.webRequest.onHeadersReceived,
      ).toHaveBeenCalledWith(expect.any(Function));
    });

    it("applies relaxed CSP in dev mode", async () => {
      process.env.ELECTRON_RENDERER_URL = "http://localhost:5173";

      await importModule();

      const cspCallback =
        mockSession.defaultSession.webRequest.onHeadersReceived.mock.calls[0][0];

      const callback = vi.fn();
      cspCallback({ responseHeaders: { "X-Existing": ["value"] } }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseHeaders: expect.objectContaining({
            "X-Existing": ["value"],
            "Content-Security-Policy": [expect.stringContaining("unsafe-inline")],
          }),
        }),
      );
    });

    it("applies strict CSP in production mode", async () => {
      await importModule();

      const cspCallback =
        mockSession.defaultSession.webRequest.onHeadersReceived.mock.calls[0][0];

      const callback = vi.fn();
      cspCallback({ responseHeaders: {} }, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseHeaders: expect.objectContaining({
            "Content-Security-Policy": [
              expect.stringContaining("default-src 'self'"),
            ],
          }),
        }),
      );

      // strict CSP should NOT contain unsafe-eval
      const cspValue = callback.mock.calls[0][0].responseHeaders["Content-Security-Policy"][0];
      expect(cspValue).not.toContain("unsafe-eval");
    });

    it("preserves existing response headers", async () => {
      await importModule();

      const cspCallback =
        mockSession.defaultSession.webRequest.onHeadersReceived.mock.calls[0][0];

      const callback = vi.fn();
      const existingHeaders = {
        "X-Custom-Header": ["custom-value"],
        "Cache-Control": ["no-cache"],
      };
      cspCallback({ responseHeaders: existingHeaders }, callback);

      const result = callback.mock.calls[0][0].responseHeaders;
      expect(result["X-Custom-Header"]).toEqual(["custom-value"]);
      expect(result["Cache-Control"]).toEqual(["no-cache"]);
      expect(result["Content-Security-Policy"]).toBeDefined();
    });
  });
});
