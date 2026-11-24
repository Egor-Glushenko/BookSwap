import { ChevronLeft, ChevronRight } from 'lucide-react';

function buildPages(page, pages) {
  const numbers = new Set([1, pages, page - 1, page, page + 1]);
  return [...numbers].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const items = buildPages(page, pages);

  return (
    <nav className="pagination" aria-label="Постраничная навигация">
      <button type="button" className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Предыдущая страница">
        <ChevronLeft size={16} />
      </button>
      {items.map((item, index) => {
        const previous = items[index - 1];
        return (
          <span key={item} style={{ display: 'contents' }}>
            {previous && item - previous > 1 && <span className="text-muted" aria-hidden="true">…</span>}
            <button
              type="button"
              className={`page-btn ${item === page ? 'active' : ''}`.trim()}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          </span>
        );
      })}
      <button type="button" className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Следующая страница">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
