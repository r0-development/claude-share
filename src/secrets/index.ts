/** The secrets store: the share's encrypted entries — `global` and one per project `.env*` file (src/env.ts's `storeName`) —
 *  behind one async interface. Adapters: sops (src/secrets/sops.ts, the default), none (here: reads nothing, stores nothing)
 *  and in-memory (src/secrets/memory.ts, for tests). An entry with no keys does not exist: `write(name, {})` removes it and
 *  `load` of a missing entry is undefined — a caller that wants values asks `valuesOf()`. */
import type { Share } from "../share.js";
import type { Values } from "../env.js";

/** An entry: its values, when it last changed and — when known — from which machine (what "take 2 keys from laptop" names). */
export interface Entry { values: Values; when: string; from?: string }
export interface SecretsStore {
  readonly name: "sops" | "none" | "memory";
  /** This machine can read and write the entries (for sops: it is a recipient). Always true for none — which has nothing to read. */
  ready(): boolean;
  /** Every entry name there is. */
  list(): Promise<string[]>;
  load(name: string): Promise<Entry | undefined>;
  /** Replace the entry; `{}` removes it. */
  write(name: string, values: Values): Promise<void>;
}
/** The store machine.toml names, bound to this share. */
export async function secretsStore(share: Share): Promise<SecretsStore> {
  const backend = share.machine.secretsBackend;
  if (backend === "sops") return (await import("./sops.js")).sopsStore(share);
  if (backend === "none") return noneStore;
  throw new Error(`cs: unknown secrets backend '${backend}' (sops | none)`);
}
/** The values of an entry, `{}` when there is none. */
export const valuesOf = async (store: SecretsStore, name: string): Promise<Values> => (await store.load(name))?.values ?? {};

const noneStore: SecretsStore = {
  name: "none", ready: () => true, list: async () => [], load: async () => undefined,
  async write() { throw new Error("cs: secrets backend 'none' cannot store secrets"); },
};
