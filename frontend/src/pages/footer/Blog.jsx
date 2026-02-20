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
      <section className="blog-hero">
        <div className="blog-hero-inner">
          <span className="blog-pill animate-fade-in-up">
            <Calendar className="blog-pill-icon" />
            <span>Our Blog</span>
          </span>
          <h1 className="blog-hero-title animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Insights &{' '}
            <span className="blog-hero-gradient">Resources</span>
          </h1>
          <p className="blog-hero-lead animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Expert tips, guides, and stories about modern society management.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="blog-categories">
        <div className="blog-categories-inner">
          <div className="blog-category-list">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`blog-category-btn ${activeCategory === cat ? 'blog-category-btn--active' : ''}`}
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
      <section className="blog-posts-section">
        <div className="blog-posts-inner">
          <div className="blog-posts-grid">
            {filteredPosts.map((post, i) => (
              <article
                key={i}
                className="blog-post-card animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate('/contact')}
              >
                <div className="blog-post-meta">
                  <span className="blog-post-category">
                    <Tag className="blog-meta-icon" />
                    {post.category}
                  </span>
                  <span className="blog-post-date">
                    <Calendar className="blog-meta-icon" />
                    {post.date}
                  </span>
                </div>
                <h3 className="blog-post-title">{post.title}</h3>
                <p className="blog-post-excerpt">{post.excerpt}</p>
                <div className="blog-post-footer">
                  <div className="blog-post-author">
                    <User className="blog-meta-icon" />
                    <span>{post.author}</span>
                  </div>
                  <span className="blog-post-read">
                    <Clock className="blog-meta-icon" />
                    {post.readTime}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="blog-cta">
        <div className="blog-cta-inner">
          <div className="blog-cta-card">
            <h2 className="blog-cta-title">Stay Updated</h2>
            <p className="blog-cta-text">Get the latest articles and society management tips delivered to your inbox.</p>
            <div className="blog-cta-form">
              <input type="email" placeholder="Enter your email" className="blog-cta-input" />
              <button className="blog-cta-button">
                Subscribe
                <ArrowRight className="blog-cta-arrow" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
