"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Camera, UploadCloud, AlertCircle, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import jsQR from "jsqr";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";
import RiskBadge from "@/components/risk/RiskBadge";

export default function QrChecker() {
  const router = useRouter();
  const { t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [qrDestination, setQrDestination] = useState<string | null>(null);
  const [analyzedScan, setAnalyzedScan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stop camera when unmounting or switching mode
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        setIsCameraActive(true);
        requestAnimationFrame(tickCamera);
      }
    } catch (err: any) {
      setError("Unable to access camera. Please allow camera permissions or upload an image instead.");
    }
  };

  const tickCamera = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            stopCamera();
            handleDecodedCode(code.data);
            return;
          }
        }
      }
    }
    if (isCameraActive) {
      requestAnimationFrame(tickCamera);
    }
  };

  const handleImageUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDecodedCode(code.data);
        } else {
          setError("No QR code was detected in this image. Please ensure the QR is clear and well-lit.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDecodedCode = async (decodedString: string) => {
    setQrDestination(decodedString);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType: "QR",
          qrDestination: decodedString,
          url: decodedString.startsWith("http") ? decodedString : undefined,
          text: `QR Code destination: ${decodedString}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalyzedScan(data.result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze decoded QR destination.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen scanType="QR" />;
  }

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card if QR is already decoded */}
      {analyzedScan && qrDestination ? (
        <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-elevated space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
            <div>
              <span className="text-xs font-semibold text-text-tertiary uppercase">Extracted Destination</span>
              <p className="text-sm font-mono font-bold text-text-primary break-all mt-0.5">
                {qrDestination}
              </p>
            </div>
            <RiskBadge level={analyzedScan.riskLevel} />
          </div>

          <div className="p-4 rounded-xl bg-surface-muted space-y-1">
            <div className="text-xs font-semibold text-text-secondary uppercase">Safety Assessment</div>
            <p className="text-sm text-text-primary">{analyzedScan.summary}</p>
          </div>

          {analyzedScan.reasons && analyzedScan.reasons.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-text-secondary uppercase">Why this was flagged</div>
              <div className="space-y-2">
                {analyzedScan.reasons.slice(0, 3).map((r: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-surface-muted/60 text-xs space-y-0.5">
                    <div className="font-semibold text-text-primary">{r.title}</div>
                    <div className="text-text-secondary">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt specified Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => router.push(`/result/${analyzedScan.id}`)}
              className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-trust hover:bg-trust-hover transition-colors shadow-soft"
            >
              View Details
            </button>
            <button
              onClick={() => {
                setQrDestination(null);
                setAnalyzedScan(null);
              }}
              className="py-3 px-4 rounded-xl font-bold text-xs text-risk-critical bg-risk-critical-bg border border-risk-critical-border hover:bg-risk-critical/10 transition-colors"
            >
              Do Not Open
            </button>
          </div>
        </div>
      ) : (
        /* Camera or Upload selector */
        <div className="space-y-4">
          <div className="flex rounded-xl bg-surface-muted p-1 border border-surface-border">
            <button
              onClick={() => {
                stopCamera();
                setMode("upload");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "upload" ? "bg-surface text-trust shadow-soft" : "text-text-secondary"
              }`}
            >
              Upload QR Image
            </button>
            <button
              onClick={() => {
                setMode("camera");
                startCamera();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                mode === "camera" ? "bg-surface text-trust shadow-soft" : "text-text-secondary"
              }`}
            >
              Scan with Camera
            </button>
          </div>

          {mode === "camera" ? (
            <div className="relative rounded-2xl overflow-hidden border border-surface-border aspect-square max-w-sm mx-auto bg-black flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-2 border-dashed border-trust/80 rounded-2xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-3 inset-x-3 text-center bg-black/60 backdrop-blur py-1.5 px-3 rounded-lg text-white text-xs">
                Align QR code inside the box
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-surface-border hover:border-trust rounded-2xl p-10 text-center cursor-pointer transition-all bg-surface"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-trust-subtle text-trust mx-auto flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8 stroke-[1.75]" />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                Click to upload a QR code image
              </p>
              <p className="text-xs text-text-secondary mt-1">
                ScamCheck extracts the destination safely without opening it in your browser.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
