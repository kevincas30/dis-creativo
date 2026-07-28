export function firstNameOf(displayName: string) {
  const first = displayName.trim().split(/\s+/)[0] ?? displayName;
  return first.charAt(0).toUpperCase() + first.slice(1);
}
