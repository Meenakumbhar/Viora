// Shared section renderer for the legal pages (terms/privacy/cookies) — same
// numbered-heading + paragraph/list shape, reused instead of tripled per page.
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="mt-12 space-y-10 border-t border-border pt-12">
      {sections.map((section, i) => (
        <section key={section.heading}>
          <h2 className="font-display text-2xl text-text-primary">
            {i + 1}. {section.heading}
          </h2>
          {section.paragraphs?.map((p) => (
            <p key={p} className="mt-3 font-body text-body-base text-text-muted leading-relaxed">
              {p}
            </p>
          ))}
          {section.list && (
            <ul className="mt-3 space-y-2">
              {section.list.map((item) => (
                <li key={item} className="flex gap-3 font-body text-body-base text-text-muted leading-relaxed">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent-gold" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default LegalSections;
