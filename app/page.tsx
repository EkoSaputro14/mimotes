import Link from "next/link";
import {
  Bot,
  MessageSquare,
  FileText,
  Upload,
  Search,
  Users,
  BarChart3,
  Shield,
  Lock,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Zap,
  Globe,
  Clock,
} from "lucide-react";

/* ================================================================
   MimoNotes Landing Page V2
   Design: Warm-purple 265° · Geist Sans · Premium SaaS
   Zero emojis · V2 design tokens · Mobile-first
   ================================================================ */

/* ---- FAQ Data ---- */
const faqItems = [
  {
    q: "What types of documents can I upload?",
    a: "MimoNotes supports PDF, DOCX, TXT, CSV, XLSX, and website URLs. Our parser handles each format automatically — just drag and drop.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your documents are never used to train AI models. We support self-hosted deployment for maximum control.",
  },
  {
    q: "Can I use my own AI model?",
    a: "Yes. MimoNotes supports OpenAI, Ollama, LM Studio, and any OpenAI-compatible API. You control which model powers your knowledge base.",
  },
  {
    q: "How does source attribution work?",
    a: "Every answer links back to the exact document, page, and paragraph it was sourced from. You can verify any claim instantly — no hallucinations, no guessing.",
  },
  {
    q: "Do you offer a free plan?",
    a: "The Free plan is yours forever — no credit card required. Upload up to 50 documents and get unlimited chat. When you need more, upgrade to Pro for $19/month.",
  },
  {
    q: "What integrations do you support?",
    a: "MimoNotes offers a REST API and embeddable widget for custom integrations. We are building Slack, Notion, and Google Drive connectors.",
  },
];

/* ---- Features Data ---- */
const features = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Ask questions in natural language. Get precise answers in seconds.",
    detail: "No special syntax, no search operators. Just ask like you would ask a colleague.",
  },
  {
    icon: FileText,
    title: "Knowledge Base",
    description: "Upload any document. MimoNotes indexes everything automatically.",
    detail: "PDF, DOCX, TXT, CSV, URLs — we parse, chunk, and embed everything for you.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Shared knowledge base for your whole team.",
    detail: "Invite teammates, share documents, and ensure everyone gets the same accurate answers.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Know what questions get asked. Track cost. Improve.",
    detail: "See which documents are most referenced. Identify knowledge gaps in your documentation.",
  },
];

/* ---- Steps Data ---- */
const steps = [
  {
    number: "1",
    icon: Upload,
    title: "Upload your documents",
    description:
      "Drag and drop PDFs, Word docs, text files, or paste a URL. MimoNotes indexes everything in seconds.",
  },
  {
    number: "2",
    icon: MessageSquare,
    title: "Ask questions naturally",
    description:
      "Type whatever you want to know. No special syntax. Just ask like you would ask a colleague.",
  },
  {
    number: "3",
    icon: CheckCircle2,
    title: "Get answers with sources",
    description:
      "Receive precise answers that cite their exact source — the document, the page, the paragraph.",
  },
];

