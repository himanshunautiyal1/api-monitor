import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Monitor — Keep your APIs alive",
  description:
    "Real-time API monitoring with instant alerts, response time tracking, and public status pages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
