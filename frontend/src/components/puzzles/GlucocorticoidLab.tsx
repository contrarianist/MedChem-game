import React, { useState } from 'react';
import {
  FlaskConical,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Sparkles,
  Mail,
} from 'lucide-react';
import { SteroidMoleculeSVG, SteroidRenderProps } from '../molecules/SteroidMoleculeSVG';
import { SteroidSandbox } from '../molecules/SteroidSandbox';
import { ProgressiveHintBox } from './ProgressiveHintBox';
import { usePuzzleTimer } from '../../utils/usePuzzleTimer';
import { deterministicShuffle } from '../../utils/shuffle';
import { toPersianDigits } from '../../utils/persian';

interface CompoundCard {
  id: string;
  blindLabel: string;
  revealedName: string;
  revealedNote: string;
  props: SteroidRenderProps;
}

const COMPOUNDS: CompoundCard[] = [
  {
    id: '1',
    blindLabel: 'ساختار ۱',
    revealedName: 'کورتیزون (Cortisone)',
    revealedNote: 'دارای گروه 11-کتو (پیش‌دارو، نیازمند تبدیل به 11β-OH)',
    props: { has11BetaOH: false, has11Keto: true, hasDelta1: false, has9AlphaF: false },
  },
  {
    id: '2',
    blindLabel: 'ساختار ۲',
    revealedName: 'هیدروکورتیزون (Hydrocortisone)',
    revealedNote: 'ساختار پایه با 11β-OH (قدرت مرجع = ۱)',
    props: { has11BetaOH: true, hasDelta1: false, has9AlphaF: false },
  },
  {
    id: '3',
    blindLabel: 'ساختار ۳',
    revealedName: 'تریامسینولون (Triamcinolone)',
    revealedNote: 'دارای Δ1 + فلوئور 9α + هیدروکسیل 16α',
    props: { has11BetaOH: true, hasDelta1: true, has9AlphaF: true, c16Sub: 'alpha-OH' },
  },
  {
    id: '4',
    blindLabel: 'ساختار ۴',
    revealedName: 'متیل‌پردنیزولون (Methylprednisolone)',
    revealedNote: 'دارای پیوند دوگانه Δ1 و متیل 6α',
    props: { has11BetaOH: true, hasDelta1: true, has9AlphaF: false, c6AlphaSub: 'CH3' },
  },
  {
    id: '5',
    blindLabel: 'ساختار ۵',
    revealedName: 'بتامتازون / دگزامتازون',
    revealedNote: 'دارای Δ1 + فلوئور 9α + متیل در C16 (بیشترین قدرت)',
    props: { has11BetaOH: true, hasDelta1: true, has9AlphaF: true, c16Sub: 'beta-CH3' },
  },
  {
    id: '6',
    blindLabel: 'ساختار ۶',
    revealedName: 'پردنیزولون (Prednisolone)',
    revealedNote: 'دارای پیوند دوگانه Δ1 و 11β-OH (قدرت ۴ برابر کورتیزول)',
    props: { has11BetaOH: true, hasDelta1: true, has9AlphaF: false },
  },
];

const INITIAL_SHUFFLED_ORDER = deterministicShuffle(['1', '2', '3', '4', '5', '6'], 'gc-potency-order-v3');

interface Props {
  conformationSolved: boolean;
  sarSolved: boolean;
  onSubmitPuzzle: (
    puzzleCode: string,
    answer: unknown,
    elapsedSeconds: number
  ) => Promise<{ correct: boolean; feedback: string }>;
  onBackToMap: () => void;
}

