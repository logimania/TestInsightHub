import { describe, it, expect } from "vitest";
import {
  detectPrerequisites,
  buildProjectTestEnvironment,
} from "../../../src/shared/utils/prerequisite-detector";
import type { ProjectTestEnvironment } from "@shared/types/feedback";

// --- Helpers ---

function makeEnv(
  overrides: Partial<ProjectTestEnvironment> = {},
): ProjectTestEnvironment {
  return {
    installedPackages: [],
    configFiles: [],
    testFramework: null,
    testEnvironment: null,
    ...overrides,
  };
}

describe("detectPrerequisites", () => {
  describe("React component files (.tsx)", () => {
    it("detects missing @testing-library/react for .tsx e2e", () => {
      const result = detectPrerequisites(
        "src/renderer/pages/home.tsx",
        "e2e",
        makeEnv(),
      );

      expect(result.satisfied).toBe(false);
      const names = result.missing.map((m) => m.name);
      expect(names).toContain("@testing-library/react");
      expect(names).toContain("@testing-library/jest-dom");
      expect(names).toContain("jsdom");
    });

    it("returns satisfied when all packages installed and config present", () => {
      const result = detectPrerequisites(
        "src/renderer/pages/home.tsx",
        "e2e",
        makeEnv({
          installedPackages: [
            "@testing-library/react",
            "@testing-library/jest-dom",
            "jsdom",
          ],
          configFiles: ["environment: 'jsdom'"],
        }),
      );

      expect(result.satisfied).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("accepts happy-dom as alternative to jsdom", () => {
      const result = detectPrerequisites(
        "src/renderer/components/button.tsx",
        "e2e",
        makeEnv({
          installedPackages: [
            "@testing-library/react",
            "@testing-library/jest-dom",
            "happy-dom",
          ],
          configFiles: ["environment: 'happy-dom'"],
        }),
      );

      expect(result.satisfied).toBe(true);
    });

    it("detects missing jsdom config even when package is installed", () => {
      const result = detectPrerequisites(
        "src/renderer/pages/home.tsx",
        "e2e",
        makeEnv({
          installedPackages: [
            "@testing-library/react",
            "@testing-library/jest-dom",
            "jsdom",
          ],
          configFiles: [], // no config with jsdom environment
        }),
      );

      expect(result.satisfied).toBe(false);
      const configMissing = result.missing.filter((m) => m.type === "config");
      expect(configMissing.length).toBe(1);
      expect(configMissing[0].name).toBe("jsdom environment");
      expect(configMissing[0].configExample).toBeDefined();
    });
  });

  describe("unit test for .ts files", () => {
    it("detects missing vitest for unit test", () => {
      const result = detectPrerequisites(
        "src/shared/utils/helpers.ts",
        "unit",
        makeEnv(),
      );

      expect(result.satisfied).toBe(false);
      expect(result.missing[0].name).toBe("vitest");
    });

    it("accepts jest as alternative to vitest", () => {
      const result = detectPrerequisites(
        "src/shared/utils/helpers.ts",
        "unit",
        makeEnv({ installedPackages: ["jest"] }),
      );

      expect(result.satisfied).toBe(true);
    });

    it("accepts mocha as alternative", () => {
      const result = detectPrerequisites(
        "src/lib/calc.ts",
        "unit",
        makeEnv({ installedPackages: ["mocha"] }),
      );

      expect(result.satisfied).toBe(true);
    });
  });

  describe("integration test for .ts files", () => {
    it("detects missing test framework", () => {
      const result = detectPrerequisites(
        "src/main/ipc/handler.ts",
        "integration",
        makeEnv(),
      );

      expect(result.satisfied).toBe(false);
      expect(result.missing[0].name).toBe("vitest");
    });

    it("satisfied when vitest installed", () => {
      const result = detectPrerequisites(
        "src/main/ipc/handler.ts",
        "integration",
        makeEnv({ installedPackages: ["vitest"] }),
      );

      expect(result.satisfied).toBe(true);
    });
  });

  describe("e2e test for non-React .ts files", () => {
    it("detects missing playwright", () => {
      const result = detectPrerequisites(
        "src/renderer/hooks/use-diagram.ts",
        "e2e",
        makeEnv(),
      );

      expect(result.satisfied).toBe(false);
      const names = result.missing.map((m) => m.name);
      expect(names).toContain("@playwright/test");
    });

    it("accepts cypress as alternative to playwright", () => {
      const result = detectPrerequisites(
        "src/renderer/hooks/use-ipc.ts",
        "e2e",
        makeEnv({ installedPackages: ["cypress"] }),
      );

      expect(result.satisfied).toBe(true);
    });
  });

  describe("deduplication", () => {
    it("does not duplicate vitest when matched by multiple rules", () => {
      // .ts file with 'integration' type could match multiple rules
      const result = detectPrerequisites(
        "src/api/route.ts",
        "integration",
        makeEnv(),
      );

      const vitestEntries = result.missing.filter((m) => m.name === "vitest");
      expect(vitestEntries.length).toBe(1);
    });
  });

  describe("install command", () => {
    it("includes installCommand for packages", () => {
      const result = detectPrerequisites(
        "src/renderer/pages/home.tsx",
        "e2e",
        makeEnv(),
      );

      for (const item of result.missing.filter((m) => m.type === "package")) {
        expect(item.installCommand).toBeDefined();
        expect(item.installCommand).toContain("npm install");
      }
    });
  });
});

describe("buildProjectTestEnvironment", () => {
  it("merges deps and devDeps into installedPackages", () => {
    const env = buildProjectTestEnvironment(
      { react: "18.0.0", "react-dom": "18.0.0" },
      { vitest: "1.0.0", "@testing-library/react": "14.0.0" },
      [],
    );

    expect(env.installedPackages).toContain("react");
    expect(env.installedPackages).toContain("vitest");
    expect(env.installedPackages).toContain("@testing-library/react");
  });

  it("detects vitest as test framework", () => {
    const env = buildProjectTestEnvironment({}, { vitest: "1.0.0" }, []);

    expect(env.testFramework).toBe("vitest");
  });

  it("detects jest as test framework", () => {
    const env = buildProjectTestEnvironment({}, { jest: "29.0.0" }, []);

    expect(env.testFramework).toBe("jest");
  });

  it("returns null testFramework when none installed", () => {
    const env = buildProjectTestEnvironment({}, {}, []);
    expect(env.testFramework).toBeNull();
  });

  it("detects jsdom environment from config content", () => {
    const env = buildProjectTestEnvironment({}, { vitest: "1.0.0" }, [
      "export default defineConfig({ test: { environment: 'jsdom' } })",
    ]);

    expect(env.testEnvironment).toBe("jsdom");
  });

  it("detects happy-dom environment from config content", () => {
    const env = buildProjectTestEnvironment({}, { vitest: "1.0.0" }, [
      "test: { environment: 'happy-dom' }",
    ]);

    expect(env.testEnvironment).toBe("happy-dom");
  });

  it("returns null testEnvironment when not configured", () => {
    const env = buildProjectTestEnvironment({}, { vitest: "1.0.0" }, [
      "export default defineConfig({ test: {} })",
    ]);

    expect(env.testEnvironment).toBeNull();
  });

  it("handles empty inputs gracefully", () => {
    const env = buildProjectTestEnvironment({}, {}, []);

    expect(env.installedPackages).toEqual([]);
    expect(env.configFiles).toEqual([]);
    expect(env.testFramework).toBeNull();
    expect(env.testEnvironment).toBeNull();
  });
});
