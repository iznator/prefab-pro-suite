import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTime = useRef(Date.now());

  useEffect(() => {
    let stream: MediaStream;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        // Use webm/opus for compression (small file size like Telegram)
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
        mediaRecorder.current = recorder;
        chunks.current = [];
        startTime.current = Date.now();

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: mimeType });
          setAudioUrl(URL.createObjectURL(blob));
        };

        recorder.start(100); // collect in 100ms chunks for responsiveness
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }, 200);
      } catch {
        onCancel();
      }
    };
    start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const handleSend = useCallback(() => {
    if (chunks.current.length === 0) return;
    const mimeType = mediaRecorder.current?.mimeType || "audio/webm";
    const blob = new Blob(chunks.current, { type: mimeType });
    onSend(blob, duration);
  }, [duration, onSend]);

  const handleDelete = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  }, [audioUrl, onCancel]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="border-t bg-card px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        <button onClick={handleDelete} className="w-9 h-9 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors">
          <Trash2 className="w-5 h-5 text-destructive" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          {recording && (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full bg-red-500"
              />
              <span className="text-sm font-mono font-medium text-foreground">{formatDuration(duration)}</span>
              <span className="text-xs text-muted-foreground">Enregistrement...</span>
            </div>
          )}

          {!recording && audioUrl && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-mono font-medium">{formatDuration(duration)}</span>
              <audio src={audioUrl} controls className="flex-1 h-8" style={{ maxWidth: 300 }} />
            </div>
          )}
        </div>

        {recording ? (
          <button onClick={stopRecording} className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-md">
            <Square className="w-4 h-4 text-white fill-white" />
          </button>
        ) : (
          <button onClick={handleSend} className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-md">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
