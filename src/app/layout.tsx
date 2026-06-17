import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QM Order Request",
  description: "Submit Amazon order requests for your department",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}