/* ================================================================ */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ========== NAVIGATION ========== */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">MimoNotes</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Security
            </a>
            <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Log In
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Start Free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ========== HERO ========== */}
        <section className="relative overflow-hidden">
          {/* Subtle radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.58 0.17 265 / 0.08), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Your knowledge base,
                <br />
                <span className="text-primary">instantly accessible.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Upload your documents and get precise, sourced answers in
                seconds — not hours of searching.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/80 hover:shadow-primary/30"
                >
                  Start Free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  View Demo
                </Link>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Free for up to 50 documents &middot; No credit card required &middot; Set up in 2 minutes
              </p>
            </div>

            {/* Product screenshot placeholder */}
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <div className="size-3 rounded-full bg-muted" />
                  <div className="size-3 rounded-full bg-muted" />
                  <div className="size-3 rounded-full bg-muted" />
                  <span className="ml-2 text-xs text-muted-foreground">MimoNotes</span>
                </div>
                <div className="flex min-h-[300px] sm:min-h-[400px]">
                  {/* Sidebar mockup */}
                  <div className="hidden w-48 border-r border-border p-4 sm:block">
                    <div className="mb-3 text-xs font-medium text-muted-foreground">Documents</div>
                    {["Employee Handbook", "Q4 Report", "API Docs", "Onboarding"].map((doc) => (
                      <div
                        key={doc}
                        className="mb-1.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground"
                      >
                        <FileText className="size-3.5 shrink-0" />
                        {doc}
                      </div>
                    ))}
                  </div>
                  {/* Chat mockup */}
                  <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="mb-4 max-w-md rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                      What is our vacation policy?
                    </div>
                    <div className="max-w-lg rounded-xl bg-primary/10 px-4 py-3 text-sm leading-relaxed">
                      <p className="mb-2">
                        Full-time employees are entitled to 20 days of paid
                        vacation per year. Vacation must be requested at least
                        2 weeks in advance through the HR portal.
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="size-3" />
                        Source: Employee Handbook, Section 4.2
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SOCIAL PROOF ========== */}
        <section className="border-y border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Trusted by teams who take knowledge seriously
            </p>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { value: "500+", label: "Teams" },
                { value: "4.8/5", label: "Rating" },
                { value: "99.9%", label: "Uptime" },
                { value: "10k+", label: "Questions Answered" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CORE FEATURES ========== */}
        <section id="features" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need,
                <br />
                nothing you don&apos;t.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built for teams who want answers, not another tool to manage.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-border bg-card p-8 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    <p className="mt-3 text-sm text-muted-foreground/70">{feature.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section id="how-it-works" className="border-y border-border bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three steps. That&apos;s it.
              </p>
            </div>

            <div className="relative mt-16">
              {/* Connecting line (desktop) */}
              <div className="absolute left-0 right-0 top-6 hidden h-px bg-border sm:block" />

              <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="relative text-center">
                      {/* Step number circle */}
                      <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
                        {step.number}
                      </div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  Start Free
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SECURITY ========== */}
        <section id="security" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your data, your control.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Enterprise-grade security built in from day one.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "Encrypted at Rest",
                  description:
                    "AES-256 encryption for all stored documents and embeddings. Your data is locked down.",
                },
                {
                  icon: Shield,
                  title: "Self-Hosted Option",
                  description:
                    "Deploy on your own infrastructure. Full control over your data, no third-party access.",
                },
                {
                  icon: Globe,
                  title: "No Training on Your Data",
                  description:
                    "Your documents are never used to train AI models. Your knowledge stays yours.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="text-center">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========== TEAM COLLABORATION ========== */}
        <section className="border-y border-border bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Built for teams,
                  <br />
                  not just individuals.
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Invite your team. Share a knowledge base. Everyone gets the
                  same accurate answers from the same source of truth.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Shared workspace with role-based access",
                    "Invite members via email",
                    "Collaborative document management",
                    "Usage analytics per team member",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
                  >
                    Start Free
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* Team UI mockup */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">Team Workspace</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    4 members
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Sarah Chen", role: "Admin", initials: "SC" },
                    { name: "Marcus Rivera", role: "Member", initials: "MR" },
                    { name: "Priya Sharma", role: "Member", initials: "PS" },
                    { name: "Alex Kim", role: "Viewer", initials: "AK" },
                  ].map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{member.name}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <section id="faq" className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked questions.
              </h2>
            </div>

            <div className="mt-12 divide-y divide-border">
              {faqItems.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="relative overflow-hidden border-y border-border py-20 sm:py-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 50%, oklch(0.58 0.17 265 / 0.06), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stop searching.
              <br />
              Start knowing.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Join teams using MimoNotes to turn their documents into instant
              knowledge.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/80 hover:shadow-primary/30"
              >
                Start Free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-5" />
                </div>
                <span className="text-lg font-semibold tracking-tight">MimoNotes</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Your knowledge base, instantly accessible.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Product
              </h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Docs", "Status"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Company
              </h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Legal
              </h4>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MimoNotes. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
