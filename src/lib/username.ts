/** Normalize login username (full name) for storage and lookup */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function initialsFromName(firstName: string, lastName: string): string {
  const a = firstName.trim()[0] ?? "";
  const b = lastName.trim()[0] ?? "";
  return `${a}${b}`.toUpperCase() || "U";
}
