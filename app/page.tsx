import LandingHeader from "@/components/landing/header";
import LandingHero from "@/components/landing/hero";
import SocialProof from "@/components/landing/social-proof";
import ProductShowcase from "@/components/landing/product-showcase";
import HowItWorks from "@/components/landing/how-it-works";
import FeatureHighlights from "@/components/landing/feature-highlights";
import SecuritySection from "@/components/landing/security-section";
import PricingSection from "@/components/landing/pricing-section";
import FaqSection from "@/components/landing/faq-section";
import FinalCta from "@/components/landing/final-cta";
import LandingFooter from "@/components/landing/footer";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />

        <ScrollFadeIn delay={0}>
          <SocialProof />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0}>
          <ProductShowcase />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0.12}>
          <HowItWorks />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0}>
          <FeatureHighlights />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0.12}>
          <SecuritySection />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0}>
          <PricingSection />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0.12}>
          <FaqSection />
        </ScrollFadeIn>

        <ScrollFadeIn delay={0}>
          <FinalCta />
        </ScrollFadeIn>
      </main>
      <ScrollFadeIn direction="none">
        <LandingFooter />
      </ScrollFadeIn>
    </div>
  );
}
