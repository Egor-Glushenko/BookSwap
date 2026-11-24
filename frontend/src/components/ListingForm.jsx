import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ImagePlus, Repeat, ShieldCheck, ShoppingBag, Sparkles, Trash2, Upload } from 'lucide-react';
import { Field } from './Field';
import { Cover } from './Cover';
import { useAuth } from '../shared/auth';
import { mediaUrl, uploadsApi } from '../shared/api';
import { GENRES, CONDITIONS, LISTING_TYPES, TONES } from '../shared/constants';

const TYPE_META = {
  'Продажа': { icon: ShoppingBag, label: 'Продажа', hint: 'Укажите цену' },
  'Обмен': { icon: Repeat, label: 'Обмен', hint: 'Что хотите взамен' },
  'Бесплатно': { icon: Gift, label: 'Бесплатно', hint: 'Подарите книгу' }
};

const emptyForm = {
  type: 'Продажа',
  title: '',
  author: '',
  genre: '',
  year: '',
  publisher: '',
  isbn: '',
  condition: 'Хорошее',
  description: '',
  price: '',
  exchangeWant: '',
  city: '',
  district: '',
  pickup: true,
  delivery: false,
  images: [],
  tone: 'blue'
};

function toForm(initial) {
  if (!initial) return emptyForm;
  return {
    ...emptyForm,
    ...initial,
    year: initial.year ?? '',
    price: initial.priceValue ?? '',
    exchangeWant: initial.exchangeWant ?? '',
    images: initial.images?.length ? initial.images : initial.coverUrl ? [initial.coverUrl] : []
  };
}

