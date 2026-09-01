import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function testPdfStructure() {
  const filePath = path.resolve("knowledge/sgk/SGK_KNTT 8_TAP 1.pdf");
  const dataBuffer = fs.readFileSync(filePath);

  const pages = [];
  let currentPage = 1;

  const options = {
    pagerender: async function (pageData) {
      const textContent = await pageData.getTextContent();
      let text = "";
      let lastY = null;
      for (const item of textContent.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          text += "\n" + item.str;
        } else {
          text += " " + item.str;
        }
        lastY = item.transform[5];
      }
      pages.push({
        pageNumber: currentPage++,
        text: text.trim(),
      });
      return text;
    },
  };

  await pdf(dataBuffer, options);

  for (let i = 5; i < 15; i++) {
    console.log(`\n--- PAGE ${pages[i].pageNumber} (length: ${pages[i].text.length}) ---`);
    console.log(pages[i].text.slice(0, 350));
  }
}

testPdfStructure().catch(console.error);
