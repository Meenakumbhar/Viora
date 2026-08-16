import Link from 'next/link';

interface ServiceCardProps {
  title: string;
  description: string;
  category: string;
  image?: string;
  href: string;
  index: number;
}

const categoryGradients: Record<string, string> = {
  wedding:
    'linear-gradient(160deg, #FDF7F5 0%, #F5E6DF 40%, #E8D5C4 70%, #C4958F 100%)',
  funeral:
    'linear-gradient(160deg, #F8F7FD 0%, #EDEAF8 40%, #D6D3EE 70%, #8B82C4 100%)',
  sports:
    'linear-gradient(160deg, #F4FAF0 0%, #E2F0DB 40%, #C2DCBB 70%, #7D9B76 100%)',
  design:
    'linear-gradient(160deg, #F4F7FD 0%, #E0E8F8 40%, #C2D4EE 70%, #2D5FA8 100%)',
  print:
    'linear-gradient(160deg, #FDFAF5 0%, #F8EDDA 40%, #F5DFB8 70%, #D4883A 100%)',
};

function getGradient(category: string): string {
  const key = category.toLowerCase();
  if (key.includes('wedding') || key.includes('event')) return categoryGradients.wedding;
  if (key.includes('funeral') || key.includes('memorial')) return categoryGradients.funeral;
  if (key.includes('sport') || key.includes('branding')) return categoryGradients.sports;
  if (key.includes('design') || key.includes('graphic')) return categoryGradients.design;
  if (key.includes('print') || key.includes('production')) return categoryGradients.print;
  return categoryGradients.design;
}

export default function ServiceCard({
  title,
  description,
  category,
  href,
  index,
}: ServiceCardProps) {
  // Normalize category to map to variables
  let normalizedCategory = 'all';
  const key = category.toLowerCase();
  if (key.includes('wedding') || key.includes('event')) normalizedCategory = 'wedding';
  else if (key.includes('funeral') || key.includes('memorial')) normalizedCategory = 'funeral';
  else if (key.includes('sport') || key.includes('branding')) normalizedCategory = 'sports';
  else if (key.includes('design') || key.includes('graphic')) normalizedCategory = 'branding';
  else if (key.includes('print') || key.includes('production')) normalizedCategory = 'events';

  return (
    <Link
      href={href}
      className="group relative block aspect-[3/4] overflow-hidden border border-border transition-[transform,border-color] duration-[400ms] ease-in-out hover:-translate-y-1 hover:border-cat-accent md:aspect-[4/5] bg-cat-bg"
      data-category={normalizedCategory}
      data-delay={index}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-[filter] duration-[400ms] ease-in-out group-hover:brightness-105"
        style={{ background: getGradient(category) }}
      />

      {/* Light overlay gradient — ensures text is readable at the bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(253,252,250,0.95) 0%, rgba(253,252,250,0.4) 50%, transparent 100%)',
        }}
      />

      {/* Category label */}
      <span className="absolute left-6 top-6 font-mono text-label uppercase text-cat-accent-dark">
        {category}
      </span>

      {/* Title and description */}
      <div className="absolute bottom-8 left-6 right-6">
        <h3 className="font-display text-display-md text-cat-heading group-hover:text-cat-accent-dark transition-colors duration-300">
          {title}
        </h3>
        <p className="mt-2 max-w-[280px] font-body text-body-base text-cat-body">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <span
        className="absolute bottom-8 right-6 text-cat-accent-dark transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        &rarr;
      </span>
    </Link>
  );
}
