"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";

export function FilePicker({
  name,
  accept,
  placeholder,
}: {
  name: string;
  accept: string;
  placeholder: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-muted-foreground hover:border-acc"
    >
      {fileName ? <FileText className="size-6 text-acc" /> : <Upload className="size-6" />}
      <span className={fileName ? "font-semibold text-ink" : undefined}>
        {fileName ?? placeholder}
      </span>
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        required
        className="hidden"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
      />
    </label>
  );
}
