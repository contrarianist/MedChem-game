import React, { useMemo, useState } from 'react';
import { Dna, CheckCircle2, AlertTriangle, RotateCcw, Cpu, ArrowDown, ArrowUp } from 'lucide-react';
import { MoleculeStructureCard } from '../molecules/MoleculeStructureCard';
import { ProgressiveHintBox } from './ProgressiveHintBox';
import { usePuzzleTimer } from '../../utils/usePuzzleTimer';
import { deterministicShuffle } from '../../utils/shuffle';
import { toPersianDigits } from '../../utils/persian';

interface Props {
  entryPotencySolved: boolean;
  metaboliteSolved: boolean;
  sarmSolved: boolean;
  androgenicitySolved: boolean;
  classificationSolved: boolean;
  enzymeComplexSolved: boolean;
  onSubmitPuzzle: (
    puzzleCode: string,
    answer: unknown,
    elapsedSeconds: number
  ) => Promise<{ correct: boolean; feedback: string }>;
  onBackToMap: () => void;
}

const ENTRY_POTENCY_ITEMS = [
  {
    id: '1',
    blindLabel: 'ساختار ۱',
    revealedName: 'اکسی‌متولون (Oxymetholone)',
    revealedNote: 'مشتق دی‌هیدروتستوسترون با 2-هیدروکسی‌متیلن',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CC[C@@H]4CC(=O)C(=CO)C[C@]34C)[C@@H]1CC[C@]2(C)O',
  },
  {
    id: '2',
    blindLabel: 'ساختار ۲',
    revealedName: 'استانوزولول (Stanozolol)',
    revealedNote: 'دارای حلقه پیرازول متصل به حلقه A',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CC[C@@H]4Cc5c[nH]nc5C[C@]34C)[C@@H]1CC[C@]2(C)O',
  },
  {
    id: '3',
    blindLabel: 'ساختار ۳',
    revealedName: 'متاسترون (Methasterone — 2α,17α-دی‌متیل DHT)',
    revealedNote: 'حلقه A اشباع (5α-H) با 2α-متیل و 17α-متیل — بیشترین قدرت در این مجموعه',
    smiles: 'C[C@@H]1C[C@]2(C)[C@@H](CC[C@@H]3[C@@H]2CC[C@]4(C)[C@H]3CC[C@]4(C)O)CC1=O',
  },
  {
    id: '4',
    blindLabel: 'ساختار ۴',
    revealedName: 'فلوکسی‌مسترون (Fluoxymesterone)',
    revealedNote: 'دارای فلوئور 9α و هیدروکسیل 11β',
    smiles: 'C[C@]12CCC(=O)C=C1CC[C@@H]3[C@H]4CC[C@](C)(O)[C@@]4(C)C[C@H](O)[C@@]32F',
  },
];

const INITIAL_ENTRY_ORDER = deterministicShuffle(['1', '2', '3', '4'], 'and-entry-order-v3');

const FLUTAMIDE_PARENT_SMILES = 'CC(C)C(=O)Nc1ccc([N+](=O)[O-])c(C(F)(F)F)c1';
const BICALUTAMIDE_SMILES = 'CC(O)(CS(=O)(=O)c1ccc(F)cc1)C(=O)Nc2ccc(C#N)c(C(F)(F)F)c2';
const TESTOSTERONE_REF_SMILES = 'C[C@]12CCC(=O)C=C1CC[C@@H]3[C@@H]2CC[C@]4(C)[C@H]3CC[C@@H]4O';
const FINASTERIDE_SMILES = 'CC(C)(C)NC(=O)[C@H]1CC[C@H]2[C@@H]3CC[C@H]4NC(=O)C=C[C@]4(C)[C@H]3CC[C@]12C';

const FLUTAMIDE_CANDIDATES = [
  {
    id: '2-hydroxyflutamide',
    blindLabel: 'ساختار الف',
    revealedName: '۲-هیدروکسی‌فلوتامید (متابولیت فعال)',
    revealedNote: 'هیدروکسیلاسیون روی کربن متین زنجیره ایزوبوتیریل',
    smiles: 'CC(C)(O)C(=O)Nc1ccc([N+](=O)[O-])c(C(F)(F)F)c1',
  },
  {
    id: 'nitro_reduced_amine',
    blindLabel: 'ساختار ب',
    revealedName: 'آمین آروماتیک احیاشده (غیرفعال)',
    revealedNote: 'احیای گروه نیترو حلقه بنزن',
    smiles: 'CC(C)C(=O)Nc1ccc(N)c(C(F)(F)F)c1',
  },
  {
    id: 'n_dealkylated_anilide',
    blindLabel: 'ساختار ج',
    revealedName: 'محصول هیدرولیز پیوند آمیدی (غیرفعال)',
    revealedNote: 'شکست کامل زنجیره آمیدی',
    smiles: 'Nc1ccc([N+](=O)[O-])c(C(F)(F)F)c1',
  },
];