export function ListingForm({ initial, onSubmit, submitLabel = 'Опубликовать объявление', compact = false }) {
  const { token, user } = useAuth();
  const [form, setForm] = useState(() => toForm(initial));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Укажите название книги';
    if (!form.author.trim()) next.author = 'Укажите автора';
    if (!form.city.trim()) next.city = 'Укажите город';
    if (form.type === 'Продажа' && (!form.price || Number(form.price) <= 0)) next.price = 'Укажите цену больше нуля';
    if (form.type === 'Обмен' && !form.exchangeWant.trim()) next.exchangeWant = 'Опишите, что хотите получить взамен';
    if (form.description.length > 2000) next.description = 'Не больше 2000 символов';
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        price: form.type === 'Продажа' ? form.price : '',
        exchangeWant: form.type === 'Обмен' ? form.exchangeWant : '',
        year: form.year || '',
        city: form.city.trim()
      });
    } catch (requestError) {
      setError(requestError.message || 'Не удалось сохранить объявление');
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Поддерживаются изображения JPEG, PNG и WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл больше 5 МБ');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const result = await uploadsApi.image(token, file);
      setForm((current) => ({ ...current, images: [...current.images, result.data.url].slice(0, 3) }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (url) => {
    setForm((current) => ({ ...current, images: current.images.filter((item) => item !== url) }));
  };

  return (
    <form className={`listing-form ${compact ? 'compact' : ''}`.trim()} onSubmit={submit} noValidate>
      <div className="listing-form-grid">
        <div className="stack" style={{ gap: 18 }}>
          <section className="form-section">
            <div className="form-section-head">
              <h2>Книга</h2>
              <p>Данные с обложки — так покупателю проще найти нужное издание.</p>
            </div>
            <div className="form-grid">
              <Field label="Название книги" htmlFor="title" error={errors.title} className="span-2">
                <input
                  id="title"
                  className="input"
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="Например, Мастер и Маргарита"
                  maxLength={160}
                  aria-invalid={Boolean(errors.title)}
                  autoFocus={!initial}
                />
              </Field>
              <Field label="Автор" htmlFor="author" error={errors.author}>
                <input
                  id="author"
                  className="input"
                  value={form.author}
                  onChange={(event) => set('author', event.target.value)}
                  placeholder="Михаил Булгаков"
                  maxLength={120}
                  aria-invalid={Boolean(errors.author)}
                />
              </Field>
              <Field label="Жанр" htmlFor="genre">
                <select id="genre" className="select" value={form.genre} onChange={(event) => set('genre', event.target.value)}>
                  <option value="">Выберите жанр</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Год издания" htmlFor="year" hint="необязательно">
                <input
                  id="year"
                  className="input"
                  value={form.year}
                  onChange={(event) => set('year', event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                  placeholder="2019"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Издательство" htmlFor="publisher" hint="необязательно">
                <input
                  id="publisher"
                  className="input"
                  value={form.publisher}
                  onChange={(event) => set('publisher', event.target.value)}
                  placeholder="АСТ"
                  maxLength={120}
                />
              </Field>
              <Field label="ISBN" htmlFor="isbn" hint="необязательно">
                <input
                  id="isbn"
                  className="input"
                  value={form.isbn}
                  onChange={(event) => set('isbn', event.target.value)}
                  placeholder="978-5-17-..."
                  maxLength={24}
                />
              </Field>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2>Условия</h2>
              <p>Продайте, обменяйте или отдайте книгу бесплатно.</p>
            </div>

            <div className="type-choice" role="radiogroup" aria-label="Тип объявления">
              {LISTING_TYPES.map((type) => {
                const meta = TYPE_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    type="button"
                    key={type}
                    role="radio"
                    aria-checked={form.type === type}
                    className={`type-option ${form.type === type ? 'selected' : ''}`.trim()}
                    onClick={() => set('type', type)}
                  >
                    <Icon size={18} />
                    <strong>{meta.label}</strong>
                    <span>{meta.hint}</span>
                  </button>
                );
              })}
            </div>

            <div className="form-grid">
              {form.type === 'Продажа' && (
                <Field label="Цена, ₽" htmlFor="price" error={errors.price}>
                  <input
                    id="price"
                    className="input"
                    value={form.price}
                    onChange={(event) => set('price', event.target.value.replace(/[^\d.]/g, '').slice(0, 7))}
                    placeholder="450"
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.price)}
                  />
                </Field>
              )}

              {form.type === 'Обмен' && (
                <Field label="Хочу получить взамен" htmlFor="exchangeWant" error={errors.exchangeWant} className="span-2">
                  <input
                    id="exchangeWant"
                    className="input"
                    value={form.exchangeWant}
                    onChange={(event) => set('exchangeWant', event.target.value)}
                    placeholder="Например, «Солярис» Лема или другие книги Стругацких"
                    maxLength={400}
                    aria-invalid={Boolean(errors.exchangeWant)}
                  />
                </Field>
              )}

              <Field label="Состояние" htmlFor="condition">
                <select id="condition" className="select" value={form.condition} onChange={(event) => set('condition', event.target.value)}>
                  {CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </Field>

              <Field label="Описание" htmlFor="description" hint={`${form.description.length}/2000`} className="span-2" error={errors.description}>
                <textarea
                  id="description"
                  className="textarea"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  placeholder="Расскажите о состоянии книги, есть ли пометки, как выглядит обложка"
                  maxLength={2000}
                />
              </Field>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h2>Фото и передача</h2>
              <p>Настоящие фото повышают доверие: до трёх изображений, до 5 МБ каждое.</p>
            </div>

            <div className="upload-grid">
              {form.images.map((image) => (
                <div className="upload-preview" key={image}>
                  <img src={mediaUrl(image)} alt="Фото книги" loading="lazy" />
                  <button type="button" className="upload-remove" onClick={() => removeImage(image)} aria-label="Удалить фото">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {form.images.length < 3 && (
                <button
                  type="button"
                  className="upload-tile"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <span className="spinner" /> : <ImagePlus size={22} />}
                  <strong>{uploading ? 'Загружаем…' : 'Добавить фото'}</strong>
                  <span>JPEG, PNG или WebP</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => upload(event.target.files?.[0])}
            />

            <div className="form-grid mt-2">
              <Field label="Город" htmlFor="city" error={errors.city}>
                <input
                  id="city"
                  className="input"
                  value={form.city}
                  onChange={(event) => set('city', event.target.value)}
                  placeholder={user?.city && user.city !== 'Не указан' ? user.city : 'Москва'}
                  maxLength={80}
                  aria-invalid={Boolean(errors.city)}
                />
              </Field>
              <Field label="Район или метро" htmlFor="district" hint="необязательно">
                <input
                  id="district"
                  className="input"
                  value={form.district}
                  onChange={(event) => set('district', event.target.value)}
                  placeholder="Хамовники"
                  maxLength={80}
                />
              </Field>
            </div>

            <div className="row mt-2" style={{ gap: 18 }}>
              <label className="checkbox">
                <input type="checkbox" checked={form.pickup} onChange={(event) => set('pickup', event.target.checked)} />
                <span>Самовывоз</span>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.delivery} onChange={(event) => set('delivery', event.target.checked)} />
                <span>Готов отправить доставкой</span>
              </label>
            </div>
          </section>
        </div>

        <aside className="listing-aside">
          <div className="preview-card">
            <span className="eyebrow">Предпросмотр</span>
            <Cover title={form.title || 'Ваша книга'} author={form.author || 'Автор'} tone={form.tone} image={form.images[0]} />            <div className="preview-meta">
              <strong>{form.title || 'Без названия'}</strong>
              <span>{form.author || 'Автор не указан'} · {form.type}</span>
              <b>{form.type === 'Продажа' ? `${form.price || '—'} ₽` : form.type === 'Обмен' ? 'Обмен' : 'Даром'}</b>
            </div>
            <div className="tone-picker" role="group" aria-label="Цвет обложки">
              {TONES.map((tone) => (
                <button
                  type="button"
                  key={tone}
                  className={`tone-dot ${tone} ${form.tone === tone ? 'active' : ''}`.trim()}
                  onClick={() => set('tone', tone)}
                  aria-label={`Цвет ${tone}`}
                  aria-pressed={form.tone === tone}
                />
              ))}
            </div>
          </div>

          <div className="aside-tips">
            <span><Sparkles size={15} /> Чем подробнее описание, тем быстрее найдётся покупатель.</span>
            <span><Upload size={15} /> Фото обложки и корешка помогают избежать вопросов.</span>
            <span><ShieldCheck size={15} /> Объявление сразу появляется в каталоге и доступно модерации.</span>
          </div>

          {error && <p className="alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy || uploading}>
            {busy ? 'Сохраняем…' : submitLabel}
          </button>
          <Link className="btn btn-ghost btn-block" to={initial ? `/listing/${initial.id}` : '/catalog'}>
            Отмена
          </Link>
        </aside>
      </div>
    </form>
  );
}
