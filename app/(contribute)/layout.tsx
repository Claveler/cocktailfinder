import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ContributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please sign in to submit a venue");
  }

  return <>{children}</>;
}
