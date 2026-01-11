"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/stores/language-store";
import {
  Gamepad2,
  Users,
  Eye,
  Vote,
  Trophy,
  ArrowLeft,
  MessageCircle,
  Search,
  UserX,
} from "lucide-react";

export function AboutContent() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Users,
      title: t("about.step1_title"),
      desc: t("about.step1_desc"),
    },
    {
      icon: Eye,
      title: t("about.step2_title"),
      desc: t("about.step2_desc"),
    },
    {
      icon: MessageCircle,
      title: t("about.step3_title"),
      desc: t("about.step3_desc"),
    },
    {
      icon: Vote,
      title: t("about.step4_title"),
      desc: t("about.step4_desc"),
    },
  ];

  const features = [
    {
      icon: Search,
      title: t("about.feature1_title"),
      desc: t("about.feature1_desc"),
    },
    {
      icon: UserX,
      title: t("about.feature2_title"),
      desc: t("about.feature2_desc"),
    },
    {
      icon: Trophy,
      title: t("about.feature3_title"),
      desc: t("about.feature3_desc"),
    },
  ];

  return (
    <main className="min-h-full p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <Image
            src="/assets/impostor.png"
            alt="Duplizen"
            width={150}
            height={150}
            className="mx-auto"
          />
          <h1 className="text-4xl font-bold text-white">{t("about.title")}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>

        {/* What is Duplizen */}
        <Card className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              {t("about.what_is_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("about.what_is_desc")}</p>
          </CardContent>
        </Card>

        {/* How to Play */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {t("about.how_to_play")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <step.icon className="h-5 w-5" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {t("about.features_title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-center"
              >
                <CardHeader className="pb-2">
                  <feature.icon className="h-10 w-10 mx-auto text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-bold text-white">{t("about.cta_title")}</h2>
          <Link href="/create">
            <Button size="lg" className="h-14 text-lg">
              <Gamepad2 className="mr-2 h-5 w-5" />
              {t("home.create_room")}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
