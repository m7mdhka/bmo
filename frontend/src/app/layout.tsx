import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BMO – Developer Workspace",
  description:
    "BMO is a local, Docker-run workspace that lets you create and manage projects from your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
