import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user?.rol || "").toUpperCase();

  if (role === "ASESOR") {
    redirect("/pre-siniestro");
  }

  if (role === "CAPTADOR") {
    redirect("/captaciones");
  }

  // Default redirect for other roles
  redirect("/dashboard");
}
