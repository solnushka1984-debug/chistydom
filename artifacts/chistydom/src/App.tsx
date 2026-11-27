import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, Check, CheckCircle2, Leaf, ShieldCheck, Sparkles, Camera, Shirt, ListChecks, Trash2, X } from 'lucide-react';

// ДЕМО-КОНТАКТЫ — замените на контакты вашей компании.
const PHONE = '8 (800) 000-00-00';
const EMAIL = 'hello@chistydom.example';
// ССЫЛКИ НА СОЦСЕТИ — сейчас ведут на общие главные страницы, их можно заменить.
const TELEGRAM_URL = 'https://t.me/';
const VK_URL = 'https://vk.com/';
// ЦЕНЫ ИЗМЕНЯЮТСЯ ЗДЕСЬ: тарифы за м², доп. услуги и минимальная стоимость.
const RATES = { maintenance: 90, general: 150, renovation: 220 };
const EXTRAS = { windows: 500, furniture: 1500, balcony: 800 };
const MINIMUM_PRICE = 2500;

type CleaningType = keyof typeof RATES;
type ExtraKey = keyof typeof EXTRAS;
type RequestRecord = {
  id: string;
  name: string;
  phone: string;
  address: string;
  cleaningType: CleaningType;
  area: number;
  extras: ExtraKey[];
  quote: number;
  submittedAt: string;
};

const cleaningOptions: { id: CleaningType; name: string; description: string }[] = [
  { id: 'maintenance', name: 'Поддерживающая', description: 'Для чистоты каждую неделю' },
  { id: 'general', name: 'Генеральная', description: 'Когда пора навести порядок' },
  { id: 'renovation', name: 'После ремонта', description: 'Уберём пыль и следы работ' },
];
const extrasOptions: { id: ExtraKey; name: string; price: number }[] = [
  { id: 'windows', name: 'Мытьё окон', price: EXTRAS.windows },
  { id: 'furniture', name: 'Химчистка мебели', price: EXTRAS.furniture },
  { id: 'balcony', name: 'Уборка балкона', price: EXTRAS.balcony },
];
const included = [
  'Протираем все доступные поверхности',
  'Пылесосим и моем полы',
  'Очищаем кухонную плиту снаружи',
  'Моем раковины и смесители',
  'Наводим порядок в ванной комнате',
  'Протираем зеркала и стеклянные поверхности',
  'Собираем и выносим мусор',
  'Меняем мешки в мусорных корзинах',
];
const benefits = [
  { icon: Leaf, title: 'Бережные средства', text: 'Подходят для дома с детьми и питомцами' },
  { icon: Shirt, title: 'Свои салфетки', text: 'Чистый инвентарь для каждого заказа' },
  { icon: Camera, title: 'Фото до и после', text: 'Покажем результат каждого этапа' },
  { icon: ShieldCheck, title: 'Гарантия качества', text: 'Если что-то не так — исправим' },
];
const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const STORAGE_KEY = 'chistydom-demo-requests';

// Заявки лежат в localStorage — их могла записать и более ранняя версия кода,
// поэтому перед выводом проверяем, что запись вообще похожа на заявку.
const isRequestRecord = (value: unknown): value is RequestRecord => {
  const record = value as Partial<RequestRecord> | null;
  return !!record && typeof record.id === 'string' && typeof record.name === 'string'
    && typeof record.phone === 'string' && typeof record.address === 'string'
    && typeof record.area === 'number' && Array.isArray(record.extras)
    && typeof record.quote === 'number' && typeof record.submittedAt === 'string';
};
const readStoredRequests = (): RequestRecord[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isRequestRecord) : [];
  } catch {
    return [];
  }
};
const cleaningTypeName = (id: CleaningType) => cleaningOptions.find((o) => o.id === id)?.name ?? id;
const extraName = (key: ExtraKey) => extrasOptions.find((o) => o.id === key)?.name ?? key;
const formatSubmittedAt = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

function normalizeRussianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const hasPlusSeven = value.trim().startsWith('+7');
  const hasFullCountryPrefix =
    digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
  let subscriberDigits = digits;

  if (hasPlusSeven) {
    subscriberDigits = digits.slice(1);
  } else if (digits === '7' || digits === '8') {
    subscriberDigits = '';
  } else if (hasFullCountryPrefix || (digits.startsWith('8') && digits.length <= 11)) {
    subscriberDigits = digits.slice(1);
  }

  if (subscriberDigits.length === 10) {
    return `+7 (${subscriberDigits.slice(0, 3)}) ${subscriberDigits.slice(3, 6)}-${subscriberDigits.slice(6, 8)}-${subscriberDigits.slice(8)}`;
  }

  return `+7${subscriberDigits ? ` ${subscriberDigits}` : ''}`;
}

