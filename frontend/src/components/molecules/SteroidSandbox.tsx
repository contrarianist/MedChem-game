import React, { useMemo, useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  Activity,
  Eraser,
  FlipHorizontal2,
} from 'lucide-react';

export type SandboxMode = 'free' | 'mineral_reduce' | 'estrogen_oral' | 'progestin_nor' | 'antidote';

export type HotspotId =
  | 'ringA'
  | 'C3'
  | 'C6'
  | 'C9'
  | 'C11'
  | 'C16'
  | 'C17a'
  | 'C17b'
  | 'C19'
  | 'C21';

export type Stereo = 'alpha' | 'beta';

export interface SandboxState {
  ringA: 'delta4' | 'delta14' | 'aromatic';
  C3: '=O' | 'OH' | 'OCH3' | '=N-OH';
  C6: 'H' | 'CH3' | 'F';
  C6Stereo: Stereo;
  C9: 'H' | 'F';
  C9Stereo: Stereo;
  C11: 'H' | 'OH' | '=O' | 'aryl';
  C11Stereo: Stereo;
  C16: 'H' | 'OH' | 'CH3' | 'CN';
  C16Stereo: Stereo;
  C17a: 'H' | 'OH' | 'ethynyl';
  C17b: 'H' | 'OH' | 'ketol';
  C19: 'CH3' | 'H';
  C21: 'none' | 'OH' | 'ester' | 'phosphate';
}

type ToolCategory = 'groups' | 'rings' | 'chains' | 'edit';

interface UniversalTool {
  id: string;
  label: string;
  formula: string;
  category: ToolCategory;
  apply: (state: SandboxState, spot: HotspotId) => { next?: SandboxState; error?: string };
}

interface MeterSpec {
  label: string;
  value: number;
  displayValue: string;
  colorClass: string;
  targetMin?: number;
  targetMax?: number;
}

interface Props {
  mode: SandboxMode;
  disabled?: boolean;
  solved?: boolean;
  onTokensChange?: (tokens: string[]) => void;
}

const INITIAL_STATES: Record<SandboxMode, SandboxState> = {
  free: {
    ringA: 'delta4',
    C3: '=O',
    C6: 'H',
    C6Stereo: 'alpha',
    C9: 'H',
    C9Stereo: 'alpha',
    C11: 'OH',
    C11Stereo: 'beta',
    C16: 'H',
    C16Stereo: 'alpha',
    C17a: 'OH',
    C17b: 'ketol',
    C19: 'CH3',
    C21: 'OH',
  },
  mineral_reduce: {
    ringA: 'delta4',
    C3: '=O',
    C6: 'H',
    C6Stereo: 'alpha',
    C9: 'F',
    C9Stereo: 'alpha',
    C11: 'OH',
    C11Stereo: 'beta',
    C16: 'H',
    C16Stereo: 'alpha',
    C17a: 'OH',
    C17b: 'ketol',
    C19: 'CH3',
    C21: 'OH',
  },
  estrogen_oral: {
    ringA: 'aromatic',
    C3: 'OH',
    C6: 'H',
    C6Stereo: 'alpha',
    C9: 'H',
    C9Stereo: 'alpha',
    C11: 'H',
    C11Stereo: 'beta',
    C16: 'H',
    C16Stereo: 'alpha',
    C17a: 'H',
    C17b: 'OH',
    C19: 'H',
    C21: 'none',
  },
  progestin_nor: {
    ringA: 'delta4',
    C3: '=O',
    C6: 'H',
    C6Stereo: 'alpha',
    C9: 'H',
    C9Stereo: 'alpha',
    C11: 'H',
    C11Stereo: 'beta',
    C16: 'H',
    C16Stereo: 'alpha',
    C17a: 'H',
    C17b: 'OH',
    C19: 'CH3',
    C21: 'none',
  },
  antidote: {
    ringA: 'delta14',
    C3: '=O',
    C6: 'H',
    C6Stereo: 'alpha',
    C9: 'F',
    C9Stereo: 'alpha',
    C11: 'OH',
    C11Stereo: 'beta',
    C16: 'CN',
    C16Stereo: 'alpha',
    C17a: 'OH',
    C17b: 'ketol',
    C19: 'CH3',
    C21: 'ester',
  },
};

const SOLVED_STATES: Record<SandboxMode, SandboxState> = {
  free: INITIAL_STATES.free,
  mineral_reduce: {
    ...INITIAL_STATES.mineral_reduce,
    ringA: 'delta14',
    C16: 'CH3',
    C16Stereo: 'alpha',
  },
  estrogen_oral: {
    ...INITIAL_STATES.estrogen_oral,
    C3: 'OCH3',
    C17a: 'ethynyl',
  },
  progestin_nor: {
    ...INITIAL_STATES.progestin_nor,
    C19: 'H',
    C17a: 'ethynyl',
    C3: '=N-OH',
  },
  antidote: {
    ...INITIAL_STATES.antidote,
    C9: 'H',
    C16: 'H',
    C11: 'aryl',
    C21: 'OH',
  },
};

