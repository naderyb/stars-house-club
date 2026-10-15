import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import StorySection from "@/components/StorySection";
import ExploreGrid from "@/components/ExploreGrid";
import VisitStrip from "@/components/VisitStrip";

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <StorySection />
      <ExploreGrid />
      <VisitStrip />
    </main>
  );
}