const ANDROGENICITY_OPTIONS = deterministicShuffle(
  [
    { id: 'add_androgenic_features', label: 'افزودن استخلاف‌های 17α-متیل و 9α-فلوئور روی هسته آندروستان' },
    { id: 'remove_androgenic_features', label: 'حذف بخش‌هایی که خواص آندروژنی ایجاد می‌کنند (مثل متیل زاویه‌ای C19)' },
    { id: 'add_low_androgenic_features', label: 'افزودن تغییرات کاهنده آندروژنیسیته و مهارکننده احیای 5α' },
  ],
  'and-low-opts-v3'
);

const COFACTOR_OPTIONS = deterministicShuffle(
  [
    { value: 'heme_iron_chelation', label: 'کلاته کردن اتم آهن هم (Heme Fe)' },
    { value: 'nadph_covalent_adduct', label: 'تشکیل کمپلکس کووالانسی برگشت‌ناپذیر با کوفاکتور NADPH' },
    { value: 'allosteric_zinc', label: 'اتصال آلوستریک به یون روی' },
  ],
  'and-cofactor-v3'
);

const PHARMACOPHORE_OPTIONS = deterministicShuffle(
  [
    { value: 'phenolic_oh', label: 'حلقه فنولیک آروماتیک' },
    { value: 'nitro_benzene', label: 'حلقه نیتروبنزن' },
    { value: 'keto_enol_lactam', label: 'سیستم کتو-انول / لاکتام حلقه A' },
  ],
  'and-pharm-v3'
);

const ANDROGEN_DRUGS = [
  {
    id: '1',
    blindLabel: 'ترکیب ۱',
    revealedName: 'سیپروترون استات',
    revealedNote: 'آنتی‌اندروژن استروئیدی',
    smiles: 'CC(=O)O[C@@]1(C(C)=O)CC[C@H]2[C@@H]3C=C(Cl)C4=CC(=O)[C@@H]5C[C@@H]5[C@]4(C)[C@H]3CC[C@@]12C',
  },
  {
    id: '2',
    blindLabel: 'ترکیب ۲',
    revealedName: 'نیلوتامید',
    revealedNote: 'آنتی‌اندروژن غیراستروئیدی',
    smiles: 'CC1(C)NC(=O)N(c2ccc([N+](=O)[O-])c(C(F)(F)F)c2)C1=O',
  },
  {
    id: '3',
    blindLabel: 'ترکیب ۳',
    revealedName: 'فیناستراید',
    revealedNote: 'مهارکننده ۵-آلفا ردوکتاز',
    smiles: FINASTERIDE_SMILES,
  },
  {
    id: '4',
    blindLabel: 'ترکیب ۴',
    revealedName: 'لیاروزول',
    revealedNote: 'مهارکننده 17α-هیدروکسیلاز / لایز (کلر در موقعیت متا)',
    smiles: 'Clc1cccc(c1)C(c2ccc3nc[nH]c3c2)n4ccnc4',
  },
  {
    id: '5',
    blindLabel: 'ترکیب ۵',
    revealedName: '۱۷β-سیکلوپروپیل‌آمینو استروئید',
    revealedNote: 'مهارکننده 17α-هیدروکسیلاز / 17,20-لایز',
    smiles: 'C[C@]12CC[C@H](O)CC1=CC[C@@H]3[C@@H]2CC[C@]4(C)[C@H]3CC[C@@H]4NC5CC5',
  },
  {
    id: '6',
    blindLabel: 'ترکیب ۶',
    revealedName: 'SARM فلوئوروفنوکسی (S-1)',
    revealedNote: 'تعدیل‌کننده انتخابی گیرنده آندروژن با پل اتری (-O-)',
    smiles: 'C[C@](O)(COc1ccc(F)cc1)C(=O)Nc2ccc([N+](=O)[O-])c(C(F)(F)F)c2',
  },
  {
    id: '7',
    blindLabel: 'ترکیب ۷',
    revealedName: 'زانوترون (Zanoterone)',
    revealedNote: 'آنتی‌اندروژن استروئیدی با حلقه پیرازول و متان‌سولفونیل',
    smiles: 'C#C[C@]1(O)CC[C@H]2[C@@H]3CCc4nn(S(C)(=O)=O)cc4C[C@]3(C)CC[C@@]12C',
  },
  {
    id: '8',
    blindLabel: 'ترکیب ۸',
    revealedName: 'بیکالوتامید',
    revealedNote: 'آنتی‌اندروژن غیراستروئیدی',
    smiles: BICALUTAMIDE_SMILES,
  },
  {
    id: '9',
    blindLabel: 'ترکیب ۹',
    revealedName: 'دوتاستراید',
    revealedNote: 'مهارکننده ۵-آلفا ردوکتاز (بیس-تری‌فلورومتیل در ۲ و ۵)',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CC[C@@H]4NC(=O)C=C[C@]34C)[C@@H]1CC[C@@H]2C(=O)Nc5cc(C(F)(F)F)ccc5C(F)(F)F',
  },
  {
    id: '10',
    blindLabel: 'ترکیب ۱۰',
    revealedName: 'آندارین (SARM)',
    revealedNote: 'تعدیل‌کننده انتخابی گیرنده آندروژن با پل اتری و پارا-استامیدو',
    smiles: 'CC(=O)Nc1ccc(OC[C@](C)(O)C(=O)Nc2ccc([N+](=O)[O-])c(C(F)(F)F)c2)cc1',
  },
];

