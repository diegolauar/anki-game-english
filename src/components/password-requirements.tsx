import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { buildPasswordRequirements } from "@/lib/auth-validation";

export function PasswordRequirements({ password }: { password: string }) {
  const t = useTranslations("validation");
  const requirements = buildPasswordRequirements(t);

  return (
    <ul className="mt-1 flex flex-col gap-0.5">
      {requirements.map((requirement) => {
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
