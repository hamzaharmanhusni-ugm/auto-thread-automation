import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ensure the signed-in user belongs to the shared workspace (internal tool).
  await getCurrentWorkspaceId();

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <div className="lg:hidden">
            <span className="font-semibold">ThreadsGrowth AI</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Panduan & bantuan" title="Panduan & bantuan">
              <Link href="/panduan">
                <HelpCircle className="size-5" />
              </Link>
            </Button>
            <UserMenu email={user.email ?? ""} />
          </div>
        </header>
        <MobileNav />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <WelcomeDialog />
    </div>
  );
}
