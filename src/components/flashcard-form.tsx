import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FlashcardForm({
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
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="front">Frente</Label>
        <Input
          id="front"
          name="front"
          required
          defaultValue={defaultFront}
          placeholder="Pergunta ou situação em português"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="back">Verso</Label>
        <Input
          id="back"
          name="back"
          required
          defaultValue={defaultBack}
          placeholder="Frase em inglês"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="explanation">Explicação (opcional)</Label>
        <Input
          id="explanation"
          name="explanation"
          defaultValue={defaultExplanation}
          placeholder="Contexto ou dica extra"
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
