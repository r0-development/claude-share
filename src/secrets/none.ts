import type { Backend } from "./index.js";
import * as ui from "../ui.js";
const no = () => { throw new Error("cs: secrets backend 'none' cannot store secrets"); };
export const NoneBackend: Backend = {
  name: "none",
  async init() { ui.info("secrets backend is 'none' — set [secrets].backend = \"sops\" in machine.toml to enable"); },
  ready: () => true, loadEnv: () => ({}), writeEnv: no, loadEnvA: async () => ({}), writeEnvA: no, edit: no, status: () => ui.info("backend none"),
};
