/**
 * Dashboard loading state.
 *
 * Every route in this group is force-dynamic — rendered per request against
 * the database — so navigating to one used to leave the previous page on
 * screen with no feedback until the server replied. This gives Next a
 * Suspense boundary to show immediately instead.
 *
 * Shaped to match DashboardShell (a fixed, full-viewport dark surface with a
 * sidebar and a topbar) so the skeleton occupies the same regions the real
 * chrome will, rather than shifting everything once it arrives.
 *
 * No client JS: this is a server component, and the shimmer is pure CSS.
 * globals.css already disables animation under prefers-reduced-motion.
 */

const shimmer =
  'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)';

function Bar({ w, h = 14 }: { w: string; h?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        background: shimmer,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

export default function AppLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dashboard"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-dark-bg-primary)',
        fontFamily: 'var(--font-dm-sans)',
        display: 'flex',
      }}
    >
      {/* Sidebar */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 248,
          flexDirection: 'column',
          gap: 18,
          padding: '28px 20px',
          borderRight: '1px solid var(--color-dark-border)',
          background: 'var(--color-dark-bg-secondary)',
        }}
      >
        <Bar w="60%" h={20} />
        <div style={{ height: 12 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} w={`${85 - i * 6}%`} />
        ))}
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: 64,
            borderBottom: '1px solid var(--color-dark-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <Bar w="180px" h={16} />
          <Bar w="96px" h={28} />
        </header>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Bar w="240px" h={30} />

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 92,
                  borderRadius: 8,
                  border: '1px solid var(--color-dark-border)',
                  background: shimmer,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s ease-in-out infinite',
                }}
              />
            ))}
          </div>

          {/* Table rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Bar key={i} w="100%" h={44} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
