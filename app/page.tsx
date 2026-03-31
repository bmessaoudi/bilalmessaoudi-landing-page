"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SectionDivider from "@/components/SectionDivider";
import Services from "@/components/Services";
import Ideas from "@/components/Ideas";
import Process from "@/components/Process";
import FooterCTA from "@/components/FooterCTA";

const SmoothScrollProvider = dynamic(
  () => import("@/components/SmoothScrollProvider"),
  { ssr: false }
);
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), {
  ssr: false,
});
const Manifesto = dynamic(() => import("@/components/Manifesto"), {
  ssr: false,
});

export default function Home() {
  return (
    <SmoothScrollProvider>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <SectionDivider />
      <Services />
      <SectionDivider />
      <Ideas />
      <Process />
      <Manifesto />
      <SectionDivider />
      <FooterCTA />
    </SmoothScrollProvider>
  );
}
