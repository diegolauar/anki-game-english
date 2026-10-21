import { Check, X } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth-validation";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-1 flex flex-col gap-0.5">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        return (
          <li
            key={requirement.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-ok" : "text-muted-foreground"}`}
          >
            {met ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {requirement.label}
          </li>
        );
      })}
    </ul>
  );
}
