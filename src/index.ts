import type { Post } from "./domain.js";
import { summarizeEvent } from "./helpers/events.js";
import { createPage, mapPaginated } from "./helpers/paginated.js";
import { pickDefined } from "./helpers/object-keys.js";

export type { BuildEvent, EventSummary, Post } from "./domain.js";
export type { PaginatedResponse } from "./helpers/paginated.js";
export { publishGeneratedPost } from "./integration/anthropic-like.js";

export function demo(): {
  postIds: readonly string[];
  summary: string;
  config: Partial<{ compiler: string; strict: boolean }>;
} {
  const posts: readonly Post[] = [
    {
      id: "post_1",
      slug: "typescript-7-beta",
      title: "TypeScript 7 beta",
      tags: ["typescript", "compiler"],
      publishedAt: new Date("2026-04-26T00:00:00.000Z"),
    },
  ];

  const page = createPage(posts);
  const ids = mapPaginated(page, (post) => ({
    id: post.id,
    slug: post.slug,
  }));
  const event = summarizeEvent({
    type: "check_completed",
    projectId: "post_1",
    durationMs: 1200,
  });

  return {
    postIds: ids.data.map((post) => post.id),
    summary: event.message,
    config: pickDefined({ compiler: "tsgo", strict: true }),
  };
}
