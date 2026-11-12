import {
  AchievementDef,
  AchievementId,
  DifficultyMode,
  GameSettings,
  MasteryRank,
} from './types';

export const STORAGE_GAME_SETTINGS = 'blackthorn_castle_settings_v1';
export const STORAGE_ACHIEVEMENTS = 'blackthorn_castle_achievements_v1';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  difficulty: 'normal',
  fov: 72,
  lookSensitivity: 1.0,
  invertY: false,
  graphicsQuality: 'ultra',
  masterVolume: 85,
};

export const DIFFICULTY_TUNING: Record<
  DifficultyMode,
  {
    labelAr: string;
    descAr: string;
    enemySpeedMul: number;
    hearingMul: number;
    sanityDrainMul: number;
    batteryDrainMul: number;
  }
> = {
  story: {
    labelAr: 'وضع القصة',
    descAr: 'روح الجد أبطأ واستنزاف الإدراك والبطارية أخفّ للاستمتاع بالألغاز والاستكشاف.',
    enemySpeedMul: 0.82,
    hearingMul: 0.78,
    sanityDrainMul: 0.65,
    batteryDrainMul: 0.7,
  },
  normal: {
    labelAr: 'متوازن (الافتراضي)',
    descAr: 'مارك أسرع من روح الجد في المشي والركض مع توازن مشوّق بين الرعب والألغاز.',
    enemySpeedMul: 1.0,
    hearingMul: 1.0,
    sanityDrainMul: 1.0,
    batteryDrainMul: 1.0,
  },
  nightmare: {
    labelAr: 'كابوس القلعة',
    descAr: 'حاسة سمع الجد أشدّ وسرعته أعلى للمحترفين الباحثين عن أقصى درجات التوتر.',
    enemySpeedMul: 1.14,
    hearingMul: 1.25,
    sanityDrainMul: 1.3,
    batteryDrainMul: 1.2,
  },
};

export const STEAM_ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first_key',
    titleAr: 'مفتاح الميراث الأول',
    titleEn: 'First Key of Malakor',
    descAr: 'حلّ لغز ساعة البهو الملكي الطويلة واحصل على مفتاح الرواق الغربي.',
    category: 'story',
  },
  {
    id: 'shadow_whisper',
    titleAr: 'كتم الأنفاس في الخزانة',
    titleEn: 'Breath Held in Oak',
    descAr: 'اختبئ داخل خزانة خشبية بينما تكون روح الجد أو الأشباح قريبة منك.',
    category: 'stealth',
  },
  {
    id: 'silver_exorcist',
    titleAr: 'طارد الأرواح الفضي',
    titleEn: 'Radiant Silver Ward',
    descAr: 'اشلّ حركة روح الجد أو الأشباح باستخدام ومضة العدسة الفضية المشعّة [Q].',
    category: 'stealth',
  },
  {
    id: 'loremaster',
    titleAr: 'محقّق المخطوطات السرية',
    titleEn: 'Castle Archivist',
    descAr: 'اكتشف واقرأ جميع المخطوطات الإحدى عشرة الموزعة في أجنحة القلعة.',
    category: 'mastery',
  },
  {
    id: 'master_locksmith',
    titleAr: 'كاسر أختام القلعة الستة',
    titleEn: 'Master of Six Locks',
    descAr: 'حلّ جميع الألغاز المتسلسلة الستة في جولة واحدة.',
    category: 'story',
  },
  {
    id: 'tomb_raider',
    titleAr: 'منتزع الوصية من الضريح',
    titleEn: 'Awakener of the Crypt',
    descAr: 'انتزع وثيقة الميراث المختومة من أمام تابوت الجد فيكتور في السرداب.',
    category: 'story',
  },
  {
    id: 'relic_hunter',
    titleAr: 'جامع إرث آل مالاكور',
    titleEn: 'Heirloom Collector',
    descAr: 'اعثر على التحف العائلية الاثنتي عشرة المخبأة في أجنحة القلعة.',
    category: 'mastery',
  },
  {
    id: 'debt_free_survivor',
    titleAr: 'وريث بلا ديون',
    titleEn: 'Debt-Free Survivor',
    descAr: 'اهرب حيّاً عبر بوابة القلعة الرئيسية وبيدك وثيقة الميراث المختومة.',
    category: 'story',
  },
];

export function sanitizeSettings(raw: Partial<GameSettings> | null | undefined): GameSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GAME_SETTINGS };
  const difficulty: DifficultyMode =
    raw.difficulty === 'story' || raw.difficulty === 'normal' || raw.difficulty === 'nightmare'
      ? raw.difficulty
      : DEFAULT_GAME_SETTINGS.difficulty;
  const fov =
    typeof raw.fov === 'number' && Number.isFinite(raw.fov)
      ? Math.max(65, Math.min(90, Math.round(raw.fov)))
      : DEFAULT_GAME_SETTINGS.fov;
  const lookSensitivity =
    typeof raw.lookSensitivity === 'number' && Number.isFinite(raw.lookSensitivity)
      ? Math.max(0.5, Math.min(2.0, Number(raw.lookSensitivity.toFixed(2))))
      : DEFAULT_GAME_SETTINGS.lookSensitivity;
  const invertY = Boolean(raw.invertY);
  const graphicsQuality =
    raw.graphicsQuality === 'medium' || raw.graphicsQuality === 'ultra'
      ? raw.graphicsQuality
      : DEFAULT_GAME_SETTINGS.graphicsQuality;
  const masterVolume =
    typeof raw.masterVolume === 'number' && Number.isFinite(raw.masterVolume)
      ? Math.max(0, Math.min(100, Math.round(raw.masterVolume)))
      : DEFAULT_GAME_SETTINGS.masterVolume;

  return {
    difficulty,
    fov,
    lookSensitivity,
    invertY,
    graphicsQuality,
    masterVolume,
  };
}

export function loadGameSettings(): GameSettings {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_GAME_SETTINGS };
    const raw = localStorage.getItem(STORAGE_GAME_SETTINGS);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveGameSettings(settings: GameSettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_GAME_SETTINGS, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadUnlockedAchievements(): Set<AchievementId> {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const raw = localStorage.getItem(STORAGE_ACHIEVEMENTS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const validIds = new Set(STEAM_ACHIEVEMENTS.map((a) => a.id));
    return new Set(parsed.filter((id): id is AchievementId => validIds.has(id)));
  } catch {
    return new Set();
  }
}

export function saveUnlockedAchievements(unlocked: ReadonlySet<AchievementId>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_ACHIEVEMENTS, JSON.stringify(Array.from(unlocked)));
  } catch {
    // Ignore storage quota errors
  }
}

export function computeRunMasteryRank(params: {
  outcome: 'victory' | 'defeat';
  sigilsCollected: number;
  relicsFound: number;
  notesFound: number;
  survivalSeconds: number;
  sanityRemaining: number;
}): MasteryRank {
  if (params.outcome === 'defeat') {
    if (params.sigilsCollected >= 5) return 'B';
    return 'C';
  }
  let score = 50;
  score += params.sigilsCollected * 4; // up to +24
  score += params.relicsFound * 2.5; // up to +20
  score += params.notesFound * 1.5; // up to +9
  if (params.survivalSeconds <= 420) score += 12;
  else if (params.survivalSeconds <= 660) score += 6;
  if (params.sanityRemaining >= 70) score += 8;
  else if (params.sanityRemaining >= 40) score += 4;

  if (score >= 106) return 'S+';
  if (score >= 92) return 'S';
  if (score >= 78) return 'A';
  if (score >= 62) return 'B';
  return 'C';
}
