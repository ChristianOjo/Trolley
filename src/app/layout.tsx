import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trolley — Food Delivery in Eswatini",
  description:
    "Order from Mbabane and Manzini's best restaurants. Pay with MTN MoMo or card.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://trolley.sz"),
  openGraph: {
    title: "Trolley",
    description: "Food delivery in Eswatini",
    siteName: "Trolley",
  },
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
