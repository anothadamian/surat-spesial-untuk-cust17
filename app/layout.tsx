import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Untuk Felicia · Maafkan Aku, Cintaku",
  description: "Sebuah surat kecil untuk Felicia.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
