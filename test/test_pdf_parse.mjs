import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function testPdf() {
  const filePath = path.resolve("knowledge/sgk/SGK_KNTT 8_TAP 1.pdf");
  console.log("Reading:", filePath);
  const dataBuffer = fs.readFileSync(filePath);

  const pages = [];
  let currentPage = 1;

  const options = {
    pagerender: async function (pageData) {
      const textContent = await pageData.getTextContent();
      let text = "";
      for (const item of textContent.items) {
        text += item.str + " ";
      }
      pages.push({
        pageNumber: currentPage++,
        text: text.trim(),
      });
      return text;
    },
  };

  const data = await pdf(dataBuffer, options);
  console.log("Total pages reported by numpages:", data.numpages);
  console.log("Total pages collected in array:", pages.length);
  console.log("Sample page 8 text:", pages[7]?.text?.slice(0, 200));
}

testPdf().catch(console.error);
