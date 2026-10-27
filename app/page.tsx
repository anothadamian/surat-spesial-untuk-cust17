import { readFileSync } from "node:fs";
import { join } from "node:path";
import Experience from "./experience";

export default function Page() {
  const letter = readFileSync(join(process.cwd(), "letter.txt"), "utf8").replace(/\n$/, "");
  return <Experience letter={letter} />;
}
