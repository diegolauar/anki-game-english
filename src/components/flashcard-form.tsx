import { getTranslations } from "next-intl/server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export async function FlashcardForm({
  action,
  submitLabel,
  hiddenFields,
  defaultFront,
  defaultBack,
  defaultExplanation,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
  defaultFront?: string;
  defaultBack?: string;
  defaultExplanation?: string;
}) {
  const t = await getTranslations("flashcards.form");

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="front">{t("frontLabel")}</Label>
        <Input
          id="front"
          name="front"
          required
          defaultValue={defaultFront}
          placeholder={t("frontPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="back">{t("backLabel")}</Label>
        <Input
          id="back"
          name="back"
          required
          defaultValue={defaultBack}
          placeholder={t("backPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="explanation">{t("explanationLabel")}</Label>
        <Input
          id="explanation"
          name="explanation"
          defaultValue={defaultExplanation}
          placeholder={t("explanationPlaceholder")}
        />
      </div>

      <button
        type="submit"
        className="mt-2 flex h-12 items-center justify-center rounded-full bg-acc text-sm font-bold text-acc-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}
