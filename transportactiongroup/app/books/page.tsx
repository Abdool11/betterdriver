import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Publications | Transport Action Group",
  description: "Books, conference papers, and published articles by Abdool Kamdar — covering green freight, road freight sustainability, electric truck transition, and professional driver development.",
};

const BOOKS = [
  {
    title: "The Professional Truck Driver's Handbook",
    subtitle: "2026 Edition — with Electric Truck Chapter",
    author: "Abdool Kamdar and Nicci Scott-Anderson",
    description:
      "A comprehensive step-by-step guide to professional excellence in road freight. Covers the full range of knowledge and skills required for professional drivers — from road safety and vehicle management through to eco-driving, cargo handling, and the emerging requirements of electric truck operation. The 2026 edition includes a new chapter on electric trucks. Foreword by Dr. John Deng Diar Diing, Executive Secretary, Northern Corridor Transit and Transport Coordination Authority (NCTTCA).",
    image: "/book-truck-driver-handbook-2026.webp",
    year: "2026",
  },
  {
    title: "Road Freight Sustainability 4.0",
    subtitle: "Reducing CO₂ Emissions While Improving Profit — South African Edition",
    author: "A K Kamdar",
    description:
      "A practical guide for South African fleet operators and freight managers on how to reduce emissions while simultaneously improving operational profitability. Covers the full sustainability toolkit — from driver behaviour and eco-driving to telematics, target-setting, and green procurement. Demonstrates that a green fleet is a more profitable fleet.",
    image: "/book-road-freight-sustainability.png",
    year: "2020",
  },
  {
    title: "Driving Profit with Power",
    subtitle: "Making the electric transition work for you",
    author: "Abdool Kamdar",
    description:
      "A practical guide to making the transition to electric trucks commercially viable. Covers total cost of ownership analysis, route and duty-cycle assessment, charging pathway selection, battery swapping, fleet transition planning, and the operational and management skills required to run a profitable electric fleet. Built on the principle that the electric transition must be predicated on achieving the same or better profit performance than diesel.",
    image: "/book-driving-profit-with-power.png",
    year: "2026",
  },
];

const PAPERS = [
  {
    title: "Decarbonisation of Road Freight: Electrification of Heavy Vehicles",
    venue: "EVIA — Expert's Opinion",
    year: "2018",
    summary:
      "An early published article examining the role of electric heavy vehicles in freight decarbonisation, including transition constraints, infrastructure questions, and the long-term logic of electrification in road freight. Based on a presentation at the Electric Vehicle Industry Association Conference at Nelson Mandela University in 2018.",
  },
  {
    title: "Perceptions of the Road Transport Management System (RTMS): Promoting Voluntary Certification",
    venue: "SATC Conference Paper",
    year: "2017",
    summary:
      "A conference paper examining stakeholder perceptions of RTMS and the role of voluntary certification in improving safety, compliance, and operational performance in road freight.",
  },
  {
    title: "Ultracapacitor Kinetic Energy Recovery Systems in Road Transport Vehicles: Is it a Viable Retrofit Option for Reducing Fuel Consumption and CO₂ Emissions?",
    venue: "SATC Conference Paper",
    year: "2017",
    summary:
      "A conference paper exploring retrofit energy-recovery options for reducing fuel consumption and CO₂ emissions in road transport operations.",
  },
  {
    title: "Operational Improvement Outcomes through Voluntary Compliance in Road Transport Operations",
    venue: "IEOM Conference Proceedings",
    year: "2018",
    summary:
      "A conference paper focused on operational improvement and voluntary compliance in road transport operations, examining the measurable outcomes of structured compliance programmes.",
  },
];

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">

        <div className="mb-16">
          <h1 className="mb-6">Publications</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            Books, conference papers, and published articles by Abdool Kamdar — covering green freight transformation, road freight sustainability, electric truck transition, and professional driver development.
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-semibold mb-10">Books</h2>
          <div className="flex flex-col gap-14">
            {BOOKS.map(({ title, subtitle, author, description, image, year }) => (
              <div key={title} className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-shrink-0 w-36 sm:w-44">
                  <div className="rounded-lg overflow-hidden shadow-lg border border-border/30">
                    <Image
                      src={image}
                      alt={title}
                      width={176}
                      height={248}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{year}</p>
                  <h3 className="text-xl font-semibold mb-1 leading-snug">{title}</h3>
                  {subtitle && (
                    <p className="text-sm text-primary font-medium mb-2">{subtitle}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3 italic">{author}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-2">Conference Papers and Published Articles</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-2xl">
            A selection of peer-reviewed and published academic contributions on road freight, sustainability, and electrification.
          </p>
          <div className="flex flex-col gap-4">
            {PAPERS.map(({ title, venue, year, summary }) => (
              <div key={title} className="card p-5 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={15} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-primary">{venue}</span>
                    <span className="text-xs text-muted-foreground">{year}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1 leading-snug">{title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Get in touch</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            For enquiries about books, speaking engagements, or research collaboration, contact us directly.
          </p>
          <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
            Contact TAG <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
