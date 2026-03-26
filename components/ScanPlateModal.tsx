"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera, Zap, AlertCircle } from "lucide-react";
import { reservationsApi } from "@/lib/api";
import type { ChargingSession } from "@/lib/types";

interface Props {
  reservationId: string;
  onClose: () => void;
  onChargingStarted: (session: ChargingSession) => void;
}

type ScanState = "idle" | "scanning" | "matched" | "mismatch" | "error";

export default function ScanPlateModal({ reservationId, onClose, onChargingStarted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [detectedPlate, setDetectedPlate] = useState("");
  const [scanError, setScanError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

    setScanState("scanning");
    setScanError("");
    setDetectedPlate("");

    try {
      const result = await reservationsApi.scanPlate(reservationId, base64);
      setDetectedPlate(result.detectedPlate);

      if (result.matched && result.session) {
        setScanState("matched");
        stopCamera();
        setTimeout(() => {
          onChargingStarted(result.session!);
          onClose();
        }, 1500);
      } else {
        setScanState("mismatch");
      }
    } catch (err: unknown) {
      setScanState("error");
      setScanError(err instanceof Error ? err.message : "Scan failed");
    }
  };

  const handleRetry = () => {
    setScanState("idle");
    setDetectedPlate("");
    setScanError("");
    if (!streamRef.current) startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#1D1D1F]" />
            <span className="text-sm font-semibold text-[#1D1D1F]">Scan License Plate</span>
          </div>
          <button onClick={onClose} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black aspect-video">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle size={32} className="text-[#FF3B30]" />
              <p className="text-sm text-white">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Plate guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/70 rounded-lg w-3/4 h-1/4 shadow-lg" />
              </div>
            </>
          )}

          {/* Scanning overlay */}
          {scanState === "scanning" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm font-medium">Analysing plate…</span>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Result / actions */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {scanState === "idle" && !cameraError && (
            <>
              <p className="text-xs text-[#86868B] text-center">
                Point the camera at your license plate and press Capture
              </p>
              <button
                onClick={handleCapture}
                className="w-full h-11 bg-[#1D1D1F] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
              >
                <Camera size={15} />
                Capture
              </button>
            </>
          )}

          {scanState === "matched" && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex items-center gap-2 text-[#34C759]">
                <Zap size={18} className="fill-[#34C759]" />
                <span className="text-sm font-semibold">Plate matched — charging started!</span>
              </div>
              {detectedPlate && (
                <span className="font-mono text-lg font-bold text-[#1D1D1F]">{detectedPlate}</span>
              )}
            </div>
          )}

          {scanState === "mismatch" && (
            <>
              <div className="flex flex-col items-center gap-1 py-1">
                <div className="flex items-center gap-2 text-[#FF3B30]">
                  <AlertCircle size={16} />
                  <span className="text-sm font-semibold">Plate does not match</span>
                </div>
                {detectedPlate && (
                  <p className="text-xs text-[#86868B]">
                    Detected: <span className="font-mono font-medium text-[#1D1D1F]">{detectedPlate}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleRetry}
                className="w-full h-11 bg-[#1D1D1F] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
              >
                Try Again
              </button>
            </>
          )}

          {scanState === "error" && (
            <>
              <div className="flex items-center gap-2 text-[#FF3B30]">
                <AlertCircle size={16} />
                <span className="text-sm">{scanError || "Something went wrong"}</span>
              </div>
              <button
                onClick={handleRetry}
                className="w-full h-11 bg-[#1D1D1F] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
              >
                Try Again
              </button>
            </>
          )}

          {cameraError && (
            <button
              onClick={onClose}
              className="w-full h-11 border border-[#D2D2D7] rounded-xl text-sm font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
