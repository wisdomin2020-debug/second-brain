"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "recording" | "submitting" | "success" | "error";

export function QuickCapture({ onCapture }: { onCapture?: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [classificationResult, setClassificationResult] = useState<string | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Using a fake user id for now. In production, get from auth session.
  const userId = "00000000-0000-0000-0000-000000000000";

  const submitFormData = useCallback(async (formData: FormData) => {
    setStatus("submitting");
    setErrorMsg("");
    setClassificationResult(null);
    try {
      formData.append("user_id", userId);
      const res = await fetch("/api/ingest", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ingestion failed.");
      setClassificationResult(json.classification);
      setStatus("success");
      setText("");
      // Notify MemoryFeed to refresh
      window.dispatchEvent(new Event("brain:captured"));
      onCapture?.();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }, [onCapture]);

  const handleCaptureText = async () => {
    if (!text.trim()) return;
    const formData = new FormData();
    formData.append("text", text);
    await submitFormData(formData);
  };

  const startRecording = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Prefer webm/opus which Deepgram handles well; fall back gracefully
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks so the mic indicator disappears
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log("Audio blob size:", audioBlob.size);
        if (audioBlob.size === 0) {
          setErrorMsg("Recording is empty. Please try speaking again.");
          setStatus("error");
          return;
        }
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        await submitFormData(formData);
      };

      recorder.start(250); // collect data every 250 ms
      setStatus("recording");
    } catch {
      setErrorMsg("Microphone access denied or not supported.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    // Status will flip to "submitting" inside onstop handler
  };

  const handleMicClick = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle") {
      startRecording();
    }
  };

  const isRecording = status === "recording";
  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const isError = status === "error";
  const isBusy = isRecording || isSubmitting;

  return (
    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden group">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Recording pulse ring */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            key="pulse"
            className="absolute inset-0 rounded-3xl border-2 border-red-500/50 pointer-events-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.01, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white/90 tracking-tight flex items-center gap-2">
          Capture{" "}
          <span className="text-neutral-500 font-normal">
            {isRecording ? "Recording…" : "Thought"}
          </span>
        </h3>
        <p className="text-sm text-neutral-400 mt-1 mb-6">
          Type or speak. The system classifies and stores it automatically.
        </p>

        <div className="flex flex-col gap-3 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCaptureText();
            }}
            placeholder="Type an idea, task, or paste some raw notes…"
            disabled={isBusy}
            className="w-full h-32 bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none shadow-inner disabled:opacity-50"
          />

          {/* Status feedback strip */}
          <AnimatePresence mode="wait">
            {(isSuccess || isError) && (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border ${
                  isSuccess
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Saved as{" "}
                    <span className="font-semibold capitalize">
                      {classificationResult}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg || "Something went wrong."}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-2">
            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={isSubmitting}
              title={isRecording ? "Stop recording" : "Record voice note"}
              className={`p-3 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              }`}
            >
              <AnimatePresence mode="popLayout">
                {isRecording ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <MicOff className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Mic className="w-5 h-5 text-white/80" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Submit button */}
            <button
              onClick={handleCaptureText}
              disabled={isSubmitting || isRecording || !text.trim()}
              className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl shadow-white/5 group-hover:shadow-indigo-500/10"
            >
              <AnimatePresence mode="popLayout">
                {isSubmitting ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="send"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
              {isSubmitting ? "Processing…" : "Submit"}
            </button>
          </div>

          <p className="text-xs text-neutral-600 text-right">⌘↵ to submit</p>
        </div>
      </div>
    </div>
  );
}
