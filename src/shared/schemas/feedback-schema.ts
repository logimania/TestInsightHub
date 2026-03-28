import { z } from "zod";

export const uncoveredLineSchema = z.object({
  start: z.number(),
  end: z.number(),
  functionName: z.string(),
});

export const coverageGapSchema = z.object({
  filePath: z.string(),
  moduleName: z.string(),
  currentCoverage: z.number().min(0).max(100),
  targetCoverage: z.number().min(0).max(100),
  uncoveredLines: z.array(uncoveredLineSchema),
  recommendedTestType: z.enum(["unit", "integration", "e2e"]),
  priority: z.enum(["high", "medium", "low"]),
  priorityScore: z.number().min(0).max(100),
  complexity: z.number().min(0),
  changeFrequency: z.number().min(0),
});

export const testRecommendationSchema = z.object({
  type: z.enum(["unit", "integration", "e2e"]),
  targetFile: z.string(),
  suggestedTestFile: z.string(),
  functions: z.array(z.string()),
  description: z.string(),
});

export const feedbackSummarySchema = z.object({
  totalModules: z.number().min(0),
  belowThreshold: z.number().min(0),
  totalUncoveredFunctions: z.number().min(0),
  overallCoverage: z.number().min(0).max(100),
});

export const feedbackFileSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  projectRoot: z.string(),
  coverageThreshold: z.number().min(0).max(100),
  summary: feedbackSummarySchema,
  gaps: z.array(coverageGapSchema),
  recommendations: z.array(testRecommendationSchema),
});
