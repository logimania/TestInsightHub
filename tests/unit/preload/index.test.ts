import { describe, it, expect, vi } from "vitest";

const { mockContextBridge, mockIpcRenderer } = vi.hoisted(() => ({
  mockContextBridge: { exposeInMainWorld: vi.fn() },
  mockIpcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

vi.mock("electron", () => ({
  contextBridge: mockContextBridge,
  ipcRenderer: mockIpcRenderer,
}));

// Import triggers contextBridge.exposeInMainWorld("api", ...)
import "../../../src/preload/index";

// Extract the api object that was passed to exposeInMainWorld
function getApi() {
  return mockContextBridge.exposeInMainWorld.mock.calls[0][1];
}

describe("preload/index", () => {
  it("exposes api to main world", () => {
    expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      "api",
      expect.any(Object),
    );
  });

  it("api has all required namespaces", () => {
    const api = getApi();
    expect(api.project).toBeDefined();
    expect(api.coverage).toBeDefined();
    expect(api.test).toBeDefined();
    expect(api.feedback).toBeDefined();
    expect(api.settings).toBeDefined();
    expect(api.exportDiagram).toBeDefined();
    expect(api.clearCache).toBeDefined();
    expect(api.onParseProgress).toBeDefined();
    expect(api.onTestOutput).toBeDefined();
    expect(api.onFileChange).toBeDefined();
    expect(api.removeAllListeners).toBeDefined();
  });

  it("project.selectDirectory invokes correct channel", () => {
    getApi().project.selectDirectory();
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("project:select-directory");
  });

  it("project.parse invokes with request", () => {
    const req = { rootPath: "/project" };
    getApi().project.parse(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("project:parse", req);
  });

  it("coverage.load invokes with request", () => {
    const req = { autoDetect: true };
    getApi().coverage.load(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("coverage:load", req);
  });

  it("test.run invokes with request", () => {
    const req = { rootPath: "/p" };
    getApi().test.run(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("test:run", req);
  });

  it("feedback.generate invokes with request", () => {
    const req = { threshold: 80 };
    getApi().feedback.generate(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("feedback:generate", req);
  });

  it("feedback.deploy invokes with request", () => {
    const req = { feedbackFile: {}, deployPath: "/out" };
    getApi().feedback.deploy(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("feedback:deploy", req);
  });

  it("settings.loadGlobal invokes correct channel", () => {
    getApi().settings.loadGlobal();
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("settings:load-global");
  });

  it("settings.saveGlobal invokes with settings", () => {
    const settings = { theme: "dark" };
    getApi().settings.saveGlobal(settings);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("settings:save-global", settings);
  });

  it("settings.loadRecentProjects invokes correct channel", () => {
    getApi().settings.loadRecentProjects();
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recent-projects:load");
  });

  it("exportDiagram invokes with request", () => {
    const req = { format: "svg", svgContent: "<svg/>" };
    getApi().exportDiagram(req);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("export:diagram", req);
  });

  it("clearCache invokes with projectId", () => {
    getApi().clearCache("proj-1");
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("cache:clear", "proj-1");
  });

  it("onParseProgress registers listener on correct channel", () => {
    const cb = vi.fn();
    getApi().onParseProgress(cb);
    expect(mockIpcRenderer.on).toHaveBeenCalledWith(
      "project:parse-progress",
      expect.any(Function),
    );
  });

  it("onTestOutput registers listener on correct channel", () => {
    const cb = vi.fn();
    getApi().onTestOutput(cb);
    expect(mockIpcRenderer.on).toHaveBeenCalledWith(
      "test:run-output",
      expect.any(Function),
    );
  });

  it("onFileChange registers listener on correct channel", () => {
    const cb = vi.fn();
    getApi().onFileChange(cb);
    expect(mockIpcRenderer.on).toHaveBeenCalledWith(
      "file:watch-change",
      expect.any(Function),
    );
  });

  it("removeAllListeners delegates to ipcRenderer", () => {
    getApi().removeAllListeners("test:run");
    expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith("test:run");
  });
});
