import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Download, Expand, Grid2X2, NotebookPen, X } from 'lucide-react';
import { deck, SIZE } from './deck.mjs';
import './styles.css';

const storageKey = 'zhan-event-ideas-v3';
const clamp = (n) => Math.max(0, Math.min(n, deck.length - 1));
function initialSlide() {
  const value = new URLSearchParams(location.search).get('slide');
  if (value !== null && /^\d+$/.test(value)) return clamp(Number(value) - 1);
  try {
    const saved = localStorage.getItem(storageKey);
    return saved !== null && /^\d+$/.test(saved) ? clamp(Number(saved)) : 0;
  } catch { return 0; }
}

function Scene({ slide, thumbnail = false }) {
  return <article className={`scene${thumbnail ? ' scene--thumb' : ''}`} style={{ background: slide.background }} aria-label={slide.title}>
    {slide.elements.map((el, i) => {
      const position = { left: el.x, top: el.y, width: el.w, height: el.h };
      if (el.kind === 'shape') return <div key={i} className="shape" aria-hidden="true" style={{ ...position, background: el.fill }} />;
      if (el.kind === 'image') return <img key={i} className="slide-image" src={`${import.meta.env.BASE_URL}assets/${el.file}`} alt={el.alt} style={position} draggable="false" />;
      const Tag = el.href && !thumbnail ? 'a' : el.role === 'heading' ? 'h2' : 'p';
      return <Tag key={i} className={`slide-text slide-text--${el.role}`} href={Tag === 'a' ? el.href : undefined}
        target={Tag === 'a' && !el.href.startsWith('mailto:') ? '_blank' : undefined} rel={Tag === 'a' ? 'noopener noreferrer' : undefined}
        style={{ ...position, color: el.color, fontSize: el.size, fontFamily: el.font, fontWeight: el.bold ? 700 : 400, textAlign: el.align }}>{el.text}</Tag>;
    })}
  </article>;
}