const UNIVERSAL_TOOLS: UniversalTool[] = [
  {
    id: 'delta14',
    label: 'پیوند دوگانه Δ1',
    formula: 'C1=C2',
    category: 'rings',
    apply: (s, spot) =>
      spot === 'ringA'
        ? { next: { ...s, ringA: 'delta14' } }
        : { error: 'پیوند دوگانه Δ1 فقط روی حلقه A قرار می‌گیرد.' },
  },
  {
    id: 'delta4',
    label: 'حلقه Δ4 ساده',
    formula: 'C4=C5',
    category: 'rings',
    apply: (s, spot) =>
      spot === 'ringA'
        ? { next: { ...s, ringA: 'delta4' } }
        : { error: 'تغییر ساختار حلقه فقط روی حلقه A اعمال می‌شود.' },
  },
  {
    id: 'aromatic',
    label: 'آروماتیک کردن حلقه A',
    formula: 'Aromatic',
    category: 'rings',
    apply: (s, spot) =>
      spot === 'ringA'
        ? { next: { ...s, ringA: 'aromatic', C19: 'H', C3: s.C3 === '=O' ? 'OH' : s.C3 } }
        : { error: 'آروماتیک کردن فقط روی حلقه A امکان‌پذیر است.' },
  },
  {
    id: 'fluorine',
    label: 'اتم فلوئور',
    formula: '-F',
    category: 'groups',
    apply: (s, spot) => {
      if (spot === 'C9') return { next: { ...s, C9: 'F', C9Stereo: 'alpha' } };
      if (spot === 'C6') return { next: { ...s, C6: 'F', C6Stereo: 'alpha' } };
      return { error: 'در استروئیدهای دارویی، فلوئور روی موقعیت‌های C9 یا C6 قرار می‌گیرد.' };
    },
  },
  {
    id: 'methyl',
    label: 'گروه متیل',
    formula: '-CH3',
    category: 'groups',
    apply: (s, spot) => {
      if (spot === 'C6') return { next: { ...s, C6: 'CH3', C6Stereo: 'alpha' } };
      if (spot === 'C16') return { next: { ...s, C16: 'CH3' } };
      if (spot === 'C19') return { next: { ...s, C19: 'CH3' } };
      return { error: 'گروه متیل را می‌توانید روی C6، C16 یا C19 قرار دهید.' };
    },
  },
  {
    id: 'hydroxyl',
    label: 'هیدروکسیل',
    formula: '-OH',
    category: 'groups',
    apply: (s, spot) => {
      if (spot === 'C3') return { next: { ...s, C3: 'OH' } };
      if (spot === 'C11') return { next: { ...s, C11: 'OH', C11Stereo: 'beta' } };
      if (spot === 'C16') return { next: { ...s, C16: 'OH', C16Stereo: 'alpha' } };
      if (spot === 'C17a') return { next: { ...s, C17a: 'OH' } };
      if (spot === 'C17b') return { next: { ...s, C17b: 'OH' } };
      if (spot === 'C21') return { next: { ...s, C21: 'OH', C17b: 'ketol' } };
      return { error: 'گروه -OH را روی C3، C11، C16، C17 یا C21 قرار دهید.' };
    },
  },
  {
    id: 'keto',
    label: 'گروه کتون',
    formula: '=O',
    category: 'groups',
    apply: (s, spot) => {
      if (spot === 'C3') return { next: { ...s, C3: '=O' } };
      if (spot === 'C11') return { next: { ...s, C11: '=O' } };
      return { error: 'گروه کتون (=O) روی موقعیت‌های C3 یا C11 قابل اتصال است.' };
    },
  },
  {
    id: 'methoxy',
    label: 'متیل اتر',
    formula: '-OCH3',
    category: 'groups',
    apply: (s, spot) =>
      spot === 'C3'
        ? { next: { ...s, C3: 'OCH3' } }
        : { error: 'متیل اتر (-OCH3) برای ساخت پیش‌دارو روی موقعیت C3 قرار می‌گیرد.' },
  },
  {
    id: 'oxime',
    label: 'گروه اکسیم',
    formula: '=N-OH',
    category: 'groups',
    apply: (s, spot) =>
      spot === 'C3'
        ? { next: { ...s, C3: '=N-OH' } }
        : { error: 'گروه اکسیم (=N-OH) روی کربن C3 قرار می‌گیرد.' },
  },
  {
    id: 'ethynyl',
    label: 'گروه اتینیل',
    formula: '-C≡CH',
    category: 'groups',
    apply: (s, spot) =>
      spot === 'C17a'
        ? { next: { ...s, C17a: 'ethynyl' } }
        : { error: 'گروه اتینیل (-C≡CH) برای پایداری خوراکی روی موقعیت C17α قرار می‌گیرد.' },
  },
  {
    id: 'cyanide',
    label: 'گروه سیانید',
    formula: '-C≡N',
    category: 'groups',
    apply: (s, spot) =>
      spot === 'C16'
        ? { next: { ...s, C16: 'CN' } }
        : { error: 'گروه سیانید را می‌توانید روی موقعیت C16 آزمایش کنید.' },
  },
  {
    id: 'aryl',
    label: 'آریل حجیم آنتاگونیست',
    formula: 'Ar-NMe2',
    category: 'chains',
    apply: (s, spot) =>
      spot === 'C11'
        ? { next: { ...s, C11: 'aryl', C11Stereo: 'beta' } }
        : { error: 'گروه حجیم آریل آنتاگونیست روی C11β قرار می‌گیرد.' },
  },
  {
    id: 'ketol',
    label: 'زنجیره کتول C17β',
    formula: '-CO-CH2OH',
    category: 'chains',
    apply: (s, spot) =>
      spot === 'C17b' || spot === 'C21'
        ? { next: { ...s, C17b: 'ketol', C21: 'OH' } }
        : { error: 'زنجیره کتول روی موقعیت C17β یا C21 قرار می‌گیرد.' },
  },
  {
    id: 'ester',
    label: 'استر لیپوفیل (موضعی)',
    formula: '-OCOR',
    category: 'chains',
    apply: (s, spot) =>
      spot === 'C21' || spot === 'C17b'
        ? { next: { ...s, C17b: 'ketol', C21: 'ester' } }
        : { error: 'استر لیپوفیل موضعی روی زنجیره C21 قرار می‌گیرد.' },
  },
  {
    id: 'phosphate',
    label: 'فسفات قطبی (تزریقی)',
    formula: '-PO4',
    category: 'chains',
    apply: (s, spot) =>
      spot === 'C21' || spot === 'C17b'
        ? { next: { ...s, C17b: 'ketol', C21: 'phosphate' } }
        : { error: 'گروه فسفات محلول در آب روی موقعیت C21 قرار می‌گیرد.' },
  },
  {
    id: 'flip_stereo',
    label: 'تغییر فضایی (α ⇄ β)',
    formula: 'α/β',
    category: 'edit',
    apply: (s, spot) => {
      if (spot === 'C16' && s.C16 !== 'H') {
        return { next: { ...s, C16Stereo: s.C16Stereo === 'alpha' ? 'beta' : 'alpha' } };
      }
      if (spot === 'C6' && s.C6 !== 'H') {
        return { next: { ...s, C6Stereo: s.C6Stereo === 'alpha' ? 'beta' : 'alpha' } };
      }
      if (spot === 'C9' && s.C9 !== 'H') {
        return { next: { ...s, C9Stereo: s.C9Stereo === 'alpha' ? 'beta' : 'alpha' } };
      }
      if (spot === 'C11' && s.C11 === 'OH') {
        return { next: { ...s, C11Stereo: s.C11Stereo === 'alpha' ? 'beta' : 'alpha' } };
      }
      return { error: 'ابتدا یک استخلاف روی C6، C9، C11 یا C16 قرار دهید تا آرایش α/β آن تغییر کند.' };
    },
  },
  {
    id: 'eraser',
    label: 'پاک‌کن (حذف گروه)',
    formula: 'DEL',
    category: 'edit',
    apply: (s, spot) => {
      if (spot === 'C6') return { next: { ...s, C6: 'H' } };
      if (spot === 'C9') return { next: { ...s, C9: 'H' } };
      if (spot === 'C11') return { next: { ...s, C11: 'H' } };
      if (spot === 'C16') return { next: { ...s, C16: 'H' } };
      if (spot === 'C17a') return { next: { ...s, C17a: 'H' } };
      if (spot === 'C17b') return { next: { ...s, C17b: 'H', C21: 'none' } };
      if (spot === 'C19') return { next: { ...s, C19: 'H' } };
      if (spot === 'C21') return { next: { ...s, C21: s.C17b === 'ketol' ? 'OH' : 'none' } };
      return { error: 'این موقعیت را می‌توانید با انتخاب گروه دیگر جایگزین کنید.' };
    },
  },
];

