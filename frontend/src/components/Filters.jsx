import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { CONDITIONS, GENRES, LISTING_TYPES } from '../shared/constants';

function Chips({ options, value, onSelect, emptyLabel, counts }) {
  return (
    <div className="filter-options">
      <button type="button" className={`chip ${!value ? 'active' : ''}`.trim()} onClick={() => onSelect('')}>
        {emptyLabel}
      </button>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={`chip ${value === option ? 'active' : ''}`.trim()}
          onClick={() => onSelect(value === option ? '' : option)}
        >
          {option}
          {counts?.[option] ? <span className="filter-count">{counts[option]}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Filters({ value, facets, onChange, onReset, open = false, id = 'catalog-filters' }) {
  const genres = facets?.genres?.length ? facets.genres.map((item) => item.name) : GENRES;
  const cities = facets?.cities?.length ? facets.cities.map((item) => item.name) : [];
  const conditions = facets?.conditions?.length ? facets.conditions.map((item) => item.name) : CONDITIONS;
  const typeCounts = facets?.types;

  return (
    <aside className={`filters-panel ${open ? 'open' : ''}`.trim()} id={id} aria-label="Фильтры каталога">
      <div className="row-between">
        <span className="eyebrow">
          <SlidersHorizontal size={13} /> Фильтры
        </span>
        <button type="button" className="subtle-link" onClick={onReset}>
          <RotateCcw size={12} /> Сбросить
        </button>
      </div>

      <div className="filter-group">
        <h4>Тип объявления</h4>
        <Chips
          options={LISTING_TYPES}
          value={value.type}
          onSelect={(next) => onChange({ type: next })}
          emptyLabel="Все"
          counts={typeCounts}
        />
      </div>

      <div className="filter-group">
        <h4>Жанр</h4>
        <Chips
          options={genres.slice(0, 10)}
          value={value.genre}
          onSelect={(next) => onChange({ genre: next })}
          emptyLabel="Все жанры"
        />
      </div>

      {cities.length > 0 && (
        <div className="filter-group">
          <h4>Город</h4>
          <Chips
            options={cities.slice(0, 8)}
            value={value.city}
            onSelect={(next) => onChange({ city: next })}
            emptyLabel="Все города"
          />
        </div>
      )}

      <div className="filter-group">
        <h4>Состояние</h4>
        <Chips
          options={conditions}
          value={value.condition}
          onSelect={(next) => onChange({ condition: next })}
          emptyLabel="Любое"
        />
      </div>

      <div className="filter-group">
        <h4>Цена, ₽</h4>
        <div className="price-range">
          <input
            className="input"
            inputMode="numeric"
            placeholder={facets?.priceMin ? String(facets.priceMin) : 'от'}
            value={value.minPrice}
            onChange={(event) => onChange({ minPrice: event.target.value.replace(/[^\d]/g, '') })}
            aria-label="Минимальная цена"
          />
          <input
            className="input"
            inputMode="numeric"
            placeholder={facets?.priceMax ? String(facets.priceMax) : 'до'}
            value={value.maxPrice}
            onChange={(event) => onChange({ maxPrice: event.target.value.replace(/[^\d]/g, '') })}
            aria-label="Максимальная цена"
          />
        </div>
      </div>
    </aside>
  );
}
