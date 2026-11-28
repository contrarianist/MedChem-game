import React, { useEffect, useMemo, useState } from 'react';
import {
  Atom,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Siren,
  FlaskConical,
  RotateCcw,
  Eraser,
} from 'lucide-react';
import { MoleculeStructureCard } from '../molecules/MoleculeStructureCard';
import { SteroidSandbox } from '../molecules/SteroidSandbox';
import { ProgressiveHintBox } from './ProgressiveHintBox';
import { usePuzzleTimer } from '../../utils/usePuzzleTimer';
import { deterministicShuffle } from '../../utils/shuffle';
import { toPersianDigits } from '../../utils/persian';

interface Props {
  metabolismSolved: boolean;
  dockingSolved: boolean;
  oralDesignSolved: boolean;
  potencySolved: boolean;
  metaboliteSolved: boolean;
  classificationSolved: boolean;
  onSubmitPuzzle: (
    puzzleCode: string,
    answer: unknown,
    elapsedSeconds: number
  ) => Promise<{ correct: boolean; feedback: string }>;
  onBackToMap: () => void;
}

const ENZYME_OPTIONS = deterministicShuffle(
  ['Estradiol dehydrogenase', '16a-hydroxylase', 'Aromatase (CYP19)', '5a-reductase'],
  'est-enzymes-v3'
);

const ESTROGEN_STRUCTURES = [
  {
    id: '1',
    blindLabel: 'ساختار ۱',
    revealedName: 'استرادیول (Estradiol - E2)',
    revealedNote: 'دارای 3-OH فنولی و 17β-OH',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O',
  },
  {
    id: '2',
    blindLabel: 'ساختار ۲',
    revealedName: 'استرون (Estrone - E1)',
    revealedNote: 'دارای کتون C17=O',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CCC2=O',
  },
  {
    id: '3',
    blindLabel: 'ساختار ۳',
    revealedName: 'استریول (Estriol - E3)',
    revealedNote: 'دارای هیدروکسیل 16α و 17β',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1C[C@@H](O)[C@@H]2O',
  },
  {
    id: '4',
    blindLabel: 'ساختار ۴',
    revealedName: '16α-هیدروکسی‌استرون',
    revealedNote: 'دارای کتون C17=O و هیدروکسیل 16α',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1C[C@@H](O)C2=O',
  },
];

const POTENCY_COMPOUNDS = [
  {
    id: '1',
    blindLabel: 'ترکیب ۱',
    revealedName: '17β-استرادیول',
    revealedNote: 'استروژن طبیعی مرجع',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1CC[C@@H]2O',
  },
  {
    id: '2',
    blindLabel: 'ترکیب ۲',
    revealedName: 'اتینیل استرادیول',
    revealedNote: 'مشتق خوراکی با قدرت هم‌تراز استرادیول',
    smiles: 'C#C[C@]1(O)CC[C@H]2[C@@H]3CCc4cc(O)ccc4[C@H]3CC[C@@]12C',
  },
  {
    id: '3',
    blindLabel: 'ترکیب ۳',
    revealedName: 'دی‌ان‌استرول (Dienestrol)',
    revealedNote: 'آگونیست غیراستروئیدی دی‌ان کونژوگه با دو پیوند دوگانه جانبی و بالاترین قدرت اثر',
    smiles: 'C/C=C(/c1ccc(O)cc1)C(=C\\C)c2ccc(O)cc2',
  },
  {
    id: '4',
    blindLabel: 'ترکیب ۴',
    revealedName: 'استریول',
    revealedNote: 'متابولیت قطبی با کمترین قدرت اثر',
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc34)[C@@H]1C[C@@H](O)[C@@H]2O',
  },
];

const LAWRENCE_CATECHOL_METABOLITE_SMILES = 'C[C@]12CC[C@H]3[C@@H](CCc4c(O)c(O)ccc34)[C@@H]1CC[C@@H]2O';

const INITIAL_POTENCY_ORDER = deterministicShuffle(['1', '2', '3', '4'], 'est-potency-v3');

const DRUG_CLASS_FIELDS = [
  { key: 'serm', blindTitle: '۱) تعدیل‌کننده انتخابی گیرنده استروژن (SERM)', revealedTitle: '۱) SERM — آرزوکسیفن' },
  { key: 'pure_antiestrogen', blindTitle: '۲) آنتی‌استروژن خالص (Pure Antiestrogen)', revealedTitle: '۲) آنتی‌استروژن خالص — فولوسترانت' },
  { key: 'steroid_aromatase_inhibitor', blindTitle: '۳) مهارکننده استروئیدی آروماتاز', revealedTitle: '۳) مهارکننده استروئیدی آروماتاز — اگزمستان' },
  { key: 'non_steroid_aromatase_inhibitor', blindTitle: '۴) مهارکننده غیراستروئیدی آروماتاز', revealedTitle: '۴) مهارکننده غیراستروئیدی آروماتاز — لتروزول' },
] as const;

