import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { parseProject } from "../../src/main/services/project-parser";
import { loadCoverage } from "../../src/main/services/coverage-analyzer";
import { aggregateByModule } from "../../src/main/services/coverage-analyzer/aggregator";
import { generateFeedback } from "../../src/main/services/feedback-generator";
import { compareFeedback } from "../../src/main/services/feedback-generator/cycle-tracker";

const FIXTURE_PATH = resolve(__dirname, "../fixtures/sample-project");
const ISTANBUL_REPORT = resolve(__dirname, "../fixtures/istanbul-report.json");

describe("Full Pipeline Integration", () => {
  it("runs the complete flow: parse → coverage → feedback", async () => {
    // Step 1: Parse project
    const structure = await parseProject({ rootPath: FIXTURE_PATH });
    expect(structure.totalFiles).toBe(4);
    expect(structure.modules.length).toBeGreaterThan(0);

    // Step 2: Load coverage
    const coverageResult = await loadCoverage({
      rootPath: FIXTURE_PATH,
      reportPath: ISTANBUL_REPORT,
      projectStructure: structure,
    });
    expect(coverageResult.coverage.files.length).toBeGreaterThan(0);

    // Step 3: Aggregate by module
    const moduleCoverages = aggregateByModule(
      coverageResult.coverage.files,
      structure.modules,
    );
    expect(moduleCoverages.length).toBeGreaterThan(0);

    // Verify color levels are assigned
    const hasColors = moduleCoverages.some((m) => m.colorLevel !== "grey");
    expect(hasColors).toBe(true);

    // Step 4: Generate feedback
    const feedback = generateFeedback({
      moduleCoverages,
      projectStructure: structure,
      threshold: 80,
    });

    expect(feedback.version).toBe("1.2.0");
    expect(feedback.coverageThreshold).toBe(80);
    expect(feedback.summary.totalModules).toBe(moduleCoverages.length);
    expect(feedback.gaps.length).toBeGreaterThan(0);
    expect(feedback.recommendations.length).toBeGreaterThan(0);

    // Verify gaps have priority scores
    for (const gap of feedback.gaps) {
      expect(gap.priorityScore).toBeGreaterThanOrEqual(0);
      expect(gap.priorityScore).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(gap.priority);
    }

    // Verify recommendations reference real files
    for (const rec of feedback.recommendations) {
      expect(rec.targetFile).toBeTruthy();
      expect(rec.suggestedTestFile).toBeTruthy();
    }
  });

  it("feedback cycle comparison works", async () => {
    const structure = await parseProject({ rootPath: FIXTURE_PATH });

    const coverageResult = await loadCoverage({
      rootPath: FIXTURE_PATH,
      reportPath: ISTANBUL_REPORT,
      projectStructure: structure,
    });

    const moduleCoverages = aggregateByModule(
      coverageResult.coverage.files,
      structure.modules,
    );

    // Generate first feedback
    const feedback1 = generateFeedback({
      moduleCoverages,
      projectStructure: structure,
      threshold: 80,
    });

    // Simulate improvement: same data but as "second run"
    const feedback2 = generateFeedback({
      moduleCoverages,
      projectStructure: structure,
      threshold: 80,
    });

    const comparison = compareFeedback(feedback2, feedback1);

    expect(comparison.previousFeedbackAt).toBeTruthy();
    expect(comparison.currentFeedbackAt).toBeTruthy();
    expect(comparison.improvementRate).toBeGreaterThanOrEqual(0);
    expect(comparison.improvementRate).toBeLessThanOrEqual(100);
  });

  it("handles project with no coverage data gracefully", async () => {
    const structure = await parseProject({ rootPath: FIXTURE_PATH });

    // Generate feedback with empty module coverages (all grey)
    const moduleCoverages = aggregateByModule([], structure.modules);

    const feedback = generateFeedback({
      moduleCoverages,
      projectStructure: structure,
      threshold: 80,
    });

    // All modules are grey, so no gaps should be detected
    expect(feedback.gaps.length).toBe(0);
    expect(feedback.summary.belowThreshold).toBe(0);
  });
});
