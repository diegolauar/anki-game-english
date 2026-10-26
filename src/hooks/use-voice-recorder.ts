import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_DURATION_MS = 60_000;

export type RecorderState = "idle" | "recording" | "processing" | "review" | "error" | "denied";

export interface VoiceRecorderResult {
  text: string;
  rawText: string;
  provider: string;
  audioDurationMs: number;
}

interface UseVoiceRecorderOptions {
  onSubmit: (result: VoiceRecorderResult) => Promise<void>;
}

export function useVoiceRecorder({ onSubmit }: UseVoiceRecorderOptions) {
  const t = useTranslations("conversation.chat");
  const [state, setState] = useState<RecorderState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [provider, setProvider] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function processRecording() {
    setState("processing");
    const duration = Date.now() - startedAtRef.current;
    setDurationMs(duration);

    const audioBlob = new Blob(chunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || "audio/webm",
    });

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!response.ok) throw new Error("transcription failed");

      const data: { text: string; provider: string } = await response.json();
      setTranscript(data.text);
      setRawTranscript(data.text);
      setProvider(data.provider);
      setState("review");
    } catch {
      setErrorMessage(t("transcribeError"));
      setState("error");
    }
  }

  function stopRecording() {
    clearTimers();
    mediaRecorderRef.current?.stop();
    stopStream();
  }

  async function beginRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        void processRecording();
      };

      mediaRecorder.start();

      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);

      timeoutRef.current = setTimeout(stopRecording, MAX_DURATION_MS);
    } catch {
      setState("denied");
    }
  }

  useEffect(() => {
    return () => {
      clearTimers();
      stopStream();
    };
  }, []);

  function start() {
    setState("recording");
    setErrorMessage(null);
    setElapsedSeconds(0);
    void beginRecording();
  }

  function cancel() {
    clearTimers();
    stopStream();
    setTranscript("");
    setState("idle");
  }

  async function send() {
    if (!transcript.trim()) return;

    const result = {
      text: transcript.trim(),
      rawText: rawTranscript,
      provider,
      audioDurationMs: durationMs,
    };
    // Limpa o campo antes de esperar a resposta da IA, igual ao modo texto —
    // senão a transcrição fica parada na tela até a resposta inteira voltar,
    // dando a impressão de que a mensagem não foi enviada.
    setState("idle");
    setTranscript("");
    await onSubmit(result);
  }

  return {
    state,
    errorMessage,
    transcript,
    setTranscript,
    elapsedSeconds,
    maxDurationSeconds: MAX_DURATION_MS / 1000,
    start,
    stopRecording,
    cancel,
    send,
  };
}
