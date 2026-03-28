import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/types/ipc";
import type {
  ParseProjectRequest,
  CoverageLoadRequest,
  FeedbackGenerateRequest,
  FeedbackDeployRequest,
  ExportDiagramRequest,
  TestRunRequest,
  TestQualityRequest,
  ParseProgressEvent,
  IpcApi,
} from "../shared/types/ipc";

const api: IpcApi = {
  project: {
    selectDirectory: () =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_SELECT_DIRECTORY),
    parse: (request: ParseProjectRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_PARSE, request),
  },
  coverage: {
    load: (request: CoverageLoadRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.COVERAGE_LOAD, request),
  },
  test: {
    run: (request: TestRunRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.TEST_RUN, request),
    analyzeQuality: (request: TestQualityRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.TEST_QUALITY_ANALYZE, request),
  },
  feedback: {
    generate: (request: FeedbackGenerateRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_GENERATE, request),
    deploy: (request: FeedbackDeployRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_DEPLOY, request),
    getHistory: (projectId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_HISTORY, projectId),
    compare: (projectId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FEEDBACK_COMPARE, projectId),
  },
  settings: {
    loadGlobal: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_LOAD_GLOBAL),
    saveGlobal: (settings) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE_GLOBAL, settings),
    loadProject: (projectId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_LOAD_PROJECT, projectId),
    saveProject: (settings) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE_PROJECT, settings),
    loadRecentProjects: () =>
      ipcRenderer.invoke(IPC_CHANNELS.RECENT_PROJECTS_LOAD),
  },
  exportDiagram: (request: ExportDiagramRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_DIAGRAM, request),
  clearCache: (projectId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CACHE_CLEAR, projectId),

  onParseProgress: (callback: (event: ParseProgressEvent) => void) => {
    ipcRenderer.on(IPC_CHANNELS.PROJECT_PARSE_PROGRESS, (_event, data) =>
      callback(data),
    );
  },
  onTestOutput: (
    callback: (line: string, stream: "stdout" | "stderr") => void,
  ) => {
    ipcRenderer.on(IPC_CHANNELS.TEST_RUN_OUTPUT, (_event, { line, stream }) =>
      callback(line, stream),
    );
  },
  onFileChange: (callback: (filePath: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.FILE_WATCH_CHANGE, (_event, filePath) =>
      callback(filePath),
    );
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

contextBridge.exposeInMainWorld("api", api);
