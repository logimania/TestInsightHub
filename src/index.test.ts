import { expect, test } from "vitest";
import { APP_NAME } from "./index";

test("APP_NAME is defined", () => {
  expect(APP_NAME).toBe("claude-code-structured-project");
});
