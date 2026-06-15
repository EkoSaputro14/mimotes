"use client";

import { Pricing } from "@/components/ui/pricing";

const mimotesPlans = [
  {
    name: "STARTER",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Up to 50 documents",
      "Unlimited chat messages",
      "1 workspace",
      "Source citations",
      "PDF, DOCX, TXT support",
      "Community support",
    ],
    description: "Perfect for individuals trying out MimoNotes",
    buttonText: "Start Free",
    href: "/register",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "29",
    yearlyPrice: "23",
    period: "per month",
    features: [
      "Up to 500 documents",
      "Unlimited chat messages",
      "5 workspaces",
      "Team collaboration",
      "API access",
      "Priority support",
      "Advanced analytics",
      "Custom AI models",
    ],
    description: "Ideal for growing teams and businesses",
    buttonText: "Get Started",
    href: "/register",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    features: [
      "Unlimited documents",
      "Unlimited workspaces",
      "SSO Authentication",
      "Dedicated account manager",
      "Custom integrations",
      "SLA agreement",
      "Advanced security",
      "On-premise deployment",
    ],
    description: "For large organizations with specific needs",
    buttonText: "Contact Sales",
    href: "/register",
    isPopular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-16 sm:py-24">
      <Pricing
        plans={mimotesPlans}
        title="Plans for every team size"
        description="Start free with 50 documents. Upgrade when you need more capacity, team features, or dedicated support."
      />
    </section>
  );
}
