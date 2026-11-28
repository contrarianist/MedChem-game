import React, { useMemo, useRef, useState } from 'react';
import { Grid3X3, Sparkles } from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';

interface CrosswordWord {
  id: string;
  direction: 'across' | 'down';
  code: string;
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
}

const ROWS = 12;
const COLS = 15;

const CROSSWORD_WORDS: CrosswordWord[] = [
  {
    id: 'a1',
    direction: 'across',
    code: '۱ افقی (۱→)',
    clue: 'پیش‌ساز ۲۷ کربنه تمام هورمون‌های استروئیدی که برش زنجیره جانبی آن اولین گام استروئیدوژنز در میتوکندری است (۱۱ حرف)',
    answer: 'CHOLESTEROL',
    startRow: 0,
    startCol: 0,
  },
  {
    id: 'd1',
    direction: 'down',
    code: '۱ عمودی (۱↓)',
    clue: 'آندروژن کلیدی ۱۹ کربنه که هم پیش‌ساز مستقیم 5α-DHT و هم سوبسترای آنزیم آروماتاز برای تولید استرادیول است (۱۲ حرف)',
    answer: 'TESTOSTERONE',
    startRow: 0,
    startCol: 6,
  },
  {
    id: 'a2',
    direction: 'across',
    code: '۲ افقی (۲→)',
    clue: 'گلوکوکورتیکوئید طبیعی اصلی بخش قشری آدرنال با گروه 11β-OH و زنجیره کتول روی C17 (۸ حرف)',
    answer: 'CORTISOL',
    startRow: 4,
    startCol: 5,
  },
  {
    id: 'a3',
    direction: 'across',
    code: '۳ افقی (۳→)',
    clue: 'قوی‌ترین استروژن طبیعی بدن با حلقه A آروماتیک و دو گروه هیدروکسیل روی C3 و C17β (۹ حرف)',
    answer: 'ESTRADIOL',
    startRow: 7,
    startCol: 6,
  },
];

// نگاشت خانه‌های شماره‌دار ۱ تا ۱۴ به مختصات (row, col) برای استخراج رمز CORTICOSTEROID
const NUMBERED_SLOTS: { slot: number; row: number; col: number }[] = [
  { slot: 1, row: 0, col: 0 },   // C
  { slot: 2, row: 0, col: 2 },   // O
  { slot: 3, row: 0, col: 8 },   // R
  { slot: 4, row: 0, col: 6 },   // T
  { slot: 5, row: 4, col: 9 },   // I
  { slot: 6, row: 4, col: 5 },   // C
  { slot: 7, row: 4, col: 11 },  // O
  { slot: 8, row: 2, col: 6 },   // S
  { slot: 9, row: 3, col: 6 },   // T
  { slot: 10, row: 7, col: 6 },  // E
  { slot: 11, row: 8, col: 6 },  // R
  { slot: 12, row: 9, col: 6 },  // O
  { slot: 13, row: 7, col: 12 }, // I
  { slot: 14, row: 7, col: 11 }, // D
];

const keyOf = (r: number, c: number) => `${r},${c}`;

interface Props {
  disabled?: boolean;
  solved?: boolean;
  onPasswordExtracted: (password: string) => void;
}

/**
 * جدول کلمات متقاطع ۲بعدی واقعی (افقی و عمودی) اتاق مخفی دکتر ارول.
 * هیچ‌یک از جواب‌ها در متن راهنما نوشته نشده‌اند و دانشجو با پر کردن مستقیم خانه‌های جدول،
 * رمز ۱۴ حرفی را از خانه‌های شماره‌دار ۱ تا ۱۴ استخراج می‌کند.
 */