function computeTokens(mode: SandboxMode, s: SandboxState): string[] {
  const tokens: string[] = [];
  if (mode === 'mineral_reduce') {
    const hasGcCore = s.C11 === 'OH' && s.C11Stereo === 'beta' && s.C17b === 'ketol';
    if (hasGcCore && (s.C16 === 'OH' || s.C16 === 'CH3' || s.C9 === 'H')) {
      tokens.push('mineral_reduced');
    }
  } else if (mode === 'estrogen_oral') {
    if (s.C17a === 'ethynyl') tokens.push('add_17alpha_ethynyl');
    if (s.C3 === 'OCH3') tokens.push('methylate_3_hydroxyl');
    if (s.C17b === 'H') tokens.push('remove_17beta_hydroxyl');
  } else if (mode === 'progestin_nor') {
    if (s.C19 === 'H') tokens.push('remove_c19_methyl');
    if (s.C17a === 'ethynyl') tokens.push('c17_alpha_ethynyl');
    if (s.C3 === '=N-OH') tokens.push('c3_oxime_or_ester');
    if (s.ringA === 'aromatic') tokens.push('aromatize_ring_a');
  } else if (mode === 'antidote') {
    if (s.C9 === 'H') tokens.push('remove_9alpha_f');
    if (s.C16 === 'H') tokens.push('remove_cyanide');
    if (s.C11 === 'aryl') tokens.push('add_11beta_antagonist_aryl');
    if (s.C21 === 'OH') tokens.push('hydrolyze_lipophilic_ester');
    if (s.C6 === 'F') tokens.push('add_extra_fluorine_decoy');
  }
  return tokens;
}

function identifyDrug(s: SandboxState): string | null {
  if (s.ringA === 'aromatic' && s.C17b === 'OH') {
    if (s.C3 === 'OH' && s.C17a === 'H') return '17β-Estradiol';
    if (s.C3 === 'OH' && s.C17a === 'ethynyl') return 'Ethinyl Estradiol (Oral)';
    if (s.C3 === 'OCH3' && s.C17a === 'ethynyl') return 'Mestranol (Oral Long-Acting)';
  }
  if (s.ringA === 'delta4' && s.C19 === 'H' && s.C17a === 'ethynyl' && s.C17b === 'OH') {
    if (s.C3 === '=N-OH') return 'Norgestimate-like (19-Nor Progestin)';
    if (s.C3 === '=O') return 'Norethindrone (Oral 19-Nor)';
  }
  if (s.C11 === 'aryl' && s.C9 === 'H' && s.C16 === 'H') {
    return '11β-Aryl Antagonist (Antidote)';
  }
  if (s.C17b === 'ketol' && s.C19 === 'CH3') {
    if (s.ringA === 'delta4' && s.C9 === 'H' && s.C6 === 'H' && s.C16 === 'H') {
      if (s.C11 === 'OH' && s.C11Stereo === 'beta') return 'Hydrocortisone (1× Ref)';
      if (s.C11 === '=O') return 'Cortisone (Prodrug)';
    }
    if (s.ringA === 'delta4' && s.C9 === 'F' && s.C6 === 'H' && s.C16 === 'H' && s.C11 === 'OH') {
      return 'Fludrocortisone (High MC)';
    }
    if (s.ringA === 'delta14' && s.C9 === 'H' && s.C11 === 'OH' && s.C16 === 'H') {
      if (s.C6 === 'H') return 'Prednisolone (4×)';
      if (s.C6 === 'CH3') return 'Methylprednisolone (5×)';
    }
    if (s.ringA === 'delta14' && s.C9 === 'F' && s.C11 === 'OH') {
      if (s.C16 === 'OH' && s.C6 === 'H') return 'Triamcinolone (Zero MC)';
      if (s.C16 === 'OH' && s.C6 === 'F') return 'Fluocinolone (Topical)';
      if (s.C16 === 'CH3' && s.C16Stereo === 'alpha' && s.C6 === 'H') return 'Dexamethasone (25–30×)';
      if (s.C16 === 'CH3' && s.C16Stereo === 'beta' && s.C6 === 'H') return 'Betamethasone (25–30×)';
    }
  }
  return null;
}

