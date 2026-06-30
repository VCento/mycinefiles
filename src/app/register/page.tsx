import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./RegisterForm";

// Reads the session cookie — must be evaluated per request.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");
  return <RegisterForm />;
}