export const BiosynthesisCrossword: React.FC<Props> = ({
  disabled = false,
  solved = false,
  onPasswordExtracted,
}) => {
  const { activeCells, startBadges, slotMap, solvedValues } = useMemo(() => {
    const active = new Map<string, string>();
    const badges = new Map<string, string[]>();
    const slots = new Map<string, number>();

    CROSSWORD_WORDS.forEach((w) => {
      const startKey = keyOf(w.startRow, w.startCol);
      const list = badges.get(startKey) || [];
      list.push(w.direction === 'across' ? `${w.code.charAt(0)}→` : `${w.code.charAt(0)}↓`);
      badges.set(startKey, list);

      for (let i = 0; i < w.answer.length; i++) {
        const r = w.direction === 'across' ? w.startRow : w.startRow + i;
        const c = w.direction === 'across' ? w.startCol + i : w.startCol;
        active.set(keyOf(r, c), w.answer[i]);
      }
    });

    NUMBERED_SLOTS.forEach((s) => {
      slots.set(keyOf(s.row, s.col), s.slot);
    });

    const initialSolved: Record<string, string> = {};
    active.forEach((letter, k) => {
      initialSolved[k] = letter;
    });

    return { activeCells: active, startBadges: badges, slotMap: slots, solvedValues: initialSolved };
  }, []);

  const [cells, setCells] = useState<Record<string, string>>(() =>
    solved ? solvedValues : {}
  );
  const [activeWordId, setActiveWordId] = useState<string>('a1');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeWord = CROSSWORD_WORDS.find((w) => w.id === activeWordId) || CROSSWORD_WORDS[0];

  const isCellInActiveWord = (r: number, c: number) => {
    for (let i = 0; i < activeWord.answer.length; i++) {
      const wr = activeWord.direction === 'across' ? activeWord.startRow : activeWord.startRow + i;
      const wc = activeWord.direction === 'across' ? activeWord.startCol + i : activeWord.startCol;
      if (wr === r && wc === c) return true;
    }
    return false;
  };

  const extractSlots = (current: Record<string, string>) =>
    NUMBERED_SLOTS.map((s) => (current[keyOf(s.row, s.col)] || '').toUpperCase());

  const handleCellChange = (r: number, c: number, raw: string) => {
    if (disabled || solved) return;
    const cleaned = raw.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(-1);
    const next = { ...cells, [keyOf(r, c)]: cleaned };
    setCells(next);

    const extracted = extractSlots(next);
    if (extracted.every((ch) => ch !== '')) {
      onPasswordExtracted(extracted.join(''));
    }

    // حرکت خودکار به خانه بعدی در راستای کلمه فعال
    if (cleaned) {
      const nextR = activeWord.direction === 'down' ? r + 1 : r;
      const nextC = activeWord.direction === 'across' ? c + 1 : c;
      const nextInput = inputRefs.current[keyOf(nextR, nextC)];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !cells[keyOf(r, c)]) {
      const prevR = activeWord.direction === 'down' ? r - 1 : r;
      const prevC = activeWord.direction === 'across' ? c - 1 : c;
      const prevInput = inputRefs.current[keyOf(prevR, prevC)];
      if (prevInput) prevInput.focus();
    }
  };

  const focusWord = (w: CrosswordWord) => {
    setActiveWordId(w.id);
    const firstInput = inputRefs.current[keyOf(w.startRow, w.startCol)];
    if (firstInput) firstInput.focus();
  };

  const extractedLetters = extractSlots(cells);

  return (
    <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 sm:p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#18181B] pb-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-heading font-bold text-[#18181B]">
          <Grid3X3 className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>جدول کلمات متقاطع مجله علمی روی گاوصندوق (افقی و عمودی)</span>
        </div>
        <span className="text-[11px] font-bold text-[#52525B]">
          روی هر خانه کلیک کن و با حروف انگلیسی پر کن
        </span>
      </div>

      {/* راهنمای افقی و عمودی بدون لو دادن جواب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {CROSSWORD_WORDS.map((w) => {
          const isSelected = w.id === activeWordId;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => focusWord(w)}
              className={`text-right rounded-[6px] border-2 border-[#18181B] p-3 text-xs leading-6 transition ${
                isSelected ? 'bg-[#0D9488] text-white' : 'bg-[#FFFFFF] text-[#18181B] hover:bg-[#F7F5F0]'
              }`}
            >
              <span
                className={`font-extrabold ml-1.5 px-1.5 py-0.5 rounded-[4px] border border-[#18181B] ${
                  isSelected ? 'bg-[#FFFFFF] text-[#18181B]' : 'bg-[#FEF3C7] text-[#18181B]'
                }`}
              >
                {w.code}
              </span>
              <span>{w.clue}</span>
            </button>
          );
        })}
      </div>

      {/* شبکه ۲بعدی واقعی جدول کلمات متقاطع */}
      <div dir="ltr" className="overflow-x-auto pb-2">
        <div
          className="inline-grid gap-1 p-3 rounded-[8px] border-2 border-[#18181B] molecule-dot-grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(26px, 32px))` }}
        >
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((__, c) => {
              const k = keyOf(r, c);
              if (!activeCells.has(k)) {
                return <div key={k} className="w-7 h-8 sm:w-8 sm:h-9" />;
              }

              const slotNum = slotMap.get(k);
              const startBadge = startBadges.get(k);
              const val = cells[k] || '';
              const inActive = isCellInActiveWord(r, c);

              return (
                <div
                  key={k}
                  className={`relative w-7 h-8 sm:w-8 sm:h-9 rounded-[4px] border-2 transition ${
                    slotNum
                      ? 'border-[#E11D48] bg-[#FFE4E6]'
                      : inActive
                      ? 'border-[#0D9488] bg-[#CCFBF1]'
                      : 'border-[#18181B] bg-[#FFFFFF]'
                  }`}
                >
                  {startBadge && (
                    <span className="absolute -top-2 -left-1 px-1 rounded bg-[#18181B] text-white text-[8px] font-bold leading-tight pointer-events-none z-10">
                      {startBadge.join('/')}
                    </span>
                  )}
                  {slotNum && (
                    <span className="absolute -bottom-1.5 -right-1 px-1 rounded bg-[#E11D48] text-white text-[8px] font-mono font-bold leading-tight pointer-events-none z-10">
                      {slotNum}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[k] = el;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    disabled={disabled || solved}
                    value={val}
                    aria-label={`خانه سطر ${r + 1} ستون ${c + 1}`}
                    onFocus={() => {
                      const belonging = CROSSWORD_WORDS.find((w) => {
                        for (let i = 0; i < w.answer.length; i++) {
                          const wr = w.direction === 'across' ? w.startRow : w.startRow + i;
                          const wc = w.direction === 'across' ? w.startCol + i : w.startCol;
                          if (wr === r && wc === c) return true;
                        }
                        return false;
                      });
                      if (belonging && !isCellInActiveWord(r, c)) {
                        setActiveWordId(belonging.id);
                      }
                    }}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(r, c, e)}
                    className="w-full h-full bg-transparent text-center font-mono text-xs sm:text-sm font-extrabold uppercase text-[#18181B] focus:outline-none"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* نوار استخراج رمز ۱۴ حرفی از خانه‌های قرمز ۱ تا ۱۴ */}
      <div className="rounded-[8px] border-2 border-[#18181B] bg-[#FFFFFF] p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#E11D48]">
          <Sparkles className="w-4 h-4" />
          <span>رمز {toPersianDigits(14)} حرفی استخراج‌شده از خانه‌های شماره‌دار قرمز ({toPersianDigits(1)} تا {toPersianDigits(14)}):</span>
        </div>
        <div dir="ltr" className="flex flex-wrap gap-1 justify-center">
          {extractedLetters.map((ch, i) => (
            <div
              key={i}
              className="w-7 h-9 rounded-[4px] border-2 border-[#18181B] bg-[#FEF3C7] flex flex-col items-center justify-center"
            >
              <span className="text-[8px] font-mono text-[#E11D48] font-bold leading-none">{i + 1}</span>
              <span className="font-mono text-xs font-extrabold text-[#18181B] leading-tight">
                {ch || '·'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
