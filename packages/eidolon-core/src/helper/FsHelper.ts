import crypto from "crypto";
import fsSync from "fs";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export function filePathToText(mod: any): string {
  if (typeof mod === "string") {
    try {
      return fsSync.readFileSync(mod, "utf-8");
    } catch {
      return mod;
    }
  }
  if (typeof mod?.default === "string") {
    try {
      return fsSync.readFileSync(mod.default, "utf-8");
    } catch {
      return mod.default;
    }
  }
  return String(mod ?? "");
}