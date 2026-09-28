import fs from 'node:fs/promises';
import { deck } from '../src/deck.mjs';

const duration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const sections = deck.map((slide, i) => {
  const { anchor, points, example, transition } = slide.talkingPoints;
  return [
    `## ${String(i + 1).padStart(2, '0')}. ${slide.title} · ${duration(slide.seconds)}`,
    `**Вспомнить:** ${anchor}.`,
    points.map(point => `- ${point}`).join('\n'),
    example ? `**Пример для объяснения:** ${example}` : '',
    transition ? `**Переход:** ${transition}` : '',
  ].filter(Boolean).join('\n\n');
});
const output = [
  '# Жан Бейсикеев — что рассказать',
  `Около ${deck.reduce((total, slide) => total + slide.seconds, 0) / 60} минут. Время можно свободно перераспределить; ориентир для каждого слайда указан ниже.`,
  'Это опоры для рассказа своими словами. Биографические факты взяты из твоих материалов; выводы, переходы и условные примеры предложены для выступления. Слайды остаются коротким фоном.',
  '**Главная мысль:** «Идея MindZan появилась там, где встретились мой опыт в ментальной арифметике и навык разработки. Чтобы решать проблему, нужно понимать человека и его задачу».',
  '**Цепочка для памяти:** мой опыт → как пришёл к идее → где искать → потребность → понимание сферы → ресерч → проверка.',
  ...sections,
  '## Перед выходом на сцену',
  'Вспомни три настоящих эпизода: одну задачу из рабочего опыта; ситуацию из ментальной арифметики; момент, когда захотел сделать свой продукт. Свои детали добавят истории конкретики. При нехватке времени сократи примеры, сохрани блок о понимании проблемы.',
  '## Основа',
  '- Личный профиль: README.md, llms.txt от 04.09.2026, резюме.\n- [Интервью Digital Business](https://digitalbusiness.kz/2026-04-21/shkolnik-iz-pavlodara-v-15-let-uzhe-zarabatival-500-tisyach-tenge-a-v-17-uspeshno-prodal-startap/): хронология, первые центры, сделка.\n- [Paul Graham — How to Get Startup Ideas](https://paulgraham.com/startupideas.html): отправная точка для поиска в знакомых задачах. Конкретные упражнения и примеры выше — предлагаемый разбор для этого выступления.',
].join('\n\n') + '\n';
const path = new URL('../speaker-notes.md', import.meta.url);
await fs.writeFile(path, output);
console.log(path.pathname);