function Presentation() {
  const [active, setActive] = useState(initialSlide);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState('');
  const [isFullscreen, setFullscreen] = useState(false);
  const overview = useRef(null);
  const notes = useRef(null);
  const touch = useRef(null);
  const panelTrigger = useRef(null);
  const nav = useCallback((index) => {
    const next = clamp(index);
    setActive(next);
    try { localStorage.setItem(storageKey, String(next)); } catch { /* Optional persistence. */ }
    const url = new URL(location.href);
    url.searchParams.set('slide', String(next + 1));
    history.replaceState({}, '', url);
  }, []);
  const openPanel = (name) => { panelTrigger.current = document.activeElement; setPanel(name); };
  const closePanel = () => { setPanel(null); panelTrigger.current?.focus(); };

  useEffect(() => {
    const resize = () => {
      const width = window.visualViewport?.width ?? innerWidth;
      const height = window.visualViewport?.height ?? innerHeight;
      const full = Boolean(document.fullscreenElement);
      const compact = height < 520;
      const paddingX = full ? 0 : width < 760 ? 20 : 64;
      const paddingY = full ? 0 : compact ? 82 : width < 760 ? 128 : 160;
      const scale = Math.max(.04, Math.min((width - paddingX) / SIZE.width, (height - paddingY) / SIZE.height));
      document.documentElement.style.setProperty('--deck-scale', scale);
      document.documentElement.style.setProperty('--stage-width', `${SIZE.width * scale}px`);
      document.documentElement.style.setProperty('--stage-height', `${SIZE.height * scale}px`);
      setFullscreen(full);
    };
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      document.removeEventListener('fullscreenchange', resize);
    };
  }, []);
  useEffect(() => { document.title = `${deck[active].title} — Жан Бейсикеев`; }, [active]);
  useEffect(() => {
    for (const [name, ref] of [['overview', overview], ['notes', notes]]) {
      if (panel === name && !ref.current.open) ref.current.showModal();
      else if (panel !== name && ref.current.open) ref.current.close();
    }
  }, [panel]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const restore = () => setActive(initialSlide());
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    const printVisibility = (printing) => document.querySelectorAll('.slide-shell').forEach((el, index) => {
      el.toggleAttribute('inert', !printing && index !== active);
      el.setAttribute('aria-hidden', String(!printing && index !== active));
    });
    const before = () => printVisibility(true);
    const after = () => printVisibility(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, [active]);

  const fullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice('Полный экран недоступен в этом браузере.');
    } catch { setNotice('Браузер не разрешил полный экран.'); }
  }, []);
  const print = async () => {
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, img => img.decode()));
      window.print();
    } catch { setNotice('Не удалось загрузить изображение для печати. Попробуйте ещё раз.'); }
  };
  useEffect(() => {
    const onKey = (event) => {
      if (panel || event.altKey || event.metaKey || event.ctrlKey || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        if (event.key === 'Home') nav(0);
        else if (event.key === 'End') nav(deck.length - 1);
        else nav(active + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1));
      } else if (event.target.closest?.('button, a')) return;
      else if (event.key === ' ') { event.preventDefault(); nav(active + (event.shiftKey ? -1 : 1)); }
      else if (key === 'f' || key === 'а') { event.preventDefault(); fullscreen(); }
      else if (key === 'g' || key === 'п') { event.preventDefault(); openPanel('overview'); }
      else if (key === 'n' || key === 'т') { event.preventDefault(); openPanel('notes'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, panel, nav, fullscreen]);

  return <div className={`viewer${isFullscreen ? ' is-fullscreen' : ''}`}>
    <header className="viewer-header screen-only">
      <a className="wordmark" href="https://mfhonley.com" title="Личный сайт" target="_blank" rel="noopener noreferrer">mfhonley<span> / </span>present</a>
      <span className="keyboard-hint">← → листать <span>·</span> F полный экран <span>·</span> G обзор <span>·</span> N что рассказать</span>
    </header>
    <main className="deck" aria-label="Чекпойнты выступления Жана Бейсикеева"
      onTouchStart={(event) => {
        touch.current = event.touches.length === 1 && !event.target.closest('button, a')
          ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
      }}
      onTouchCancel={() => { touch.current = null; }}
      onTouchEnd={(event) => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) nav(active + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}>
      {deck.map((slide, index) => <section key={index} className={`slide-shell${active === index ? ' is-active' : ''}`}
        data-slide={index + 1} aria-hidden={active !== index} inert={active !== index ? '' : undefined}>
        <Scene slide={slide} />
      </section>)}
    </main>
    <footer className="viewer-footer screen-only">
      <div className="slide-caption"><span>{deck[active].section}</span><p aria-live="polite">{deck[active].title}</p></div>
      <nav className="controls" aria-label="Управление презентацией">
        <button onClick={() => openPanel('overview')} title="Все слайды (G)" aria-label="Все слайды"><Grid2X2 /></button>
        <button onClick={() => openPanel('notes')} title="Что рассказать (N)" aria-label="Что рассказать"><NotebookPen /></button>
        <i />
        <button onClick={() => nav(active - 1)} disabled={active === 0} title="Предыдущий слайд" aria-label="Предыдущий слайд"><ArrowLeft /></button>
        <span className="counter"><strong>{String(active + 1).padStart(2, '0')}</strong><span>/ {deck.length}</span></span>
        <button onClick={() => nav(active + 1)} disabled={active === deck.length - 1} title="Следующий слайд" aria-label="Следующий слайд"><ArrowRight /></button>
        <i />
        <button onClick={fullscreen} title="Полный экран (F)" aria-label="Полный экран" aria-pressed={isFullscreen}><Expand /></button>
        <button onClick={print} title="Печать / сохранить PDF" aria-label="Сохранить в PDF"><Download /></button>
      </nav>
    </footer>
    <div className="progress screen-only" aria-hidden="true"><span style={{ width: `${(active + 1) / deck.length * 100}%` }} /></div>
    {notice && <div className="notice screen-only" role="status">{notice}</div>}
    <dialog ref={overview} className="overview screen-only" onCancel={closePanel} aria-labelledby="overview-title">
      <header className="panel-header"><div><span>ЖАН БЕЙСИКЕЕВ / ~20 МИНУТ</span><h1 id="overview-title">Все слайды</h1></div><button onClick={closePanel} aria-label="Закрыть обзор"><X /></button></header>
      <div className="overview-grid">{deck.map((slide, index) => <button key={index} className={`thumbnail${index === active ? ' is-current' : ''}`}
        onClick={() => { nav(index); closePanel(); }} aria-label={`Слайд ${index + 1}. ${slide.title}`} aria-current={active === index ? 'true' : undefined}>
        <div className="thumbnail-image" aria-hidden="true"><Scene slide={slide} thumbnail /></div>
        <span><b>{String(index + 1).padStart(2, '0')}</b>{slide.title}</span>
      </button>)}</div>
    </dialog>
    <dialog ref={notes} className="notes screen-only" onCancel={closePanel} aria-labelledby="notes-title">
      <header className="panel-header"><div><span>ЧЕКПОЙНТ · {active + 1} / {deck.length}</span><h1 id="notes-title">{deck[active].title}</h1></div><button onClick={closePanel} aria-label="Закрыть чекпойнт"><X /></button></header>
      <p className="notes-timing">Ориентир: {Math.floor(deck[active].seconds / 60)}:{String(deck[active].seconds % 60).padStart(2, '0')} мин</p>
      <p className="notes-copy">{deck[active].notes}</p>
      <details><summary>Источники и контекст</summary><p>{deck[active].sources.split(/(https:\/\/\S+)/g).map((part, i) => part.startsWith('https://') ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part)}</p></details>
      <nav className="notes-nav" aria-label="Переключение заметок"><button disabled={active === 0} onClick={() => nav(active - 1)}><ArrowLeft size={18} /> Назад</button><button disabled={active === deck.length - 1} onClick={() => nav(active + 1)}>Далее <ArrowRight size={18} /></button></nav>
    </dialog>
  </div>;
}

createRoot(document.getElementById('root')).render(<Presentation />);
