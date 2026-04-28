import type { BuildEvent, EventSummary } from "../domain.js";

export function summarizeEvent(event: BuildEvent): EventSummary {
  switch (event.type) {
    case "check_completed":
      return {
        kind: event.type,
        message: `checked ${event.projectId} in ${event.durationMs}ms`,
        severity: "info",
      };

    case "post_failed":
      return {
        kind: event.type,
        message: `failed after ${event.retryCount} retries: ${event.error}`,
        severity: "error",
      };

    case "cache_miss":
      return {
        kind: event.type,
        message: `cache miss for ${event.slug}`,
        severity: "warning",
      };
  }
}
