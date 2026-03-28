export type ErrorCode =
  | "PERMISSION_DENIED"
  | "NO_SOURCE_FILES"
  | "CYCLIC_SYMLINK"
  | "PARSE_ERROR"
  | "LARGE_PROJECT_WARNING"
  | "COVERAGE_FORMAT_INVALID"
  | "COVERAGE_MISMATCH"
  | "COVERAGE_FORMAT_UNKNOWN"
  | "COVERAGE_NOT_LOADED"
  | "BRANCH_COVERAGE_UNAVAILABLE"
  | "FEEDBACK_NO_DATA"
  | "FEEDBACK_ALL_PASSING"
  | "FEEDBACK_SOURCE_CHANGED"
  | "DEPLOY_PERMISSION_DENIED"
  | "DEPLOY_DISK_FULL"
  | "FEEDBACK_NO_PREVIOUS"
  | "FEEDBACK_STRUCTURE_MISMATCH";

export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly detail?: string;
  readonly recoverable: boolean;
}

export class AppErrorImpl extends Error implements AppError {
  readonly code: ErrorCode;
  readonly detail?: string;
  readonly recoverable: boolean;

  constructor(params: AppError) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.detail = params.detail;
    this.recoverable = params.recoverable;
  }

  toSerializable(): AppError {
    return {
      code: this.code,
      message: this.message,
      detail: this.detail,
      recoverable: this.recoverable,
    };
  }
}
