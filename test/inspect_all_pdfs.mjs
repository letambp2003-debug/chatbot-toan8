import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function inspectAllPdfs() {
  const files = [
    "knowledge/sgk/SGK_KNTT 8_TAP 1.pdf",
    "knowledge/sgk/SGK_KNTT 8_TAP 2.pdf",
    "knowledge/sbt/SBT_KNTT 8_TAP 1.pdf",
    "knowledge/sbt/SBT_KNTT 8_TAP 2.pdf",
  ];

  for (const f of files) {
    const fullPath = path.resolve(f);
    const buf = fs.readFileSync(fullPath);
    const res = await pdf(buf);
    console.log(`\n=== ${f} ===`);
    console.log(`Pages: ${res.numpages}, Total Text Length: ${res.text.length}`);
    console.log(`Sample Text:`, res.text.slice(0, 300).replace(/\n+/g, " "));
  }
}

inspectAllPdfs().catch(console.error);