const STEP6_CANDIDATE_IDS = ['8', '1', '9', '6', '3'];

type AndrogenBucket =
  | 'steroid_antiandrogen'
  | 'non_steroid_antiandrogen'
  | 'five_alpha_reductase'
  | 'cyp17_inhibitor'
  | 'sarms';

export const AndrogenLab: React.FC<Props> = ({
  entryPotencySolved,
  metaboliteSolved,
  sarmSolved,
  androgenicitySolved,
  classificationSolved,
  enzymeComplexSolved,
  onSubmitPuzzle,
  onBackToMap,
}) => {
  const [entryOrder, setEntryOrder] = useState<string[]>(
    entryPotencySolved ? ['3', '2', '1', '4'] : INITIAL_ENTRY_ORDER
  );
  const entryTimer = usePuzzleTimer(true, entryPotencySolved);
  const [entryFeedback, setEntryFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);

  const [metabolite, setMetabolite] = useState<string>(
    metaboliteSolved ? '2-hydroxyflutamide' : ''
  );
  const metTimer = usePuzzleTimer(entryPotencySolved, metaboliteSolved);
  const [metFeedback, setMetFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [metLoading, setMetLoading] = useState(false);

  const [sarmChoice, setSarmChoice] = useState(sarmSolved ? '10' : '');
  const sarmTimer = usePuzzleTimer(metaboliteSolved, sarmSolved);
  const [sarmFeedback, setSarmFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [sarmLoading, setSarmLoading] = useState(false);

  const [androgenicityMods, setAndrogenicityMods] = useState<string[]>(
    androgenicitySolved
      ? ['remove_androgenic_features', 'add_low_androgenic_features']
      : []
  );
  const androgenicityTimer = usePuzzleTimer(sarmSolved, androgenicitySolved);
  const [androgenicityFeedback, setAndrogenicityFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [androgenicityLoading, setAndrogenicityLoading] = useState(false);

  const [buckets, setBuckets] = useState<Record<AndrogenBucket, string[]>>(
    classificationSolved
      ? {
          steroid_antiandrogen: ['1', '7'],
          non_steroid_antiandrogen: ['2', '8'],
          five_alpha_reductase: ['3', '9'],
          cyp17_inhibitor: ['4', '5'],
          sarms: ['6', '10'],
        }
      : {
          steroid_antiandrogen: [],
          non_steroid_antiandrogen: [],
          five_alpha_reductase: [],
          cyp17_inhibitor: [],
          sarms: [],
        }
  );
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const classTimer = usePuzzleTimer(androgenicitySolved, classificationSolved);
  const [classFeedback, setClassFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [classLoading, setClassLoading] = useState(false);

  const [complexState, setComplexState] = useState({
    selected_inhibitors: enzymeComplexSolved ? ['3', '9'] : ([] as string[]),
    cofactor_complex: enzymeComplexSolved ? 'nadph_covalent_adduct' : '',
    pharmacophore: enzymeComplexSolved ? 'keto_enol_lactam' : '',
  });
  const compTimer = usePuzzleTimer(classificationSolved, enzymeComplexSolved);
  const [compFeedback, setCompFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [compLoading, setCompLoading] = useState(false);

  const shuffledFlutamide = useMemo(
    () => deterministicShuffle(FLUTAMIDE_CANDIDATES, 'and-flutamide-v3'),
    []
  );
  const shuffledSarms = useMemo(
    () =>
      deterministicShuffle(
        ANDROGEN_DRUGS.filter((d) => ['2', '6', '10'].includes(d.id)),
        'and-sarms-v3'
      ),
    []
  );
  const shuffledDrugs = useMemo(
    () => deterministicShuffle(ANDROGEN_DRUGS, 'and-all10-v3'),
    []
  );
  const step6Candidates = useMemo(
    () =>
      STEP6_CANDIDATE_IDS.map((id) => ANDROGEN_DRUGS.find((d) => d.id === id)!),
    []
  );

  const moveEntryItem = (index: number, direction: -1 | 1) => {
    if (entryPotencySolved) return;
    const target = index + direction;
    if (target < 0 || target >= entryOrder.length) return;
    const next = [...entryOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setEntryOrder(next);
  };

  const handleEntrySubmit = async () => {
    setEntryLoading(true);
    setEntryFeedback(null);
    try {
      const elapsed = entryTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('androgen_entry_potency_sort', entryOrder, elapsed);
      setEntryFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setEntryFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setEntryLoading(false);
    }
  };

  const handleMetSubmit = async () => {
    if (!entryPotencySolved || !metabolite) return;
    setMetLoading(true);
    setMetFeedback(null);
    const elapsed = metTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('flutamide_metabolite', metabolite, elapsed);
      setMetFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setMetFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setMetLoading(false);
    }
  };

  const handleSarmSubmit = async () => {
    if (!metaboliteSolved || !sarmChoice) return;
    setSarmLoading(true);
    setSarmFeedback(null);
    try {
      const elapsed = sarmTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('sarm_alternative', sarmChoice, elapsed);
      setSarmFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setSarmFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setSarmLoading(false);
    }
  };

  const toggleAndrogenicityMod = (id: string) => {
    if (!sarmSolved || androgenicitySolved) return;
    setAndrogenicityMods((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAndrogenicitySubmit = async () => {
    if (!sarmSolved || !androgenicityMods.length) return;
    setAndrogenicityLoading(true);
    setAndrogenicityFeedback(null);
    try {
      const elapsed = androgenicityTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('low_androgenicity_design', androgenicityMods, elapsed);
      setAndrogenicityFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setAndrogenicityFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setAndrogenicityLoading(false);
    }
  };

  const assignToBucket = (bucket: AndrogenBucket, id: string) => {
    if (!androgenicitySolved || classificationSolved) return;
    setBuckets((prev) => {
      const next: Record<AndrogenBucket, string[]> = {
        steroid_antiandrogen: prev.steroid_antiandrogen.filter((x) => x !== id),
        non_steroid_antiandrogen: prev.non_steroid_antiandrogen.filter((x) => x !== id),
        five_alpha_reductase: prev.five_alpha_reductase.filter((x) => x !== id),
        cyp17_inhibitor: prev.cyp17_inhibitor.filter((x) => x !== id),
        sarms: prev.sarms.filter((x) => x !== id),
      };
      next[bucket] = [...next[bucket], id];
      return next;
    });
    setSelectedChip(null);
  };

  const removeFromBucket = (bucket: AndrogenBucket, id: string) => {
    if (!androgenicitySolved || classificationSolved) return;
    setBuckets((prev) => ({ ...prev, [bucket]: prev[bucket].filter((x) => x !== id) }));
  };

  const assignedCount = Object.values(buckets).flat().length;

  const handleClassSubmit = async () => {
    if (!androgenicitySolved || assignedCount < 10) return;
    setClassLoading(true);
    setClassFeedback(null);
    const elapsed = classTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('antiandrogen_classification', buckets, elapsed);
      setClassFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setClassFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setClassLoading(false);
    }
  };

  const toggleInhibitor = (id: string) => {
    if (!classificationSolved || enzymeComplexSolved) return;
    setComplexState((prev) => {
      const exists = prev.selected_inhibitors.includes(id);
      const next = exists
        ? prev.selected_inhibitors.filter((x) => x !== id)
        : [...prev.selected_inhibitors, id].sort();
      return { ...prev, selected_inhibitors: next };
    });
  };

  const handleComplexSubmit = async () => {
    if (
      !classificationSolved ||
      !complexState.selected_inhibitors.length ||
      !complexState.cofactor_complex ||
      !complexState.pharmacophore
    )
      return;
    setCompLoading(true);
    setCompFeedback(null);
    const elapsed = compTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle('five_alpha_reductase_complex', complexState, elapsed);
      setCompFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setCompFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setCompLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="lab-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] font-heading font-bold text-lg">
            <Dna className="w-6 h-6" />
            <span>اتاق ریش و سیبیل — اتاق آقای زیگموند (آندروژن‌ها)</span>
          </div>
          <p className="text-[#52525B] text-xs sm:text-sm mt-1 leading-6">
            آقای زیگموند (رفیق صمیمی و رقیب ارول) مبتلا به سرطان پروستاته و ارول بهش خیانت کرده! کمکش کن تا آخرین نامه ارول رو بهت بده...
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

      {/* گام ۱: ورود به اتاق با رتبه‌بندی ۴ ساختار (ساختار ۴ اصلاح‌شده به فلوکسی‌مسترون واقعی) */}
      <div className="lab-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(1)}: برای ورود به اتاق، ساختارها رو بر اساس قدرت مرتب کن
        </h3>
        <div className="space-y-3">
          {entryOrder.map((id, index) => {
            const item = ENTRY_POTENCY_ITEMS.find((x) => x.id === id)!;
            return (
              <div
                key={id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] text-[#0D9488] font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                    {toPersianDigits(index + 1)}
                  </div>
                  <div className="w-full sm:w-64">
                    <MoleculeStructureCard
                      smiles={item.smiles}
                      label={item.blindLabel}
                      revealed={entryPotencySolved}
                      revealedName={item.revealedName}
                      revealedNote={item.revealedNote}
                      compact
                    />
                  </div>
                </div>
                {!entryPotencySolved && (
                  <div className="flex gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveEntryItem(index, -1)}
                      aria-label={`بالا بردن ساختار ${id}`}
                      className="btn-tactile btn-tactile-surface p-2"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === entryOrder.length - 1}
                      onClick={() => moveEntryItem(index, 1)}
                      aria-label={`پایین بردن ساختار ${id}`}
                      className="btn-tactile btn-tactile-surface p-2"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <ProgressiveHintBox
          solved={entryPotencySolved}
          hints={[
            'به اشباع بودن حلقه A (ساختار مشتق از 5α-DHT)، حضور حلقه‌های هتروسیکل متصل به حلقه A و استخلاف‌های حلقه B/C دقت کن.',
            'ترکیبات دارای حلقه A اشباع همراه با ممانعت فضایی مناسب روی C2 و C17 بیشترین قدرت اثر را دارند.',
          ]}
        />

        {entryFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              entryFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {entryFeedback.text}
          </div>
        )}
        {!entryPotencySolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={entryLoading}
              onClick={handleEntrySubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {entryLoading ? 'در حال بررسی...' : 'باز کردن در اتاق زیگموند'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۲: متابولیت ماژور فلوتامید */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          entryPotencySolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(2)}: متابولیت ماژور و فعال داروی فلوتامید
        </h3>
        <div className="rounded-[6px] border-2 border-[#18181B] bg-[#EFECE6] p-3.5 text-xs leading-7 text-[#18181B]">
          آقای زیگموند غمگین نشسته؛ توی آزمایشش <strong>تستوسترون، آندروستندیون و PSA خیلی بالاست</strong>. توی دستش فلوتامید رو می‌بینی و می‌گه: <em>«ارول گفته متابولیت ماژور و موثر اینو مصرف کنم ولی PSA هنوز بالاست... کدوم ساختار متابولیت فعالشه؟»</em>
        </div>

        <div className="max-w-xs">
          <MoleculeStructureCard
            smiles={FLUTAMIDE_PARENT_SMILES}
            label="داروی دست زیگموند: فلوتامید"
            compact
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shuffledFlutamide.map((opt) => (
            <div
              key={opt.id}
              onClick={() => !metaboliteSolved && setMetabolite(opt.id)}
              className={`rounded-[8px] cursor-pointer transition ${
                metabolite === opt.id ? 'ring-2 ring-[#0D9488]' : ''
              }`}
            >
              <MoleculeStructureCard
                smiles={opt.smiles}
                label={opt.blindLabel}
                revealed={metaboliteSolved}
                revealedName={opt.revealedName}
                revealedNote={opt.revealedNote}
                compact
              />
            </div>
          ))}
        </div>

        {metFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              metFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {metFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{metFeedback.text}</span>
          </div>
        )}

        {!metaboliteSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={metLoading || !metabolite}
              onClick={handleMetSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {metLoading ? 'در حال بررسی...' : 'تایید متابولیت فعال'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۳: پیشنهاد SARM */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          metaboliteSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(3)}: تبدیل بیکالوتامید به یک SARM بهتر
        </h3>
        <p className="text-xs leading-6 text-[#52525B]">
          ساختار قبلی دو تا مشکل داره: ۱) باید چند بار در روز مصرف بشه، ۲) PSA زیگموند همچنان بالاست. از روی ساختار بیکالوتامید (با پل سولفونیل <code dir="ltr">-SO2-</code>)، کدام ساختار یک <strong>SARM</strong> مناسب است؟
        </p>

        <div className="max-w-xs">
          <MoleculeStructureCard smiles={BICALUTAMIDE_SMILES} label="ساختار مرجع: بیکالوتامید" compact />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shuffledSarms.map((cand) => (
            <div
              key={cand.id}
              onClick={() => metaboliteSolved && !sarmSolved && setSarmChoice(cand.id)}
              className={`rounded-[8px] cursor-pointer transition ${
                sarmChoice === cand.id ? 'ring-2 ring-[#0D9488]' : ''
              }`}
            >
              <MoleculeStructureCard
                smiles={cand.smiles}
                label={cand.blindLabel}
                revealed={sarmSolved}
                revealedName={cand.revealedName}
                revealedNote={cand.revealedNote}
                compact
              />
            </div>
          ))}
        </div>
        {sarmFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              sarmFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {sarmFeedback.text}
          </div>
        )}
        {!sarmSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!metaboliteSolved || sarmLoading || !sarmChoice}
              onClick={handleSarmSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {sarmLoading ? 'در حال بررسی...' : 'ثبت انتخاب SARM'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۴: کمینه‌کردن آندروژنیسیته */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          sarmSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(4)}: راز زیگموند درباره کمینه‌کردن آندروژنیسیته
        </h3>
        <div className="rounded-[6px] border-2 border-[#18181B] bg-[#EFECE6] p-3.5 text-xs leading-7 text-[#18181B]">
          <strong>آقای زیگموند:</strong> <em>«ارول اهریمن رو با کمترین آندروژنیسیته می‌سازه؛ اون قسمتایی که خواص آندروژنی می‌دن رو باید حذف کنی و قسمتایی که آندروژنیسیته رو کم می‌کنن اضافه کنی.»</em>
        </div>

        <div className="max-w-xs">
          <MoleculeStructureCard
            smiles={TESTOSTERONE_REF_SMILES}
            label="ساختار مرجع آندروژن: تستوسترون"
            compact
          />
        </div>

        <div className="space-y-2">
          {ANDROGENICITY_OPTIONS.map((modification) => {
            const active = androgenicityMods.includes(modification.id);
            return (
              <button
                key={modification.id}
                type="button"
                disabled={!sarmSolved || androgenicitySolved}
                aria-pressed={active}
                onClick={() => toggleAndrogenicityMod(modification.id)}
                className={`w-full rounded-[6px] border-2 border-[#18181B] p-3.5 text-right text-xs sm:text-sm font-bold transition ${
                  active ? 'bg-[#0D9488] text-white' : 'bg-[#F7F5F0] text-[#18181B] hover:bg-[#EFECE6]'
                }`}
              >
                {modification.label}
              </button>
            );
          })}
        </div>
        {androgenicityFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              androgenicityFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {androgenicityFeedback.text}
          </div>
        )}
        {!androgenicitySolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!sarmSolved || androgenicityLoading || !androgenicityMods.length}
              onClick={handleAndrogenicitySubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {androgenicityLoading ? 'در حال بررسی...' : 'تایید اصلاحات آندروژنیسیته'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۵: دسته‌بندی ۱۰ ساختار */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          androgenicitySolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#18181B]">
            گام {toPersianDigits(5)}: آخرین نامه ارول — جداسازی {toPersianDigits(10)} ساختار در {toPersianDigits(5)} دسته
          </h3>
          {!classificationSolved && assignedCount > 0 && (
            <button
              type="button"
              onClick={() =>
                setBuckets({
                  steroid_antiandrogen: [],
                  non_steroid_antiandrogen: [],
                  five_alpha_reductase: [],
                  cyp17_inhibitor: [],
                  sarms: [],
                })
              }
              disabled={!androgenicitySolved}
              className="btn-tactile btn-tactile-surface px-3 py-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> پاکسازی
            </button>
          )}
        </div>

        <p className="text-xs text-[#52525B] leading-6">
          ارول توی آخرین نامه‌اش از زیگموند خواسته این {toPersianDigits(10)} ساختار رو بر اساس دسته‌هاشون جدا کنه:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {shuffledDrugs
            .filter((d) => !Object.values(buckets).flat().includes(d.id))
            .map((drug) => (
              <div
                key={drug.id}
                draggable={androgenicitySolved && !classificationSolved}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', drug.id)}
                onClick={() => {
                  if (!androgenicitySolved || classificationSolved) return;
                  setSelectedChip(selectedChip === drug.id ? null : drug.id);
                }}
                className={`rounded-[8px] cursor-pointer transition ${
                  selectedChip === drug.id ? 'ring-2 ring-[#0D9488]' : ''
                }`}
              >
                <MoleculeStructureCard
                  smiles={drug.smiles}
                  label={drug.blindLabel}
                  revealed={classificationSolved}
                  revealedName={drug.revealedName}
                  revealedNote={drug.revealedNote}
                  compact
                />
              </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(
            [
              { key: 'steroid_antiandrogen', title: 'Steroid Antiandrogens' },
              { key: 'non_steroid_antiandrogen', title: 'Non-Steroid Antiandrogens' },
              { key: 'five_alpha_reductase', title: '5α-Reductase Inhibitors' },
              { key: 'cyp17_inhibitor', title: '17α-Hydroxylase / Lyase' },
              { key: 'sarms', title: 'SARMs' },
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
              onClick={() => selectedChip && assignToBucket(b.key, selectedChip)}
              className="min-h-[140px] rounded-[8px] border-2 border-dashed border-[#71717A] bg-[#EFECE6] p-3 space-y-2"
            >
              <div dir="ltr" className="text-[11px] font-mono font-bold text-[#0D9488] text-center">
                {b.title}
              </div>
              {buckets[b.key].map((id) => {
                const item = ANDROGEN_DRUGS.find((x) => x.id === id)!;
                return (
                  <div
                    key={id}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromBucket(b.key, id);
                    }}
                    className="rounded-[6px] bg-[#FFFFFF] border-2 border-[#18181B] px-2.5 py-1.5 text-[11px] text-[#18181B] cursor-pointer space-y-0.5"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>
                        {item.blindLabel}
                        {classificationSolved ? ` — ${item.revealedName}` : ''}
                      </span>
                      {!classificationSolved && <span className="text-[#E11D48]">×</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <ProgressiveHintBox
          solved={classificationSolved}
          disabled={!androgenicitySolved}
          hints={[
            'ابتدا ساختارهای دارای هسته استروئیدی را از غیراستروئیدی‌ها جدا کن و به حلقه A و استخلاف‌های C17 نگاه کن.',
            'حلقه A لاکتامی (۴-آزااستروئید) شاخص مهارکننده‌های 5α-ردوکتاز، پل اتری (-O-) در داربست پروپیونامید شاخص SARMها، و حلقه‌های آزول یا سیکلوپروپیل‌آمین شاخص مهارکننده‌های CYP17 هستند.',
          ]}
        />

        {classFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              classFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {classFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{classFeedback.text}</span>
          </div>
        )}

        {!classificationSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!androgenicitySolved || classLoading || assignedCount < 10}
              onClick={handleClassSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {classLoading ? 'در حال بررسی...' : `تایید دسته‌بندی ${toPersianDigits(10)} ترکیب`}
            </button>
          </div>
        )}
      </div>

      {/* گام ۶: کمپلکس فیناستراید-NADPH با نمایش واقعی ساختارهای ۵ کاندیدا */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          classificationSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#0D9488]" />
          <span>گام {toPersianDigits(6)}: قرار دادن مهارکننده‌های ۵-آلفا ردوکتاز داخل سایت فعال آنزیم</span>
        </h3>

        <p className="text-xs text-[#52525B] leading-6">
          از بین ۵ ساختار زیر، مهارکننده‌های ۵-آلفا ردوکتاز را انتخاب کن و ببین کدوم قسمت ساختار با کوفاکتور آنزیم واکنش می‌ده:
        </p>

        {/* شماتیک واکنش فیناستراید + NADPH */}
        <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 space-y-3">
          <div className="text-xs font-heading font-bold text-[#0D9488]">
            شماتیک واکنش در سایت فعال آنزیم 5α-Reductase:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            <div className="md:col-span-5">
              <MoleculeStructureCard
                smiles={FINASTERIDE_SMILES}
                label="مهارکننده ۴-آزااستروئید (حلقه A لاکتام + Δ1)"
                compact
              />
            </div>
            <div className="md:col-span-1 text-center font-mono text-xs font-extrabold text-[#0D9488]">
              + NADPH
              <div className="text-lg">→</div>
            </div>
            <div dir="ltr" className="md:col-span-5 rounded-[8px] border-2 border-[#18181B] molecule-dot-grid p-3 flex flex-col items-center">
              <svg viewBox="0 0 260 120" className="w-full max-w-[250px] h-28 bg-transparent">
                <polygon points="22,22 44,10 66,22 66,46 44,58 22,46" fill="rgba(13,148,136,0.14)" stroke="#0D9488" strokeWidth="2" />
                <text x="12" y="16" fill="#0D9488" fontSize="9.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">NADPH</text>
                <line x1="66" y1="46" x2="88" y2="62" stroke="#16A34A" strokeWidth="2.8" />
                <circle cx="77" cy="54" r="3.5" fill="#16A34A" />
                <polygon points="88,62 114,48 140,62 140,90 114,104 88,90" fill="rgba(22,163,74,0.12)" stroke="#16A34A" strokeWidth="2" />
                <text x="100" y="114" fill="#2563EB" fontSize="9.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">NH-C=O</text>
                <polygon points="140,62 166,48 192,62 192,90 166,104 140,90" fill="none" stroke="#18181B" strokeWidth="2" />
                <polygon points="166,48 192,34 218,48 218,76 192,90 192,62" fill="none" stroke="#18181B" strokeWidth="2" />
                <polygon points="218,48 242,56 248,78 232,90 218,76" fill="none" stroke="#18181B" strokeWidth="2" />
              </svg>
              <span className="text-[11px] font-bold text-[#16A34A] font-mono">
                Finasteride–NADPH Covalent Complex
              </span>
            </div>
          </div>
        </div>

        {/* ۱. انتخاب بصری از بین ساختارهای واقعی (نه فقط شماره!) */}
        <div className="space-y-2.5">
          <div className="text-xs font-heading font-bold text-[#18181B]">
            ۱. ساختارهای مهارکننده ۵-آلفا ردوکتاز را انتخاب کن (۲ مورد):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {step6Candidates.map((cand) => {
              const active = complexState.selected_inhibitors.includes(cand.id);
              return (
                <div
                  key={cand.id}
                  onClick={() => toggleInhibitor(cand.id)}
                  className={`rounded-[8px] cursor-pointer transition ${
                    active ? 'ring-4 ring-[#0D9488]' : ''
                  }`}
                >
                  <MoleculeStructureCard
                    smiles={cand.smiles}
                    label={`${cand.blindLabel}${active ? ' ✓' : ''}`}
                    revealed={enzymeComplexSolved}
                    revealedName={cand.revealedName}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 space-y-2">
            <div className="text-xs font-bold text-[#18181B]">۲. مکانیسم مهار در سایت فعال:</div>
            <select
              disabled={!classificationSolved || enzymeComplexSolved}
              value={complexState.cofactor_complex}
              onChange={(e) => setComplexState((p) => ({ ...p, cofactor_complex: e.target.value }))}
              className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs text-[#18181B]"
            >
              <option value="">انتخاب مکانیسم...</option>
              {COFACTOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-4 space-y-2">
            <div className="text-xs font-bold text-[#18181B]">۳. بخش کلیدی حلقه A در اهریمن:</div>
            <select
              disabled={!classificationSolved || enzymeComplexSolved}
              value={complexState.pharmacophore}
              onChange={(e) => setComplexState((p) => ({ ...p, pharmacophore: e.target.value }))}
              className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs text-[#18181B]"
            >
              <option value="">انتخاب بخش کلیدی...</option>
              {PHARMACOPHORE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {compFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              compFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {compFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{compFeedback.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          {enzymeComplexSolved ? (
            <button
              type="button"
              onClick={onBackToMap}
              className="btn-tactile btn-tactile-emerald px-6 py-2.5 text-sm"
            >
              ذخیره سرنخ پنجم (کتو-انول مهار ۵-آلفا ردوکتاز) و بازگشت ←
            </button>
          ) : (
            <button
              type="button"
              disabled={
                compLoading ||
                !classificationSolved ||
                !complexState.selected_inhibitors.length ||
                !complexState.cofactor_complex ||
                !complexState.pharmacophore
              }
              onClick={handleComplexSubmit}
              className="btn-tactile btn-tactile-primary px-6 py-2.5 text-sm"
            >
              {compLoading ? 'در حال ثبت...' : 'تایید کمپلکس و کشف آخرین سرنخ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
