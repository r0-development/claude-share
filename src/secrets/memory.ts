/** The in-memory secrets store: what tests run the .env merge and the commands against. `stamp` is what a write is
 *  stamped with (the clock and the machine a real store would take from the share's commit). */
import type { Values } from "../env.js";
import type { Entry, SecretsStore } from "./index.js";

export function memoryStore(entries: Record<string, Entry> = {}, stamp: { when?: () => string; from?: string } = {}): SecretsStore & { entries: Record<string, Entry> } {
  return {
    name: "memory", entries, ready: () => true,
    list: async () => Object.keys(entries),
    load: async (name) => entries[name],
    async write(name, values) { if (Object.keys(values).length) entries[name] = { values: { ...values }, when: stamp.when?.() ?? new Date().toISOString(), ...(stamp.from ? { from: stamp.from } : {}) }; else delete entries[name]; },
  };
}