function computeMeters(mode: SandboxMode, s: SandboxState): { meters: MeterSpec[]; insight: string } {
  if (mode === 'estrogen_oral') {
    const oral = s.C17a === 'ethynyl' ? 92 : 12;
    const halfLife = (s.C17a === 'ethynyl' ? 50 : 15) + (s.C3 === 'OCH3' ? 42 : 0);
    const binding = s.C17b === 'H' ? 10 : s.ringA !== 'aromatic' ? 15 : s.C3 === 'OCH3' ? 86 : 95;
    let insight = 'استرادیول طبیعی خوراکی نیست. از جعبه‌ابزار آزاد استفاده کن و روی کربن‌های مختلف آزمایش کن تا اثر خوراکی و طول اثر بالا برود.';
    if (s.C17b === 'H') {
      insight = 'حذف 17β-OH پیوند هیدروژنی کلیدی با گیرنده استروژن را از بین برد!';
    } else if (s.C17a === 'ethynyl' && s.C3 === 'OCH3') {
      insight = 'فوق‌العاده! ساختار اکنون هم خوراکی است و هم به شکل پیش‌دارو طول اثر بالایی دارد.';
    } else if (s.C17a === 'ethynyl') {
      insight = 'عالی، دارو خوراکی شد! برای افزایش طول اثر، روی حلقه A هم فکر کن.';
    }
    return {
      meters: [
        { label: 'Oral Bioavailability', value: oral, displayValue: `${oral}%`, colorClass: oral > 70 ? 'bg-[#16A34A]' : 'bg-[#F59E0B]', targetMin: 75 },
        { label: 'Half-Life / Duration', value: halfLife, displayValue: `${halfLife}%`, colorClass: halfLife > 75 ? 'bg-[#0D9488]' : 'bg-[#F59E0B]', targetMin: 80 },
        { label: 'ERα Binding Affinity', value: binding, displayValue: `${binding}%`, colorClass: binding < 40 ? 'bg-[#E11D48]' : 'bg-[#16A34A]', targetMin: 70 },
      ],
      insight,
    };
  }

  if (mode === 'progestin_nor') {
    const progestin =
      s.ringA === 'aromatic'
        ? 10
        : 35 + (s.C19 === 'H' ? 35 : 0) + (s.C17a === 'ethynyl' ? 25 : 0);
    const oral = s.C17a === 'ethynyl' ? 90 : 18;
    const halfLife = 25 + (s.C3 === '=N-OH' ? 50 : 0) + (s.C17a === 'ethynyl' ? 20 : 0);
    const androgenic = s.ringA === 'aromatic' ? 5 : s.C19 === 'H' ? 18 : 82;
    let insight = 'از جعبه‌ابزار کامل (از جمله پاک‌کن برای حذف گروه‌ها) استفاده کن تا ۳ هدف تخته دکتر ماریا هم‌زمان محقق شوند.';
    if (s.ringA === 'aromatic') {
      insight = 'آروماتیک کردن حلقه A مولکول را شبیه استروژن کرد و خاصیت پروژسترونی از بین رفت!';
    } else if (s.C19 === 'H' && s.C17a === 'ethynyl' && s.C3 === '=N-OH') {
      insight = 'دقیقاً همین بود! مشتق ۱۹-نورآندروستان خوراکی با طول اثر افزایش‌یافته ساخته شد.';
    }
    return {
      meters: [
        { label: 'PR Selectivity', value: progestin, displayValue: `${progestin}%`, colorClass: progestin > 75 ? 'bg-[#16A34A]' : 'bg-[#F59E0B]', targetMin: 80 },
        { label: 'Oral Activity', value: oral, displayValue: `${oral}%`, colorClass: oral > 70 ? 'bg-[#0D9488]' : 'bg-[#F59E0B]', targetMin: 75 },
        { label: 'Half-Life', value: halfLife, displayValue: `${halfLife}%`, colorClass: halfLife > 70 ? 'bg-[#0D9488]' : 'bg-[#52525B]', targetMin: 75 },
        { label: 'Androgenicity (Low)', value: androgenic, displayValue: `${androgenic}%`, colorClass: androgenic > 50 ? 'bg-[#E11D48]' : 'bg-[#16A34A]', targetMax: 30 },
      ],
      insight,
    };
  }

  if (mode === 'antidote') {
    let toxicity = 10;
    if (s.C9 === 'F') toxicity += 30;
    if (s.C16 === 'CN') toxicity += 30;
    if (s.C21 === 'ester') toxicity += 20;
    if (s.C6 === 'F') toxicity += 25;
    if (s.C11 === 'aryl') toxicity = Math.max(0, toxicity - 10);
    toxicity = Math.min(100, toxicity);

    const antagonism = s.C11 === 'aryl' ? 96 : 8;
    const clearance = s.C21 === 'OH' || s.C21 === 'phosphate' ? 90 : 20;

    let insight = 'از ابزار «پاک‌کن» و گروه‌های عاملی استفاده کن تا بخش‌های سمی اهریمن حذف شوند و مولکول به یک آنتاگونیست بی‌خطر تبدیل شود.';
    if (s.C6 === 'F') {
      insight = 'خطر! افزودن فلوئور روی C6 سمیت مولکول را بیشتر کرد!';
    } else if (toxicity === 0 && antagonism > 90 && clearance >= 90) {
      insight = 'پادزهر کامل شد! سمیت صفر است، گروه 11β-آریل گیرنده را مهار می‌کند و مولکول قطبی و قابل دفع شد.';
    }
    return {
      meters: [
        { label: 'Toxicity Index', value: toxicity, displayValue: `${toxicity}%`, colorClass: toxicity === 0 ? 'bg-[#16A34A]' : 'bg-[#E11D48]', targetMax: 10 },
        { label: 'GR Antagonism', value: antagonism, displayValue: `${antagonism}%`, colorClass: antagonism > 80 ? 'bg-[#16A34A]' : 'bg-[#F59E0B]', targetMin: 85 },
        { label: 'Renal Clearance', value: clearance, displayValue: `${clearance}%`, colorClass: clearance > 75 ? 'bg-[#0D9488]' : 'bg-[#F59E0B]', targetMin: 80 },
      ],
      insight,
    };
  }

  // free & mineral_reduce modes
  let gc = 1.0;
  if (s.C11 === '=O') gc *= 0.8;
  if (s.C11 === 'H' || s.C11 === 'aryl') gc *= 0.1;
  if (s.C11 === 'OH' && s.C11Stereo === 'alpha') gc *= 0.05;
  if (s.ringA === 'delta14') gc *= 4.0;
  if (s.ringA === 'aromatic') gc *= 0.05;
  if (s.C6 === 'CH3') gc *= 1.3;
  if (s.C6 === 'F') gc *= 2.5;
  if (s.C9 === 'F') gc *= 8.0;
  if (s.C16 === 'OH') gc *= 0.5;
  if (s.C16 === 'CH3') gc *= 0.9;
  const gcRounded = Math.round(gc * 10) / 10;
  const gcPercent = Math.min(100, Math.round((Math.log10(gc + 1) / Math.log10(60)) * 100));

  let mc = 1.0;
  if (s.ringA === 'delta14') mc *= 0.6;
  if (s.ringA === 'aromatic') mc = 0;
  if (s.C6 === 'CH3') mc *= 0.2;
  if (s.C9 === 'F') mc *= 120;
  if (s.C16 !== 'H') mc = 0;
  const mcPercent = mc === 0 ? 0 : Math.min(100, Math.round((Math.log10(mc + 1) / Math.log10(130)) * 100));

  let halfLifeHours = 10;
  if (s.ringA === 'delta14') halfLifeHours += 12;
  if (s.C6 !== 'H') halfLifeHours += 8;
  if (s.C9 === 'F') halfLifeHours += 18;
  if (s.C16 !== 'H') halfLifeHours += 10;
  if (s.C3 === 'OCH3' || s.C3 === '=N-OH') halfLifeHours += 12;
  const hlPercent = Math.min(100, Math.round((halfLifeHours / 65) * 100));

  let logP = 1.6;
  if (s.C6 === 'CH3') logP += 0.5;
  if (s.C9 === 'F') logP += 0.2;
  if (s.C16 === 'OH') logP -= 0.7;
  if (s.C16 === 'CH3') logP += 0.5;
  if (s.C21 === 'ester') logP += 2.1;
  if (s.C21 === 'phosphate') logP -= 2.4;
  if (s.C3 === 'OCH3') logP += 0.6;
  const logPPercent = Math.max(5, Math.min(100, Math.round(((logP + 1.5) / 6.5) * 100)));

  let insight =
    mode === 'mineral_reduce'
      ? 'این ترکیب کژتاب به دلیل حضور 9α-F اثر مینرالوکورتیکوئیدی بسیار شدیدی (احتباس آب و نمک) دارد. ساختار را طوری اصلاح کن که اثر مینرال آن افت کند در حالی که خاصیت ضدالتهابی حفظ شود.'
      : 'هر گروهی را از جعبه‌ابزار انتخاب کن و روی کربن دلخواه بگذار (یا با α/β آرایش فضایی‌اش را بچرخان) تا اثر واقعی SAR را ببینی.';
  if (s.C11 === 'OH' && s.C11Stereo === 'alpha') {
    insight = 'نکته کلیدی استریوشیمی: تنها ایزومر 11β-OH فعال است! چرخاندن به 11α-OH فعالیت گلوکوکورتیکوئیدی را تقریباً از بین می‌برد.';
  } else if (s.C9 === 'F' && s.C16 === 'H') {
    insight = 'اثر مینرالوکورتیکوئیدی هنوز بسیار بالاست! بررسی کن کدام موقعیت روی حلقه D یا B می‌تواند احتباس سدیم را خنثی کند.';
  } else if (s.C9 === 'F' && s.C16 !== 'H') {
    insight = 'عالی! استخلاف روی C16 اثر احتباس سدیم ناشی از 9α-F را به صفر رساند در حالی که قدرت ضدالتهابی فوق‌العاده باقی ماند.';
  } else if (mode === 'mineral_reduce' && s.C9 === 'H' && s.C11 === 'OH') {
    insight = 'حذف فلوئور 9α نیز اثر مینرال شدید را به‌طور چشمگیری کاهش داد.';
  } else if (s.C21 === 'ester') {
    insight = 'استر لیپوفیل C21 (LogP بالا) ترکیب را برای مصرف موضعی و نفوذ پوستی ایده‌آل می‌کند.';
  } else if (s.C21 === 'phosphate') {
    insight = 'فسفات قطبی C21 انحلال‌پذیری آبی را افزایش داده و دارو را برای مصرف سیستمیک/تزریقی آماده می‌سازد.';
  }

  return {
    meters: [
      { label: 'GC Potency', value: gcPercent, displayValue: `${gcRounded}x`, colorClass: 'bg-[#16A34A]', targetMin: 60 },
      { label: 'MC Activity', value: mcPercent, displayValue: mc === 0 ? '0.0x' : `${Math.round(mc * 10) / 10}x`, colorClass: mc > 5 ? 'bg-[#E11D48]' : 'bg-[#0D9488]', targetMax: 15 },
      { label: 'Half-Life (t½)', value: hlPercent, displayValue: `${halfLifeHours}h`, colorClass: 'bg-[#0D9488]', targetMin: 50 },
      { label: 'cLogP', value: logPPercent, displayValue: logP.toFixed(1), colorClass: 'bg-[#F59E0B]', targetMin: 40, targetMax: 75 },
    ],
    insight,
  };
}

