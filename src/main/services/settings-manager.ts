import { app } from "electron";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import type {
  GlobalSettings,
  ProjectSettings,
  RecentProject,
} from "@shared/types/settings";
import {
  DEFAULT_COVERAGE_THRESHOLD,
  DEFAULT_COLOR_THRESHOLDS,
  DEFAULT_PRIORITY_WEIGHTS,
  CACHE_MAX_TOTAL_SIZE_BYTES,
  RECENT_PROJECTS_MAX,
} from "@shared/constants";

function getUserDataPath(): string {
  return app.getPath("userData");
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  theme: "light",
  locale: "ja",
  maxCacheSizeBytes: CACHE_MAX_TOTAL_SIZE_BYTES,
  defaultCoverageThreshold: DEFAULT_COVERAGE_THRESHOLD,
  defaultColorThresholds: DEFAULT_COLOR_THRESHOLDS,
  defaultPriorityWeights: DEFAULT_PRIORITY_WEIGHTS,
};

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = join(filePath, "..");
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function loadGlobalSettings(): Promise<GlobalSettings> {
  const filePath = join(getUserDataPath(), "settings.json");
  const loaded = await readJsonFile<GlobalSettings>(filePath);
  return loaded ?? DEFAULT_GLOBAL_SETTINGS;
}

export async function saveGlobalSettings(
  settings: GlobalSettings,
): Promise<void> {
  const filePath = join(getUserDataPath(), "settings.json");
  await writeJsonFile(filePath, settings);
}

export async function loadProjectSettings(
  projectId: string,
): Promise<ProjectSettings | null> {
  const filePath = join(
    getUserDataPath(),
    "projects",
    projectId,
    "config.json",
  );
  return readJsonFile<ProjectSettings>(filePath);
}

export async function saveProjectSettings(
  settings: ProjectSettings,
): Promise<void> {
  const filePath = join(
    getUserDataPath(),
    "projects",
    settings.projectId,
    "config.json",
  );
  await writeJsonFile(filePath, settings);
}

export async function loadRecentProjects(): Promise<readonly RecentProject[]> {
  const filePath = join(getUserDataPath(), "recent-projects.json");
  const loaded = await readJsonFile<RecentProject[]>(filePath);
  return loaded ?? [];
}

export async function addRecentProject(project: RecentProject): Promise<void> {
  const current = await loadRecentProjects();
  const filtered = current.filter((p) => p.projectId !== project.projectId);
  const updated = [project, ...filtered].slice(0, RECENT_PROJECTS_MAX);
  const filePath = join(getUserDataPath(), "recent-projects.json");
  await writeJsonFile(filePath, updated);
}
