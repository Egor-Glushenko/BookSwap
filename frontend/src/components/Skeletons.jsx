export function BookGridSkeleton({ count = 8 }) {
  return (
    <div className="book-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton cover-skeleton" />
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" style={{ width: '85%' }} />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-layout" aria-hidden="true">
      <div className="skeleton" style={{ minHeight: 420, borderRadius: 21 }} />
      <div className="stack">
        <div className="skeleton skeleton-line" style={{ width: '30%', height: 14 }} />
        <div className="skeleton skeleton-line" style={{ width: '80%', height: 34 }} />
        <div className="skeleton skeleton-line" style={{ width: '45%', height: 14 }} />
        <div className="skeleton skeleton-line" style={{ width: '100%', height: 90, marginTop: 12 }} />
        <div className="skeleton skeleton-line" style={{ width: '100%', height: 120 }} />
      </div>
    </div>
  );
}

export function RowsSkeleton({ count = 4 }) {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton" key={index} style={{ height: 62, borderRadius: 12 }} />
      ))}
    </div>
  );
}