const DRUG_CLASS_STRUCTURES = [
  {
    id: 'A',
    blindLabel: 'ساختار A',
    revealedName: 'اگزمستان (Exemestane)',
    revealedNote: 'مهارکننده استروئیدی آروماتاز',
    smiles: 'C[C@]12CCC(=O)C=C1C(=C)C[C@@H]3[C@@H]2CC[C@]4(C)[C@H]3CCC4=O',
  },
  {
    id: 'B',
    blindLabel: 'ساختار B',
    revealedName: 'آرزوکسیفن (Arzoxifene)',
    revealedNote: 'تعدیل‌کننده انتخابی گیرنده استروژن (SERM) با داربست بنزوتیوفن، پل اتری و متوکسی',
    smiles: 'COc1ccc(cc1)c2sc3cc(O)ccc3c2Oc4ccc(OCCN5CCCCC5)cc4',
  },
  {
    id: 'C',
    blindLabel: 'ساختار C',
    revealedName: 'فولوسترانت (Fulvestrant)',
    revealedNote: 'آنتی‌استروژن خالص با زنجیره بلند C7α',
    smiles: 'C[C@]12CC[C@H]3[C@@H]([C@@H](CCCCCCCCC[S](=O)CCCC(F)(F)C(F)(F)F)Cc4cc(O)ccc34)[C@@H]1CC[C@@H]2O',
  },
  {
    id: 'D',
    blindLabel: 'ساختار D',
    revealedName: 'لتروزول (Letrozole)',
    revealedNote: 'مهارکننده غیراستروئیدی آروماتاز دارای سیانید (-C≡N)',
    smiles: 'N#Cc1ccc(cc1)C(c2ccc(C#N)cc2)n3cncn3',
  },
];

// ===== باکس تعاملی اصلاح حلقه A در گام ۵ (جلوگیری از تشکیل متابولیت کاتکول-کوئینون سرطان‌زا) =====
type RingASpot = 'C2' | 'C3' | 'C4' | 'C17b';
type RingATool = 'F' | 'OCH3' | 'OH' | 'CH3' | 'DEL';

interface RingAState {
  C2: 'H' | 'F' | 'OH' | 'CH3';
  C3: 'OH' | 'OCH3' | 'H';
  C4: 'H' | 'F' | 'OH' | 'CH3';
  C17b: 'OH' | 'H';
}

const INITIAL_RING_A: RingAState = { C2: 'H', C3: 'OH', C4: 'H', C17b: 'OH' };
const SOLVED_RING_A: RingAState = { C2: 'H', C3: 'OH', C4: 'F', C17b: 'OH' };

const RING_A_TOOLS: { id: RingATool; label: string; formula: string }[] = [
  { id: 'F', label: 'فلوئور (مسدودکننده متابولیک)', formula: '-F' },
  { id: 'OCH3', label: 'متیل اتر (پوشش فنول)', formula: '-OCH3' },
  { id: 'OH', label: 'هیدروکسیل', formula: '-OH' },
  { id: 'CH3', label: 'متیل', formula: '-CH3' },
  { id: 'DEL', label: 'پاک‌کن (حذف گروه)', formula: 'DEL' },
];

