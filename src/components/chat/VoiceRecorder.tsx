import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Pause, Play, Send } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [state, setState] = useState<"recording" | "paused" | "stopped">("recording");
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const elapsedRef = useRef(0);
  const lastTick = useRef(Date.now());
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";

        const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
        mediaRecorder.current = recorder;
        chunks.current = [];

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
        recorder.start(100);

        lastTick.current = Date.now();
        timerRef.current = setInterval(() => {
          const now = Date.now();
          elapsedRef.current += now - lastTick.current;
          lastTick.current = now;
          setDuration(Math.floor(elapsedRef.current / 1000));
        }, 200);
      } catch {
        onCancel();
      }
    };
    start();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.pause();
      // freeze timer
      elapsedRef.current += Date.now() - lastTick.current;
      if (timerRef.current) clearInterval(timerRef.current);
      setState("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current?.state === "paused") {
      mediaRecorder.current.resume();
      lastTick.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        elapsedRef.current += now - lastTick.current;
        lastTick.current = now;
        setDuration(Math.floor(elapsedRef.current / 1000));
      }, 200);
      setState("recording");
    }
  }, []);

  const stopAndSend = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const recorder = mediaRecorder.current;
    if (!recorder) return;

    const finalDuration = Math.floor(elapsedRef.current / 1000);

    if (recorder.state !== "inactive") {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type: mimeType });
        streamRef.current?.getTracks().forEach(t => t.stop());
        onSend(blob, finalDuration);
      };
      recorder.stop();
    }
  }, [onSend]);

  const handleCancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorder.current?.state !== "inactive") {
      mediaRecorder.current?.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCancel();
  }, [onCancel]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="border-t bg-card px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        {/* Cancel */}
        <button onClick={handleCancel} className="text-xs text-destructive hover:underline px-2">
          Annuler
        </button>

        {/* Recording indicator + duration */}
        <div className="flex-1 flex items-center gap-2">
          {state === "recording" && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0"
            />
          )}
          {state === "paused" && (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          )}
          <span className="text-sm font-mono font-medium">{fmt(duration)}</span>
          <span className="text-[11px] text-muted-foreground">
            {state === "recording" ? "Enregistrement..." : "En pause"}
          </span>
        </div>

        {/* Pause / Resume */}
        {state === "recording" && (
          <button
            onClick={pauseRecording}
            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        {state === "paused" && (
          <button
            onClick={resumeRecording}
            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            title="Reprendre"
          >
            <Play className="w-4 h-4 ml-0.5" />
          </button>
        )}

        {/* Stop & Send */}
        <button
          onClick={stopAndSend}
          className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-md"
          title="Envoyer"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
