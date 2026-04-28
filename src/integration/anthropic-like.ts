export type ApiResponse = {
  status: number;
  body: string;
};

export type PublishResult =
  | { ok: true; postId: string }
  | { ok: false; response: ApiResponse };

export async function publishGeneratedPost(
  title: string,
  markdown: string,
): Promise<PublishResult> {
  if (title.trim() === "" || markdown.trim() === "") {
    return {
      ok: false,
      response: {
        status: 400,
        body: "title and markdown are required",
      },
    };
  }

  return {
    ok: true,
    postId: cryptoSafeId(title),
  };
}

function cryptoSafeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
