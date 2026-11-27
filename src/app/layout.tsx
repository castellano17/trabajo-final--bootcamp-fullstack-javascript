import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReseñIt",
  description: "Descubre taquerías, califícalas y comparte tus reseñas.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="es-MX"
      className={`${geist.variable} ${bricolageGrotesque.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider nonce={nonce}>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
