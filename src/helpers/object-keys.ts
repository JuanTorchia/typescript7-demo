export function typedKeys<T extends Record<string, unknown>>(value: T): Array<Extract<keyof T, string>> {
  return Object.keys(value).filter((key): key is Extract<keyof T, string> => key in value);
}

export function pickDefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};

  for (const key of typedKeys(value)) {
    const item = value[key];

    if (item !== undefined) {
      result[key] = item;
    }
  }

  return result;
}
