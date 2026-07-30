"use client";

import { useCallback, useEffect, useState } from "react";
import { publicListUpcomingEvents, type EventItem } from "@/lib/api/events";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { Highlights } from "@/components/landing/Highlights";
import { Recruiters } from "@/components/landing/Recruiters";
import { WhyRecruit } from "@/components/landing/WhyRecruit";
import { SuccessStories } from "@/components/landing/SuccessStories";
import { Process } from "@/components/landing/Process";
import { Training } from "@/components/landing/Training";
import { News } from "@/components/landing/News";
import { ContactCTA } from "@/components/landing/ContactCTA";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function LandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    publicListUpcomingEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const navigate = useCallback((id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-paper font-archivo text-ink antialiased">
      <SiteHeader onNavigate={navigate} />
      <main>
        <Hero onNavigate={navigate} />
        <Highlights />
        <Recruiters onNavigate={navigate} />
        <WhyRecruit />
        <SuccessStories />
        <Process />
        <Training />
        <News events={events} onNavigate={navigate} />
        <ContactCTA />
      </main>
      <SiteFooter onNavigate={navigate} />
    </div>
  );
}
