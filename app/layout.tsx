import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voyce",
  description: "AV Channel Analytics Dashboard",
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
