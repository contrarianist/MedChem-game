import React, { useMemo, useState } from 'react';
import {
  Droplets,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Layers,
  RotateCcw,
  PhoneCall,
  ScrollText,
} from 'lucide-react';
import { SteroidMoleculeSVG } from '../molecules/SteroidMoleculeSVG';
import { MoleculeStructureCard } from '../molecules/MoleculeStructureCard';
import { SteroidSandbox } from '../molecules/SteroidSandbox';
import { ProgressiveHintBox } from './ProgressiveHintBox';
import { usePuzzleTimer } from '../../utils/usePuzzleTimer';
import { deterministicShuffle } from '../../utils/shuffle';
import { toPersianDigits } from '../../utils/persian';

interface RouteCompound {
  id: string;
  blindLabel: string;
  revealedName: string;
  revealedNote: string;
  smiles: string;
}

const ROUTE_COMPOUNDS: RouteCompound[] = [
  {
    id: '1',
    blindLabel: 'ترکیب ۱',
    revealedName: 'دگزامتازون (سیستمیک)',
    revealedNote: 'دارای Δ1، فلوئور 9α، متیل 16α و هیدروکسیل آزاد C21',
    smiles: 'C[C@@H]1C[C@H]2[C@@H]3CCC4=CC(=O)C=C[C@]4(C)[C@@]3(F)[C@@H](O)C[C@]2(C)[C@@]1(O)C(=O)CO',
  },
  {
    id: '2',
    blindLabel: 'ترکیب ۲',
    revealedName: 'فلوسینولون استونید (موضعی)',
    revealedNote: 'کتال حلقوی استونید 16α,17α + دو فلوئور با نفوذ پوستی بالا',
    smiles: 'CC1(C)O[C@@H]2C[C@H]3[C@@H]4C[C@H](F)C5=CC(=O)C=C[C@]5(C)[C@@]4(F)[C@@H](O)C[C@]3(C)[C@@]2(O1)C(=O)CO',
  },
  {
    id: '3',
    blindLabel: 'ترکیب ۳',
    revealedName: 'بکلومتازون دی‌پروپیونات (استنشاقی)',
    revealedNote: 'دارای کلر 9α، متیل 16β و دو استر پروپیونات در C17/C21',
    smiles: 'CCC(=O)OCC(=O)[C@@]1(OC(=O)CC)[C@@H](C)C[C@H]2[C@@H]3CCC4=CC(=O)C=C[C@]4(C)[C@@]3(Cl)[C@@H](O)C[C@@]12C',
  },
  {
    id: '4',
    blindLabel: 'ترکیب ۴',
    revealedName: 'بودزوناید (استنشاقی)',
    revealedNote: 'استال نامتقارن بوتیرآلدهید روی C16,C17 با کلیرانس کبدی بالا',
    smiles: 'CCCC1O[C@@H]2C[C@H]3[C@@H]4CCC5=CC(=O)C=C[C@]5(C)[C@H]4[C@@H](O)C[C@]3(C)[C@@]2(O1)C(=O)CO',
  },
  {
    id: '5',
    blindLabel: 'ترکیب ۵',
    revealedName: 'پردنیزولون (سیستمیک)',
    revealedNote: 'هسته Δ1,4 با هیدروکسیل آزاد 11β، 17α و C21 بدون استر لیپوفیل',
    smiles: 'C[C@]12C=CC(=O)C=C1CC[C@@H]3[C@@H]2[C@@H](O)C[C@]4(C)[C@H]3CC[C@]4(O)C(=O)CO',
  },
  {
    id: '6',
    blindLabel: 'ترکیب ۶',
    revealedName: 'آلکلومتازون دی‌پروپیونات (موضعی)',
    revealedNote: 'دارای کلر 7α، متیل 16α و دی‌پروپیونات C17/C21 برای مصرف پوستی',
    smiles: 'CCC(=O)OCC(=O)[C@@]1(OC(=O)CC)[C@H](C)C[C@H]2[C@@H]3[C@H](Cl)CC4=CC(=O)C=C[C@]4(C)[C@H]3[C@@H](O)C[C@@]12C',
  },
  {
    id: '7',
    blindLabel: 'ترکیب ۷',
    revealedName: 'آمسینوناید (موضعی)',
    revealedNote: 'کتال سیکلوپنتیلیدن 16α,17α + استات C21 با لیپوفیلیته موضعی بالا',
    smiles: 'CC(=O)OCC(=O)[C@@]12OC3(CCCC3)O[C@@H]1C[C@H]4[C@@H]5CCC6=CC(=O)C=C[C@]6(C)[C@@]5(F)[C@@H](O)C[C@@]24C',
  },
  {
    id: '8',
    blindLabel: 'ترکیب ۸',
    revealedName: 'متیل‌پردنیزولون (سیستمیک)',
    revealedNote: 'هیدروکسیل آزاد C21 و متیل 6α برای مصرف خوراکی/سیستمیک',
    smiles: 'C[C@H]1C[C@H]2[C@@H]3CC[C@](O)(C(=O)CO)[C@@]3(C)C[C@H](O)[C@@H]2[C@@]4(C)C=CC(=O)C=C14',
  },
  {
    id: '9',
    blindLabel: 'ترکیب ۹',
    revealedName: 'فلوتیکازون پروپیونات (استنشاقی)',
    revealedNote: 'تیواستر فلوئورومتیل در C17β + دو فلوئور با متابولیسم کبدی بسیار سریع',
    smiles: 'CCC(=O)O[C@@]1(C(=O)SCF)[C@H](C)C[C@H]2[C@@H]3C[C@H](F)C4=CC(=O)C=C[C@]4(C)[C@@]3(F)[C@@H](O)C[C@@]12C',
  },
];

