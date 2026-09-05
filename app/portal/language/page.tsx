import { Metadata } from "next";
import LanguageSelectClient from "./LanguageSelectClient";

export const metadata: Metadata = { title: "Choose your language | BetterDriver" };

export default function LanguageSelectPage() {
  return <LanguageSelectClient />;
}
