import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Mail, Phone } from 'lucide-react';
import clsx from 'clsx'; // even if not strictly needed, nice to have

import googlePlayBtn from '../assets/icons/Get-it-on-Google-Play.svg';
import appStoreBtn from '../assets/icons/Download-on-app-store.svg';
import twitterIcon from '../assets/icons/twitter-logo.svg';
import youtubeIcon from '../assets/icons/youtube.svg';
import linkedinIcon from '../assets/icons/linkedin.svg';
import githubIcon from '../assets/icons/github.svg';

export default function PublicFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  const footerSocialLinks = [
    { iconSrc: twitterIcon, href: '#', label: 'X' },
    { iconSrc: youtubeIcon, href: '#', label: 'YouTube' },
    { iconSrc: linkedinIcon, href: '#', label: 'LinkedIn' },
    { iconSrc: githubIcon, href: '#', label: 'GitHub' },
  ];

  const handleScroll = (id) => {
    if (location.pathname !== '/') {
      // If we are not on the homepage, navigate to the homepage with a hash
      navigate('/#' + id);
      // Wait for navigation to finish before attempting to scroll
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="contact"
      className="scroll-mt-28 border-t border-[#e2e8f0] bg-[#f6f9fc] px-4 py-14 text-[#0f172a] transition-colors duration-300 sm:px-6 sm:py-16 dark:border-slate-800/80 dark:bg-[#0b1120] dark:text-white"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid items-start gap-x-8 gap-y-12 lg:grid-cols-[1.4fr_0.9fr_1.3fr_1.1fr_1.1fr] md:grid-cols-3 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#1d4ed8] text-white">
                <Building2 size={22} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-[900] tracking-tight text-[#0f172a] dark:text-white">
                  SocietyHub
                </span>
                <span className="text-[0.75rem] font-[800] text-[#334155] dark:text-slate-400">
                  By SocietyHub Technologies
                </span>
              </div>
            </div>
            <p className="max-w-[280px] text-[0.95rem] font-medium leading-[1.65] text-[#334155] dark:text-slate-300">
              SocietyHub is aimed at making life in your residential society
              easy and secure. Manage visitor access, domestic help and
              services, and much more.
            </p>
          </div>

          {[
            {
              title: "COMPANY",
              links: [
                { label: "About Us", action: () => navigate("/about") },
                { label: "Pricing", action: () => navigate("/pricing") },
                { label: "Contact Us", action: () => navigate("/contact") },
                { label: "Request Demo", action: () => navigate("/demo") },
                {
                  label: "Privacy Policy",
                  action: () => navigate("/privacy"),
                },
                {
                  label: "Terms & Conditions",
                  action: () => navigate("/terms"),
                },
                { label: "Help Center", action: () => navigate("/help") },
              ],
            },
            {
              title: "SOLUTION",
              links: [
                {
                  label: "Society Accounting System",
                  action: () => handleScroll("features"),
                },
                {
                  label: "Society Management System",
                  action: () => handleScroll("features"),
                },
                {
                  label: "Apartment Management Software",
                  action: () => handleScroll("features"),
                },
                {
                  label: "Visitor Management System",
                  action: () => handleScroll("features"),
                },
                {
                  label: "Parking Management System",
                  action: () => handleScroll("features"),
                },
                {
                  label: "Housing Society",
                  action: () => handleScroll("features"),
                },
              ],
            },
          ].map((g, i) => (
            <div key={i} className="flex min-w-0 flex-col gap-4">
              <h4 className="text-[0.8rem] font-[900] tracking-[0.05em] text-[#0f172a] dark:text-white">
                {g.title}
              </h4>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {g.links.map((l, j) => (
                  <li key={j}>
                    <button
                      onClick={l.action}
                      className="no-sweep border-none bg-transparent p-0 text-left text-[0.95rem] font-bold text-[#475569] no-underline transition-colors hover:text-[#0f172a] hover:underline hover:underline-offset-2 dark:text-slate-300 dark:hover:text-white"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex min-w-0 flex-col gap-4">
            <h4 className="text-[0.8rem] font-[900] tracking-[0.05em] text-[#0f172a] dark:text-white">
              CONTACT US
            </h4>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              <li>
                <a
                  href="mailto:assist@societyhub.com"
                  className="group inline-flex items-center gap-2 break-all text-[0.95rem] font-bold text-[#475569] no-underline transition-colors hover:text-[#0f172a] dark:text-slate-300 dark:hover:text-white"
                >
                  <Mail size={18} className="stroke-[2.5] text-[#334155] transition-colors group-hover:text-[#0f172a] dark:text-slate-400 dark:group-hover:text-white" />
                  assist@societyhub.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+919119300000"
                  className="group inline-flex items-center gap-2 break-all text-[0.95rem] font-bold text-[#475569] no-underline transition-colors hover:text-[#0f172a] dark:text-slate-300 dark:hover:text-white"
                >
                  <Phone size={18} className="stroke-[2.5] text-[#334155] transition-colors group-hover:text-[#0f172a] dark:text-slate-400 dark:group-hover:text-white" />
                  +91 91193 00000
                </a>
              </li>
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <h4 className="text-[0.8rem] font-[900] tracking-[0.05em] text-[#0f172a] dark:text-white">
              GET THE MOBILE APP
            </h4>
            <div className="flex flex-col gap-3">
              <a href="https://play.google.com/store/apps" target="_blank" rel="noreferrer" className="inline-block w-fit transition-shadow hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] dark:hover:drop-shadow-[0_4px_8px_rgba(255,255,255,0.08)]">
                <img
                  src={googlePlayBtn}
                  alt="Get it on Google Play"
                  className="h-[42px] w-[135px] object-contain"
                />
              </a>
              <a href="https://www.apple.com/app-store/" target="_blank" rel="noreferrer" className="inline-block w-fit transition-shadow hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] dark:hover:drop-shadow-[0_4px_8px_rgba(255,255,255,0.08)]">
                <img
                  src={appStoreBtn}
                  alt="Download on the App Store"
                  className="h-[42px] w-[135px] object-contain dark:invert"
                />
              </a>
            </div>
            <div className="mt-4 flex gap-2.5">
              {footerSocialLinks.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] border border-[#cbd5e1] bg-transparent no-underline transition-all hover:bg-white hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)] dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                  aria-label={`Open ${item.label} in new tab`}
                >
                  <img src={item.iconSrc} alt={item.label} className={`h-5 w-5 object-contain ${item.label === 'GitHub' ? 'dark:invert' : ''}`} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#cbd5e1] pt-6 text-left dark:border-slate-800/80">
          <p className="text-[0.85rem] font-bold text-[#64748b] dark:text-slate-500">
            &copy; SocietyHub Technologies Pvt. Ltd. – All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
