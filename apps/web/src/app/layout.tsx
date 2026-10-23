import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Nav } from "@/components/nav";
import { Palette } from "@/components/palette";
import { UIProvider } from "@/lib/ui-provider";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display-var", weight: ["400", "500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-var" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-var" });

export const metadata: Metadata = {
  title: "sangamora — the widest experience one prompt can build",
  description:
    "A deterministic, zero-API-key simulation of the Kumbh Mela: 5.2 million pilgrims, 24 sectors, 54 edges, 3 shahi snan, an emergent bazaar, marshals and a time machine.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "sangamora — the widest experience one prompt can build",
    description: "5.2M pilgrims. 24 sectors. 3 shahi snan. Zero API keys.",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UIProvider>
          <Nav />
          <Palette />
          <main className="flex-1">{children}</main>
        </UIProvider>
      </body>
    </html>
  );
}