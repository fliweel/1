import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Channel Agent – AV Industry Intelligence",
  description: "Market intelligence chatbot for the Audio Visual industry powered by survey data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
