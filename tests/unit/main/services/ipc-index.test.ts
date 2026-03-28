import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRegisterProjectHandlers,
  mockRegisterCoverageHandlers,
  mockRegisterTestHandlers,
  mockRegisterFeedbackHandlers,
  mockRegisterSettingsHandlers,
  mockRegisterExportHandlers,
} = vi.hoisted(() => ({
  mockRegisterProjectHandlers: vi.fn(),
  mockRegisterCoverageHandlers: vi.fn(),
  mockRegisterTestHandlers: vi.fn(),
  mockRegisterFeedbackHandlers: vi.fn(),
  mockRegisterSettingsHandlers: vi.fn(),
  mockRegisterExportHandlers: vi.fn(),
}));

vi.mock("../../../../src/main/ipc/project-handlers", () => ({
  registerProjectHandlers: mockRegisterProjectHandlers,
}));
vi.mock("../../../../src/main/ipc/coverage-handlers", () => ({
  registerCoverageHandlers: mockRegisterCoverageHandlers,
}));
vi.mock("../../../../src/main/ipc/test-handlers", () => ({
  registerTestHandlers: mockRegisterTestHandlers,
}));
vi.mock("../../../../src/main/ipc/feedback-handlers", () => ({
  registerFeedbackHandlers: mockRegisterFeedbackHandlers,
}));
vi.mock("../../../../src/main/ipc/settings-handlers", () => ({
  registerSettingsHandlers: mockRegisterSettingsHandlers,
}));
vi.mock("../../../../src/main/ipc/export-handlers", () => ({
  registerExportHandlers: mockRegisterExportHandlers,
}));

import { registerAllHandlers } from "../../../../src/main/ipc/index";

describe("ipc/index - registerAllHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls all sub-handler registration functions", () => {
    const mockWindow = {} as any;
    registerAllHandlers(mockWindow);

    expect(mockRegisterProjectHandlers).toHaveBeenCalledWith(mockWindow);
    expect(mockRegisterCoverageHandlers).toHaveBeenCalled();
    expect(mockRegisterTestHandlers).toHaveBeenCalledWith(mockWindow);
    expect(mockRegisterFeedbackHandlers).toHaveBeenCalled();
    expect(mockRegisterSettingsHandlers).toHaveBeenCalled();
    expect(mockRegisterExportHandlers).toHaveBeenCalled();
  });

  it("passes the mainWindow reference to handlers that need it", () => {
    const mockWindow = { id: 42 } as any;
    registerAllHandlers(mockWindow);

    expect(mockRegisterProjectHandlers).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42 }),
    );
    expect(mockRegisterTestHandlers).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42 }),
    );
  });

  it("calls handlers that do not need mainWindow without it", () => {
    const mockWindow = {} as any;
    registerAllHandlers(mockWindow);

    // These are called without mainWindow argument
    expect(mockRegisterCoverageHandlers).toHaveBeenCalledWith();
    expect(mockRegisterFeedbackHandlers).toHaveBeenCalledWith();
    expect(mockRegisterSettingsHandlers).toHaveBeenCalledWith();
    expect(mockRegisterExportHandlers).toHaveBeenCalledWith();
  });

  it("calls each handler exactly once", () => {
    registerAllHandlers({} as any);

    expect(mockRegisterProjectHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterCoverageHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterTestHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterFeedbackHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterSettingsHandlers).toHaveBeenCalledTimes(1);
    expect(mockRegisterExportHandlers).toHaveBeenCalledTimes(1);
  });
});
