import { useNavigate } from "react-router-dom";
import {
  Target,
  Heart,
  Zap,
  Shield,
  Globe,
  Award,
  ArrowRight,
  Building2,
  Mail,
  Phone,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import PublicSweepButton from "../../components/PublicSweepButton";

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: "Community First",
      description:
        "We believe in building strong communities through technology and innovation.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description:
        "Constantly evolving to meet the needs of modern housing societies.",
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Your data security is our top priority with enterprise-grade protection.",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description:
        "Making society management accessible to everyone, everywhere.",
    },
  ];

  const stats = [
    { value: "500+", label: "Societies", color: "var(--accent-primary)" },
    { value: "50K+", label: "Residents", color: "var(--accent-secondary)" },
    { value: "99.9%", label: "Uptime", color: "#3b82f6" },
    { value: "24/7", label: "Support", color: "#22c55e" },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-20">

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2">
            <Target
              className="h-4 w-4"
              style={{ color: "var(--accent-primary)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              Our Mission
            </span>
          </div>
          <h1
            className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]"
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-[var(--text-primary)]">Empowering </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
              }}
            >
              Communities
            </span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.15rem] text-[var(--text-secondary)]"
            style={{ animationDelay: "200ms" }}
          >
            SocietyHub is a digital society management platform designed to
            simplify the day-to-day operations of residential societies and
            housing communities.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[var(--bg-primary)] px-4 py-16 sm:py-[4.75rem]">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-slide-in-left">
              <h2 className="mb-6 text-3xl font-extrabold text-[var(--text-primary)]">
                Our Story
              </h2>
              <div className="flex flex-col gap-4 leading-7 text-[var(--text-secondary)]">
                <p>
                  The platform brings resident management, maintenance
                  management, payments, notices, complaints, facilities,
                  vendors, and other society operations together in one
                  centralized system.
                </p>
                <p>
                  SocietyHub is developed and operated by Tanmay Vijay Kudkar.
                  The focus is to deliver a reliable, secure, and scalable SaaS
                  platform for modern community management.
                </p>
              </div>
            </div>
            <div className="animate-slide-in-right rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_5%,var(--bg-primary))] p-8">
              <div className="stagger-children grid grid-cols-2 gap-6 text-center">
                {stats.map((s, i) => (
                  <div key={i}>
                    <div
                      className="text-4xl font-black"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-4xl font-[900] tracking-tight text-[var(--text-primary)] md:text-5xl">
              Our Values
            </h2>
            <p className="mx-auto max-w-[40rem] text-[1.125rem] text-[color-mix(in_srgb,var(--text-primary)_72%,var(--text-secondary))]">
              The core principles that drive our innovation and define our
              commitment to your community.
            </p>
          </div>
          <div className="stagger-children grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border-light)] bg-[var(--bg-card)] p-8 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-[color-mix(in_srgb,var(--accent-primary)_40%,var(--border-default))] hover:shadow-[0_40px_80px_-20px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--accent-primary)_5%,transparent)] transition-transform duration-700 group-hover:scale-150" />

                <div
                  className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))`,
                  }}
                >
                  <value.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="relative z-10 mb-3 text-2xl font-[900] tracking-tight text-[var(--text-primary)]">
                  {value.title}
                </h3>
                <p className="relative z-10 text-[1.05rem] leading-relaxed text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ownership */}
      <section className="bg-[var(--bg-primary)] px-4 pb-8 pt-14 sm:pb-9 sm:pt-[4.5rem]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2">
              <Building2
                className="h-4 w-4"
                style={{ color: "var(--accent-primary)" }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--accent-primary)" }}
              >
                Ownership
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
              SocietyHub Ownership & Operations
            </h2>
          </div>
          <div className="mx-auto max-w-[760px] rounded-[1.35rem] border border-[color-mix(in_srgb,var(--accent-primary)_22%,var(--border-default))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--bg-card)_92%,var(--accent-primary)_8%)_0%,color-mix(in_srgb,var(--bg-card)_98%,transparent)_100%)] px-7 pb-8 pt-7 text-center shadow-[0_14px_32px_color-mix(in_srgb,var(--accent-primary)_14%,transparent)]">
            <h3 className="mb-2 text-[2rem] font-extrabold leading-[1.16] tracking-[-0.012em] text-[var(--text-primary)]">
              Tanmay Vijay Kudkar
            </h3>
            <p className="mb-6 inline-flex min-h-[2.4rem] items-center rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] px-4 text-center text-[0.98rem] font-semibold leading-[1.3] text-[color-mix(in_srgb,var(--text-primary)_82%,var(--text-secondary))]">
              Developed and operated by Tanmay Vijay Kudkar
            </p>

            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 text-left">
              <a
                href="mailto:kudkartanmay25@gmail.com"
                className="inline-flex items-center gap-2 text-[0.98rem] font-semibold text-[var(--text-primary)] no-underline hover:underline"
              >
                <Mail className="h-4 w-4" />
                kudkartanmay25@gmail.com
              </a>
              <a
                href="tel:+918104970317"
                className="inline-flex items-center gap-2 text-[0.98rem] font-semibold text-[var(--text-primary)] no-underline hover:underline"
              >
                <Phone className="h-4 w-4" />
                +91 8104970317
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 pt-10 sm:pb-24 sm:pt-14">
        <div className="mx-auto max-w-5xl text-center">
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border-default))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_24%,var(--bg-card))_0%,color-mix(in_srgb,var(--bg-card)_96%,transparent)_100%)] px-10 py-16 shadow-[0_32px_64px_-16px_color-mix(in_srgb,var(--accent-primary)_18%,transparent)] transition-all duration-500 hover:shadow-[0_48px_80px_-20px_color-mix(in_srgb,var(--accent-primary)_24%,transparent)]">
            {/* Atmospheric background */}
            <div
              className="absolute inset-0 opacity-[0.4] dark:opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(59,130,246,0.15) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            {/* Top Right Corner Circle */}
            <div className="pointer-events-none absolute -right-[150px] -top-[150px] h-[350px] w-[350px] rounded-full bg-blue-400/20 dark:bg-blue-500/20 mix-blend-multiply dark:mix-blend-screen transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.4]" />
            {/* Bottom Left Corner Circle */}
            <div className="pointer-events-none absolute -bottom-[150px] -left-[150px] h-[350px] w-[350px] rounded-full bg-sky-400/25 dark:bg-cyan-500/20 mix-blend-multiply dark:mix-blend-screen transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.4]" />


            <div className="relative z-[1]">
              <div className="mx-auto mb-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#facc15_0%,#eab308_100%)] shadow-[0_12px_24px_rgba(234,179,8,0.35)] transition-transform duration-500 will-change-transform group-hover:scale-110">
                <Award className="h-10 w-10 text-white" />
              </div>

              <h2 className="mb-4 text-[clamp(2.2rem,4.5vw,3rem)] font-[900] leading-[1.1] tracking-tight text-[var(--text-primary)]">
                Ready to{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--accent-primary), var(--accent-secondary))`,
                  }}
                >
                  Transform
                </span>{" "}
                Your Society?
              </h2>

              <p className="mx-auto mb-10 max-w-[38rem] text-[1.25rem] font-medium leading-[1.5] text-[color-mix(in_srgb,var(--text-primary)_75%,var(--text-secondary))]">
                Join 500+ forward-thinking communities already using SocietyHub
                to simplify their daily operations.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <PublicSweepButton
                  onClick={() => navigate("/login")}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-10 text-[1.1rem] font-bold text-white transition-all duration-300 hover:bg-[var(--accent-secondary)] hover:shadow-[0_12px_24px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] active:scale-95"
                >
                  Get Started Now
                  <ArrowRight className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                </PublicSweepButton>

                <button
                  onClick={() => navigate("/pricing")}
                  className="flex h-14 items-center justify-center rounded-2xl border-2 border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-transparent px-10 text-[1.1rem] font-bold text-[var(--text-primary)] transition-all duration-300 hover:border-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] active:scale-95"
                >
                  View Pricing
                </button>
              </div>

              <div className="mt-10 flex items-center justify-center gap-8 border-t border-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] pt-8 opacity-70">
                <div className="text-center">
                  <div className="text-xl font-black text-[var(--text-primary)]">
                    14-Day
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Free Trial
                  </div>
                </div>
                <div className="h-8 w-px bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]" />
                <div className="text-center">
                  <div className="text-xl font-black text-[var(--text-primary)]">
                    24/7
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Expert Support
                  </div>
                </div>
                <div className="h-8 w-px bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]" />
                <div className="text-center">
                  <div className="text-xl font-black text-[var(--text-primary)]">
                    99.9%
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Uptime
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
