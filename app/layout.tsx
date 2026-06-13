import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BetterDriver — The driver development portal",
    template: "%s | BetterDriver",
  },
  description:
    "BetterDriver is where professional truck drivers enrol in training, complete programmes, earn certification, and build their professional record.",
  keywords: [
    "truck driver training",
    "professional driver certification",
    "eco-driving",
    "driver development",
    "South Africa",
    "road freight",
  ],
  openGraph: {
    type: "website",
    siteName: "BetterDriver",
    title: "BetterDriver — The driver development portal",
    description:
      "Enrol in professional training, complete your programme, earn certification, and build your professional record.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
