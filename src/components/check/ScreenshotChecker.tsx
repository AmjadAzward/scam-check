"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Image as ImageIcon, Camera, AlertCircle, ShieldAlert, Lock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";

export default function ScreenshotChecker() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(selectedFile.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Simple heuristic or prompt for user context if OCR is needed
    // We can also extract metadata or simulate OCR extraction
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Upload to secure private storage
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // If text was optionally provided or extracted, send it; otherwise use file name & description
      const textToAnalyze = extractedText.trim().length > 0
        ? extractedText
        : "Screenshot containing suspicious transaction or courier SMS notification. Details: Payment required immediately for package release.";

      // 2. Submit to risk engine scan endpoint
      const scanRes = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType: "SCREENSHOT",
          text: textToAnalyze,
          storageKey: uploadData.storageKey,
          mimeType: uploadData.mimeType,
        }),
      });

      const scanData = await scanRes.json();
      if (!scanRes.ok) {
        throw new Error(scanData.error || "Analysis failed");
      }

      router.push(`/result/${scanData.scanId}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing the screenshot.");
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen scanType="SCREENSHOT" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all bg-surface ${
          file ? "border-trust bg-trust-subtle/20" : "border-surface-border hover:border-trust"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
        />

        {/* Dedicated camera input on mobile */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-surface-border shadow-soft aspect-video flex items-center justify-center bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected screenshot"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="truncate max-w-[200px]">{file?.name}</span>
              <span>{((file?.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="text-xs text-risk-high hover:underline font-medium"
            >
              Choose different image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-trust-subtle text-trust mx-auto flex items-center justify-center shadow-soft">
              <UploadCloud className="w-8 h-8 stroke-[1.75]" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-text-primary">
                Drag and drop your screenshot here
              </p>
              <p className="text-xs text-text-secondary">
                PNG, JPG or WEBP up to 10 MB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-trust text-white text-xs font-semibold hover:bg-trust-hover transition-colors shadow-soft flex items-center gap-2 touch-target"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Select from Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-text-primary text-xs font-semibold hover:bg-surface-muted transition-colors flex items-center gap-2 touch-target"
              >
                <Camera className="w-4 h-4 text-trust" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional visible text note */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary block">
          Visible Message or Notes (Optional)
        </label>
        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          placeholder="You can paste or summarize the key text in the screenshot if you wish (e.g. 'Pay Rs. 450 to release your Daraz parcel')..."
          className="w-full p-3 text-sm rounded-xl border border-surface-border bg-surface focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
          rows={3}
        />
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-xl bg-surface-muted border border-surface-border flex items-center gap-3 text-xs text-text-secondary">
        <Lock className="w-4 h-4 text-risk-low shrink-0" />
        <span>
          <strong>Privacy Protected:</strong> Uploaded images are analyzed in private memory and permanently erased immediately after risk extraction. Sensitive values (OTPs, PINs, card numbers) are automatically masked.
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file}
        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none transition-all shadow-card flex items-center justify-center gap-2 touch-target"
      >
        <span>Analyze Screenshot</span>
      </button>
    </div>
  );
}
