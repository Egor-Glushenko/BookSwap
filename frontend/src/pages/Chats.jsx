import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MessageCircle, Send } from 'lucide-react';
import { chatsApi } from '../shared/api';
import { useFetch, useInterval } from '../shared/hooks';
import { useAuth } from '../shared/auth';
import { useToast } from '../shared/toast';
import { useUnread } from '../shared/notifications';
import { Seo } from '../shared/seo';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { RowsSkeleton } from '../components/Skeletons';
import { SITE_NAME } from '../shared/constants';
import { chatDay, countLabel, formatTime } from '../shared/format';

export function ChatsPage() {
  const { user, token } = useAuth();
  const { notify } = useToast();
  const { refresh: refreshUnread } = useUnread();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = Number(searchParams.get('chat')) || null;

  const chats = useFetch((signal) => chatsApi.list(token, signal), [token]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);

  const chatList = chats.data?.data || [];
  const activeChat = chatList.find((chat) => chat.id === activeChatId) || null;

  const loadMessages = useCallback(async (chatId, { silent = false } = {}) => {
    if (!chatId) return;
    if (!silent) setMessagesLoading(true);
    try {
      const result = await chatsApi.messages(token, chatId);
      setMessages(result.data);
      const last = result.data[result.data.length - 1];
      lastIdRef.current = last?.id || 0;
      refreshUnread();
    } catch (error) {
      if (!silent) notify(error.message, 'error');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, [token, notify, refreshUnread]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    loadMessages(activeChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, token]);

  useInterval(() => {
    if (activeChatId && document.visibilityState === 'visible') {
      loadMessages(activeChatId, { silent: true });
    }
  }, activeChatId ? 5000 : null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const selectChat = (chatId) => {
    setSearchParams({ chat: String(chatId) });
    setMessages([]);
    lastIdRef.current = 0;
  };

  const send = async (event) => {
    event?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChatId || sending) return;
    setSending(true);
    try {
      const result = await chatsApi.send(token, activeChatId, trimmed);
      setMessages((current) => [...current, result.data]);
      setText('');
      chats.reload();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Seo
        title={`Сообщения | ${SITE_NAME}`}
        description="Переписка с продавцами и покупателями на BookSwap."
        path="/chats"
        noindex
      />

      <div className="container page">
        <div className="page-head">
          <span className="eyebrow"><span className="dot" /> Переписка</span>
          <h1>Сообщения</h1>
          <p className="lede">Договаривайтесь о встрече прямо здесь — история переписки сохраняется.</p>
        </div>

        <div className="chat-shell">
          <div className={`chat-list ${activeChat ? 'hidden-mobile' : ''}`.trim()}>
            <div className="chat-list-head">
              <h1>Диалоги</h1>
              <span className="text-muted text-small">{chatList.length ? countLabel(chatList.length, 'диалог', 'диалога', 'диалогов') : 'Пока нет диалогов'}</span>
            </div>

            <div className="chat-items">
              {chats.loading && !chatList.length ? (
                <div style={{ padding: 10 }}><RowsSkeleton count={4} /></div>
              ) : chatList.length ? (
                chatList.map((chat) => (
                  <button
                    type="button"
                    className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`.trim()}
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                  >
                    <Avatar name={chat.participant} src={chat.participantAvatar} />
                    <div className="grow">
                      <strong>{chat.participant}</strong>
                      <span>{chat.listingTitle}</span>
                      <small>{chat.lastMessage || 'Нет сообщений'}</small>
                    </div>
                    {chat.unread > 0 && <span className="unread">{chat.unread}</span>}
                  </button>
                ))
              ) : (
                <p className="text-muted text-small" style={{ padding: 14 }}>
                  Напишите продавцу с карточки книги — диалог появится здесь.
                </p>
              )}
            </div>
          </div>

          {activeChat ? (
            <div className="chat-thread">
              <div className="chat-thread-head">
                <button
                  type="button"
                  className="icon-button mobile-back"
                  onClick={() => setSearchParams({})}
                  aria-label="Назад к списку чатов"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={activeChat.participant} src={activeChat.participantAvatar} />
                <div className="grow">
                  <strong>{activeChat.participant}</strong>
                  <span>
                    <Link to={`/listing/${activeChat.listingId}`}>{activeChat.listingTitle}</Link>
                  </span>
                </div>
                <Link className="icon-button" to={`/listing/${activeChat.listingId}`} aria-label="Открыть объявление">
                  <ChevronRight size={18} />
                </Link>
              </div>

              <div className="chat-messages">
                {messagesLoading && !messages.length && <div className="loading-block"><span className="spinner" /> Загружаем переписку…</div>}
                {!messagesLoading && !messages.length && (
                  <div className="chat-empty">
                    <div>
                      <MessageCircle size={26} style={{ margin: '0 auto 8px' }} />
                      <p>Сообщений пока нет. Напишите первым — расскажите, что хотите уточнить.</p>
                    </div>
                  </div>
                )}
                {messages.map((message, index) => {
                  const day = chatDay(message.createdAt);
                  const previousDay = index > 0 ? chatDay(messages[index - 1].createdAt) : null;
                  return (
                    <div key={message.id} style={{ display: 'contents' }}>
                      {day !== previousDay && <span className="chat-day">{day}</span>}
                      <div className={`message ${message.senderId === user.id ? 'own' : ''}`.trim()}>
                        {message.text}
                        <time>{formatTime(message.createdAt)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form className="chat-composer" onSubmit={send}>
                <input
                  className="input"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Написать сообщение…"
                  maxLength={2000}
                  aria-label="Сообщение"
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={sending || !text.trim()} aria-label="Отправить">
                  <Send size={17} />
                </button>
              </form>
            </div>
          ) : (
            <div className="chat-thread">
              <div className="chat-empty">
                <EmptyState
                  icon={MessageCircle}
                  title="Выберите диалог"
                  description="Здесь появится переписка с продавцом: обсудите состояние книги, место встречи и доставку."
                  action={<Link className="btn btn-secondary" to="/catalog">Найти книгу</Link>}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
