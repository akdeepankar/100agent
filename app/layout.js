import { Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MyApp - Landing Page",
  description: "A beautiful landing page built with HeroUI components",
};

export default function RootLayout({ children }) {
  return (
    <html className="light" lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
