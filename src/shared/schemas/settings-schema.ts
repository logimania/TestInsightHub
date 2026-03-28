import { z } from "zod";

export const colorThresholdsSchema = z.object({
  green: z.number().min(0).max(100),
  yellow: z.number().min(0).max(100),
});

export const priorityWeightsSchema = z.object({
  coverageGapWeight: z.number().min(0).max(1),
  complexityWeight: z.number().min(0).max(1),
  changeFreqWeight: z.number().min(0).max(1),
});

export const pathMappingSchema = z.object({
  sourcePrefix: z.string(),
  reportPrefix: z.string(),
});

export const globalSettingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  locale: z.enum(["ja", "en"]),
  maxCacheSizeBytes: z.number().positive(),
  defaultCoverageThreshold: z.number().min(0).max(100),
  defaultColorThresholds: colorThresholdsSchema,
  defaultPriorityWeights: priorityWeightsSchema,
});

export const projectSettingsSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  rootPath: z.string(),
  testRootPath: z.string().nullable(),
  coverageReportPath: z.string().nullable(),
  coverageThreshold: z.number().min(0).max(100),
  colorThresholds: colorThresholdsSchema,
  excludePatterns: z.array(z.string()),
  pathMappings: z.array(pathMappingSchema),
  priorityWeights: priorityWeightsSchema,
  lastOpenedAt: z.string(),
});
