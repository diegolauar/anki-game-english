"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  title,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className} title={title}>
      {pending ? pendingLabel : children}
    </button>
  );
}
