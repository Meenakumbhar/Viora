/**
 * Marketing loading state.
 *
 * Most pages in this group are static or ISR, so this rarely appears — but
 * the dynamic ones (/portfolio, /portfolio/[id], /contact, /order-form/*)
 * are rendered per request, and those are exactly the routes where a visitor
 * would otherwise sit on the previous page with no feedback.
 *
 * It renders inside the marketing layout, so Nav and Footer stay put and
 * only the page body is replaced. The top padding clears the fixed nav.
 *
 * No client JS; globals.css disables the shimmer under prefers-reduced-motion.
 */

const shimmer =
  'linear-gradient(90deg, rgba(28,37,48,0.05) 0%, rgba(28,37,48,0.11) 50%, rgba(28,37,48,0.05) 100%)';

function Block({ w, h = 16, radius = 4 }: { w: string; h?: number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: shimmer,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

export default function MarketingLoading() {
  return (
    <main aria-busy="true" aria-label="Loading" className="container-wide" style={{ paddingTop: 140, paddingBottom: 96 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
        <Block w="120px" h={12} />
        <Block w="min(100%, 520px)" h={44} />
        <Block w="min(100%, 440px)" h={18} />
        <Block w="min(100%, 380px)" h={18} />
      </div>

      <div
        style={{
          marginTop: 64,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Block w="100%" h={220} radius={8} />
            <Block w="70%" h={16} />
            <Block w="45%" h={13} />
          </div>
        ))}
      </div>
    </main>
  );
}
