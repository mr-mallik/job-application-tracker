'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Briefcase,
  Sparkles,
  FileText,
  FileUser,
  ScrollText,
  Link2,
  BarChart3,
  Bell,
  Download,
  Shield,
  Zap,
  Target,
  ChevronRight,
  Check,
  Bot,
  Brain,
  LayoutDashboard,
  ArrowRight,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Application Dashboard',
    description:
      'Track every application in one place. Kanban-style pipeline from Saved through to Offer — never lose track of where you stand.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Link2,
    title: 'One-Click Job Scraping',
    description:
      'Paste a job URL from LinkedIn, Indeed, or any major board. JobTracker AI extracts the title, company, salary, requirements, and description automatically.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: FileUser,
    title: 'AI-Tailored CVs & Resumes',
    description:
      'Upload your existing CV or build your profile once. Gemini AI rewrites and restructures it to match each job description — ATS-optimised, UK-ready.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: FileText,
    title: 'AI Cover Letter Generator',
    description:
      'Industry-aware, seniority-adaptive cover letters written to UK conventions. Proper salutation rules, 1-page target, no hollow filler phrases.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: ScrollText,
    title: 'AI Supporting Statements',
    description:
      'Detects essential criteria automatically and writes STAR-format responses for each. Critical for public sector, academic, and executive roles.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Brain,
    title: 'Smart Document Editor',
    description:
      'Block-based rich text editor with real-time PDF preview. Edit AI output, customise layout, and export pixel-perfect PDFs in one click.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  },
  {
    icon: Bell,
    title: 'Application Reminders',
    description:
      'Set follow-up reminders per application so deadlines never slip by. Smart notifications keep your pipeline active.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Analytics',
    description:
      'Visualise your job search at a glance. See conversion rates across stages and understand where to focus your effort.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Export any document as a professional PDF instantly. Multiple templates — ATS Clean, Modern, Creative — all printer-ready.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Build your profile once',
    description:
      'Enter your experience, education, skills, and achievements. Or upload your existing CV — AI extracts everything automatically.',
  },
  {
    step: '02',
    title: 'Add a job in seconds',
    description:
      'Paste the job URL. AI scrapes the listing and fills in every field. Or add manually for roles without a URL.',
  },
  {
    step: '03',
    title: 'Generate tailored documents',
    description:
      'One click generates a CV, cover letter, and supporting statement — all tailored to that specific role and employer.',
  },
  {
    step: '04',
    title: 'Refine, export, apply',
    description:
      'Fine-tune in the rich text editor with live PDF preview. Export and apply. Track the outcome in your dashboard.',
  },
];