export const EstrogenLab: React.FC<Props> = ({
  metabolismSolved,
  dockingSolved,
  oralDesignSolved,
  potencySolved,
  metaboliteSolved,
  classificationSolved,
  onSubmitPuzzle,
  onBackToMap,
}) => {
  const [enzymes, setEnzymes] = useState({
    top_horizontal: metabolismSolved ? 'Estradiol dehydrogenase' : '',
    bottom_horizontal: metabolismSolved ? 'Estradiol dehydrogenase' : '',
    left_vertical: metabolismSolved ? '16a-hydroxylase' : '',
    right_vertical: metabolismSolved ? '16a-hydroxylase' : '',
  });
  const [structurePositions, setStructurePositions] = useState({
    estradiol: metabolismSolved ? '1' : '',
    estrone: metabolismSolved ? '2' : '',
    estriol: metabolismSolved ? '3' : '',
    hydroxyestrone: metabolismSolved ? '4' : '',
  });
  const metTimer = usePuzzleTimer(true, metabolismSolved);
  const [metFeedback, setMetFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [metLoading, setMetLoading] = useState(false);

  const [oralMods, setOralMods] = useState<string[]>(
    oralDesignSolved ? ['add_17alpha_ethynyl', 'methylate_3_hydroxyl'] : []
  );
  const oralTimer = usePuzzleTimer(metabolismSolved, oralDesignSolved);
  const [oralFeedback, setOralFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [oralLoading, setOralLoading] = useState(false);

  const [potencyOrder, setPotencyOrder] = useState<string[]>(
    potencySolved ? ['3', '1', '2', '4'] : INITIAL_POTENCY_ORDER
  );
  const potencyTimer = usePuzzleTimer(oralDesignSolved, potencySolved);
  const [potencyFeedback, setPotencyFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [potencyLoading, setPotencyLoading] = useState(false);

  // گام ۴: هم‌ترازی واقعی و یکتا دقیقاً در زاویه ۳۱۵ درجه (در راستای Glu 353/Arg 394 تا His 524)
  const [angle, setAngle] = useState<number>(dockingSolved ? 315 : 45);
  const [hasRotated, setHasRotated] = useState(dockingSolved);
  const [escapeSeconds, setEscapeSeconds] = useState(10);
  const [escapeStarted, setEscapeStarted] = useState(false);
  const dockTimer = usePuzzleTimer(potencySolved, dockingSolved);
  const [dockFeedback, setDockFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [dockLoading, setDockLoading] = useState(false);

  // گام ۵: میز کار اصلاح حلقه A استروژن فنولیک
  const [ringAState, setRingAState] = useState<RingAState>(
    metaboliteSolved ? SOLVED_RING_A : INITIAL_RING_A
  );
  const [selectedRingATool, setSelectedRingATool] = useState<RingATool | null>(null);
  const [ringANotice, setRingANotice] = useState<string | null>(null);
  const metaboliteTimer = usePuzzleTimer(dockingSolved, metaboliteSolved);
  const [metaboliteFeedback, setMetaboliteFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [metaboliteLoading, setMetaboliteLoading] = useState(false);

  const [classifications, setClassifications] = useState({
    serm: classificationSolved ? 'B' : '',
    pure_antiestrogen: classificationSolved ? 'C' : '',
    steroid_aromatase_inhibitor: classificationSolved ? 'A' : '',
    non_steroid_aromatase_inhibitor: classificationSolved ? 'D' : '',
  });
  const classificationTimer = usePuzzleTimer(metaboliteSolved, classificationSolved);
  const [classificationFeedback, setClassificationFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [classificationLoading, setClassificationLoading] = useState(false);

  const shuffledMetStructures = useMemo(
    () => deterministicShuffle(ESTROGEN_STRUCTURES, 'est-met-cards-v3'),
    []
  );
  const shuffledDrugStructures = useMemo(
    () => deterministicShuffle(DRUG_CLASS_STRUCTURES, 'est-class-cards-v3'),
    []
  );

  useEffect(() => {
    if (!escapeStarted || dockingSolved) return;
    const timer = window.setInterval(() => {
      setEscapeSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [escapeStarted, dockingSolved]);

  const handleMetSubmit = async () => {
    if (
      metabolismSolved ||
      Object.values(enzymes).some((value) => !value) ||
      Object.values(structurePositions).some((value) => !value)
    )
      return;
    setMetLoading(true);
    setMetFeedback(null);
    const elapsed = metTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle(
        'metabolism_enzymes',
        { ...enzymes, structure_positions: structurePositions },
        elapsed
      );
      setMetFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setMetFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setMetLoading(false);
    }
  };

  const handleOralSubmit = async () => {
    if (!metabolismSolved || !oralMods.length) return;
    setOralLoading(true);
    setOralFeedback(null);
    try {
      const elapsed = oralTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('oral_long_acting_design', oralMods, elapsed);
      setOralFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setOralFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setOralLoading(false);
    }
  };

  const movePotencyItem = (index: number, direction: -1 | 1) => {
    if (!oralDesignSolved || potencySolved) return;
    const target = index + direction;
    if (target < 0 || target >= potencyOrder.length) return;
    const next = [...potencyOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setPotencyOrder(next);
  };

  const handlePotencySubmit = async () => {
    if (!oralDesignSolved) return;
    setPotencyLoading(true);
    setPotencyFeedback(null);
    try {
      const elapsed = potencyTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('estrogen_potency_sort', potencyOrder, elapsed);
      setPotencyFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setPotencyFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setPotencyLoading(false);
    }
  };

  const handleDockSubmit = async () => {
    if (!potencySolved || !hasRotated || escapeSeconds === 0) return;
    setDockLoading(true);
    setDockFeedback(null);
    const elapsed = dockTimer.consumeElapsedSeconds();
    try {
      const res = await onSubmitPuzzle(
        'receptor_docking_and_class',
        { rotation_angle: angle % 360 },
        elapsed
      );
      setDockFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setDockFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setDockLoading(false);
    }
  };

  const applyRingATool = (tool: RingATool, spot: RingASpot) => {
    if (!dockingSolved || metaboliteSolved) return;
    setRingANotice(null);
    setRingAState((prev) => {
      if (spot === 'C2') {
        if (tool === 'DEL') return { ...prev, C2: 'H' };
        if (tool === 'F' || tool === 'OH' || tool === 'CH3') return { ...prev, C2: tool };
        setRingANotice('روی موقعیت ارتو C2 می‌توانید -F، -CH3، -OH یا پاک‌کن اعمال کنید.');
        return prev;
      }
      if (spot === 'C4') {
        if (tool === 'DEL') return { ...prev, C4: 'H' };
        if (tool === 'F' || tool === 'OH' || tool === 'CH3') return { ...prev, C4: tool };
        setRingANotice('روی موقعیت ارتو C4 می‌توانید -F، -CH3، -OH یا پاک‌کن اعمال کنید.');
        return prev;
      }
      if (spot === 'C3') {
        if (tool === 'DEL') return { ...prev, C3: 'H' };
        if (tool === 'OH' || tool === 'OCH3') return { ...prev, C3: tool };
        setRingANotice('روی کربن C3 می‌توانید -OH، -OCH3 یا پاک‌کن اعمال کنید.');
        return prev;
      }
      if (spot === 'C17b') {
        if (tool === 'DEL') return { ...prev, C17b: 'H' };
        if (tool === 'OH') return { ...prev, C17b: 'OH' };
        setRingANotice('روی موقعیت C17β گروه هیدروکسیل برای اتصال به گیرنده ضروری است.');
        return prev;
      }
      return prev;
    });
  };

  const evaluateRingAToken = (): string => {
    if (ringAState.C17b !== 'OH') return 'broken_receptor_binding';
    if (ringAState.C4 === 'OH' || ringAState.C2 === 'OH') return 'formed_catechol';
    if (ringAState.C4 === 'F') return 'block_c4_fluorine';
    if (ringAState.C2 === 'F') return 'block_c2_fluorine';
    if (ringAState.C3 === 'OCH3') return 'methylate_c3_oh';
    return 'unmodified_estrogen';
  };

  const handleMetaboliteSubmit = async () => {
    if (!dockingSolved) return;
    setMetaboliteLoading(true);
    setMetaboliteFeedback(null);
    const token = evaluateRingAToken();
    try {
      const elapsed = metaboliteTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('active_metabolite_prevention', token, elapsed);
      setMetaboliteFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setMetaboliteFeedback({ ok: false, text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.' });
    } finally {
      setMetaboliteLoading(false);
    }
  };

  const handleClassificationSubmit = async () => {
    if (!metaboliteSolved || Object.values(classifications).some((value) => !value)) return;
    setClassificationLoading(true);
    setClassificationFeedback(null);
    try {
      const elapsed = classificationTimer.consumeElapsedSeconds();
      const res = await onSubmitPuzzle('estrogen_drug_classification', classifications, elapsed);
      setClassificationFeedback({ ok: res.correct, text: res.feedback });
    } catch (err: unknown) {
      setClassificationFeedback({
        ok: false,
        text: err instanceof Error ? err.message : 'ثبت پاسخ ناموفق بود.',
      });
    } finally {
      setClassificationLoading(false);
    }
  };

  // فقط و فقط در زاویه ۳۱۵ درجه (هم‌ترازی دقیق مورب بین Glu 353/Arg 394 و His 524) سبز می‌شود
  const isAligned = angle % 360 === 315;

  return (
    <div className="space-y-8">
      <div className="lab-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#0D9488] font-heading font-bold text-lg">
            <Atom className="w-6 h-6" />
            <span>اتاق ماه عسل — آزمایشگاه آقا و خانم لارنس (استروژن‌ها)</span>
          </div>
          <p className="text-[#52525B] text-xs sm:text-sm mt-1 leading-6">
            آقا و خانم لارنس یک ساله داخل آزمایشگاه حیوانات روی تولید یه استروژن «فول‌شارژ» کار می‌کنن. حواست باشه توی دامشون نیفتی!
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

      {/* گام ۱: متابولیسم استروژن */}
      <div className="lab-card p-6 space-y-5">
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(1)}: برای ورود به اتاق، ساختارها و آنزیم‌های متابولیسم رو جای درستشون بذار
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shuffledMetStructures.map((st) => (
            <MoleculeStructureCard
              key={st.id}
              smiles={st.smiles}
              label={st.blindLabel}
              revealed={metabolismSolved}
              revealedName={st.revealedName}
              revealedNote={st.revealedNote}
              compact
            />
          ))}
        </div>

        <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['estradiol', 'استرادیول (Estradiol)'],
              ['estrone', 'استرون (Estrone)'],
              ['estriol', 'استریول (Estriol)'],
              ['hydroxyestrone', '16α-هیدروکسی‌استرون'],
            ].map(([molecule, label]) => (
              <label key={molecule} className="space-y-1 text-[11px] text-[#18181B]">
                <span className="font-bold block">کدام ساختار مربوط به {label} است؟</span>
                <select
                  required
                  disabled={metabolismSolved}
                  value={structurePositions[molecule as keyof typeof structurePositions]}
                  onChange={(event) =>
                    setStructurePositions((previous) => ({
                      ...previous,
                      [molecule]: event.target.value,
                    }))
                  }
                  className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs text-[#18181B]"
                >
                  <option value="">انتخاب شماره ساختار...</option>
                  {shuffledMetStructures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.blindLabel}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] p-3 font-bold text-sm">استرادیول</div>
            <div>
              <label className="block text-[11px] text-[#18181B] font-bold mb-1">
                آنزیم تبدیل برگشت‌پذیر استرادیول ⇄ استرون
              </label>
              <select
                disabled={metabolismSolved}
                value={enzymes.top_horizontal}
                onChange={(e) => setEnzymes((p) => ({ ...p, top_horizontal: e.target.value }))}
                dir="ltr"
                className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#18181B]"
              >
                <option value="">انتخاب آنزیم...</option>
                {ENZYME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] p-3 font-bold text-sm">استرون</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            <div>
              <label className="block text-[11px] text-[#18181B] font-bold mb-1">
                آنزیم مسیر استرادیول → استریول
              </label>
              <select
                disabled={metabolismSolved}
                value={enzymes.left_vertical}
                onChange={(e) => setEnzymes((p) => ({ ...p, left_vertical: e.target.value }))}
                dir="ltr"
                className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#18181B]"
              >
                <option value="">انتخاب آنزیم...</option>
                {ENZYME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-[#52525B] font-mono">↓ مسیر تبدیل عمودی ↓</div>
            <div>
              <label className="block text-[11px] text-[#18181B] font-bold mb-1">
                آنزیم مسیر استرون → 16α-هیدروکسی‌استرون
              </label>
              <select
                disabled={metabolismSolved}
                value={enzymes.right_vertical}
                onChange={(e) => setEnzymes((p) => ({ ...p, right_vertical: e.target.value }))}
                dir="ltr"
                className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#18181B]"
              >
                <option value="">انتخاب آنزیم...</option>
                {ENZYME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] p-3 font-bold text-sm">استریول</div>
            <div>
              <label className="block text-[11px] text-[#18181B] font-bold mb-1">
                آنزیم تبدیل استریول ⇄ 16α-هیدروکسی‌استرون
              </label>
              <select
                disabled={metabolismSolved}
                value={enzymes.bottom_horizontal}
                onChange={(e) => setEnzymes((p) => ({ ...p, bottom_horizontal: e.target.value }))}
                dir="ltr"
                className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#18181B]"
              >
                <option value="">انتخاب آنزیم...</option>
                {ENZYME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] p-3 font-bold text-sm">16α-هیدروکسی‌استرون</div>
          </div>
        </div>

        <ProgressiveHintBox
          solved={metabolismSolved}
          hints={[
            'تعداد گروه‌های هیدروکسیل و وجود گروه کتون روی کربن C17 در هر ساختار را با پسوند نام‌ها (-diol، -one، -triol) تطبیق بده.',
            'تبدیل برگشت‌پذیر الکل و کتون روی C17 توسط یک دهیدروژناز انجام می‌شود و افزودن هیدروکسیل روی کربن ۱۶ کار یک هیدروکسیلاز است.',
          ]}
        />

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

        {!metabolismSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={
                metLoading ||
                Object.values(enzymes).some((value) => !value) ||
                Object.values(structurePositions).some((value) => !value)
              }
              onClick={handleMetSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {metLoading ? 'در حال بررسی...' : 'تایید و ورود به اتاق ماه عسل'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۲: فرم خوراکی و طولانی‌اثر */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          metabolismSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(2)}: قفسه موش‌ها — فرم خوراکی و طولانی‌اثر استروژن رو بساز
        </h3>
        <p className="text-xs leading-6 text-[#52525B]">
          به محض ورود چشمت به قفسه موش‌ها می‌افته که دارن یه دارویی می‌خورن؛ اما ماده‌ای که روی ویال کشیدن اصلاً خوراکی نیست! با جعبه‌ابزار آزاد، فرم <strong>خوراکی و طولانی‌اثرش</strong> رو بساز:
        </p>

        <SteroidSandbox
          mode="estrogen_oral"
          disabled={!metabolismSolved}
          solved={oralDesignSolved}
          onTokensChange={setOralMods}
        />

        {oralFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              oralFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {oralFeedback.text}
          </div>
        )}
        {!oralDesignSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!metabolismSolved || oralLoading || oralMods.length === 0}
              onClick={handleOralSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {oralLoading ? 'در حال بررسی...' : 'ثبت ساختار ساخته‌شده'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۳: رتبه‌بندی قدرت (با ساختار اصلاح‌شده Dienestrol برای ترکیب ۳) */}
      <div
        className={`lab-card p-6 space-y-4 transition ${
          oralDesignSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(3)}: رمز کامپیوتر قفل‌شده — این ۴ مولکول رو بر اساس قدرت مرتب کن
        </h3>
        <p className="text-xs leading-6 text-[#52525B]">
          از قوی‌ترین (بالا) به ضعیف‌ترین (پایین) مرتب کن تا قفل کامپیوترشون باز بشه (دو ترکیب قدرت برابر دارند):
        </p>
        <div className="space-y-3">
          {potencyOrder.map((id, index) => {
            const item = POTENCY_COMPOUNDS.find((c) => c.id === id)!;
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
                      revealed={potencySolved}
                      revealedName={item.revealedName}
                      revealedNote={item.revealedNote}
                      compact
                    />
                  </div>
                </div>
                {!potencySolved && (
                  <div className="flex gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={!oralDesignSolved || index === 0}
                      onClick={() => movePotencyItem(index, -1)}
                      aria-label={`بالا بردن ترکیب ${id}`}
                      className="btn-tactile btn-tactile-surface p-2"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!oralDesignSolved || index === potencyOrder.length - 1}
                      onClick={() => movePotencyItem(index, 1)}
                      aria-label={`پایین بردن ترکیب ${id}`}
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
          solved={potencySolved}
          disabled={!oralDesignSolved}
          hints={[
            'فاصله فضایی میان دو گروه فنولی و میزان قطبیت مولکول، میل اتصال به گیرنده استروژن را تعیین می‌کند.',
            'آگونیست غیراستروئیدی با آرایش فضایی صلب بیشترین قدرت را دارد و افزایش تعداد گروه‌های هیدروکسیل قطبی قدرت اتصال را کاهش می‌دهد.',
          ]}
        />

        {potencyFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              potencyFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {potencyFeedback.text}
          </div>
        )}
        {!potencySolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!oralDesignSolved || potencyLoading}
              onClick={handlePotencySubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {potencyLoading ? 'در حال بررسی...' : 'باز کردن قفل کامپیوتر'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۴: داکینگ در گیرنده — فقط در ۳۱۵ درجه هم‌تراز و سبز می‌شود */}
      <div
        className={`lab-card p-6 space-y-6 transition ${
          potencySolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FFE4E6] p-4 flex items-start gap-3">
          <Siren className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-6 text-[#18181B]">
            <strong>اوه اوهههه! خانم لارنس بالا سر کامپیوترش دیدت — لو رفتی!</strong>
            <br />
            فقط <strong>{toPersianDigits(10)} ثانیه</strong> وقت داری ساختار رو داخل رسپتور بچرخونی تا دو سر هیدروکسیلش دقیقاً روبه‌روی آمینواسیدها قرار بگیرن و قفل در باز بشه!
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 rounded-[8px] border-2 border-[#18181B] molecule-dot-grid p-4 flex flex-col items-center">
            <div dir="ltr" className="w-full flex justify-center">
              <svg viewBox="0 0 320 220" className="w-full max-w-[320px] h-52 bg-transparent">
                <rect x="12" y="132" width="84" height="28" rx="6" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
                <text x="20" y="150" fill="#18181B" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">Glu 353</text>

                <rect x="114" y="182" width="90" height="28" rx="6" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
                <text x="126" y="200" fill="#18181B" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">Arg 394</text>

                <rect x="224" y="22" width="84" height="28" rx="6" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                <text x="236" y="40" fill="#18181B" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">His 524</text>

                {/* پیوندهای هیدروژنی سبز فقط و فقط در زاویه ۳۱۵ درجه دقیقاً بین OH و آمینواسیدها */}
                {isAligned && (
                  <>
                    <line x1="96" y1="148" x2="109" y2="159" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="4,3" />
                    <line x1="138" y1="182" x2="122" y2="167" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="4,3" />
                    <line x1="224" y1="45" x2="207" y2="62" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="4,3" />
                  </>
                )}

                <g transform={`rotate(${angle} 160 110)`}>
                  <line x1="145" y1="110" x2="175" y2="110" stroke="#18181B" strokeWidth="2.5" />
                  <line x1="145" y1="115" x2="175" y2="115" stroke="#0D9488" strokeWidth="2" />
                  <polygon points="115,95 135,95 145,112 135,130 115,130 105,112" fill="none" stroke="#18181B" strokeWidth="2" />
                  <text x="79" y="116" fill="#E11D48" fontSize="11.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">HO</text>
                  <polygon points="185,95 205,95 215,112 205,130 185,130 175,112" fill="none" stroke="#18181B" strokeWidth="2" />
                  <text x="219" y="116" fill="#E11D48" fontSize="11.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">OH</text>
                </g>
              </svg>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                disabled={!potencySolved || dockingSolved || escapeSeconds === 0}
                onClick={() => {
                  setAngle((a) => (a + 45) % 360);
                  setHasRotated(true);
                  setEscapeStarted(true);
                }}
                className="btn-tactile btn-tactile-surface px-4 py-2 text-xs"
              >
                <RotateCw className="w-4 h-4 text-[#0D9488]" /> چرخش {toPersianDigits(45)} درجه ({toPersianDigits(angle)}°)
              </button>
              <span className={`text-xs font-extrabold ${isAligned ? 'text-[#16A34A]' : 'text-[#F59E0B]'}`}>
                {isAligned ? 'هم‌تراز شد ✓' : 'بچرخون...'}
              </span>
            </div>
            <div className="mt-3 text-xs font-mono font-bold text-[#E11D48]" role="status" aria-live="polite">
              {escapeSeconds > 0
                ? `مهلت فرار: ${toPersianDigits(escapeSeconds)} ثانیه`
                : 'مهلت تمام شد! روی دکمه زیر بزن و دوباره سریع بچرخون.'}
            </div>
            {potencySolved && escapeSeconds === 0 && !dockingSolved && (
              <button
                type="button"
                onClick={() => {
                  setAngle(45);
                  setHasRotated(false);
                  setEscapeSeconds(10);
                  setEscapeStarted(false);
                }}
                className="btn-tactile btn-tactile-crimson mt-2 px-3 py-1.5 text-xs"
              >
                تلاش دوباره ({toPersianDigits(10)} ثانیه)
              </button>
            )}
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="text-xs leading-7 text-[#52525B]">
              ساختار رو بچرخون تا دو طرف هیدروکسیلش دقیقاً روبه‌روی <strong>Glu 353، Arg 394</strong> (پایین چپ) و <strong>His 524</strong> (بالا راست) قرار بگیره و پیوند هیدروژنی سبز برقرار بشه!
            </div>
            {dockingSolved && (
              <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FEF3C7] p-4 text-xs leading-7 text-[#18181B]">
                <strong>پیچش داستانی!</strong> با اینکه درست وصل کردی، متاسفانه رمز خروج رو عوض کردن و گیر افتادی... اما نگران نباش، خانم لارنس حرف مهمی باهات داره!
              </div>
            )}
          </div>
        </div>

        {dockFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold flex items-start gap-2 ${
              dockFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {dockFeedback.ok ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-[#E11D48] shrink-0" />}
            <span>{dockFeedback.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          {!dockingSolved && (
            <button
              type="button"
              disabled={!potencySolved || dockLoading || !hasRotated || escapeSeconds === 0}
              onClick={handleDockSubmit}
              className="btn-tactile btn-tactile-primary px-6 py-2.5 text-sm"
            >
              {dockLoading ? 'در حال ثبت...' : 'ثبت اتصال و تلاش برای فرار'}
            </button>
          )}
        </div>
      </div>

      {/* گام ۵: میز کار تعاملی اصلاح ساختار استروژن فنولیک خانم لارنس */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          dockingSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading font-bold text-base text-[#18181B] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#0D9488]" />
            <span>گام {toPersianDigits(5)}: اصلاح ساختار داروی خانم لارنس برای جلوگیری از تشکیل متابولیت سرطان‌زا</span>
          </h3>
          {!metaboliteSolved && dockingSolved && (
            <button
              type="button"
              onClick={() => {
                setRingAState(INITIAL_RING_A);
                setRingANotice(null);
              }}
              className="btn-tactile btn-tactile-surface px-3 py-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> بازنشانی ساختار
            </button>
          )}
        </div>

        <div className="rounded-[6px] border-2 border-[#18181B] bg-[#EFECE6] p-3.5 text-xs leading-7 text-[#18181B]">
          <strong>خانم لارنس:</strong> <em>«که اومدی اینجا جاسوسی کنی! باشه، من بهت کمک می‌کنم؛ چون ارول یه دارویی به من داد بخورم که توی بدن به متابولیت فعال کاتکول-کوئینون تبدیل می‌شه و باعث سرطان شد... خودت روی ساختار زیر تغییر لازم رو اعمال کن تا دیگه به اون متابولیت فعال تبدیل نشه!»</em>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* بوم تعاملی اصلاح حلقه A */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-[8px] border-2 border-[#18181B] molecule-dot-grid p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[4px] border border-[#18181B] bg-[#EFECE6]">
                  INTERACTIVE RING-A EDITOR
                </span>
                <span className="text-[11px] font-bold text-[#52525B]">
                  روی نقاط خط‌چین (C2، C3، C4، C17β) کلیک کن
                </span>
              </div>

              <div dir="ltr" className="w-full flex justify-center">
                <svg viewBox="0 0 360 205" className="w-full max-w-[380px] h-48 bg-transparent">
                  {/* Ring A (Aromatic) */}
                  <polygon points="75,92 108,73 141,92 141,130 108,149 75,130" fill="rgba(13,148,136,0.08)" stroke="#18181B" strokeWidth="2" />
                  <circle cx="108" cy="111" r="18" fill="none" stroke="#18181B" strokeWidth="2" />

                  {/* Ring B, C, D */}
                  <polygon points="141,92 174,73 207,92 207,130 174,149 141,130" fill="none" stroke="#18181B" strokeWidth="2" />
                  <polygon points="174,73 174,35 207,16 240,35 240,73 207,92" fill="none" stroke="#18181B" strokeWidth="2" />
                  <polygon points="240,35 276,24 298,54 276,84 240,73" fill="none" stroke="#18181B" strokeWidth="2" />

                  {/* C2 substituent */}
                  {ringAState.C2 !== 'H' && (
                    <g>
                      <line x1="75" y1="92" x2="50" y2="78" stroke={ringAState.C2 === 'F' ? '#0D9488' : '#18181B'} strokeWidth="2" />
                      <text x="26" y="77" fill={ringAState.C2 === 'F' ? '#0D9488' : ringAState.C2 === 'OH' ? '#E11D48' : '#18181B'} fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                        {ringAState.C2 === 'OH' ? 'HO' : ringAState.C2}
                      </text>
                    </g>
                  )}

                  {/* C3 substituent */}
                  {ringAState.C3 !== 'H' && (
                    <g>
                      <line x1="75" y1="130" x2="48" y2="144" stroke="#18181B" strokeWidth="2" />
                      <text x={ringAState.C3 === 'OCH3' ? '6' : '22'} y="152" fill="#E11D48" fontSize="11.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                        {ringAState.C3 === 'OH' ? 'HO' : 'CH3O'}
                      </text>
                    </g>
                  )}

                  {/* C4 substituent */}
                  {ringAState.C4 !== 'H' && (
                    <g>
                      <line x1="108" y1="149" x2="108" y2="176" stroke={ringAState.C4 === 'F' ? '#0D9488' : '#18181B'} strokeWidth="2" />
                      <text x="102" y="191" fill={ringAState.C4 === 'F' ? '#0D9488' : ringAState.C4 === 'OH' ? '#E11D48' : '#18181B'} fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                        {ringAState.C4}
                      </text>
                    </g>
                  )}

                  {/* C17β-OH */}
                  {ringAState.C17b === 'OH' && (
                    <g>
                      <polygon points="276,24 302,10 306,16" fill="#18181B" />
                      <text x="310" y="18" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">OH</text>
                    </g>
                  )}

                  {/* Interactive Dashed Hotspots */}
                  {!metaboliteSolved && dockingSolved && (
                    <>
                      {(
                        [
                          { id: 'C2' as const, cx: 65, cy: 86 },
                          { id: 'C3' as const, cx: 63, cy: 137 },
                          { id: 'C4' as const, cx: 108, cy: 162 },
                          { id: 'C17b' as const, cx: 292, cy: 18 },
                        ]
                      ).map((spot) => (
                        <g
                          key={spot.id}
                          onClick={() => {
                            if (selectedRingATool) {
                              applyRingATool(selectedRingATool, spot.id);
                            } else {
                              setRingANotice('ابتدا یک گروه یا ابزار را از پنل کنار انتخاب کن و سپس روی موقعیت هدف کلیک کن.');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={spot.cx}
                            cy={spot.cy}
                            r="13"
                            fill="rgba(255,255,255,0.85)"
                            stroke="#71717A"
                            strokeWidth="2"
                            strokeDasharray="4,3"
                          />
                          <text
                            x={spot.cx}
                            y={spot.cy + 3}
                            textAnchor="middle"
                            fill="#18181B"
                            fontSize="7.5"
                            fontWeight="bold"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {spot.id}
                          </text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </div>

            {ringANotice && (
              <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FEF3C7] px-3 py-2 text-xs font-bold text-[#18181B]">
                {ringANotice}
              </div>
            )}
          </div>

          {/* پنل ابزار + ساختار متابولیت سمی جهت مقایسه */}
          <div className="lg:col-span-5 space-y-3">
            <MoleculeStructureCard
              smiles={LAWRENCE_CATECHOL_METABOLITE_SMILES}
              label="متابولیت سمی که نباید تشکیل شود (کاتکول ۴-هیدروکسی)"
              compact
            />

            {!metaboliteSolved && (
              <div className="rounded-[8px] border-2 border-[#18181B] bg-[#EFECE6] p-3 space-y-2">
                <div className="text-xs font-bold text-[#18181B]">ابزارهای اصلاح ساختار:</div>
                <div className="space-y-1.5">
                  {RING_A_TOOLS.map((t) => {
                    const active = selectedRingATool === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedRingATool(active ? null : t.id)}
                        className={`w-full rounded-[6px] border-2 border-[#18181B] px-3 py-1.5 text-xs font-bold flex items-center justify-between transition ${
                          active ? 'bg-[#0D9488] text-white' : 'bg-[#FFFFFF] text-[#18181B] hover:bg-[#F7F5F0]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {t.id === 'DEL' && <Eraser className="w-3.5 h-3.5" />}
                          <span>{t.label}</span>
                        </span>
                        <span dir="ltr" className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[#18181B] bg-[#FFFFFF] text-[#18181B]">
                          {t.formula}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <ProgressiveHintBox
          solved={metaboliteSolved}
          disabled={!dockingSolved}
          hints={[
            'متابولیت سرطان‌زا زمانی شکل می‌گیرد که آنزیم CYP1B1 روی موقعیت ارتو نسبت به گروه فنولی حلقه A هیدروکسیلاسیون انجام دهد و ساختار کاتکول بسازد.',
            'برای جلوگیری از اکسیداسیون کاتکولی-کوئینونی، یا باید موقعیت ارتو را با یک اتم مقاوم به متابولیسم مسدود کنی یا خود گروه فنولی را بپوشانی (بدون آسیب به C17β-OH).',
          ]}
        />

        {metaboliteFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              metaboliteFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {metaboliteFeedback.text}
          </div>
        )}
        {!metaboliteSolved && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!dockingSolved || metaboliteLoading}
              onClick={handleMetaboliteSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {metaboliteLoading ? 'در حال بررسی ساختار...' : 'ثبت اصلاح ساختار برای خانم لارنس'}
            </button>
          </div>
        )}
      </div>

      {/* گام ۶: دسته‌بندی ۴ دارو و کشف سرنخ سیانید */}
      <div
        className={`lab-card p-6 space-y-5 transition ${
          metaboliteSolved ? '' : 'opacity-60 pointer-events-none'
        }`}
      >
        <h3 className="font-heading font-bold text-base text-[#18181B]">
          گام {toPersianDigits(6)}: وصل کردن ساختارها به دسته دارویی (پاداش خانم لارنس)
        </h3>
        <p className="text-xs leading-6 text-[#52525B]">
          <strong>خانم لارنس:</strong> <em>«دستت درد نکنه که کمکم کردی! منم در ازای لطفت بهت می‌گم این ساختارها رو به دسته داروییشون وصل کن و اونی که مربوط به مورد ۴ هست رو خوب یادت باشه...»</em>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shuffledDrugStructures.map((st) => (
            <MoleculeStructureCard
              key={st.id}
              smiles={st.smiles}
              label={st.blindLabel}
              revealed={classificationSolved}
              revealedName={st.revealedName}
              revealedNote={st.revealedNote}
              compact
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DRUG_CLASS_FIELDS.map((field) => (
            <label key={field.key} className="space-y-1 text-xs text-[#18181B]">
              <span className="font-bold block">
                {classificationSolved ? field.revealedTitle : field.blindTitle}
              </span>
              <select
                required
                disabled={!metaboliteSolved || classificationSolved}
                value={classifications[field.key]}
                onChange={(event) =>
                  setClassifications((previous) => ({
                    ...previous,
                    [field.key]: event.target.value,
                  }))
                }
                className="w-full rounded-[6px] border-2 border-[#18181B] bg-[#FFFFFF] px-3 py-2 text-xs text-[#18181B]"
              >
                <option value="">انتخاب ساختار...</option>
                {shuffledDrugStructures.map((option) => (
                  <option key={option.id} value={option.id}>
                    {classificationSolved ? `${option.blindLabel} — ${option.revealedName}` : option.blindLabel}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <ProgressiveHintBox
          solved={classificationSolved}
          disabled={!metaboliteSolved}
          hints={[
            'ابتدا ساختارهای دارای هسته چهارحلقه‌ای استروئیدی را از ساختارهای غیراستروئیدی جدا کن.',
            'به ویژگی‌های کلیدی هر کلاس توجه کن: زنجیره بسیار بلند جانبی روی حلقه B، داربست هتروسیکلیک دارای گوگرد، و حضور حلقه آزول برای کلاته کردن آهن آروماتاز.',
          ]}
        />

        {classificationFeedback && (
          <div
            className={`rounded-[6px] border-2 border-[#18181B] p-3 text-sm font-bold ${
              classificationFeedback.ok ? 'bg-[#DCFCE7] text-[#18181B]' : 'bg-[#FFE4E6] text-[#E11D48]'
            }`}
          >
            {classificationFeedback.text}
          </div>
        )}
        {!classificationSolved ? (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={
                !metaboliteSolved ||
                classificationLoading ||
                Object.values(classifications).some((value) => !value)
              }
              onClick={handleClassificationSubmit}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
            >
              {classificationLoading ? 'در حال بررسی...' : 'ثبت دسته‌بندی و استخراج سرنخ سیانید'}
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onBackToMap}
              className="btn-tactile btn-tactile-emerald px-6 py-2.5 text-sm"
            >
              ذخیره سرنخ سوم (سیانید) و بازگشت ←
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