type BucketKey = 'systemic' | 'topical' | 'inhalation';

interface Props {
  arrowsSolved: boolean;
  routesSolved: boolean;
  onSubmitPuzzle: (
    puzzleCode: string,
    answer: unknown,
    elapsedSeconds: number
  ) => Promise<{ correct: boolean; feedback: string }>;
  onBackToMap: () => void;
}

export const MineralocorticoidLab: React.FC<Props> = ({
  arrowsSolved,
  routesSolved,
  onSubmitPuzzle,
  onBackToMap,
}) => {
  const [arrows, setArrows] = useState<{
    anti_inflammatory: 'up' | 'down' | '';
    half_life: 'up' | 'down' | '';
    mineralocorticoid: 'up' | 'down' | '';
  }>(
    arrowsSolved
      ? { anti_inflammatory: 'up', half_life: 'up', mineralocorticoid: 'down' }
      : { anti_inflammatory: '', half_life: '', mineralocorticoid: '' }
  );
  const arrowTimer = usePuzzleTimer(true, arrowsSolved);
  const [arrowFeedback, setArrowFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [arrowLoading, setArrowLoading] = useState(false);

  // گام ۲ تعاملی: کاهش اثر مینرال ترکیب کژتاب روی میز کار
  const [letterTokens, setLetterTokens] = useState<string[]>(routesSolved ? ['mineral_reduced'] : []);
  const [letterSolved, setLetterSolved] = useState<boolean>(routesSolved);
  const [letterFeedback, setLetterFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [phoneAnswered, setPhoneAnswered] = useState(routesSolved);
  const [buckets, setBuckets] = useState<Record<BucketKey, string[]>>(
    routesSolved
      ? { systemic: ['1', '5', '8'], topical: ['2', '6', '7'], inhalation: ['3', '4', '9'] }
      : { systemic: [], topical: [], inhalation: [] }
  );
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const routeTimer = usePuzzleTimer(arrowsSolved && letterSolved && phoneAnswered, routesSolved);
  const [routeFeedback, setRouteFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const shuffledCompounds = useMemo(
    () => deterministicShuffle(ROUTE_COMPOUNDS, 'mc-route-cards-v3'),
    []
  );

  const handleArrowSubmit = async () => {
    setArrowLoading(true);
    setArrowFeedback(null);
    const elapsed = arrowTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('effect_arrows', arrows, elapsed);
      setArrowFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setArrowFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setArrowLoading(false);
    }
  };

  const handleVerifyLetterReduction = () => {
    if (letterTokens.includes('mineral_reduced')) {
      setLetterSolved(true);
      setLetterFeedback({
        ok: true,
        text: 'آفرین! اثر مینرالوکورتیکوئیدی ترکیب کژتاب با حفظ هسته ضدالتهابی کاهش یافت. ناگهان تلفن میز زهتاب زنگ می‌خورد...',
      });
    } else {
      setLetterFeedback({
        ok: false,
        text: 'اثر مینرالوکورتیکوئیدی هنوز بالاست یا هسته فعال ضدالتهابی (11β-OH / کتول) آسیب دیده است. روی میز کار ساختار را اصلاح کن و دوباره بررسی کن.',
      });
    }
  };

  const assignToBucket = (bucket: BucketKey, id: string) => {
    if (routesSolved) return;
    setBuckets((prev) => {
      const cleaned: Record<BucketKey, string[]> = {
        systemic: prev.systemic.filter((x) => x !== id),
        topical: prev.topical.filter((x) => x !== id),
        inhalation: prev.inhalation.filter((x) => x !== id),
      };
      cleaned[bucket] = [...cleaned[bucket], id];
      return cleaned;
    });
    setSelectedChip(null);
  };

  const removeFromBucket = (bucket: BucketKey, id: string) => {
    if (routesSolved) return;
    setBuckets((prev) => ({
      ...prev,
      [bucket]: prev[bucket].filter((x) => x !== id),
    }));
  };

  const assignedIds = [...buckets.systemic, ...buckets.topical, ...buckets.inhalation];

  const handleRouteSubmit = async () => {
    setRouteLoading(true);
    setRouteFeedback(null);
    const elapsed = routeTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('route_classification', buckets, elapsed);
      setRouteFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setRouteFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="lab-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] font-heading font-bold text-lg">
            <Droplets className="w-6 h-6" />
            <span>اتاق گوله نمک — اتاق پروفسور زهتاب (مینرالوکورتیکوئیدها)</span>
          </div>
          <p className="text-[#52525B] text-xs sm:text-sm mt-1 leading-6">
            پروفسور زهتاب، برادر پروفسور کژتاب، برخلاف برادرش رفت سراغ مینرالوکورتیکوئیدها و کنترل آب و نمک بدن...
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToMap}
          className="btn-tactile btn-tactile-surface self-start md:self-center px-4 py-2 text-xs"
        >
          بازگشت به نقشه کارخانه
        </button>
      </div>

      {/* گام ۱: مقایسه متیل‌پردنیزولون (۱) نسبت به پردنیزولون (۲) */}
      <div className="lab-card p-6 space-y-5">
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(1)}: برای ورود به اتاق، این دو ساختار رو با هم مقایسه کن و فلش‌هاشونو بزن
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SteroidMoleculeSVG
            name={arrowsSolved ? 'ساختار ۱ — متیل‌پردنیزولون' : 'ساختار ۱'}
            formulaNote={arrowsSolved ? 'دارای پیوند دوگانه Δ1 و متیل 6α' : undefined}
            hasDelta1
            c6AlphaSub="CH3"
          />
          <SteroidMoleculeSVG
            name={arrowsSolved ? 'ساختار ۲ — پردنیزولون' : 'ساختار ۲'}
            formulaNote={arrowsSolved ? 'دارای پیوند دوگانه Δ1 بدون متیل 6α' : undefined}
            hasDelta1
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'anti_inflammatory' as const, label: 'اثر ضدالتهابی ترکیب ۱ نسبت به ۲' },
            { key: 'half_life' as const, label: 'نیمه‌عمر ترکیب ۱ نسبت به ۲' },
            { key: 'mineralocorticoid' as const, label: 'اثر مینرالوکورتیکوئید ترکیب ۱ نسبت به ۲' },
          ].map((item) => (
            <div key={item.key} className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 space-y-3">
              <div className="text-xs font-bold text-[#18181B]">{item.label}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={arrowsSolved}
                  onClick={() => setArrows((p) => ({ ...p, [item.key]: 'up' }))}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border-2 border-[#18181B] flex items-center justify-center gap-1 transition ${
                    arrows[item.key] === 'up'
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#FFFFFF] text-[#18181B]'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" /> افزایش (↑)
                </button>
                <button
                  type="button"
                  disabled={arrowsSolved}
                  onClick={() => setArrows((p) => ({ ...p, [item.key]: 'down' }))}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-bold border-2 border-[#18181B] flex items-center justify-center gap-1 transition ${
                    arrows[item.key] === 'down'
                      ? 'bg-[#E11D48] text-white'
                      : 'bg-[#FFFFFF] text-[#18181B]'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" /> کاهش (↓)
                </button>
              </div>
            </div>
          ))}
        </div>

        <ProgressiveHintBox
          solved={arrowsSolved}
          hints={[
            'تفاوت اصلی این دو ساختار را روی حلقه B پیدا کن و اثر آن را بر متابولیسم و انتخاب‌پذیری گیرنده بسنج.',
            'بررسی کن افزودن یک استخلاف آلکیلی در حلقه B چه تغییری در نیمه‌عمر، فعالیت ضدالتهابی و احتباس سدیم ایجاد می‌کند.',
          ]}
        />

        {arrowFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              arrowFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {arrowFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{arrowFeedback.text}</span>
          </div>
        )}

        {!arrowsSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={arrowLoading || !arrows.anti_inflammatory || !arrows.half_life || !arrows.mineralocorticoid}
              onClick={handleArrowSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {arrowLoading ? 'در حال بررسی...' : 'باز کردن در اتاق گوله نمک'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۲ (تعاملی): نامه کژتاب به زهتاب — اصلاح ساختار برای کاهش اثر مینرال */}
      {arrowsSolved && (
        <div className="space-y-4">
          <div className="lab-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-[#18181B]">
              <ScrollText className="w-5 h-5 text-[#F59E0B]" />
              <span>گام {toPersianDigits(2)}: نامه پروفسور کژتاب روی میز زهتاب</span>
            </div>
            <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FEF3C7] p-3.5 text-xs leading-7 text-[#18181B]">
              «زهتاب جان، می‌دونم از من دلخوری. راست می‌گی، من اشتباه کردم رفتم سراغ گلوکو... ولی الان فرصت ندارم حرفامو بزنم. یه چیزی می‌خوام ازت: <strong>اثر مینرال ترکیبم رو کم کن!</strong>»
            </div>

            <SteroidSandbox
              mode="mineral_reduce"
              disabled={!arrowsSolved}
              solved={letterSolved}
              onTokensChange={setLetterTokens}
            />

            <ProgressiveHintBox
              solved={letterSolved}
              hints={[
                'اتم فلوئور در موقعیت 9α هم قدرت گلوکوکورتیکوئیدی و هم احتباس سدیم را به‌شدت بالا می‌برد.',
                'فکر کن چه استخلافی روی حلقه D (یا حذف کدام اتم) می‌تواند اثر مینرالوکورتیکوئیدی را بدون از بین بردن خاصیت ضدالتهابی مهار کند.',
              ]}
            />

            {letterFeedback && (
              <div
                className={`rounded-[6px] border-2 border-[#18181B] p-3 text-xs sm:text-sm font-bold flex items-start gap-2 ${
                  letterFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
                }`}
              >
                {letterFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
                <span>{letterFeedback.text}</span>
              </div>
            )}

            {!letterSolved && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleVerifyLetterReduction}
                  className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
                >
                  ثبت اصلاح ساختار و بررسی اثر مینرال
                </button>
              </div>
            )}
          </div>

          {letterSolved && (
            <div
              className={`lab-card p-5 space-y-3 transition ${
                phoneAnswered ? 'bg-[#DCFCE7]' : 'bg-[#FFE4E6]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#E11D48]">
                  <PhoneCall className="w-4 h-4" />
                  <span>{phoneAnswered ? 'تماس تلفنی شنود شد!' : 'تلفن میز زهتاب داره زنگ می‌خوره!'}</span>
                </div>
                {!phoneAnswered && (
                  <button
                    type="button"
                    onClick={() => setPhoneAnswered(true)}
                    className="btn-tactile btn-tactile-crimson px-3.5 py-1.5 text-xs"
                  >
                    برداشتن گوشی 📞
                  </button>
                )}
              </div>
              {phoneAnswered ? (
                <p className="text-xs leading-7 text-[#18181B]">
                  صدای ناشناس پشت خط: <strong>«قراره اهریمن رو موضعی بسازیم...»</strong>
                  <br />
                  <span className="text-[#0D9488] font-bold">
                    همکار پشت بی‌سیم: یعنی دکتر ارول نمی‌خواد کل بدن رو درگیر کنه، فقط یه نقطه خاص! توی چرک‌نویسای دکتر ترکیبات رو جدا کن تا موضعی‌ها رو پیدا کنی.
                  </span>
                </p>
              ) : (
                <p className="text-xs text-[#52525B]">
                  زود گوشی رو بردار و ببین کی پشت خطه!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* گام ۳: چرک‌نویس ۹ ترکیب */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          arrowsSolved && letterSolved && phoneAnswered ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#18181B] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0D9488]" />
            <span>گام {toPersianDigits(3)}: جداسازی چرک‌نویس ترکیبات زهتاب (سیستمیک، موضعی، استنشاقی)</span>
          </h3>
          {!routesSolved && assignedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setBuckets({ systemic: [], topical: [], inhalation: [] })}
              className="btn-tactile btn-tactile-surface px-3 py-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> بازنشانی سبدها
            </button>
          )}
        </div>

        <p className="text-xs text-[#52525B] leading-6">
          هر کدوم از {toPersianDigits(9)} ساختار زیر رو با <strong>Drag & Drop</strong> (یا کلیک روی کارت و سپس سبد مقصد) توی دسته خودش بذار:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shuffledCompounds
            .filter((c) => !assignedIds.includes(c.id))
            .map((comp) => (
              <div
                key={comp.id}
                draggable={!routesSolved}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', comp.id)}
                onClick={() => setSelectedChip(selectedChip === comp.id ? null : comp.id)}
                className={`rounded-[8px] transition cursor-pointer ${
                  selectedChip === comp.id ? 'ring-2 ring-[#0D9488]' : ''
                }`}
              >
                <MoleculeStructureCard
                  smiles={comp.smiles}
                  label={comp.blindLabel}
                  revealed={routesSolved}
                  revealedName={comp.revealedName}
                  revealedNote={comp.revealedNote}
                  compact
                />
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {(
            [
              { key: 'systemic', title: 'سبد ۱: سیستمیک (خوراکی/تزریقی)' },
              { key: 'topical', title: 'سبد ۲: موضعی (پوستی)' },
              { key: 'inhalation', title: 'سبد ۳: استنشاقی (تنفسی)' },
            ] as const
          ).map((b) => (
            <div
              key={b.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) assignToBucket(b.key, id);
              }}
              onClick={() => {
                if (selectedChip) assignToBucket(b.key, selectedChip);
              }}
              className="min-h-[170px] rounded-[8px] border-2 border-dashed border-[#71717A] bg-[#EFECE6] p-4 space-y-2.5"
            >
              <div className="text-xs font-bold text-[#18181B]">{b.title}</div>
              <div className="space-y-2">
                {buckets[b.key].map((id) => {
                  const item = ROUTE_COMPOUNDS.find((c) => c.id === id)!;
                  return (
                    <div
                      key={id}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromBucket(b.key, id);
                      }}
                      className="rounded-[6px] bg-[#FFFFFF] border-2 border-[#18181B] p-2 text-xs text-[#18181B] cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {item.blindLabel}
                          {routesSolved ? ` — ${item.revealedName}` : ''}
                        </span>
                        {!routesSolved && <span className="text-[#E11D48] text-xs font-bold">×</span>}
                      </div>
                      {routesSolved && (
                        <div className="text-[11px] text-[#16A34A]">{item.revealedNote}</div>
                      )}
                    </div>
                  );
                })}
                {buckets[b.key].length === 0 && (
                  <div className="text-[11px] text-[#52525B] pt-4 text-center">
                    ساختارها را اینجا رها کن
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <ProgressiveHintBox
          solved={routesSolved}
          disabled={!arrowsSolved || !letterSolved || !phoneAnswered}
          hints={[
            'تفاوت اصلی مسیرهای تجویز در میزان لیپوفیلیته، نوع استرها/کتال‌ها روی حلقه D و سرعت غیرفعال‌سازی کبدی است.',
            'ساختارهای با هیدروکسیل آزاد و قطبی‌تر برای مصرف سیستمیک، استونیدها/کتال‌های حلقوی و دی‌استرهای پوستی برای موضعی، و استال‌های نامتقارن یا تیواسترهای با کلیرانس سریع برای استنشاقی به کار می‌روند.',
          ]}
        />

        {routeFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              routeFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {routeFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{routeFeedback.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          {routesSolved ? (
            <button
              type="button"
              onClick={onBackToMap}
              className="btn-tactile btn-tactile-emerald px-6 py-2.5 text-sm"
            >
              ذخیره سرنخ دوم (اهریمن موضعی است) و بازگشت ←
            </button>
          ) : (
            <button
              type="button"
              disabled={routeLoading || assignedIds.length < 9}
              onClick={handleRouteSubmit}
              className="btn-tactile btn-tactile-primary px-6 py-2.5 text-sm"
            >
              {routeLoading ? 'در حال بررسی...' : 'تایید دسته‌بندی و کشف سرنخ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
