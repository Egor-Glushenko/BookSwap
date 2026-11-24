import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive, Heart, ImagePlus, Info, LogOut, MessageCircle, Pencil, RotateCcw,
  Settings, ShieldCheck, ShoppingBag, Sparkles, Star, Check
} from 'lucide-react';
import { authApi, listingsApi, uploadsApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuth } from '../shared/auth';
import { useToast } from '../shared/toast';
import { useUnread } from '../shared/notifications';
import { useFavorites } from '../shared/favorites';
import { Seo } from '../shared/seo';
import { Avatar } from '../components/Avatar';
import { Cover } from '../components/Cover';
import { Field } from '../components/Field';
import { EmptyState } from '../components/EmptyState';
import { RowsSkeleton } from '../components/Skeletons';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LISTING_STATUS_LABELS, SITE_NAME } from '../shared/constants';
import { countLabel, formatDate } from '../shared/format';

const TABS = [
  { key: 'listings', label: 'Мои объявления', icon: ShoppingBag },
  { key: 'settings', label: 'Настройки профиля', icon: Settings }
];

export function AccountPage() {
  const { user, token, logout, updateUser, isStaff } = useAuth();
  const { notify } = useToast();
  const { count: unread } = useUnread();
  const { count: favoritesCount } = useFavorites();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'settings' ? 'settings' : 'listings';

  const mine = useFetch((signal) => listingsApi.mine(token, 'all', signal), [token]);
  const listings = mine.data?.data || [];

  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city === 'Не указан' ? '' : user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirm, setConfirm] = useState(null);

  const active = listings.filter((book) => book.status === 'active');
  const finished = listings.filter((book) => book.status !== 'active');

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const result = await authApi.updateProfile(token, { name, city, bio, avatarUrl });
      updateUser(result.user);
      notify('Профиль обновлён');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    setFormError('');
    try {
      const result = await uploadsApi.image(token, file);
      setAvatarUrl(result.data.url);
      notify('Фото загружено, сохраните профиль');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const changeStatus = async (listing, status) => {
    try {
      await listingsApi.setStatus(token, listing.id, status);
      notify(status === 'sold' ? 'Книга отмечена как переданная' : 'Объявление снова в каталоге');
      mine.reload();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const archive = async (listing) => {
    await listingsApi.remove(token, listing.id);
    notify('Объявление снято с публикации');
    mine.reload();
  };

  return (
    <>
      <Seo
        title={`Личный кабинет | ${SITE_NAME}`}
        description="Управляйте объявлениями, профилем и избранным на BookSwap."
        path="/profile"
        noindex
      />

      <div className="container page">
        <div className="page-head">
          <span className="eyebrow"><span className="dot" /> Личный кабинет</span>
          <h1>{user.name}</h1>
          <p className="lede">
            {user.city} · на BookSwap с {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="account-layout">
          <nav className="account-nav" aria-label="Разделы кабинета">
            <div className="row" style={{ gap: 10, padding: '8px 10px 14px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
              <Avatar name={user.name} src={user.avatarUrl} />
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 13 }} className="truncate">{user.name}</strong>
                <span className="text-muted text-small">
                  {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Читатель'}
                </span>
              </div>
            </div>

            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={tab === item.key ? 'active' : ''}
                  onClick={() => setSearchParams(item.key === 'listings' ? {} : { tab: item.key })}
                >
                  <Icon size={16} /> {item.label}
                  {item.key === 'listings' && <span className="badge soft">{listings.length}</span>}
                </button>
              );
            })}

            <Link to="/favorites">
              <Heart size={16} /> Избранное
              {favoritesCount > 0 && <span className="badge soft">{favoritesCount}</span>}
            </Link>
            <Link to="/chats">
              <MessageCircle size={16} /> Сообщения
              {unread > 0 && <span className="badge rose">{unread}</span>}
            </Link>
            {isStaff && (
              <Link to="/moderation">
                <ShieldCheck size={16} /> Модерация
              </Link>
            )}
            <div className="menu-sep" />
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut size={16} /> Выйти
            </button>
          </nav>

          <div className="account-panels">
            <div className="stat-grid">
              <div className="stat">
                <strong>{user.rating || 0}</strong>
                <span>рейтинг продавца</span>
              </div>
              <div className="stat">
                <strong>{user.deals || 0}</strong>
                <span>{countLabel(user.deals || 0, 'сделка', 'сделки', 'сделок')}</span>
              </div>
              <div className="stat">
                <strong>{active.length}</strong>
                <span>активных объявлений</span>
              </div>
              <div className="stat">
                <strong>{favoritesCount}</strong>
                <span>книг в избранном</span>
              </div>
            </div>

            {tab === 'listings' ? (
              <div className="account-card">
                <div className="row-between" style={{ marginBottom: 14 }}>
                  <div>
                    <h2>Мои объявления</h2>
                    <p className="hint">{active.length} в каталоге · {finished.length} завершено</p>
                  </div>
                  <Link className="btn btn-primary btn-sm" to="/sell">
                    <Sparkles size={15} /> Добавить книгу
                  </Link>
                </div>

                {mine.loading && !listings.length ? (
                  <RowsSkeleton count={4} />
                ) : listings.length ? (
                  listings.map((listing) => (
                    <div className="listing-admin-row" key={listing.id}>
                      <Cover title={listing.title} author={listing.author} tone={listing.tone} image={listing.coverUrl} />
                      <div className="grow">
                        <Link to={`/listing/${listing.id}`}><strong>{listing.title}</strong></Link>
                        <span>
                          {listing.price} · {listing.views} просмотров · {listing.city}
                        </span>
                        <span className="badge soft" style={{ width: 'max-content' }}>
                          {LISTING_STATUS_LABELS[listing.status] || listing.status}
                        </span>
                      </div>
                      <div className="row-actions">
                        <Link className="btn btn-secondary btn-sm" to={`/listing/${listing.id}/edit`}>
                          <Pencil size={13} /> Изменить
                        </Link>
                        {listing.status === 'active' ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => changeStatus(listing, 'sold')}
                          >
                            <Check size={13} /> Передано
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => changeStatus(listing, 'active')}
                          >
                            <RotateCcw size={13} /> В каталог
                          </button>
                        )}
                        {listing.status !== 'archived' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setConfirm(listing)}
                          >
                            <Archive size={13} /> Снять
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={ShoppingBag}
                    title="Пока нет объявлений"
                    description="Добавьте первую книгу — это займёт пару минут."
                    action={<Link className="btn btn-primary" to="/sell">Разместить книгу</Link>}
                  />
                )}
              </div>
            ) : (
              <div className="account-card">
                <h2>Профиль</h2>
                <p className="hint">Это имя и город видят покупатели в объявлениях и чатах.</p>

                <form className="stack mt-2" onSubmit={saveProfile} noValidate>
                  <div className="row" style={{ gap: 14 }}>
                    <Avatar name={name || user.name} src={avatarUrl} size="lg" />
                    <div className="stack" style={{ gap: 6 }}>
                      <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                        {uploading ? <span className="spinner" /> : <ImagePlus size={14} />}
                        {uploading ? 'Загружаем…' : 'Загрузить фото'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          hidden
                          onChange={(event) => uploadAvatar(event.target.files?.[0])}
                        />
                      </label>
                      {avatarUrl && (
                        <button type="button" className="subtle-link" onClick={() => setAvatarUrl('')}>
                          Удалить фото
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-grid">
                    <Field label="Имя" htmlFor="profile-name">
                      <input id="profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
                    </Field>
                    <Field label="Город" htmlFor="profile-city">
                      <input id="profile-city" className="input" value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} placeholder="Москва" />
                    </Field>
                    <Field label="О себе" htmlFor="profile-bio" hint={`${bio.length}/400`} className="span-2">
                      <textarea
                        id="profile-bio"
                        className="textarea"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        maxLength={400}
                        placeholder="Что читаете, как передаёте книги, удобные районы для встреч"
                        style={{ minHeight: 96 }}
                      />
                    </Field>
                  </div>

                  {formError && <p className="alert">{formError}</p>}

                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <span className="text-muted text-small" style={{ marginRight: 'auto' }}>
                      <Info size={13} /> Email {user.email} используется для входа
                    </span>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Сохраняем…' : 'Сохранить изменения'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {isStaff && (
              <div className="account-card">
                <div className="row-between">
                  <div>
                    <h2>Панель управления</h2>
                    <p className="hint">
                      {user.role === 'admin' ? 'Полный доступ: пользователи, роли, жалобы и категории.' : 'Жалобы, объявления и категории.'}
                    </p>
                  </div>
                  <Link className="btn btn-secondary" to="/moderation">
                    <ShieldCheck size={15} /> Открыть модерацию
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => archive(confirm)}
        title="Снять объявление с публикации?"
        description={confirm ? `«${confirm.title}» исчезнет из каталога. Вернуть его можно кнопкой «В каталог».` : ''}
        confirmLabel="Снять"
        danger
      />
    </>
  );
}
