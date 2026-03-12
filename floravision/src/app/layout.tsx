import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FloraVision",
  description: "Modern floral POS and operations platform prototype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
