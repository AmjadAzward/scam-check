import { NextResponse } from "next/server";
import {
  savePrivateFile,
  generateSignedFileUrl,
  verifySignedUrl,
  getPrivateFileBuffer,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    const originalName = file.name || "screenshot.png";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save privately with validation
    const saved = await savePrivateFile(buffer, originalName, mimeType);

    // Generate safe signed URL
    const signedUrl = generateSignedFileUrl(saved.storageKey, 600); // 10 minutes

    return NextResponse.json({
      success: true,
      storageKey: saved.storageKey,
      signedUrl,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image upload" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const expires = parseInt(searchParams.get("expires") || "0", 10);
    const sig = searchParams.get("sig");

    if (!key || !expires || !sig) {
      return NextResponse.json({ error: "Invalid signed URL parameters" }, { status: 400 });
    }

    const isValid = verifySignedUrl(key, expires, sig);
    if (!isValid) {
      return NextResponse.json({ error: "Signed URL is invalid or has expired" }, { status: 403 });
    }

    const buffer = await getPrivateFileBuffer(key);
    if (!buffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const ext = key.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
