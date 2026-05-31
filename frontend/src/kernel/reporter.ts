/**
 * Evolutionary Kernel — client reporter.
 *
 * Keeps a small in-memory breadcrumb trail and ships error reports to
 * /api/kernel/report. Falls back gracefully when the backend is unreachable
 * (the boundary UI still shows the local trace).
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@/src/api/client";

export type KernelAnalysis = {
  root_cause: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggested_fix: string;
  suspected_file: string;
  confidence: number;
};

export type KernelReport = {
  id: string;
  user_id?: string | null;
  source: "frontend" | "backend";
  error_name: string;
  error_message: string;
  stack: string;
  component_stack: string;
  route: string;
  breadcrumbs: string[];
  platform: string;
  app_version: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  analysis: KernelAnalysis | null;
  analysis_status: "pending" | "ready" | "failed" | "disabled";
  analysis_error?: string | null;
};

export type KernelStats = {
  total: number;
  unresolved: number;
  by_severity: Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL", number>;
  model: string;
  llm_configured: boolean;
};

const BREAD_MAX = 20;
const breadcrumbs: string[] = [];

export function dropBreadcrumb(msg: string) {
  const stamp = new Date().toISOString().slice(11, 19);
  breadcrumbs.push(`${stamp} ${msg}`.slice(0, 140));
  if (breadcrumbs.length > BREAD_MAX) breadcrumbs.shift();
}

export function getBreadcrumbs(): string[] {
  return [...breadcrumbs];
}

function appVersion(): string {
  try {
    return (
      (Constants?.expoConfig as { version?: string })?.version ??
      (Constants as unknown as { manifest?: { version?: string } })?.manifest?.version ??
      "1.0.0"
    );
  } catch {
    return "1.0.0";
  }
}

export type ReportInput = {
  user_id?: string | null;
  error: unknown;
  component_stack?: string;
  route?: string;
};

export async function reportError(input: ReportInput): Promise<KernelReport | null> {
  const err = input.error;
  const isErr = err instanceof Error;
  const payload = {
    user_id: input.user_id ?? null,
    source: "frontend" as const,
    error_name: isErr ? err.name : typeof err,
    error_message: isErr ? err.message : String(err),
    stack: isErr ? String(err.stack ?? "") : "",
    component_stack: input.component_stack ?? "",
    route: input.route ?? "",
    breadcrumbs: getBreadcrumbs(),
    platform: `${Platform.OS}${Platform.Version ? `/${Platform.Version}` : ""}`,
    app_version: appVersion(),
  };
  try {
    return await api.post<KernelReport>("/kernel/report", payload);
  } catch (e) {
    if (__DEV__) console.warn("[kernel] report failed", e);
    return null;
  }
}

export async function listReports(userId?: string): Promise<KernelReport[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const res = await api.get<{ items: KernelReport[] }>(`/kernel/reports${qs}`);
  return res?.items ?? [];
}

export async function getStats(userId?: string): Promise<KernelStats | null> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return api.get<KernelStats>(`/kernel/stats${qs}`);
}

export async function resolveReport(id: string): Promise<KernelReport | null> {
  return api.post<KernelReport>(`/kernel/reports/${id}/resolve`);
}

export async function deleteReport(id: string): Promise<boolean> {
  const res = await api.del<{ deleted: boolean }>(`/kernel/reports/${id}`);
  return !!res?.deleted;
}

/**
 * Wires global handlers once. Safe to call multiple times.
 */
let installed = false;
export function installGlobalKernel(getUserId: () => string | null) {
  if (installed) return;
  installed = true;
  // Unhandled promise rejections (RN gives us tracking)
  const g = globalThis as unknown as {
    onunhandledrejection?: (e: PromiseRejectionEvent) => void;
    addEventListener?: (t: string, h: (e: PromiseRejectionEvent) => void) => void;
    HermesInternal?: unknown;
  };
  const handler = (e: PromiseRejectionEvent) => {
    const reason = (e as unknown as { reason?: unknown }).reason ?? e;
    reportError({
      user_id: getUserId(),
      error: reason instanceof Error ? reason : new Error(String(reason)),
      route: "unhandledRejection",
    });
  };
  try {
    if (typeof g.addEventListener === "function") {
      g.addEventListener("unhandledrejection", handler);
    } else {
      g.onunhandledrejection = handler;
    }
  } catch {
    // best-effort
  }
  dropBreadcrumb("kernel.installed");
}
