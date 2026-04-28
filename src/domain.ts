export type Post = {
  id: string;
  slug: string;
  title: string;
  tags: readonly string[];
  publishedAt: Date;
};

export type BuildEvent =
  | { type: "check_completed"; projectId: string; durationMs: number }
  | { type: "post_failed"; error: string; retryCount: number }
  | { type: "cache_miss"; slug: string };

export type EventSummary = {
  kind: BuildEvent["type"];
  message: string;
  severity: "info" | "warning" | "error";
};
