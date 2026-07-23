import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "GamerTrades — Retro Paper Trading",
  description: "Paper trading with a retro game style. Human vs AI. Real-time markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
