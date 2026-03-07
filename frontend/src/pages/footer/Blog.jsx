import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, Tag, User } from 'lucide-react'
import PageShell from '../../components/PageShell'

export default function Blog() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')

  const posts = [
    {
      title: '10 Tips for Effective Society Management',
      excerpt: 'Discover proven strategies to streamline operations and improve resident satisfaction in your housing society.',
      date: 'Jan 15, 2026',
      readTime: '5 min read',
      category: 'Management',
      author: 'Tanmay Kudkar',
    },
    {
      title: 'Digitizing Maintenance Bills: A Complete Guide',
      excerpt: 'Learn how to transition from paper-based billing to a fully digital system that saves time and reduces errors.',
      date: 'Jan 8, 2026',
      readTime: '7 min read',
      category: 'Finance',
      author: 'Parth Waghe',
    },
    {
      title: 'Building Community Through Technology',
      excerpt: 'How modern society management platforms are fostering stronger connections between residents.',
      date: 'Dec 28, 2025',
      readTime: '4 min read',
      category: 'Community',
      author: 'Nidhish Vartak',
    },
    {
      title: 'Security Best Practices for Society Admins',
      excerpt: 'Essential security measures every society administrator should implement to protect resident data.',
      date: 'Dec 20, 2025',
      readTime: '6 min read',
      category: 'Security',
      author: 'Atharva Raut',
    },
    {
      title: 'How SocietyHub Reduced Complaints by 60%',
      excerpt: 'A case study on how one society transformed their complaint resolution process using our platform.',
      date: 'Dec 12, 2025',
      readTime: '8 min read',
      category: 'Case Study',
      author: 'Yash Thakur',
    },
    {
      title: 'Understanding RERA Compliance for Societies',
      excerpt: 'Navigate the regulatory landscape with our comprehensive guide to RERA compliance for housing societies.',
      date: 'Dec 5, 2025',
      readTime: '10 min read',
      category: 'Legal',
      author: 'Tanmay Kudkar',
    },
  ]

  const categories = ['All', 'Management', 'Finance', 'Community', 'Security', 'Case Study', 'Legal']
  const filteredPosts = useMemo(
    () => (activeCategory === 'All' ? posts : posts.filter((post) => post.category === activeCategory)),
    [activeCategory]
  )

  return (
    <PageShell>
      {/* Hero */}
      <section className="px-4 py-16 sm:px-6 sm:py-[5.25rem]">
        <div className="mx-auto max-w-4xl text-center">
          <span className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-primary))] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]">
            <Calendar className="h-4 w-4" />
            <span>Our Blog</span>
          </span>
          <h1 className="animate-fade-in-up mb-6 text-[clamp(2.25rem,4vw,3.75rem)] font-black leading-[1.05] text-[var(--text-primary)]" style={{ animationDelay: '100ms' }}>
            Insights &{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))' }}>Resources</span>
          </h1>
          <p className="animate-fade-in-up mx-auto max-w-[42rem] text-[1.15rem] text-[color-mix(in_srgb,var(--text-primary)_70%,var(--text-secondary))]" style={{ animationDelay: '200ms' }}>
            Expert tips, guides, and stories about modern society management.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === cat
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white'
                    : 'border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                }`}
                onClick={() => setActiveCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post, i) => (
              <article
                key={i}
                className="animate-fade-in-up flex cursor-pointer flex-col rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-secondary))] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-lg"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate('/contact')}
              >
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                    <Tag className="h-3 w-3" />
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </span>
                </div>
                <h3 className="mb-2.5 text-[1.0625rem] font-bold leading-[1.35] text-[var(--text-primary)]">{post.title}</h3>
                <p className="mb-5 flex-1 text-sm leading-7 text-[color-mix(in_srgb,var(--text-primary)_66%,var(--text-secondary))]">{post.excerpt}</p>
                <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-4">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <User className="h-3 w-3" />
                    <span>{post.author}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-[42rem]">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_26%,var(--border-default))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-primary)_16%,var(--bg-card))_0%,var(--bg-card)_100%)] px-8 py-10 text-center text-[var(--text-primary)] shadow-lg">
            <h2 className="mb-3 text-[1.75rem] font-extrabold">Stay Updated</h2>
            <p className="mx-auto mb-6 max-w-[28rem] text-base text-[color-mix(in_srgb,var(--text-primary)_68%,var(--text-secondary))]">Get the latest articles and society management tips delivered to your inbox.</p>
            <div className="mx-auto flex max-w-96 flex-col gap-2 sm:flex-row">
              <input type="email" placeholder="Enter your email" className="flex-1 rounded-lg border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-primary)_78%,transparent)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_20%,transparent)]" />
              <button className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[linear-gradient(135deg,var(--accent-primary),var(--accent-600))] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,var(--accent-secondary),var(--accent-primary))]">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
