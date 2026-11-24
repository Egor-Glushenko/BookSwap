import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Lock, Mail, MapPin, UserRound } from 'lucide-react';
import { useAuth } from '../shared/auth';
import { useToast } from '../shared/toast';
import { Seo } from '../shared/seo';
import { Field } from '../components/Field';
import { Cover } from '../components/Cover';
import { SITE_NAME } from '../shared/constants';

export function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(location.state?.message || '');

  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setError(location.state?.message || '');
  }, [location.state]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (isRegister && (!privacy || !terms)) {
      setError('Подтвердите согласие с документами');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    setBusy(true);
    try {
      if (isRegister) {
        await register({ email, password, name: name.trim(), city: city.trim() });
        notify('Аккаунт создан. Добро пожаловать!');
      } else {
        await login(email, password);
        notify('Вы вошли в BookSwap');
      }
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title={isRegister ? `Регистрация | ${SITE_NAME}` : `Вход | ${SITE_NAME}`}
        description={isRegister
          ? 'Создайте аккаунт BookSwap: размещайте книги, общайтесь с покупателями и оставляйте отзывы.'
          : 'Войдите в BookSwap, чтобы размещать объявления, писать продавцам и сохранять книги в избранное.'}
        path={isRegister ? '/register' : '/login'}
      />

      <div className="container auth-page">
        <div className="auth-visual">
          <div>
            <span className="eyebrow">
              <span className="dot" /> BookSwap
            </span>
            <h1 style={{ marginTop: 16 }}>
              Ваши книги.<br />
              <em>В одном месте.</em>
            </h1>
          </div>

          <div className="auth-covers" aria-hidden="true">
            <Cover title="Классика" author="На полке" tone="blue" />
            <Cover title="Фантастика" author="На полке" tone="orange" />
            <Cover title="Детские" author="На полке" tone="green" />
          </div>

          <div className="quote">
            <strong>Читатели BookSwap передают истории дальше</strong>
            <span>«Отдала три полки книг за неделю. Приятнее, чем продавать на площадках» — Елена, Москва</span>
            <div className="row">
              <BookOpen size={15} />
              <span>Размещение бесплатно · без комиссии · встроенный чат</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="row" style={{ gap: 8 }}>
            <span className="brand-mark" style={{ width: 34, height: 34, borderRadius: 11 }}>
              <BookOpen size={16} />
            </span>
            <span className="eyebrow">BOOKSWAP ACCOUNT</span>
          </div>

          <h2>{isRegister ? 'Создайте книжный дом' : 'С возвращением'}</h2>
          <p>
            {isRegister
              ? 'Только email и пароль — остальное можно заполнить позже в профиле.'
              : 'Войдите, чтобы размещать книги, писать продавцам и сохранять избранное.'}
          </p>

          <form className="auth-form" onSubmit={submit} noValidate>
            {isRegister && (
              <Field label="Имя" htmlFor="name">
                <div className="input-group">
                  <UserRound size={16} />
                  <input
                    id="name"
                    className="input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Как к вам обращаться"
                    autoComplete="name"
                    maxLength={80}
                  />
                </div>
              </Field>
            )}

            <Field label={isRegister ? 'Email' : 'Email или специальный логин'} htmlFor="email">
              <div className="input-group">
                <Mail size={16} />
                <input
                  id="email"
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type={isRegister ? 'email' : 'text'}
                  autoComplete={isRegister ? 'email' : 'username'}
                  autoFocus
                  required
                />
              </div>
            </Field>

            <Field label="Пароль" htmlFor="password" hint={isRegister ? 'минимум 8 символов' : undefined}>
              <div className="input-group">
                <Lock size={16} />
                <input
                  id="password"
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
              </div>
            </Field>

            {isRegister && (
              <Field label="Город" htmlFor="city" hint="можно изменить позже">
                <div className="input-group">
                  <MapPin size={16} />
                  <input
                    id="city"
                    className="input"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Москва"
                    autoComplete="address-level2"
                    maxLength={80}
                  />
                </div>
              </Field>
            )}

            {isRegister && (
              <div className="stack" style={{ gap: 8 }}>
                <label className="checkbox">
                  <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
                  <span>
                    Принимаю <a href="/privacy-policy.html" target="_blank" rel="noreferrer">политику конфиденциальности</a>
                  </span>
                </label>
                <label className="checkbox">
                  <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                  <span>
                    Принимаю <a href="/terms-of-use.html" target="_blank" rel="noreferrer">условия пользования</a>
                  </span>
                </label>
              </div>
            )}

            {error && <p className="alert" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? 'Проверяем…' : isRegister ? 'Создать аккаунт' : 'Войти'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? (
              <>Уже есть аккаунт? <Link to="/login" state={location.state}>Войти</Link></>
            ) : (
              <>Нет аккаунта? <Link to="/register" state={location.state}>Зарегистрироваться</Link></>
            )}
          </p>

          {import.meta.env.DEV && (
            <p className="demo-hint">
              Демо-режим: <code>anna@bookswap.local</code> / <code>demo12345</code>.
              Служебные аккаунты входят по логинам <code>admin</code> и <code>moderator</code> из <code>.env</code>.
            </p>
          )}

          {!import.meta.env.DEV && (
            <p className="demo-hint">
              Администратор и модератор входят только по специальной паре логин/пароль.
            </p>
          )}


        </div>
      </div>
    </>
  );
}
