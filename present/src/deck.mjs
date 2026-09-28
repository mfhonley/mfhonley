// Short visual checkpoints. The talk itself stays with the speaker.
import { talkingPoints, formatNotes } from './talking-points.mjs';
export const SIZE = { width: 1280, height: 720 };
export const FONT = 'Arial';
export const MONO = 'Courier New';
export const C = { black: '#111111', white: '#FFFFFF', gray: '#707070', line: '#D9D9D9' };
const article = 'https://digitalbusiness.kz/2026-04-21/shkolnik-iz-pavlodara-v-15-let-uzhe-zarabatival-500-tisyach-tenge-a-v-17-uspeshno-prodal-startap/';
const profile = 'README.md · llms.txt (04.09.2026) · Zhan_Beissikeyev_Resume.docx';
export const deck = [];
let slide, ink, muted;

function text(value, x, y, w, size = 28, options = {}) {
  const { color = ink, bold = false, mono = false, role = 'body', leading = 1.08, align = 'left', href } = options;
  value.split('\n').forEach((line, index) => slide.elements.push({
    kind: 'text', text: line, x, y: y + index * size * leading, w, h: size * 1.22,
    size, color, bold, font: mono ? MONO : FONT, role, align, href,
  }));
}
function begin(title, section, { notes = '', sources = profile, seconds = 90 } = {}) {
  ink = C.black;
  muted = C.gray;
  slide = { title, section, background: C.white, elements: [], notes, sources, seconds };
  deck.push(slide);
  text(section.toUpperCase(), 64, 48, 1152, 14, { mono: true, color: muted, role: 'header' });
  slide.elements.push({ kind: 'shape', x: 64, y: 640, w: 1152, h: 1, fill: C.line });
  text('@mfhonley', 64, 662, 650, 13, { mono: true, color: muted, role: 'footer' });
  text('', 1116, 662, 100, 13, { mono: true, color: muted, align: 'right', role: 'slide-number' });
}
function heading(value, { x = 60, y = 219, w = 1156, size = 112 } = {}) {
  text(value, x, y, w, size, { bold: true, role: 'heading' });
}
function cue(value, y = 532) { text(value, 68, y, 1148, 29, { color: muted, role: 'cue' }); }

begin('hello', 'Знакомство', {
  seconds: 30, notes: 'Приветствие',
});
slide.elements = [];
heading('hello', { y: 245, size: 140 });

begin('Опыт', 'Мой путь', {
  seconds: 180, notes: 'nFactorial (edutech) · Финтех · Фильм',
  sources: `${profile}\n${article}\nСкриншот фильма предоставлен Жаном: public/assets/film.png.`,
});
heading('Опыт', { y: 126, w: 540, size: 104 });
text('nFactorial (edutech)', 68, 325, 520, 43);
text('Финтех', 68, 414, 520, 43);
text('Фильм', 68, 503, 520, 43);
slide.elements.push({ kind: 'image', file: 'film.png', x: 650, y: 197, w: 566, h: 407,
  alt: 'Скриншот фильма «Как я построил ИИ стартап за 7 дней?» — Жан с табличкой MVP.' });

begin('Как я пришёл к идее.', 'Мой путь', {
  notes: 'Знакомая сфера · своя проблема · MindZan', sources: `${profile}\n${article}`,
});
heading('Как я пришёл\nк идее.', { y: 181, size: 104 });
cue('Ментальная арифметика → MindZan');

const editorial = 'Предлагаемый разбор для выступления. Общие примеры — условные; они не описывают реальные интервью или функции MindZan.';

begin('Как искать идею?', '01 / Где искать', { sources: `${editorial}\nОтправная точка — знакомые проблемы: https://paulgraham.com/startupideas.html` });
heading('Как искать\nидею?', { y: 181, size: 116 });
cue('Работа / учёба / свой опыт');

begin('Что людям нужно?', '02 / Найти проблему', { sources: editorial });
heading('Что людям\nнужно?', { y: 181, size: 116 });
cue('Что повторяется? / Что мешает? / Что теряют?');

begin('Разберись в сфере.', '03 / Набрать опыт', { sources: editorial });
heading('Разберись\nв сфере.', { y: 181, size: 116 });
cue('Попробуй сам / поработай рядом / спроси эксперта');

begin('Ресерч.', '04 / Проверить понимание', { sources: editorial });
heading('Ресерч.', { y: 220, size: 140 });
cue('Люди / реальный процесс / существующие решения');

begin('Проверь на практике.', '05 / Первый тест', { sources: editorial });
heading('Проверь\nна практике.', { y: 189, size: 105 });
cue('Дай попробовать / посмотри / улучши');

begin('Вопросы.', 'На связи', {
  seconds: 45, notes: 'Вопросы · общение',
});
heading('Вопросы.', { y: 216, size: 139 });
text('@mfhonley', 69, 447, 1147, 49, { href: 'https://t.me/mfhonley', role: 'contact' });

// 6 minutes of personal story, 11 minutes of idea work, 3 for questions.
const timings = [30, 180, 150, 120, 120, 120, 165, 135, 180];
if (deck.length !== talkingPoints.length || deck.length !== timings.length) throw new Error('Slides, notes and timing must stay in sync.');
deck.forEach((item, i) => {
  item.seconds = timings[i];
  item.talkingPoints = talkingPoints[i];
  item.notes = formatNotes(talkingPoints[i]);
  const pageNumber = item.elements.find(el => el.role === 'slide-number');
  if (pageNumber) pageNumber.text = `${String(i + 1).padStart(2, '0')} / ${deck.length}`;
});
