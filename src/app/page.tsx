import { redirect } from "next/navigation";
import { getCurrentSession, roleHomePath } from "@/lib/auth";

// The app has no public landing page: route everyone to the right place.
export default async function Home() {
  const session = await getCurrentSession();
  if (!session?.profile) {
    redirect("/login");
  }
  redirect(roleHomePath(session.profile.role));
}
