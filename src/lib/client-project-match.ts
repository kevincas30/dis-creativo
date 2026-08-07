// Project.client es texto libre (el módulo Clientes no existía cuando se
// creó Proyectos) — hasta que Project tenga una relación real a Client, se
// asocian comparando texto normalizado contra displayName/name/company.
// Es una asociación heurística de solo lectura: no escribe nada en Project.

export function normalizeClientText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

export function projectMatchesClient(
  projectClient: string,
  client: { displayName: string; name: string; company: string | null },
): boolean {
  const normalizedProjectClient = normalizeClientText(projectClient);
  if (!normalizedProjectClient) return false;
  const candidates = [client.displayName, client.name, client.company]
    .filter((value): value is string => !!value)
    .map(normalizeClientText);
  return candidates.includes(normalizedProjectClient);
}
