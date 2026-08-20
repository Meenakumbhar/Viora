// Shared FAQ accordion — extracted from a <details>/<summary> pattern
// hand-duplicated across a few pages (e.g. app/process/page.tsx), so new
// FAQ sections don't re-implement it every time.
interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-border py-6">
          <summary className="flex justify-between items-center cursor-pointer list-none font-display text-xl text-cat-heading group-open:text-cat-accent transition-colors duration-200">
            {item.question}
            <span className="text-cat-accent font-mono transition-transform duration-300 group-open:rotate-180">
              &darr;
            </span>
          </summary>
          <p className="mt-4 font-body text-body-base text-cat-body leading-relaxed max-w-3xl">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export default Accordion;
