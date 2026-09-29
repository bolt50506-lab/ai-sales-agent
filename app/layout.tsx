import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI Sales Agent", description: "AI sales intelligence and outreach platform" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }