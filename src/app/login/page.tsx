import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentSession, roleHomePath } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in with a profile, send them to their area.
  const session = await getCurrentSession();
  if (session?.profile) {
    redirect(roleHomePath(session.profile.role));
  }

  const { error } = await searchParams;
  const noProfile = error === "no_profile";

  return (
    <main className="bg-background flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
          <Landmark className="size-6" />
        </span>
        <div>
          <p className="text-lg font-semibold">Sophnochura Somiti</p>
          <p className="text-muted-foreground text-sm">
            Finance &amp; member management
          </p>
        </div>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {noProfile ? (
            <p className="text-destructive text-sm" role="alert">
              Your account has no profile yet. Please contact an administrator,
              then sign in again.
            </p>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
