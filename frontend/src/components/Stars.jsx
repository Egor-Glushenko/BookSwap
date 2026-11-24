import { Star } from 'lucide-react';

export function Stars({ value = 0, max = 5, size = 14, interactive = false, onChange, label }) {
  return (
    <span
      className={`stars ${interactive ? 'interactive' : ''}`}
      role={interactive ? 'group' : 'img'}
      aria-label={label || `Оценка ${value} из ${max}`}
    >
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const filled = star <= Math.round(Number(value) || 0);
        if (!interactive) {
          return <Star key={star} size={size} fill={filled ? 'currentColor' : 'none'} className={filled ? '' : 'star-empty'} aria-hidden="true" />;
        }
        return (
          <button
            type="button"
            key={star}
            onClick={() => onChange?.(star)}
            aria-label={`Поставить ${star} из ${max}`}
            aria-pressed={filled}
          >
            <Star size={size} fill={filled ? 'currentColor' : 'none'} className={filled ? '' : 'star-empty'} />
          </button>
        );
      })}
    </span>
  );
}
