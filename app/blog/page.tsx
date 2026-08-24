import type { Metadata } from 'next';
import Link from 'next/link';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { getBlogPosts } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Design insights, typography guides, paper selection tips, and updates from the Memories in Prints studio.',
};

export const revalidate = 60;

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();
  const featuredPost = blogPosts[0];
  const remainingPosts = blogPosts.slice(1);

  // Gradient helper for blog card overlays
  const gradients = [
    'from-accent-blush/20 to-accent-gold/20',
    'from-bg-surface to-border',
    'from-accent-sage/20 to-bg-surface',
    'from-accent-gold/15 to-accent-blush/10',
    'from-accent-gold/20 to-bg-surface',
  ];

  return (
    <div>
      {/* Hero Section */}
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Studio Journal
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Stories & print <em className="not-italic font-semibold text-accent-gold">guides</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          Technical advice on preparing artwork, guides on choosing paper stocks, and stories behind our custom print designs.
        </p>
      </HeroVideo>

      {/* Featured Post Section */}
      {featuredPost && (
        <section className="bg-bg-primary py-16 md:py-24 lg:py-28 border-t border-border">
          <div className="container-wide">
            <SectionReveal>
              <div className="border border-border bg-bg-secondary p-8 md:p-12">
                <span className="block font-mono text-base text-accent-gold uppercase tracking-wider mb-6">
                  Featured Article
                </span>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Column: Image placeholder */}
                  <div className="lg:col-span-7 relative aspect-[16/10] w-full border border-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/20 via-bg-surface to-accent-blush/20" />
                    <div className="absolute inset-0 bg-bg-primary/10" />
                  </div>
                  
                  {/* Right Column: Details */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-base text-text-muted uppercase tracking-wider">
                        {featuredPost.category}
                        {featuredPost.published_at
                          ? ` · ${new Date(featuredPost.published_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}`
                          : ''}
                      </span>
                      <h2 className="mt-4 font-display text-3xl md:text-4xl text-text-primary leading-tight hover:text-accent-gold transition-colors duration-300">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          {featuredPost.title}
                        </Link>
                      </h2>
                      <p className="mt-6 font-body text-body-lg text-text-muted leading-relaxed">
                        {featuredPost.excerpt}
                      </p>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-border">
                      <Button variant="primary" size="md" href={`/blog/${featuredPost.slug}`}>
                        Read Article
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Grid of Remaining Posts */}
      <section className="bg-bg-alternate py-16 md:py-24 lg:py-28 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="mb-10">
              <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                Latest Publications
              </span>
              <h2 className="mt-4 font-display text-display-lg text-text-primary">
                Latest <em className="not-italic font-semibold text-accent-gold">articles</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post, idx) => {
                const gradient = gradients[(idx + 1) % gradients.length];
                return (
                  <article key={post.id} className="group border border-border bg-bg-secondary flex flex-col justify-between">
                    {/* Visual */}
                    <div className="relative aspect-[16/9] w-full border-b border-border overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} transition-transform duration-700 group-hover:scale-105`} />
                      <div className="absolute inset-0 bg-bg-primary/20" />
                    </div>
                    
                    {/* Details */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-base text-text-muted uppercase tracking-wider">
                          {post.category}
                          {post.published_at
                            ? ` · ${new Date(post.published_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}`
                            : ''}
                        </span>
                        <h3 className="mt-3 font-display text-2xl text-text-primary group-hover:text-accent-gold transition-colors duration-300 line-clamp-2">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>
                        <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-border">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 font-body text-label uppercase tracking-wider text-accent-gold link-underline font-medium"
                        >
                          Read Article &rarr;
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* final CTA */}
      <section className="bg-bg-primary py-16 md:py-20 border-t border-border text-center">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-text-primary">
              Stay in the <em className="not-italic font-semibold text-accent-gold">loop</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-text-muted leading-relaxed">
              We send updates from our studio including print tutorials, project showcases, and paper announcements once a month.
            </p>
            <div className="mt-10 max-w-md mx-auto">
              <Link
                href="/#newsletter"
                className="inline-flex items-center justify-center bg-accent-gold text-bg-primary px-8 py-4 font-body font-medium uppercase tracking-wider text-label transition-all duration-300 hover:bg-accent-gold-dark focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary w-full sm:w-auto"
              >
                Subscribe to newsletter
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
