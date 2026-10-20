"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_DURATION_MS = 60_000;

type RecorderState = "idle" | "recording" | "processing" | "review" | "error";

export interface VoiceRecorderResult {
  text: string;
  rawText: string;
  provider: string;
  audioDurationMs: number;
}

interface VoiceRecorderProps {
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: (result: VoiceRecorderResult) => Promise<void>;
}

export function VoiceRecorder({ disabled, onCancel, onSubmit }: VoiceRecorderProps) {
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
      setErrorMessage("Não foi possível transcrever o áudio. Tente regravar ou use o texto.");
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
      setErrorMessage(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador ou use o texto.",
      );
      setState("error");
    }
  }

  useEffect(() => {
    return () => {
      clearTimers();
      stopStream();
    };
  }, []);

  function startRecording() {
    setState("recording");
    setErrorMessage(null);
    setElapsedSeconds(0);
    void beginRecording();
  }

  async function handleSend() {
    if (!transcript.trim()) return;
    await onSubmit({
      text: transcript.trim(),
      rawText: rawTranscript,
      provider,
      audioDurationMs: durationMs,
    });
  }

  if (state === "idle") {
    return (
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <p className="text-sm text-muted-foreground">
          Toque para gravar (seu navegador vai pedir permissão do microfone).
        </p>
        <div className="flex gap-2">
          <Button type="button" onClick={startRecording}>
            Iniciar gravação
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <p className="text-sm text-muted-foreground">Gravando... {elapsedSeconds}s / 60s</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={stopRecording}>
            Parar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              stopRecording();
              onCancel();
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="border-t pt-3">
        <p className="text-sm text-muted-foreground">Processando áudio...</p>
      </div>
    );
  }

  if (state === "review") {
    return (
      <div className="flex flex-col gap-2 border-t pt-3">
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          className="min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button type="button" disabled={disabled} onClick={handleSend}>
            Enviar
          </Button>
          <Button type="button" variant="outline" onClick={startRecording}>
            Regravar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={startRecording}>
          Tentar gravar novamente
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Usar texto
        </Button>
      </div>
    </div>
  );
}
