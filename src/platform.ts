import { readFileSync } from "node:fs";
import { join } from "node:path";
import { home } from "./paths.js";

export const isMac = () => process.platform === "darwin";
export const isLinux = () => process.platform === "linux";
export function isWSL(): boolean {
  if (!isLinux()) return false;
  try { return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft"); } catch { return false; }
}
export function refuseUnsupported() {
  if (process.platform === "win32" || process.env.MSYSTEM) {
    console.error("cs: Windows-native shells are unsupported. Run inside WSL2 (`wsl --install -d Ubuntu-24.04`). See docs/WINDOWS.md.");
    process.exit(1);
  }
}
export const shellRc = () => join(home(), isMac() ? ".zshrc" : ".bashrc");
export const describe = () => (isWSL() ? "wsl2" : isMac() ? "macos" : process.platform);
