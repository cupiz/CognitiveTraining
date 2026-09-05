import { getSession } from "@/lib/auth";
import { LandingClient } from "./landing/landing-client";

export const metadata = {
  title: "Platform Pelatihan Kognitif",
  description:
    "Latihan kognitif berbasis browser untuk anak — permainan adaptif singkat, rencana personal, dan kemajuan yang mudah dipahami orang tua.",
};

export default async function LandingPage() {
  const session = await getSession();
  const isAuthed = Boolean(session);

  return <LandingClient isAuthed={isAuthed} />;
}