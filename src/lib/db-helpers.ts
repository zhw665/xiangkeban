export function first<T>(rows: T[]): T | undefined {
  return rows[0];
}

export function firstOrNull<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}
