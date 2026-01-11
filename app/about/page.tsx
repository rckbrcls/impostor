import { Metadata } from "next";

import { MeshGradientOptions } from "@mesh-gradient/core";

import { MeshGradient } from "@mesh-gradient/react";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how to play Duplizen, the ultimate social deduction party game. Discover the rules, gameplay mechanics, and tips to find the impostor!",
  openGraph: {
    title: "About Duplizen - How to Play",
    description:
      "Learn how to play Duplizen, the ultimate social deduction party game.",
  },
};

export default function AboutPage() {

  const options: MeshGradientOptions = {
    colors: ["#F335AD", "#967FE6", "#23B684", "#0F595E"],
  };

  return (
    <div className="h-screen">
      <MeshGradient options={options} className="w-full h-screen fixed -z-10" />
      <AboutContent />
    </div>
  );
}
