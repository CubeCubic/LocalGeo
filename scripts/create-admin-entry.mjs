import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputDirectory = resolve("dist");
const source = resolve(outputDirectory, "index.html");
const destination = resolve(outputDirectory, "admin", "index.html");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
