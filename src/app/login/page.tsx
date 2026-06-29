import { redirect } from "next/navigation";
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
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sophnochura Somiti</CardTitle>
          <CardDescription>Sign in to your account.</CardDescription>
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
