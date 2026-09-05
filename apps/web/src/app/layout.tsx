import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Platform Pelatihan Kognitif",
  description:
    "Latihan kognitif berbasis browser untuk anak — permainan adaptif singkat, rencana personal, dan kemajuan yang mudah dipahami orang tua.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