const faqs = [
  {
    q: 'Is JobTracker AI free?',
    a: 'Yes — create an account and track unlimited applications, generate AI documents, and export PDFs for free.',
  },
  {
    q: 'How does the AI avoid making things up?',
    a: 'JobTracker AI only uses information from your profile and the job description. It restructures and tailors your real experience — it never fabricates roles, achievements, or skills.',
  },
  {
    q: 'Which job boards can it scrape?',
    a: 'LinkedIn, Indeed, and most major job boards. Simply paste the URL and the details are extracted automatically.',
  },
  {
    q: 'Does it handle UK-style applications?',
    a: 'Designed for UK conventions by default — proper CV format (2-page target), British English, supporting statements for public sector roles, and correct cover letter salutations.',
  },
  {
    q: 'Can I edit the AI-generated documents?',
    a: 'Absolutely. Every document opens in a block-based editor with live PDF preview. You have full control before exporting.',
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/assets/logo/jobtracker-logo.png"
              alt="JobTracker AI"
              width={40}
              height={40}
              className="w-9 h-9"
              priority
            />
            <Image
              src="/assets/logo/jobtracker-text.png"
              alt="JobTracker AI"
              width={150}
              height={30}
              className="hidden sm:block h-7 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Button asChild size="sm" className="shadow-sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="shadow-sm">
                  <Link href="/auth/register">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
          {/* Background blobs */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-56 -left-56 w-[500px] h-[500px] rounded-full bg-blue-400/15 dark:bg-blue-600/10 blur-3xl" />
            <div className="absolute top-1/2 -right-64 w-[600px] h-[600px] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-400/10 dark:bg-violet-600/8 blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Powered by Google Gemini AI
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Your job search,{' '}
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                supercharged by AI
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
              Track every application, generate perfectly tailored CVs, cover letters, and
              supporting statements in seconds. Built for UK &amp; international job seekers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isLoggedIn ? (
                <Button
                  asChild
                  size="lg"
                  className="h-13 px-8 text-base shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="h-13 px-8 text-base shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Link href="/auth/register">
                      Start for free <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-13 px-8 text-base">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['Free to use', 'No credit card required', 'UK & international ready'].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section className="border-y bg-muted/30 py-6">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Google Gemini 2.5
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4 text-green-500" /> GDPR-compliant
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Zap className="w-4 h-4 text-amber-500" /> Documents in under 30s
              </span>
              <span className="flex items-center gap-2 font-medium">
                <Target className="w-4 h-4 text-blue-500" /> ATS-optimised output
              </span>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Everything you need to land the role
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Stop juggling spreadsheets, Word docs, and email threads. JobTracker AI brings your
                entire job search into one intelligent platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className="group hover:shadow-md transition-shadow border-border/60"
                >
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${f.bg} mb-4`}
                    >
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI SPOTLIGHT ── */}
        <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-violet-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-violet-950/20 border-y">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">
                AI that actually knows your industry
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                The AI doesn&apos;t just swap in keywords. It detects your industry, seniority
                level, and the employer&apos;s selection criteria — then adapts the tone, structure,
                and content accordingly. Marketing exec applications read nothing like graduate
                engineering submissions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  {
                    icon: Target,
                    label: 'Criteria detection',
                    desc: 'Identifies essential vs desirable criteria and addresses each explicitly',
                  },
                  {
                    icon: Sparkles,
                    label: 'Tone adaptation',
                    desc: 'Corporate, academic, creative, or public sector — the voice matches the role',
                  },
                  {
                    icon: Zap,
                    label: 'No fabrication',
                    desc: 'Only your real experience is used — restructured and tailored, never invented',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex gap-3 p-4 rounded-xl bg-background/70 border border-border/50"
                  >
                    <item.icon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                How it works
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                From job listing to application in minutes
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Four simple steps — from profile setup to hitting send.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Connector line (desktop) */}
              <div className="hidden lg:block absolute top-8 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-violet-500/30" />

              {howItWorks.map((step, i) => (
                <div key={step.step} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold shadow-md mb-5 relative z-10">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 sm:py-28 bg-muted/20 border-t">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Common questions
              </h2>
            </div>

            <div className="max-w-2xl mx-auto divide-y divide-border">
              {faqs.map((faq, i) => (
                <div key={i} className="py-5">
                  <button
                    className="w-full text-left flex justify-between items-start gap-4 group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span className="font-semibold text-base group-hover:text-primary transition-colors">
                      {faq.q}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform mt-0.5 ${openFaq === i ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 text-center text-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur mb-6">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to transform your job search?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Join thousands of job seekers using AI to stand out. Free forever, no card required.
            </p>
            {isLoggedIn ? (
              <Button
                asChild
                size="lg"
                className="h-13 px-10 text-base bg-white text-indigo-700 hover:bg-white/90 shadow-xl"
              >
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-13 px-10 text-base bg-white text-indigo-700 hover:bg-white/90 shadow-xl"
                >
                  <Link href="/auth/register">
                    Get started free <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-13 px-10 text-base border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-card/50 py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/assets/logo/jobtracker-logo.png"
                alt="JobTracker AI"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <Image
                src="/assets/logo/jobtracker-text.png"
                alt="JobTracker AI"
                width={120}
                height={24}
                className="h-6 w-auto hidden sm:block"
              />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} JobTracker AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