export const GlucocorticoidLab: React.FC<Props> = ({
  conformationSolved,
  sarSolved,
  onSubmitPuzzle,
  onBackToMap,
}) => {
  const [conf, setConf] = useState<{ H8: 'alpha' | 'beta' | ''; H9: 'alpha' | 'beta' | ''; H14: 'alpha' | 'beta' | '' }>(
    conformationSolved
      ? { H8: 'beta', H9: 'alpha', H14: 'alpha' }
      : { H8: '', H9: '', H14: '' }
  );
  const confTimer = usePuzzleTimer(true, conformationSolved);
  const [confFeedback, setConfFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [confLoading, setConfLoading] = useState(false);

  const [order, setOrder] = useState<string[]>(
    sarSolved ? ['5', '3', '4', '6', '2', '1'] : INITIAL_SHUFFLED_ORDER
  );
  const sarTimer = usePuzzleTimer(conformationSolved, sarSolved);
  const [sarFeedback, setSarFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sarLoading, setSarLoading] = useState(false);
  const [showWallSandbox, setShowWallSandbox] = useState(true);

  const handleConfSubmit = async () => {
    setConfLoading(true);
    setConfFeedback(null);
    const elapsed = confTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('conformation_lock', conf, elapsed);
      setConfFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setConfFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setConfLoading(false);
    }
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    if (sarSolved) return;
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  const handleSarSubmit = async () => {
    setSarLoading(true);
    setSarFeedback(null);
    const elapsed = sarTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('sar_potency_sort', order, elapsed);
      setSarFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setSarFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setSarLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="lab-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] font-heading font-bold text-lg">
            <FlaskConical className="w-6 h-6" />
            <span>اتاق چنگال استرس — اتاق پروفسور کژتاب (گلوکوکورتیکوئیدها)</span>
          </div>
          <p className="text-[#52525B] text-xs sm:text-sm mt-1 leading-6">
            پروفسور کژتاب (برادر زهتاب) وسوسه شد روی مشتقات کورتیزول کار کنه، اما اولین نسخه اهریمن به هیپوکامپ خودش آسیب زد و حافظه کوتاه‌مدتش رو از دست داد...
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

      {/* گام ۱: صفحه لمسی روی در اتاق */}
      <div className="lab-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#18181B] flex items-center gap-2">
            {conformationSolved ? (
              <Unlock className="w-5 h-5 text-[#16A34A]" />
            ) : (
              <Lock className="w-5 h-5 text-[#F59E0B]" />
            )}
            <span>گام {toPersianDigits(1)}: قفل لمسی در اتاق (آرایش هیدروژن‌ها)</span>
          </h3>
          <span
            className={`lab-badge text-xs px-2.5 py-0.5 ${
              conformationSolved ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FEF3C7] text-[#18181B]'
            }`}
          >
            {conformationSolved ? 'در اتاق باز شد ✓' : 'قفل لمسی فعال'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#52525B] leading-7">
          روی درِ اتاق یه صفحه لمسی با ساختار پایه گلوکوکورتیکوئید هست. باید جهت درست سه هیدروژن روی اتصالات حلقه‌ها (<strong>H8، H9 و H14</strong>) رو تنظیم کنی تا قفل باز شه:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['H8', 'H9', 'H14'] as const).map((key) => (
            <div
              key={key}
              className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-[#0D9488]">{key}</span>
                <span className="text-[11px] text-[#52525B] font-semibold">
                  {key === 'H8' ? 'اتصال B/C (کربن ۸)' : key === 'H9' ? 'اتصال B/C (کربن ۹)' : 'اتصال C/D (کربن ۱۴)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={conformationSolved}
                  onClick={() => setConf((p) => ({ ...p, [key]: 'alpha' }))}
                  className={`py-2 rounded-[6px] text-xs font-bold border-2 border-[#18181B] transition ${
                    conf[key] === 'alpha' ? 'bg-[#0D9488] text-white' : 'bg-[#FFFFFF] text-[#18181B]'
                  }`}
                >
                  آلفا (α - خط‌چین)
                </button>
                <button
                  type="button"
                  disabled={conformationSolved}
                  onClick={() => setConf((p) => ({ ...p, [key]: 'beta' }))}
                  className={`py-2 rounded-[6px] text-xs font-bold border-2 border-[#18181B] transition ${
                    conf[key] === 'beta' ? 'bg-[#0D9488] text-white' : 'bg-[#FFFFFF] text-[#18181B]'
                  }`}
                >
                  بتا (β - گوه توپر)
                </button>
              </div>
            </div>
          ))}
        </div>

        <ProgressiveHintBox
          solved={conformationSolved}
          hints={[
            'در استروئیدهای طبیعی فعال، اتصالات حلقه‌های B/C و C/D به شکل ترانس (trans-anti-trans) هستند تا اسکلت چهارحلقه‌ای مسطح باقی بماند.',
            'به موقعیت متیل‌های زاویه‌ای C18 و C19 (که همگی β هستند) دقت کن و بر اساس قانون اتصال ترانس، جهت هیدروژن‌های کربن‌های ۸، ۹ و ۱۴ را نسبت به آن‌ها تعیین کن.',
          ]}
        />

        {confFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              confFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {confFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{confFeedback.text}</span>
          </div>
        )}

        {!conformationSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={confLoading || !conf.H8 || !conf.H9 || !conf.H14}
              onClick={handleConfSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {confLoading ? 'در حال بررسی...' : 'باز کردن قفل در اتاق'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۲ (دیوار اتاق کژتاب) */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          conformationSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-heading font-bold text-base text-[#18181B]">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            <span>گام {toPersianDigits(2)} (یادداشت روی دیوار اتاق کژتاب)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowWallSandbox((s) => !s)}
            className="btn-tactile btn-tactile-surface px-3 py-1 text-xs"
          >
            {showWallSandbox ? 'جمع کردن میز آزمایش' : 'باز کردن میز آزمایش'}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#52525B] leading-7">
          روی دیوار اتاق با خط درشت نوشته: <strong>«هر چقدر قوی‌ترش کنی، به اهریمن نزدیک‌تر می‌شی!»</strong> — روی میز کار زیر، گروه‌های مختلف رو روی کورتیزول امتحان کن و ببین کدام تغییرات قدرت ضدالتهابی رو بالا می‌برن:
        </p>
        {showWallSandbox && conformationSolved && <SteroidSandbox mode="free" />}
      </div>

      {/* گام ۳: ایمیل دکتر ارول روی کامپیوتر کژتاب */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          conformationSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading font-bold text-base text-[#18181B] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0D9488]" />
            <span>گام {toPersianDigits(3)}: ایمیل دکتر ارول روی کامپیوتر کژتاب</span>
          </h3>
          <span className="text-xs font-bold text-[#52525B]">
            از قوی‌ترین (رتبه {toPersianDigits(1)}) به ضعیف‌ترین (رتبه {toPersianDigits(6)})
          </span>
        </div>

        <div className="rounded-[6px] border-2 border-[#18181B] bg-[#EFECE6] p-3.5 text-xs sm:text-sm text-[#18181B] leading-7">
          <strong>ایمیل از طرف دکتر اِرول:</strong> <em>«پروفسور کژتاب، شنیدم داری قویش می‌کنی! این ۶ تا مولکول رو بر اساس قدرت از قوی‌ترین به ضعیف‌ترین مرتب کن و شباهت اون دو تا مولکول قوی رو خوب یادت باشه...»</em>
        </div>

        <div className="space-y-3">
          {order.map((compId, idx) => {
            const comp = COMPOUNDS.find((c) => c.id === compId)!;
            return (
              <div
                key={compId}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-8 h-8 rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] text-[#0D9488] font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                    {toPersianDigits(idx + 1)}
                  </div>
                  <SteroidMoleculeSVG {...comp.props} compact />
                  <div>
                    <div className="font-heading font-bold text-sm text-[#18181B]">
                      {sarSolved ? `${comp.blindLabel} — ${comp.revealedName}` : comp.blindLabel}
                    </div>
                    {sarSolved ? (
                      <div className="text-xs text-[#16A34A] font-semibold mt-1">
                        {comp.revealedNote}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#52525B] mt-0.5">
                        فقط از روی تصویر ساختار، رتبه قدرت آن را بالا یا پایین ببر
                      </div>
                    )}
                  </div>
                </div>

                {!sarSolved && (
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, -1)}
                      aria-label={`بالا بردن ${comp.blindLabel}`}
                      className="btn-tactile btn-tactile-surface p-2"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === order.length - 1}
                      onClick={() => moveItem(idx, 1)}
                      aria-label={`پایین بردن ${comp.blindLabel}`}
                      className="btn-tactile btn-tactile-surface p-2"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <ProgressiveHintBox
          solved={sarSolved}
          disabled={!conformationSolved}
          hints={[
            'به نقش پیوند دوگانه Δ1 (در حلقه A)، هالوژن‌دار شدن در موقعیت 9α، و وضعیت گروه اکسیژن روی کربن C11 (هیدروکسیل فعال در برابر کتون پیش‌دارو) توجه کن.',
            'در بین ترکیبات دارای فلوئور، تفاوت گروه متصل به کربن C16 (لیپوفیل در برابر قطبی) و در ترکیبات بدون فلوئور، وجود متیل 6α باعث تمایز قدرت ضدالتهابی می‌شود.',
          ]}
        />

        {sarFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              sarFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {sarFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{sarFeedback.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          {sarSolved ? (
            <button
              type="button"
              onClick={onBackToMap}
              className="btn-tactile btn-tactile-emerald px-6 py-2.5 text-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>ذخیره سرنخ اول (گلوکوکورتیکوئید قوی با F) و بازگشت ←</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={sarLoading}
              onClick={handleSarSubmit}
              className="btn-tactile btn-tactile-primary px-6 py-2.5 text-sm"
            >
              {sarLoading ? 'در حال بررسی...' : 'ثبت ترتیب قدرت و استخراج سرنخ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
