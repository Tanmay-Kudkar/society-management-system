import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import PublicSweepButton from "../../components/PublicSweepButton";
import clsx from "clsx";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSubmitted(false);
      }, 4000);
    }, 1500);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      value: "kudkartanmay25@gmail.com",
      description: "Owner and operator contact",
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+91 8104970317",
      description: "Owner and operator contact",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "Mumbai, India",
      description: "By Appointment only",
    },
    {
      icon: Clock,
      title: "Business Hours",
      value: "9:00 AM - 6:00 PM",
      description: "Monday to Saturday",
    },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">

        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[0.85rem] font-bold text-blue-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-blue-400">
            <MessageSquare className="h-4 w-4" />
            <span>Get in Touch</span>
          </span>
          <h1
            className="animate-fade-in-up mb-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            Contact{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Us
            </span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400"
            style={{ animationDelay: "200ms" }}
          >
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative z-10 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, i) => (
              <div
                key={i}
                className="animate-fade-in-up group flex flex-col items-center rounded-3xl border border-slate-200 bg-white px-2 py-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 sm:px-4 sm:py-8 lg:px-4 xl:px-6"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800/80 dark:text-slate-300 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                  <method.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-[#0f172a] dark:text-white">
                  {method.title}
                </h3>
                <p
                  className="mb-2 w-full max-w-[100%] text-[0.8rem] font-bold tracking-tight text-blue-600 break-all dark:text-blue-400 sm:text-[0.85rem] lg:text-[0.75rem] xl:text-[0.9rem]"
                  title={method.value}
                >
                  {method.value}
                </p>
                <p className="px-1 text-[0.85rem] leading-relaxed text-slate-500 dark:text-slate-400">
                  {method.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="relative z-10 px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <div
            className="animate-fade-in-up overflow-hidden rounded-3xl border-2 border-slate-300 bg-white p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none sm:p-12"
            style={{ animationDelay: "300ms" }}
          >
            <h2 className="mb-8 text-center text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Send us a Message
            </h2>

            {submitted ? (
              <div key="success" className="animate-scale-in py-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100/50 dark:bg-emerald-900/30">
                  <CheckCircle
                    className="animate-scale-in h-10 w-10 text-emerald-500"
                    style={{ animationDelay: "150ms" }}
                  />
                </div>
                <h3
                  className="animate-fade-in-up mb-3 text-2xl font-black text-slate-900 dark:text-white"
                  style={{ animationDelay: "250ms" }}
                >
                  Message Sent!
                </h3>
                <p
                  className="animate-fade-in-up text-lg text-slate-600 dark:text-slate-400"
                  style={{ animationDelay: "350ms" }}
                >
                  We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form
                key="form"
                onSubmit={handleSubmit}
                className="contact-form-no-ring animate-fade-in-up flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {[
                    {
                      label: "Your Name",
                      key: "name",
                      type: "text",
                      placeholder: "Your full name",
                    },
                    {
                      label: "Email Address",
                      key: "email",
                      type: "email",
                      placeholder: "name@example.com",
                    },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        required
                        value={formData[field.key]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.key]: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-300 ease-out placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-0 dark:border-slate-700 dark:bg-slate-800/80 focus:dark:bg-slate-900 dark:text-white"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-300 ease-out placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-0 dark:border-slate-700 dark:bg-slate-800/80 focus:dark:bg-slate-900 dark:text-white"
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full resize-none rounded-xl border-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-300 ease-out placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-0 dark:border-slate-700 dark:bg-slate-800/80 focus:dark:bg-slate-900 dark:text-white"
                    placeholder="Tell us more about your Inquiry..."
                  />
                </div>

                <PublicSweepButton
                  type="submit"
                  disabled={sending}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600"
                  sweepClassName="bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
                >
                  {sending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                      Send Message
                    </>
                  )}
                </PublicSweepButton>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
