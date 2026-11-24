import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, Ban, Check, CircleAlert, ShieldCheck, Tag, Trash2, UserCog, Users, X
} from 'lucide-react';
import { moderationApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuth } from '../shared/auth';
import { useToast } from '../shared/toast';
import { Seo } from '../shared/seo';
import { EmptyState } from '../components/EmptyState';
import { RowsSkeleton } from '../components/Skeletons';
import { Cover } from '../components/Cover';
import { Avatar } from '../components/Avatar';
import {
  LISTING_STATUS_LABELS, REVIEW_STATUS_LABELS, SITE_NAME
} from '../shared/constants';
import { formatDateTime } from '../shared/format';

const TABS = [
  { key: 'reports', label: 'Жалобы', icon: CircleAlert },
  { key: 'listings', label: 'Объявления', icon: Tag },
  { key: 'categories', label: 'Категории', icon: Archive },
  { key: 'users', label: 'Пользователи', icon: Users }
];

const REPORT_STATUS_CLASS = {
  new: 'rose',
  reviewing: 'swap',
  resolved: '',
  rejected: 'soft'
};

export function ModerationPage() {
  const { user, token } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState('reports');
  const [reportStatus, setReportStatus] = useState('all');
  const [listingStatus, setListingStatus] = useState('all');
  const [newCategory, setNewCategory] = useState('');
  const [busyId, setBusyId] = useState(null);

  const isAdmin = user?.role === 'admin';

  const stats = useFetch((signal) => moderationApi.stats(token, signal), [token]);
  const reports = useFetch((signal) => moderationApi.reports(token, reportStatus, signal), [token, reportStatus]);
  const listings = useFetch((signal) => moderationApi.listings(token, listingStatus, signal), [token, listingStatus]);
  const categories = useFetch((signal) => moderationApi.categories(signal), []);
  const users = useFetch((signal) => (isAdmin ? moderationApi.users(token, signal) : Promise.resolve({ data: [] })), [token, isAdmin]);

  const refreshStats = () => stats.reload();

  const updateReport = async (id, status) => {
    setBusyId(id);
    try {
      await moderationApi.setReportStatus(token, id, status);
      notify(`Жалоба: ${REVIEW_STATUS_LABELS[status].toLowerCase()}`);
      reports.reload();
      refreshStats();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeListing = async (listing) => {
    setBusyId(listing.id);
    try {
      await moderationApi.removeListing(token, listing.id);
      notify('Объявление снято с публикации');
      listings.reload();
      reports.reload();
      refreshStats();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const blockUser = async (id, isBlocked) => {
    setBusyId(id);
    try {
      await moderationApi.blockUser(token, id, isBlocked);
      notify(isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      users.reload();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (id, role) => {
    setBusyId(id);
    try {
      await moderationApi.setUserRole(token, id, role);
      notify('Роль обновлена');
      users.reload();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await moderationApi.createCategory(token, newCategory.trim());
      setNewCategory('');
      categories.reload();
      notify('Категория добавлена');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const removeCategory = async (id) => {
    try {
      await moderationApi.deleteCategory(token, id);
      categories.reload();
      notify('Категория удалена');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const reportRows = reports.data?.data || [];
  const listingRows = listings.data?.data || [];
  const userRows = users.data?.data || [];
  const categoryRows = categories.data?.data || [];
  const openReports = stats.data?.openReports ?? 0;

  return (
    <>
      <Seo
        title={`Модерация | ${SITE_NAME}`}
        description="Панель модерации BookSwap: жалобы, объявления, категории и пользователи."
        path="/moderation"
        noindex
      />

      <div className="container page">
        <div className="mod-layout">
          <div className="mod-hero">
            <div>
              <span className="eyebrow" style={{ color: 'rgba(247,245,240,.7)' }}>
                <span className="dot" /> Роль: {isAdmin ? 'администратор' : 'модератор'}
              </span>
              <h1 style={{ marginTop: 10 }}>Управление платформой</h1>
              <p>Жалобы, объявления, категории{isAdmin ? ' и роли пользователей' : ''} в одном месте.</p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="badge">
                <ShieldCheck size={12} /> {openReports} открытых жалоб
              </span>
              <Link className="btn btn-secondary btn-sm" to="/profile" style={{ background: 'transparent', color: 'var(--paper)', borderColor: 'rgba(247,245,240,.3)' }}>
                <UserCog size={14} /> Профиль
              </Link>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat">
              <strong>{stats.data?.activeListings ?? '—'}</strong>
              <span>активных объявлений</span>
            </div>
            <div className="stat">
              <strong>{stats.data?.users ?? '—'}</strong>
              <span>пользователей</span>
            </div>
            <div className="stat">
              <strong>{openReports}</strong>
              <span>жалоб в работе</span>
            </div>
            <div className="stat">
              <strong>{stats.data?.reviews ?? '—'}</strong>
              <span>отзывов о сделках</span>
            </div>
            <div className="stat">
              <strong>{stats.data?.messages ?? '—'}</strong>
              <span>сообщений</span>
            </div>
          </div>

          <div className="mod-tabs" role="tablist" aria-label="Разделы модерации">
            {TABS.filter((item) => item.key !== 'users' || isAdmin).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.key}
                  role="tab"
                  aria-selected={tab === item.key}
                  className={`chip ${tab === item.key ? 'active' : ''}`.trim()}
                  onClick={() => setTab(item.key)}
                >
                  <Icon size={14} /> {item.label}
                  {item.key === 'reports' && openReports > 0 && <span className="filter-count">{openReports}</span>}
                </button>
              );
            })}
          </div>

          {tab === 'reports' && (
            <section className="mod-section">
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div>
                  <h2>Жалобы на объявления</h2>
                  <p className="hint">Проверьте описание и фото, затем снимите объявление или отклоните жалобу.</p>
                </div>
                <select className="select" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)} style={{ minHeight: 38, width: 'auto' }}>
                  <option value="all">Все статусы</option>
                  <option value="new">Новые</option>
                  <option value="reviewing">В работе</option>
                  <option value="resolved">Решённые</option>
                  <option value="rejected">Отклонённые</option>
                </select>
              </div>

              {reports.loading && !reportRows.length ? (
                <RowsSkeleton count={3} />
              ) : reportRows.length ? (
                reportRows.map((report) => (
                  <div className="report-row" key={report.id}>
                    <span className={`badge ${REPORT_STATUS_CLASS[report.status] || 'soft'}`}>
                      {REVIEW_STATUS_LABELS[report.status] || report.status}
                    </span>
                    <div className="grow">
                      <strong>{report.listingTitle || 'Объявление снято'}</strong>
                      <p>{report.reason}</p>
                      <small>
                        {report.reporter} · {formatDateTime(report.createdAt)}
                        {report.sellerName ? ` · продавец: ${report.sellerName}` : ''}
                      </small>
                    </div>
                    <div className="row-actions">
                      {report.listingId && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeListing({ id: report.listingId })}
                          disabled={busyId === report.listingId}
                        >
                          <Archive size={13} /> Снять
                        </button>
                      )}
                      {report.status !== 'reviewing' && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateReport(report.id, 'reviewing')} disabled={busyId === report.id}>
                          В работу
                        </button>
                      )}
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateReport(report.id, 'resolved')} disabled={busyId === report.id}>
                        <Check size={13} /> Решено
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateReport(report.id, 'rejected')} disabled={busyId === report.id}>
                        Отклонить
                      </button>
                      {report.sellerId && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => blockUser(report.sellerId, true)}>
                          <Ban size={13} /> Блок
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Check} title="Открытых жалоб нет" description="Новые жалобы появятся здесь автоматически." />
              )}
            </section>
          )}

          {tab === 'listings' && (
            <section className="mod-section">
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div>
                  <h2>Объявления</h2>
                  <p className="hint">Последние {listingRows.length} объявлений по выбранному статусу.</p>
                </div>
                <select className="select" value={listingStatus} onChange={(event) => setListingStatus(event.target.value)} style={{ minHeight: 38, width: 'auto' }}>
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="sold">Переданные</option>
                  <option value="archived">Снятые</option>
                </select>
              </div>

              {listings.loading && !listingRows.length ? (
                <RowsSkeleton count={4} />
              ) : listingRows.length ? (
                listingRows.map((listing) => (
                  <div className="listing-admin-row" key={listing.id}>
                    <Cover title={listing.title} author={listing.author} tone={listing.tone} image={listing.coverUrl} />
                    <div className="grow">
                      <Link to={`/listing/${listing.id}`}><strong>{listing.title}</strong></Link>
                      <span>{listing.author} · {listing.price} · {listing.city}</span>
                      <span className="badge soft" style={{ width: 'max-content' }}>
                        {LISTING_STATUS_LABELS[listing.status] || listing.status}
                      </span>
                    </div>
                    <div className="row-actions">
                      {listing.status !== 'archived' && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeListing(listing)}
                          disabled={busyId === listing.id}
                        >
                          <Archive size={13} /> Снять
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Tag} title="Объявлений нет" description="В этом статусе пока нет объявлений." />
              )}
            </section>
          )}

          {tab === 'categories' && (
            <section className="mod-section">
              <h2>Жанры каталога</h2>
              <p className="hint">Категории используются в фильтрах и при размещении объявления.</p>

              <form className="inline-form" onSubmit={addCategory}>
                <input
                  className="input"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Например, Комиксы и манга"
                  maxLength={80}
                />
                <button type="submit" className="btn btn-primary">Добавить</button>
              </form>

              {categories.loading && !categoryRows.length ? (
                <RowsSkeleton count={2} />
              ) : (
                <div className="category-chips">
                  {categoryRows.map((category) => (
                    <button type="button" key={category.id} className="chip" onClick={() => removeCategory(category.id)} title="Удалить категорию">
                      {category.name} <X size={12} />
                    </button>
                  ))}
                  {!categoryRows.length && <p className="text-muted text-small">Категорий нет — добавьте первую.</p>}
                </div>
              )}
            </section>
          )}

          {tab === 'users' && isAdmin && (
            <section className="mod-section">
              <h2>Пользователи</h2>
              <p className="hint">Блокировка запрещает вход и скрывает объявления из витрины.</p>

              {users.loading && !userRows.length ? (
                <RowsSkeleton count={4} />
              ) : (
                userRows.map((item) => (
                  <div className="data-row" key={item.id}>
                    <Avatar name={item.name} src={item.avatarUrl} size="sm" />
                    <div className="grow">
                      <strong>{item.name}</strong>
                      <span>{item.email} · {item.city}{item.isBlocked ? ' · заблокирован' : ''}</span>
                    </div>
                    <div className="row-actions">
                      <select
                        className="select"
                        style={{ minHeight: 34, width: 'auto', fontSize: 12 }}
                        value={item.role}
                        onChange={(event) => changeRole(item.id, event.target.value)}
                        aria-label={`Роль ${item.name}`}
                      >
                        <option value="user">Пользователь</option>
                        <option value="moderator">Модератор</option>
                        <option value="admin">Администратор</option>
                      </select>
                      <button
                        type="button"
                        className={`btn btn-sm ${item.isBlocked ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => blockUser(item.id, !item.isBlocked)}
                        disabled={busyId === item.id}
                      >
                        <Ban size={13} /> {item.isBlocked ? 'Разблокировать' : 'Блокировать'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'users' && !isAdmin && (
            <section className="mod-section">
              <EmptyState icon={ShieldCheck} title="Только для администратора" description="Управление пользователями и ролями доступно администратору платформы." />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
