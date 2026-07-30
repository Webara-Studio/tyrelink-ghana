"use client";

import { JourneyProvider } from "@/features/journey/journey-context";
import { Header, JourneyRouter, SiteFooter } from "./screens";

export function CustomerJourney() {
  return <JourneyProvider><Header /><JourneyRouter /><SiteFooter /></JourneyProvider>;
}
