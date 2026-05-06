import { NextRequest, NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";
import { uploadToR2 } from "@/lib/r2";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { text, docId } = await req.json();

    if (!text || !docId) {
      return NextResponse.json({ error: "Missing text or docId" }, { status: 400 });
    }

    const credentials = JSON.parse(process.env.GCP_TTS_SERVICE_ACCOUNT_JSON!);
    const client = new textToSpeech.TextToSpeechClient({ credentials });

    const chunks: string[] = [];
    const words = text.split(" ");
    let current = "";
    for (const word of words) {
      if ((current + " " + word).length > 4500) {
        chunks.push(current.trim());
        current = word;
      } else {
        current += " " + word;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const [response] = await client.synthesizeSpeech({
        input: { text: chunk },
        voice: { languageCode: "en-US", name: "en-US-Neural2-D" },
        audioConfig: { audioEncoding: "MP3" },
      });
      audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
    }

    const finalBuffer = Buffer.concat(audioBuffers);

    // Upload to R2
    const key = `audiobooks/${docId}.mp3`;
    const audioUrl = await uploadToR2(key, finalBuffer, "audio/mpeg");

    return NextResponse.json({ audioUrl });
  } catch (err) {
    console.error("Convert error:", err);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}