function App() {
  const [area, setArea] = useState(54);
  const [cleaningType, setCleaningType] = useState<CleaningType>('maintenance');
  const [extras, setExtras] = useState<ExtraKey[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    setRequests(readStoredRequests());
  }, []);

  // Открытый список: закрываем по Escape и не даём фону скроллиться.
  useEffect(() => {
    if (!showRequests) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowRequests(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [showRequests]);

  const quote = useMemo(() => Math.max(area * RATES[cleaningType], MINIMUM_PRICE) + extras.reduce((sum, key) => sum + EXTRAS[key], 0), [area, cleaningType, extras]);
  const toggleExtra = (key: ExtraKey) => {
    setSaved(false);
    setExtras((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };
  const clearRequests = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRequests([]);
  };
  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError('');
    setSaved(false);
    const phone = normalizeRussianPhone(form.phone);
    setForm((current) => ({ ...current, phone }));
    if (phone.replace(/\D/g, '').length !== 11) {
      setSaveError('Введите номер из 10 цифр после кода +7.');
      return;
    }
    setSaving(true);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RequestRecord[];
      if (!Array.isArray(existing)) throw new Error('Неверный формат данных');
      const request: RequestRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...form,
        phone,
        cleaningType,
        area,
        extras: [...extras],
        quote,
        submittedAt: new Date().toISOString(),
      };
      const next = [...existing, request];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRequests(next);
      setSaved(true);
      setForm({ name: '', phone: '', address: '' });
    } catch {
      setSaveError('Не удалось сохранить заявку в этом браузере. Проверьте настройки хранилища и попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="ЧистыйДом — на главную">
          <span className="brand-mark"><Sparkles size={23} strokeWidth={2.2} /></span>
          <span>чистый<span className="brand-green">дом</span><small>УБОРКА С ЗАБОТОЙ</small></span>
        </a>
        <nav className="header-nav" aria-label="Навигация">
          <a href="#services">Услуги</a><a href="#included">Что входит</a><a href="#about">О нас</a>
        </nav>
        <div className="header-actions"><a className="header-phone" href={`tel:${PHONE.replace(/[^\d+]/g, '')}`}>{PHONE}</a><a className="button button-small" href="#booking">Заказать уборку <ArrowRight size={16} /></a></div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> УЮТ НАЧИНАЕТСЯ С ЧИСТОТЫ</div>
          <h1>Дома чисто.<br /><span>В голове — легко.</span></h1>
          <p className="hero-lede">Профессиональная уборка с понятной ценой — рассчитайте стоимость заранее и выберите только нужное.</p>
          <a className="button hero-button" href="#services">Рассчитать стоимость <ArrowDown size={18} /></a>
          <div className="hero-note"><span className="note-check"><Check size={15} /></span> Никаких сюрпризов в счёте</div>
        </div>
        <div className="hero-art" aria-label="Иллюстрация светлой уютной комнаты">
          <div className="art-sun" /><div className="art-window"><span /><span /><span /><span /></div>
          <div className="art-plant"><i /><i /><i /><i /><b /></div>
          <div className="art-sofa"><div className="sofa-back" /><div className="sofa-seat" /><div className="sofa-arm left" /><div className="sofa-arm right" /><div className="sofa-cushion" /><div className="sofa-leg one" /><div className="sofa-leg two" /></div>
          <div className="art-table"><div className="table-top" /><div className="table-leg" /><div className="vase"><i /></div></div>
          <div className="art-rug" /><div className="art-sparkle sparkle-one" aria-hidden="true" /><div className="art-sparkle sparkle-two" aria-hidden="true" />
          <div className="art-caption"><span className="caption-icon"><Check size={15} /></span><span><b>Чисто до мелочей</b><small>Именно так, как вы любите</small></span></div>
        </div>
      </section>

      <section className="calculator-section" id="services">
        <div className="section-heading">
          <div><div className="eyebrow">ПРОЗРАЧНО С ПЕРВОГО ШАГА</div><h2>Сколько стоит<br className="mobile-break" /> ваша чистота?</h2></div>
          <p>Цена зависит только от площади,<br />типа уборки и выбранных услуг.</p>
        </div>
        <div className="calculator">
          <div className="calculator-form">
            <div className="calc-step"><span className="step-number">01</span><div className="step-content">
              <label className="field-label" htmlFor="area-range">Площадь квартиры <strong>{area} м²</strong></label>
              <input data-testid="input-area" id="area-range" className="range-input" type="range" min="20" max="200" step="1" value={area} onChange={(e) => { setArea(Number(e.target.value)); setSaved(false); }} style={{ '--range-progress': `${((area - 20) / 180) * 100}%` } as CSSProperties} aria-valuetext={`${area} квадратных метров`} />
              <div className="range-labels"><span>20 м²</span><span>200 м²</span></div>
            </div></div>
            <div className="calc-step"><span className="step-number">02</span><fieldset className="step-content fieldset-reset"><legend className="field-label">Вид уборки</legend><div className="cleaning-options">
              {cleaningOptions.map((option) => <label key={option.id} className={`cleaning-option ${cleaningType === option.id ? 'selected' : ''}`}>
                <input data-testid={`radio-cleaning-${option.id}`} type="radio" name="cleaning-type" value={option.id} checked={cleaningType === option.id} onChange={() => { setCleaningType(option.id); setSaved(false); }} />
                <span className="radio-visual" aria-hidden="true">{cleaningType === option.id && <span />}</span>
                <span className="option-copy"><b>{option.name}</b><small>{option.description}</small></span><span className="option-rate">{RATES[option.id]} <small>₽/м²</small></span>
              </label>)}
            </div></fieldset></div>
            <div className="calc-step"><span className="step-number">03</span><fieldset className="step-content fieldset-reset"><legend className="field-label">Добавить к уборке <span className="optional">по желанию</span></legend><div className="extras-options">
              {extrasOptions.map((option) => <label key={option.id} className={`extra-option ${extras.includes(option.id) ? 'selected' : ''}`}>
                <input data-testid={`checkbox-extra-${option.id}`} type="checkbox" checked={extras.includes(option.id)} onChange={() => toggleExtra(option.id)} />
                <span className="check-visual" aria-hidden="true">{extras.includes(option.id) && <Check size={14} />}</span><span>{option.name}</span><b>+{rubles(option.price)}</b>
              </label>)}
            </div></fieldset></div>
          </div>
          <aside className="quote-card" aria-live="polite">
            <div className="quote-top"><span className="quote-kicker">ВАША ПРЕДВАРИТЕЛЬНАЯ ЦЕНА</span><div className="quote-price" data-testid="text-price">{rubles(quote)}</div><p>Точная стоимость фиксируется до начала уборки</p></div>
            <div className="quote-breakdown"><div><span>{cleaningOptions.find((o) => o.id === cleaningType)?.name} · {area} м²</span><b>{rubles(Math.max(area * RATES[cleaningType], MINIMUM_PRICE))}</b></div>{extras.map((key) => <div key={key}><span>{extrasOptions.find((o) => o.id === key)?.name}</span><b>{rubles(EXTRAS[key])}</b></div>)}</div>
            <div className="quote-minimum"><CheckCircle2 size={16} /> Минимальный заказ — {rubles(MINIMUM_PRICE)}</div>
            <a className="button quote-button" href="#booking">Оставить заявку <ArrowRight size={17} /></a>
            <div className="quote-smallprint">Без предоплаты и скрытых доплат</div>
          </aside>
        </div>
      </section>

      <section className="included-section" id="included">
        <div className="included-title"><div className="eyebrow">КАЖДАЯ ДЕТАЛЬ НА СВОЁМ МЕСТЕ</div><h2>Что входит<br />в уборку</h2><p>Работаем по понятному чек-листу — чтобы ни одна мелочь не осталась без внимания.</p><span className="included-count">8 пунктов заботы <ArrowRight size={15} /></span></div>
        <div className="included-list">{included.map((item, index) => <div className="included-item" key={item}><span className="included-index">{String(index + 1).padStart(2, '0')}</span><span>{item}</span><Check size={17} /></div>)}</div>
      </section>

      <section className="benefits-section" id="about">
        <div className="benefits-intro"><div className="eyebrow">ЛЮДИ, КОТОРЫМ МОЖНО ДОВЕРИТЬ ДОМ</div><h2>Чистота —<br />это ещё и <span>спокойствие.</span></h2><p>Приходим вовремя, бережём ваши вещи и отвечаем за результат.</p></div>
        <div className="benefit-grid">{benefits.map(({ icon: Icon, title, text }, index) => <article className="benefit-item" key={title}><span className={`benefit-icon benefit-icon-${index}`}><Icon size={23} strokeWidth={1.8} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="booking-section" id="booking">
        <div className="booking-copy"><div className="eyebrow"><span className="eyebrow-dot" /> ПОРА ВЫДОХНУТЬ</div><h2>Пусть дома<br />станет <span>свежо.</span></h2><p>Оставьте контакты — заявка сохранится в этом браузере.</p><div className="booking-price"><span>Предварительная стоимость</span><b>{rubles(quote)}</b></div></div>
        <form className="booking-form" onSubmit={submitRequest}>
          <h3>Оставить заявку</h3><p>Заполните форму — и мы свяжемся с вами.</p>
          <label htmlFor="customer-name">Ваше имя</label><input data-testid="input-name" id="customer-name" type="text" autoComplete="name" placeholder="Например, Мария" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label htmlFor="customer-phone">Телефон</label><input data-testid="input-phone" id="customer-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" required minLength={6} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={(e) => setForm((current) => ({ ...current, phone: normalizeRussianPhone(e.target.value) }))} aria-describedby={saveError ? 'phone-error' : undefined} />
          <label htmlFor="customer-address">Адрес уборки</label><input data-testid="input-address" id="customer-address" type="text" autoComplete="street-address" placeholder="Улица, дом, квартира" required minLength={4} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {saveError && <div id="phone-error" className="form-error" role="alert">{saveError}</div>}
          {saved && <div data-testid="status-saved" className="form-success" role="status"><CheckCircle2 size={19} /><span><b>Спасибо!</b><small>Заявка сохранена в этом браузере и добавлена в список заявок. В компанию она не отправлена.</small></span></div>}
          <button data-testid="button-submit" className="button submit-button" type="submit" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить заявку'} <ArrowRight size={17} /></button>
          <small className="privacy-note">Демо-форма: заявка сохраняется только на этом устройстве и не отправляется компании.</small>
        </form>
      </section>

      <footer className="site-footer">
        <div className="footer-main"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Sparkles size={22} /></span><span>чистый<span className="brand-green">дом</span><small>УБОРКА С ЗАБОТОЙ</small></span></a><p>Чистота, в которой<br />хорошо жить.</p><div className="footer-contact"><span>ВСЕГДА НА СВЯЗИ</span><a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`}>{PHONE}</a><a href={`mailto:${EMAIL}`}>{EMAIL}</a></div><div className="footer-social"><span>МЫ В СЕТИ</span><div><a href={TELEGRAM_URL} target="_blank" rel="noreferrer">Telegram</a><a href={VK_URL} target="_blank" rel="noreferrer">ВКонтакте</a></div></div></div>
        <div className="footer-bottom"><span>© 2026 ЧистыйДом. Демо-сайт.</span><span>Заявки сохраняются только в вашем браузере.</span><button type="button" className="footer-requests" data-testid="button-open-requests" onClick={() => setShowRequests(true)}><ListChecks size={12} /> Сохранённые заявки{requests.length > 0 ? ` (${requests.length})` : ''}</button><a href="#home">Наверх ↑</a></div>
      </footer>

      {showRequests && (
        <div className="requests-overlay" onClick={(event) => { if (event.currentTarget === event.target) setShowRequests(false); }}>
          <div className="requests-modal" role="dialog" aria-modal="true" aria-labelledby="requests-title" data-testid="requests-modal">
            <div className="requests-head">
              <div><span className="eyebrow">ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ЭТОГО БРАУЗЕРА</span><h3 id="requests-title">Сохранённые заявки <small>{requests.length}</small></h3></div>
              <button type="button" className="requests-close" data-testid="button-close-requests" onClick={() => setShowRequests(false)} aria-label="Закрыть список заявок"><X size={16} /></button>
            </div>
            {requests.length === 0 ? (
              <p className="requests-empty">Пока ни одной заявки. Заполните форму выше — она появится здесь. Ничего не уходит на почту и в CRM: демо-режим.</p>
            ) : (
              <>
                <ul className="requests-list">
                  {[...requests].reverse().map((item) => (
                    <li className="request-row" key={item.id}>
                      <div className="request-main">
                        <b>{item.name}</b>
                        <a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a>
                        <span>{item.address}</span>
                      </div>
                      <div className="request-price">{rubles(item.quote)}</div>
                      <div className="request-meta">
                        <span>{cleaningTypeName(item.cleaningType)} · {item.area} м²</span>
                        {(item.extras?.length ?? 0) > 0 && <span>{item.extras.map(extraName).join(', ')}</span>}
                        <span>{formatSubmittedAt(item.submittedAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="requests-actions">
                  <button type="button" className="requests-clear" data-testid="button-clear-requests" onClick={clearRequests}><Trash2 size={13} /> Удалить все заявки</button>
                  <button type="button" className="button button-small" onClick={() => setShowRequests(false)}>Закрыть</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
