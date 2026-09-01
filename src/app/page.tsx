import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import Collections from "@/components/home/Collections";
import MonthSpotlight from "@/components/home/MonthSpotlight";
import RegionsGrid from "@/components/home/RegionsGrid";
import FeaturedTrips from "@/components/home/FeaturedTrips";
import PlatformBand from "@/components/home/PlatformBand";
import WhyUs from "@/components/home/WhyUs";
import Team from "@/components/home/Team";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CtaBand from "@/components/home/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Collections />
      <MonthSpotlight />
      <RegionsGrid />
      <FeaturedTrips />
      <PlatformBand />
      <WhyUs />
      <Team />
      <HowItWorks />
      <Testimonials />
      <CtaBand />
    </>
  );
}