export const SteroidSandbox: React.FC<Props> = ({
  mode,
  disabled = false,
  solved = false,
  onTokensChange,
}) => {
  const [state, setState] = useState<SandboxState>(() =>
    solved ? SOLVED_STATES[mode] : INITIAL_STATES[mode]
  );
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('groups');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [dragOverSpot, setDragOverSpot] = useState<HotspotId | null>(null);
  const [toolNotice, setToolNotice] = useState<string | null>(null);

  const isLocked = disabled || solved;
  const selectedTool = UNIVERSAL_TOOLS.find((t) => t.id === selectedToolId) || null;

  const applyToolToSpot = (tool: UniversalTool, spot: HotspotId) => {
    if (isLocked) return;
    const outcome = tool.apply(state, spot);
    if (outcome.error) {
      setToolNotice(outcome.error);
      return;
    }
    if (outcome.next) {
      setToolNotice(null);
      setState(outcome.next);
      onTokensChange?.(computeTokens(mode, outcome.next));
    }
  };

  const handleReset = () => {
    if (isLocked) return;
    const resetState = INITIAL_STATES[mode];
    setState(resetState);
    onTokensChange?.(computeTokens(mode, resetState));
    setToolNotice(null);
  };

  const { meters, insight } = useMemo(() => computeMeters(mode, state), [mode, state]);
  const recognizedDrug = useMemo(() => identifyDrug(state), [state]);

  const renderHotspot = (spot: HotspotId, cx: number, cy: number, label: string) => {
    if (isLocked) return null;
    const isHovered = dragOverSpot === spot;
    return (
      <g
        key={spot}
        onClick={() => {
          if (selectedTool) {
            applyToolToSpot(selectedTool, spot);
          } else {
            setToolNotice(`ابتدا یک گروه یا ابزار (مثل پاک‌کن یا α/β) از پنل کنترل انتخاب کن و سپس روی ${label} کلیک کن.`);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverSpot(spot);
        }}
        onDragLeave={() => setDragOverSpot(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverSpot(null);
          const tid = e.dataTransfer.getData('text/plain');
          const tool = UNIVERSAL_TOOLS.find((t) => t.id === tid);
          if (tool) applyToolToSpot(tool, spot);
        }}
        className="cursor-pointer"
      >
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 16 : 13}
          fill={isHovered ? 'rgba(13, 148, 136, 0.22)' : 'rgba(255, 255, 255, 0.82)'}
          stroke={isHovered ? '#0D9488' : '#71717A'}
          strokeWidth="2"
          strokeDasharray="4,3"
        />
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fill="#18181B"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
          className="pointer-events-none select-none"
        >
          {spot === 'ringA' ? 'A' : spot}
        </text>
        <title>{label}</title>
      </g>
    );
  };

  const visibleTools = UNIVERSAL_TOOLS.filter((t) => t.category === activeCategory);

  return (
    <div className="lab-card-cream p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-[#18181B]">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-heading font-bold text-[#18181B]">
          <FlaskConical className="w-4 h-4 text-[#0D9488] shrink-0" />
          <span>میز کار تعاملی سنتز و تحلیل زنده SAR</span>
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={handleReset}
            className="btn-tactile btn-tactile-surface px-3 py-1 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> بازنشانی ساختار
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)] gap-4 items-start">
        <div className="space-y-3">
          <div className="rounded-[8px] border-2 border-[#18181B] molecule-dot-grid p-4 flex flex-col items-center shadow-[3px_3px_0px_#18181B]">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-[6px] border border-[#18181B] bg-[#EFECE6] text-[#18181B]">
                2D SCAFFOLD CANVAS
              </span>
              {recognizedDrug && (
                <span className="inline-flex items-center gap-1.5 rounded-[6px] border-2 border-[#18181B] bg-[#16A34A] px-2.5 py-0.5 text-[11px] font-mono font-bold text-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{recognizedDrug}</span>
                </span>
              )}
            </div>

            <div dir="ltr" className="w-full flex justify-center">
              <svg viewBox="0 0 395 230" className="w-full max-w-[460px] h-60 bg-transparent">
                {/* Ring A */}
                <polygon
                  points="68,118 101,99 134,118 134,156 101,175 68,156"
                  fill={state.ringA === 'aromatic' ? 'rgba(13,148,136,0.1)' : 'none'}
                  stroke="#18181B"
                  strokeWidth="2"
                />
                {state.ringA === 'aromatic' ? (
                  <circle cx="101" cy="137" r="18" fill="none" stroke="#18181B" strokeWidth="2" />
                ) : (
                  <>
                    <line x1="102" y1="168" x2="128" y2="153" stroke="#18181B" strokeWidth="2" />
                    {state.ringA === 'delta14' && (
                      <line x1="74" y1="122" x2="100" y2="107" stroke="#0D9488" strokeWidth="2.2" />
                    )}
                  </>
                )}

                {/* C3 */}
                {state.C3 === '=O' && (
                  <g>
                    <line x1="46" y1="166" x2="67" y2="154" stroke="#E11D48" strokeWidth="2" />
                    <line x1="49" y1="171" x2="70" y2="159" stroke="#E11D48" strokeWidth="2" />
                    <text x="29" y="176" fill="#E11D48" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono, monospace">O</text>
                  </g>
                )}
                {state.C3 === 'OH' && (
                  <g>
                    <line x1="46" y1="168" x2="68" y2="156" stroke="#18181B" strokeWidth="2" />
                    <text x="22" y="175" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">HO</text>
                  </g>
                )}
                {state.C3 === 'OCH3' && (
                  <g>
                    <line x1="46" y1="168" x2="68" y2="156" stroke="#18181B" strokeWidth="2" />
                    <text x="4" y="176" fill="#E11D48" fontSize="11.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">CH3O</text>
                  </g>
                )}
                {state.C3 === '=N-OH' && (
                  <g>
                    <line x1="46" y1="166" x2="67" y2="154" stroke="#2563EB" strokeWidth="2" />
                    <line x1="49" y1="171" x2="70" y2="159" stroke="#2563EB" strokeWidth="2" />
                    <text x="8" y="177" fill="#2563EB" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono, monospace">HO-N</text>
                  </g>
                )}

                {/* C19 Methyl */}
                {state.C19 === 'CH3' && (
                  <g>
                    <polygon points="134,118 130,88 138,88" fill="#18181B" />
                    <text x="123" y="83" fill="#18181B" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">CH3</text>
                  </g>
                )}

                {/* Ring B */}
                <polygon
                  points="134,118 167,99 200,118 200,156 167,175 134,156"
                  fill="none"
                  stroke="#18181B"
                  strokeWidth="2"
                />

                {/* C6 */}
                {state.C6 !== 'H' && (
                  <g>
                    <line
                      x1="167"
                      y1="175"
                      x2="167"
                      y2="199"
                      stroke={state.C6 === 'F' ? '#0D9488' : '#18181B'}
                      strokeWidth={state.C6Stereo === 'beta' ? 3 : 2}
                      strokeDasharray={state.C6Stereo === 'alpha' ? '3,2' : undefined}
                    />
                    <text x="159" y="213" fill={state.C6 === 'F' ? '#0D9488' : '#18181B'} fontSize="11.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      {state.C6}
                    </text>
                  </g>
                )}

                {/* C9-F */}
                {state.C9 === 'F' && (
                  <g>
                    <line
                      x1="167"
                      y1="99"
                      x2="167"
                      y2="128"
                      stroke="#0D9488"
                      strokeWidth={state.C9Stereo === 'beta' ? 3.2 : 2.2}
                      strokeDasharray={state.C9Stereo === 'alpha' ? '3,2' : undefined}
                    />
                    <text x="163" y="142" fill="#0D9488" fontSize="13" fontWeight="bold" fontFamily="JetBrains Mono, monospace">F</text>
                  </g>
                )}

                {/* Ring C */}
                <polygon
                  points="167,99 167,61 200,42 233,61 233,99 200,118"
                  fill="none"
                  stroke="#18181B"
                  strokeWidth="2"
                />

                {/* C11 */}
                {state.C11 === 'OH' && (
                  <g>
                    {state.C11Stereo === 'beta' ? (
                      <polygon points="167,61 147,47 152,41" fill="#18181B" />
                    ) : (
                      <line x1="167" y1="61" x2="148" y2="45" stroke="#18181B" strokeWidth="2" strokeDasharray="3,2" />
                    )}
                    <text x="128" y="42" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                      HO
                    </text>
                  </g>
                )}
                {state.C11 === '=O' && (
                  <g>
                    <line x1="167" y1="58" x2="148" y2="45" stroke="#E11D48" strokeWidth="2" />
                    <line x1="164" y1="63" x2="145" y2="50" stroke="#E11D48" strokeWidth="2" />
                    <text x="132" y="46" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">O</text>
                  </g>
                )}
                {state.C11 === 'aryl' && (
                  <g>
                    <polygon points="167,61 147,47 152,41" fill="#18181B" />
                    <polygon points="120,20 140,20 150,36 140,52 120,52 110,36" fill="rgba(13,148,136,0.12)" stroke="#18181B" strokeWidth="2" />
                    <text x="54" y="39" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">Ar-NMe2</text>
                  </g>
                )}

                {/* C18 Methyl */}
                <polygon points="233,61 229,33 237,33" fill="#18181B" />
                <text x="223" y="27" fill="#18181B" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">CH3</text>

                {/* Ring D */}
                <polygon
                  points="233,61 269,50 291,80 269,110 233,99"
                  fill="none"
                  stroke="#18181B"
                  strokeWidth="2"
                />

                {/* C17β + C21 */}
                {state.C17b === 'OH' && (
                  <g>
                    <polygon points="269,50 294,34 298,40" fill="#18181B" />
                    <text x="300" y="38" fill="#E11D48" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">OH</text>
                  </g>
                )}
                {state.C17b === 'ketol' && (
                  <g>
                    <polygon points="269,50 294,34 298,40" fill="#18181B" />
                    <line x1="295" y1="36" x2="295" y2="18" stroke="#E11D48" strokeWidth="1.8" />
                    <line x1="299" y1="36" x2="299" y2="18" stroke="#E11D48" strokeWidth="1.8" />
                    <text x="292" y="15" fill="#E11D48" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono, monospace">O</text>
                    <line x1="296" y1="36" x2="318" y2="46" stroke="#18181B" strokeWidth="2" />
                    <text
                      x="320"
                      y="50"
                      fill={state.C21 === 'ester' ? '#F59E0B' : state.C21 === 'phosphate' ? '#2563EB' : '#E11D48'}
                      fontSize="10.5"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {state.C21 === 'ester' ? 'CH2-OCOR' : state.C21 === 'phosphate' ? 'CH2-PO4' : 'CH2OH'}
                    </text>
                  </g>
                )}

                {/* C17α */}
                {state.C17a === 'OH' && (
                  <g>
                    <line x1="269" y1="50" x2="293" y2="63" stroke="#18181B" strokeWidth="2" strokeDasharray="3,2" />
                    <text x="296" y="69" fill="#E11D48" fontSize="10.5" fontWeight="bold" fontFamily="JetBrains Mono, monospace">OH</text>
                  </g>
                )}
                {state.C17a === 'ethynyl' && (
                  <g>
                    <line x1="269" y1="50" x2="296" y2="64" stroke="#18181B" strokeWidth="2" strokeDasharray="3,2" />
                    <text x="299" y="69" fill="#0D9488" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono, monospace">-C≡CH</text>
                  </g>
                )}

                {/* C16 */}
                {state.C16 !== 'H' && (
                  <g>
                    <line
                      x1="291"
                      y1="80"
                      x2="318"
                      y2="92"
                      stroke={state.C16 === 'CN' ? '#2563EB' : '#18181B'}
                      strokeWidth={state.C16Stereo === 'beta' ? 3 : 2}
                      strokeDasharray={state.C16Stereo === 'alpha' ? '3,2' : undefined}
                    />
                    <text
                      x="321"
                      y="97"
                      fill={state.C16 === 'CN' ? '#2563EB' : state.C16 === 'OH' ? '#E11D48' : '#18181B'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {state.C16 === 'CN' ? '-C≡N' : state.C16}
                    </text>
                  </g>
                )}

                {renderHotspot('ringA', 101, 137, 'حلقه A')}
                {renderHotspot('C3', 56, 162, 'کربن C3')}
                {renderHotspot('C6', 167, 184, 'کربن C6')}
                {renderHotspot('C9', 167, 108, 'کربن C9')}
                {renderHotspot('C11', 158, 52, 'کربن C11')}
                {renderHotspot('C16', 302, 85, 'کربن C16')}
                {renderHotspot('C17a', 284, 59, 'موقعیت C17α')}
                {renderHotspot('C17b', 284, 38, 'موقعیت C17β')}
                {renderHotspot('C19', 134, 98, 'موقعیت C19')}
                {renderHotspot('C21', 332, 46, 'موقعیت C21')}
              </svg>
            </div>
          </div>

          <div className="rounded-[8px] border-2 border-[#18181B] bg-[#FFFFFF] p-3 text-xs leading-6 text-[#18181B] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
            <span>{insight}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[8px] border-2 border-[#18181B] bg-[#FFFFFF] p-3.5 space-y-3 shadow-[3px_3px_0px_#18181B]">
            <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-2">
              <span className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#18181B]">
                <Activity className="w-4 h-4 text-[#0D9488]" />
                <span>ADMET & SAR Readout</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-[#52525B]">LIVE</span>
            </div>

            {meters.map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#52525B]">{m.label}</span>
                  <span dir="ltr" className="font-mono font-extrabold text-[#18181B] metric-mono">
                    {m.displayValue}
                  </span>
                </div>
                <div className="relative h-3 w-full rounded-[4px] border-2 border-[#18181B] bg-[#EFECE6] overflow-hidden">
                  {m.targetMin !== undefined && (
                    <div
                      title="Target min"
                      className="absolute top-0 bottom-0 w-0.5 bg-[#18181B] z-10"
                      style={{ left: `${m.targetMin}%` }}
                    />
                  )}
                  {m.targetMax !== undefined && (
                    <div
                      title="Target max"
                      className="absolute top-0 bottom-0 w-0.5 bg-[#E11D48] z-10"
                      style={{ left: `${m.targetMax}%` }}
                    />
                  )}
                  <div
                    className={`h-full transition-all duration-200 ${m.colorClass}`}
                    style={{ width: `${Math.max(4, Math.min(100, m.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {!isLocked && (
            <div className="rounded-[8px] border-2 border-[#18181B] bg-[#FFFFFF] p-3.5 space-y-2.5 shadow-[3px_3px_0px_#18181B]">
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'groups', label: 'گروه‌ها' },
                    { id: 'rings', label: 'حلقه‌ها' },
                    { id: 'chains', label: 'زنجیره' },
                    { id: 'edit', label: 'پاک‌کن / αβ' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-2 py-1 rounded-[6px] border-2 border-[#18181B] text-[11px] font-bold transition ${
                      activeCategory === tab.id
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-[#EFECE6] text-[#18181B] hover:bg-[#E5E0D6]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-[210px] overflow-y-auto pr-0.5">
                {visibleTools.map((tool) => {
                  const isSelected = selectedToolId === tool.id;
                  return (
                    <div
                      key={tool.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', tool.id);
                        setSelectedToolId(tool.id);
                      }}
                      onClick={() => setSelectedToolId(isSelected ? null : tool.id)}
                      className={`rounded-[6px] border-2 border-[#18181B] px-2.5 py-1.5 text-xs cursor-grab active:cursor-grabbing transition select-none flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#0D9488] text-white shadow-[2px_2px_0px_#18181B]'
                          : 'bg-[#F7F5F0] text-[#18181B] hover:bg-[#EFECE6]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        {tool.id === 'eraser' && <Eraser className="w-3.5 h-3.5" />}
                        {tool.id === 'flip_stereo' && <FlipHorizontal2 className="w-3.5 h-3.5" />}
                        <span>{tool.label}</span>
                      </span>
                      <span
                        dir="ltr"
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] border border-[#18181B] ${
                          isSelected ? 'bg-[#FFFFFF] text-[#18181B]' : 'bg-[#FFFFFF] text-[#52525B]'
                        }`}
                      >
                        {tool.formula}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedTool && (
                <div className="text-[11px] font-semibold text-[#0D9488] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>روی دایره خط‌چین کربن هدف کلیک کن یا بکش.</span>
                </div>
              )}

              {toolNotice && (
                <div className="rounded-[6px] border-2 border-[#18181B] bg-[#FEF3C7] px-2.5 py-1.5 text-[11px] font-semibold text-[#18181B]">
                  {toolNotice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
