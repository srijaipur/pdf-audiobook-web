export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ✅ Use CommonJS require (most stable for pdf-parse)
  const pdfParse = require("pdf-parse");

  const data = await pdfParse(buffer);

  return data.text || "";
}