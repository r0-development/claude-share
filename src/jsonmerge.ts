/** Deep merge for Claude settings layers; permission lists union, other lists replace. */
const UNION = new Set(["permissions.allow", "permissions.deny", "permissions.ask", "permissions.additionalDirectories", "enabledMcpjsonServers", "disabledMcpjsonServers"]);
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

export function deepMerge(base: unknown, over: unknown, path = ""): unknown {
  if (isObj(base) && isObj(over)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = k in base ? deepMerge(base[k], v, path ? `${path}.${k}` : k) : v;
    return out;
  }
  if (Array.isArray(base) && Array.isArray(over) && UNION.has(path)) {
    const seen = new Set(base.map((x) => JSON.stringify(x))); const out = [...base];
    for (const x of over) { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); out.push(x); } }
    return out;
  }
  return over;
}
export const mergeLayers = (...layers: Record<string, unknown>[]) => layers.reduce<Record<string, unknown>>((acc, l) => deepMerge(acc, l) as Record<string, unknown>, {});
export const dumps = (o: unknown) => JSON.stringify(o, null, 2) + "\n";
export const loads = (t: string): Record<string, unknown> => (t.trim() ? JSON.parse(t) : {});
export function diffKeys(a: Record<string, unknown>, b: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (!(k in a) || !(k in b)) out.push(p);
    else if (isObj(a[k]) && isObj(b[k])) out.push(...diffKeys(a[k] as any, b[k] as any, p));
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(p);
  }
  return out;
}
