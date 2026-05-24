import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navigation } from "@/components/layout/NavigationWrapper";
import { Footer } from "@/components/layout/Footer";
import { LogoIntro } from "@/components/layout/LogoIntro";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.transportactiongroup.com"),
  title: {
    default: "Transport Action Group | Enabling Green Freight Transformation",
    template: "%s | Transport Action Group",
  },
  description:
    "Transport Action Group creates the enabling environment for green freight transformation through action plans, strategic interventions, ecosystem alignment, and partner mobilisation — turning industry ambition into practical implementation momentum.",
  keywords: [
    "green freight",
    "transport action group",
    "TAG",
    "freight decarbonisation",
    "electric truck South Africa",
    "green freight action plan",
    "road freight transformation",
    "sustainable logistics",
    "green freight South Africa",
    "road freight sustainability",
    "fleet decarbonisation",
    "freight emissions reduction",
    "Abdool Kamdar",
    "green freight advisory",
    "DFI green freight",
    "electric truck Africa",
    "green freight Africa",
    "sustainable road freight",
  ],
  authors: [{ name: "Transport Action Group", url: "https://www.transportactiongroup.com" }],
  creator: "Transport Action Group",
  publisher: "Transport Action Group",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Transport Action Group",
    title: "Transport Action Group | Enabling Green Freight Transformation",
    description:
      "Creating the enabling environment for green freight transformation through action plans, strategic interventions, and ecosystem alignment.",
    url: "https://www.transportactiongroup.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Transport Action Group — Enabling Green Freight Transformation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transport Action Group | Enabling Green Freight Transformation",
    description:
      "Creating the enabling environment for green freight transformation through action plans, strategic interventions, and ecosystem alignment.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://www.transportactiongroup.com",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Transport Action Group",
  alternateName: "TAG",
  url: "https://www.transportactiongroup.com",
  logo: "https://www.transportactiongroup.com/tag-logo.png",
  description:
    "Transport Action Group creates the enabling environment for green freight transformation in South Africa and Africa through action plans, strategic interventions, ecosystem alignment, and partner mobilisation.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ZA",
  },
  sameAs: [
    "https://www.linkedin.com/company/transport-action-group",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Transport Action Group",
  url: "https://www.transportactiongroup.com",
  description:
    "The enabling environment platform for green freight transformation in South Africa and Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <LogoIntro logoSrc="/tag-logo.png" />
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
