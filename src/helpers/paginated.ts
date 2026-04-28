export type EntityWithId = {
  id: string;
};

export type PaginatedResponse<T extends EntityWithId> = {
  data: readonly T[];
  nextCursor: string | null;
  metadata: {
    firstItemId: T["id"] | null;
    count: number;
  };
};

export function createPage<T extends EntityWithId>(
  data: readonly T[],
  nextCursor: string | null = null,
): PaginatedResponse<T> {
  return {
    data,
    nextCursor,
    metadata: {
      firstItemId: data[0]?.id ?? null,
      count: data.length,
    },
  };
}

export function mapPaginated<T extends EntityWithId, U extends EntityWithId>(
  response: PaginatedResponse<T>,
  transform: (item: T) => U,
): PaginatedResponse<U> {
  const mapped = response.data.map(transform);

  return {
    data: mapped,
    nextCursor: response.nextCursor,
    metadata: {
      firstItemId: mapped[0]?.id ?? null,
      count: mapped.length,
    },
  };
}
