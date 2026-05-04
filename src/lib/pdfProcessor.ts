import * as pdfParse from "pdf-parse";


export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ✅ dynamic import for CommonJS compatibility (Vercel-safe)
  const pdfParse = (await import("pdf-parse")).default;

  const data = await pdfParse(buffer);

  return data.text || "";
}