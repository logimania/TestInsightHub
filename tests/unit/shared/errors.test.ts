import { describe, it, expect } from "vitest";
import { AppErrorImpl } from "@shared/types/errors";

describe("AppErrorImpl", () => {
  it("creates an error with correct properties", () => {
    const error = new AppErrorImpl({
      code: "PERMISSION_DENIED",
      message: "Access denied",
      detail: "Cannot read /etc/shadow",
      recoverable: true,
    });

    expect(error.code).toBe("PERMISSION_DENIED");
    expect(error.message).toBe("Access denied");
    expect(error.detail).toBe("Cannot read /etc/shadow");
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe("AppError");
    expect(error).toBeInstanceOf(Error);
  });

  it("serializes to a plain object", () => {
    const error = new AppErrorImpl({
      code: "NO_SOURCE_FILES",
      message: "No files found",
      recoverable: false,
    });

    const serialized = error.toSerializable();
    expect(serialized).toEqual({
      code: "NO_SOURCE_FILES",
      message: "No files found",
      detail: undefined,
      recoverable: false,
    });
  });

  it("is catchable as an Error", () => {
    const thrower = (): never => {
      throw new AppErrorImpl({
        code: "PARSE_ERROR",
        message: "Parse failed",
        recoverable: true,
      });
    };

    expect(thrower).toThrow(Error);
    expect(thrower).toThrow("Parse failed");
  });
});
