import { redirect } from "next/navigation";
import { ReviewSession } from "@/components/review-session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { SupabaseCardScheduleRepository } from "@/infrastructure/supabase/card-schedule-repository";

export default async function ReviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dueFlashcards = await new SupabaseCardScheduleRepository(supabase).listDueForUser(
    user.id,
    new Date(),
  );

  return (
    <main className="mx-auto flex h-screen max-w-xl flex-1 flex-col">
      <ReviewSession dueFlashcards={dueFlashcards} />
    </main>
  );
}
