import { CastleDoor, HidingSpot, RelicItem, RoomId, Vec2, WallBox } from './types';

export interface CastleRoomDef {
  id: RoomId;
  nameAr: string;
  nameEn: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  ceilingHeight: number;
  floorStyle: 'wood' | 'stone' | 'bunker' | 'infirmary' | 'checker' | 'crypt';
  wallStyle: 'wainscot' | 'plaster' | 'bunker' | 'infirmary' | 'marble' | 'crypt';
  ambientTintHex: number;
}

export interface CastleLightFixture {
  id: string;
  x: number;
  y: number;
  z: number;
  colorHex: number;
  intensity: number;
  distance: number;
  kind: 'globe' | 'sconce' | 'cyan_tube' | 'red_curtain' | 'bunker_tube' | 'crypt_torch';
}

export const DEED_ALTAR_POS: Vec2 = { x: 13.5, z: -31.0 };
export const SARCOPHAGUS_POS: Vec2 = { x: 20.5, z: -35.5 };
export const MAIN_EXIT_POS: Vec2 = { x: 0, z: 41.2 };

// Ordered so Statue Hall [-14..14, -18..18] resolves cleanly before L-wing bounding boxes
export const CASTLE_ROOMS: readonly CastleRoomDef[] = [
  {
    id: 'foyer',
    nameAr: 'البهو الملكي والدرج الكبير',
    nameEn: 'Grand Foyer & Staircase',
    minX: -10,
    maxX: 10,
    minZ: 18,
    maxZ: 42,
    ceilingHeight: 5.2,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xffd599,
  },
  {
    id: 'statue_hall',
    nameAr: 'قاعة التماثيل الستة المقنّعة',
    nameEn: 'Hall of Six Veiled Statues',
    minX: -14,
    maxX: 14,
    minZ: -18,
    maxZ: 18,
    ceilingHeight: 5.0,
    floorStyle: 'checker',
    wallStyle: 'marble',
    ambientTintHex: 0x94a3b8,
  },
  {
    id: 'steam_gallery',
    nameAr: 'الرواق المقنطر وغرفة الصمامات',
    nameEn: 'Arched Steam Gallery',
    minX: -32,
    maxX: -10,
    minZ: 14,
    maxZ: 34,
    ceilingHeight: 4.6,
    floorStyle: 'wood',
    wallStyle: 'plaster',
    ambientTintHex: 0xf59e0b,
  },
  {
    id: 'security_bunker',
    nameAr: 'قبو المراقبة والأرشيف',
    nameEn: 'Surveillance Bunker',
    minX: -34,
    maxX: -14,
    minZ: -10,
    maxZ: 14,
    ceilingHeight: 4.4,
    floorStyle: 'bunker',
    wallStyle: 'bunker',
    ambientTintHex: 0x38bdf8,
  },
  {
    id: 'portrait_hall',
    nameAr: 'الممر المسكون باللوحات',
    nameEn: 'Haunted Portrait Hallway',
    minX: 10,
    maxX: 24,
    minZ: 8,
    maxZ: 36,
    ceilingHeight: 4.5,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xfef3c7,
  },
  {
    id: 'infirmary',
    nameAr: 'المصحة المختبرية الملعونة',
    nameEn: 'Cursed Alchemical Infirmary',
    minX: 14,
    maxX: 36,
    minZ: -14,
    maxZ: 8,
    ceilingHeight: 4.5,
    floorStyle: 'infirmary',
    wallStyle: 'infirmary',
    ambientTintHex: 0x22d3ee,
  },
  {
    id: 'trophy_study',
    nameAr: 'مكتب الجد السري وخزنة الميراث',
    nameEn: "Grandfather's Trophy Study",
    minX: -28,
    maxX: -2,
    minZ: -42,
    maxZ: -18,
    ceilingHeight: 4.6,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xfbbf24,
  },
  {
    id: 'crypt',
    nameAr: 'سرداب الضريح وقبر الجد',
    nameEn: "Grandfather's Crypt & Tomb",
    minX: -2,
    maxX: 26,
    minZ: -42,
    maxZ: -18,
    ceilingHeight: 5.2,
    floorStyle: 'crypt',
    wallStyle: 'crypt',
    ambientTintHex: 0xef4444,
  },
  {
    id: 'gothic_library',
    nameAr: 'المكتبة القوطية المهجورة',
    nameEn: 'Abandoned Gothic Library',
    minX: -32,
    maxX: -10,
    minZ: 34,
    maxZ: 50,
    ceilingHeight: 5.0,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xf59e0b,
  },
  {
    id: 'banquet_hall',
    nameAr: 'قاعة المأدبة المتعفنة',
    nameEn: 'Rotting Banquet Hall',
    minX: 10,
    maxX: 36,
    minZ: 36,
    maxZ: 50,
    ceilingHeight: 5.0,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xfde68a,
  },
  {
    id: 'kitchen_cellar',
    nameAr: 'مطبخ القلعة وقبو البراميل',
    nameEn: 'Castle Kitchen & Wine Cellar',
    minX: 24,
    maxX: 44,
    minZ: 16,
    maxZ: 36,
    ceilingHeight: 4.4,
    floorStyle: 'stone',
    wallStyle: 'plaster',
    ambientTintHex: 0xfb923c,
  },
  {
    id: 'moonlit_courtyard',
    nameAr: 'حديقة الضباب والفناء المقمِر',
    nameEn: 'Foggy Moonlit Conservatory',
    minX: -52,
    maxX: -32,
    minZ: 14,
    maxZ: 38,
    ceilingHeight: 6.6,
    floorStyle: 'stone',
    wallStyle: 'marble',
    ambientTintHex: 0x93c5fd,
  },
  {
    id: 'dungeon_cells',
    nameAr: 'زنازين القبو المنسية',
    nameEn: 'Forgotten Dungeon Cells',
    minX: -52,
    maxX: -34,
    minZ: -14,
    maxZ: 10,
    ceilingHeight: 4.2,
    floorStyle: 'crypt',
    wallStyle: 'crypt',
    ambientTintHex: 0xf87171,
  },
  {
    id: 'master_bedroom',
    nameAr: 'جناح نوم الجد فيكتور الخاص',
    nameEn: "Victor's Master Bedchamber",
    minX: -48,
    maxX: -28,
    minZ: -42,
    maxZ: -18,
    ceilingHeight: 4.8,
    floorStyle: 'wood',
    wallStyle: 'wainscot',
    ambientTintHex: 0xfbbf24,
  },
];

export function getRoomAt(x: number, z: number): CastleRoomDef {
  for (const r of CASTLE_ROOMS) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
      return r;
    }
  }
  return CASTLE_ROOMS[0];
}

export function getSixStatuePositions(): Array<{ x: number; z: number; rotY: number }> {
  const list: Array<{ x: number; z: number; rotY: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * 0.16 + (i / 5) * Math.PI * 0.68;
    const sx = Math.cos(Math.PI - angle) * 6.2;
    const sz = -8.5 - Math.sin(angle) * 5.2;
    list.push({
      x: sx,
      z: sz,
      rotY: Math.atan2(-sx, -8.5 - sz),
    });
  }
  return list;
}

export function createInitialHidingSpots(): HidingSpot[] {
  return [
    {
      id: 'wardrobe-foyer',
      nameAr: 'خزانة المعاطف في البهو',
      nameEn: 'Foyer Coat Wardrobe',
      x: -8.95,
      z: 31.0,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-steam',
      nameAr: 'خزانة الرواق المقنطر',
      nameEn: 'Steam Gallery Wardrobe',
      x: -14.5,
      z: 32.95,
      rotY: Math.PI,
    },
    {
      id: 'wardrobe-bunker',
      nameAr: 'خزانة حديدية في قبو المراقبة',
      nameEn: 'Bunker Iron Locker',
      x: -32.95,
      z: 9.5,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-portrait',
      nameAr: 'خزانة الممر المسكون',
      nameEn: 'Portrait Hall Wardrobe',
      x: 22.95,
      z: 28.0,
      rotY: -Math.PI / 2,
    },
    {
      id: 'wardrobe-infirmary',
      nameAr: 'خزانة عقاقير المصحة',
      nameEn: 'Infirmary Cabinet',
      x: 34.95,
      z: 3.0,
      rotY: -Math.PI / 2,
    },
    {
      id: 'wardrobe-statues',
      nameAr: 'خزانة قاعة التماثيل',
      nameEn: 'Statue Hall Wardrobe',
      x: -12.95,
      z: 8.5,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-study',
      nameAr: 'خزانة مكتب الجد الخشبية',
      nameEn: 'Study Oak Wardrobe',
      x: -26.95,
      z: -24.0,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-library',
      nameAr: 'خزانة المخطوطات في المكتبة',
      nameEn: 'Library Archive Wardrobe',
      x: -30.95,
      z: 42.0,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-kitchen',
      nameAr: 'خزانة المؤن في المطبخ',
      nameEn: 'Kitchen Pantry Cabinet',
      x: 42.95,
      z: 26.0,
      rotY: -Math.PI / 2,
    },
    {
      id: 'wardrobe-courtyard',
      nameAr: 'مقصورة البستاني الخشبية',
      nameEn: 'Conservatory Gardener Closet',
      x: -50.95,
      z: 26.0,
      rotY: Math.PI / 2,
    },
    {
      id: 'wardrobe-bedroom',
      nameAr: 'خزانة ملابس الجد فيكتور',
      nameEn: "Victor's Master Wardrobe",
      x: -46.95,
      z: -24.0,
      rotY: Math.PI / 2,
    },
  ];
}

export function getWardrobeExitPoint(spot: HidingSpot): Vec2 {
  return {
    x: spot.x + Math.sin(spot.rotY) * 1.26,
    z: spot.z + Math.cos(spot.rotY) * 1.26,
  };
}

export function createInitialRelics(): RelicItem[] {
  return [
    {
      id: 'relic-foyer-ring',
      roomId: 'foyer',
      nameAr: 'خاتم آل مالاكور الشمعي',
      nameEn: 'Malakor Signet Ring',
      loreAr: 'خاتم الذهب الثقيل الذي ختم به الجد فيكتور وصايا الديون والمصادرة.',
      x: -6.2,
      z: 21.2,
      collected: false,
    },
    {
      id: 'relic-steam-watch',
      roomId: 'steam_gallery',
      nameAr: 'ساعة الجيب البخارية المذهّبة',
      nameEn: 'Gilded Steam Pocketwatch',
      loreAr: 'توقفت عقاربها عند منتصف الليل لحظة إغلاق أنابيب القبو على الحراس.',
      x: -29.2,
      z: 16.5,
      collected: false,
    },
    {
      id: 'relic-bunker-reel',
      roomId: 'security_bunker',
      nameAr: 'بكرة تسجيلات الجد السرية',
      nameEn: "Victor's Master Tape Reel",
      loreAr: 'توثّق اعترافات الجد بمراقبة كل وريث دخل القلعة ولم يخرج منها.',
      x: -29.8,
      z: -7.5,
      collected: false,
    },
    {
      id: 'relic-portrait-locket',
      roomId: 'portrait_hall',
      nameAr: 'قلادة العائلة المكسورة',
      nameEn: 'Shattered Heirloom Locket',
      loreAr: 'تضم صورة والدة مارك قبل أن يطردها الجد من القصر.',
      x: 21.5,
      z: 33.5,
      collected: false,
    },
    {
      id: 'relic-infirmary-chalice',
      roomId: 'infirmary',
      nameAr: 'كأس الزئبق الفضي',
      nameEn: 'Silver Alchemical Chalice',
      loreAr: 'كان طبيب القلعة يحضّر فيه إكسير إطالة العمر للجد فيكتور.',
      x: 20.5,
      z: -11.5,
      collected: false,
    },
    {
      id: 'relic-statues-mask',
      roomId: 'statue_hall',
      nameAr: 'قناع القاضي الرخامي',
      nameEn: 'Marble Mask of Judgment',
      loreAr: 'قناع مصغّر يرمز إلى الحراس الستة الذين يحرسون مكتب الميراث.',
      x: -10.8,
      z: 14.5,
      collected: false,
    },
    {
      id: 'relic-study-ledger',
      roomId: 'trophy_study',
      nameAr: 'دفتر صكوك الذهب القديم',
      nameEn: 'Ledger of Blood & Gold',
      loreAr: 'يكشف أن ثروة القلعة تكفي لسداد ديون مارك أضعافاً مضاعفة.',
      x: -6.5,
      z: -38.5,
      collected: false,
    },
    {
      id: 'relic-crypt-censer',
      roomId: 'crypt',
      nameAr: 'مبخرة الضريح القرمزية',
      nameEn: 'Crimson Crypt Censer',
      loreAr: 'تحفة جنائزية عتيقة وُضعت عند أقدام تابوت الجد لطرد الأرواح.',
      x: 22.8,
      z: -22.5,
      collected: false,
    },
    {
      id: 'relic-library-astrolabe',
      roomId: 'gothic_library',
      nameAr: 'إسطرلاب الجد الفلكي',
      nameEn: "Victor's Brass Astrolabe",
      loreAr: 'كان الجد يرصد به اقتران القمر الدموي فوق أبراج القلعة ليلة كتابة الوصية.',
      x: -28.5,
      z: 47.0,
      collected: false,
    },
    {
      id: 'relic-kitchen-goblet',
      roomId: 'kitchen_cellar',
      nameAr: 'كأس المأدبة المسموم',
      nameEn: 'Tarnished Banquet Goblet',
      loreAr: 'لا تزال آثار النبيذ القرمزي المتجمد عالقة بحافته منذ العشاء الأخير في القصر.',
      x: 40.5,
      z: 20.0,
      collected: false,
    },
    {
      id: 'relic-courtyard-sundial',
      roomId: 'moonlit_courtyard',
      nameAr: 'مزولة الضباب الفضية',
      nameEn: 'Moonlit Fog Sundial',
      loreAr: 'تحفة حجرية مفضّضة نُقش عليها: «الظلّ في هذه الحديقة لا يتبع الشمس بل يتبع صاحب القصر».',
      x: -48.5,
      z: 34.5,
      collected: false,
    },
    {
      id: 'relic-bedroom-musicbox',
      roomId: 'master_bedroom',
      nameAr: 'صندوق موسيقى السيدة إيلينا',
      nameEn: "Lady Elena's Music Box",
      loreAr: 'يعزف لحناً حزيناً كلما اقترب أحد أحفاد العائلة من سرير الجد الخالي.',
      x: -44.0,
      z: -39.0,
      collected: false,
    },
  ];
}

export function createInitialDoors(): CastleDoor[] {
  return [
    {
      id: 'door-west-gallery',
      nameAr: 'باب الرواق المقنطر الغربي',
      nameEn: 'West Arched Gallery Door',
      x: -10,
      z: 26,
      axis: 'z',
      width: 4.0,
      requiredItem: 'west_wing_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق! حلّ لغز «ساعة الجد الملعونة» في البهو للحصول على مفتاح الجناح الغربي.',
    },
    {
      id: 'door-security',
      nameAr: 'باب قبو المراقبة الحديدي',
      nameEn: 'Surveillance Bunker Door',
      x: -22,
      z: 14,
      axis: 'x',
      width: 4.0,
      requiredItem: 'security_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق بالبخار! وازن «صمامات البخار الحديدية» في الرواق للحصول على بطاقة المراقبة.',
    },
    {
      id: 'door-east-hall',
      nameAr: 'باب الجناح الشرقي المسكون',
      nameEn: 'East Haunted Wing Door',
      x: 10,
      z: 26,
      axis: 'z',
      width: 4.0,
      requiredItem: 'infirmary_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق! فكّ شيفرة «شاشات المراقبة» في القبو الغربي للحصول على مفتاح الجناح الشرقي.',
    },
    {
      id: 'door-statue-hall',
      nameAr: 'بوابة قاعة التماثيل الستة',
      nameEn: 'Hall of Six Statues Gate',
      x: 0,
      z: 18,
      axis: 'x',
      width: 4.0,
      requiredItem: 'statue_hall_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق بختم فضي! حضّر «معادلة الترياق الكيميائي» في المصحة الشرقية للحصول على المفتاح الفضي.',
    },
    {
      id: 'door-infirmary-statue',
      nameAr: 'ممر المصحة إلى قاعة التماثيل',
      nameEn: 'Infirmary-to-Statue Shortcut Door',
      x: 14,
      z: -2,
      axis: 'z',
      width: 4.0,
      requiredItem: 'statue_hall_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'يحتاج إلى مفتاح قاعة التماثيل الفضي من طاولة الترياق في المصحة.',
    },
    {
      id: 'door-bunker-statue',
      nameAr: 'ممر القبو إلى قاعة التماثيل',
      nameEn: 'Bunker-to-Statue Loop Door',
      x: -14,
      z: -2,
      axis: 'z',
      width: 4.0,
      requiredItem: 'statue_hall_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'يحتاج إلى مفتاح قاعة التماثيل الفضي.',
    },
    {
      id: 'door-study',
      nameAr: 'باب مكتب الجد الملكي',
      nameEn: "Grandfather's Royal Study Door",
      x: -9,
      z: -18,
      axis: 'x',
      width: 4.0,
      requiredItem: 'study_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق! أتمّ «طقس التماثيل الستة المقنّعة» في القاعة للحصول على مفتاح مكتب الجد.',
    },
    {
      id: 'door-crypt',
      nameAr: 'بوابة سرداب الضريح والقبر',
      nameEn: 'Crypt & Sarcophagus Gate',
      x: -2,
      z: -30,
      axis: 'z',
      width: 4.0,
      requiredItem: 'crypt_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مغلق بقفل الخزنة! افتح «خزنة المرايا الليزرية» في مكتب الجد للحصول على مفتاح الضريح.',
    },
    {
      id: 'door-crypt-escape',
      nameAr: 'بوابة الطوارئ من الضريح للقاعة',
      nameEn: 'Crypt Southern Archway',
      x: 8,
      z: -18,
      axis: 'x',
      width: 4.0,
      requiredItem: 'inheritance_deed',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      lockedHintAr: 'مختوم من الداخل — يُفتح فور الاستحواذ على وثيقة الميراث من الضريح!',
    },
    {
      id: 'door-main-exit',
      nameAr: 'بوابة القلعة الرئيسية (الهروب النهائي)',
      nameEn: 'Main Castle Front Gate (Escape)',
      x: 0,
      z: 42,
      axis: 'x',
      width: 4.0,
      requiredItem: 'master_exit_key',
      unlocked: false,
      isOpen: false,
      openProgress: 0,
      isMainExit: true,
      lockedHintAr: 'بوابة الخروج موصدة بالسلاسل! لن تغادر القلعة قبل انتزاع «وثيقة الميراث ومفتاح البوابة» من سرداب الضريح شمالاً!',
    },
    // --- 6 Optional Exploration Wing Doors (Unlocked for immediate AAA castle exploration!) ---
    {
      id: 'door-library',
      nameAr: 'باب المكتبة القوطية المهجورة',
      nameEn: 'Abandoned Gothic Library Door',
      x: -10,
      z: 38,
      axis: 'z',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
    {
      id: 'door-banquet',
      nameAr: 'باب قاعة المأدبة الكبرى',
      nameEn: 'Grand Banquet Hall Door',
      x: 10,
      z: 39,
      axis: 'z',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
    {
      id: 'door-kitchen',
      nameAr: 'باب مطبخ القلعة وقبو البراميل',
      nameEn: 'Castle Kitchen & Cellar Door',
      x: 30,
      z: 36,
      axis: 'x',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
    {
      id: 'door-courtyard',
      nameAr: 'بوابة حديقة الضباب الداخلية',
      nameEn: 'Moonlit Conservatory Gate',
      x: -32,
      z: 30,
      axis: 'z',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
    {
      id: 'door-dungeon',
      nameAr: 'بوابة زنازين القبو الحديدية',
      nameEn: 'Forgotten Dungeon Gate',
      x: -34,
      z: 4,
      axis: 'z',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
    {
      id: 'door-bedroom',
      nameAr: 'باب جناح نوم الجد فيكتور',
      nameEn: "Victor's Master Bedchamber Door",
      x: -28,
      z: -29,
      axis: 'z',
      width: 4.0,
      unlocked: true,
      isOpen: false,
      openProgress: 0,
      isOptionalWing: true,
      lockedHintAr: '',
    },
  ];
}

function makeWall(
  id: string,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  height = 4.8,
  style: WallBox['style'] = 'wainscot',
  renderMesh = true,
  blocksSight = true
): WallBox {
  return {
    id,
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minZ: Math.min(minZ, maxZ),
    maxZ: Math.max(minZ, maxZ),
    height,
    blocksSight,
    renderMesh,
    style,
  };
}

/**
 * Builds 100% airtight 3D architectural walls (0.66m thick with overlapping corner joints)
 * PLUS exact physics colliders for EVERY solid 3D prop, staircase, wardrobe, safe, statue,
 * desk, cart, clock, and podium so neither Mark nor Grandfather can EVER clip through geometry!
 */
export function createCastleWalls(): WallBox[] {
  const walls: WallBox[] = [
    // === ZONE 1: GRAND FOYER [-10..10, 18..42] ===
    // South wall z=42 with doorway [-2..2]
    makeWall('foyer-s-l', -10.35, -1.92, 41.67, 42.33, 5.2, 'wainscot'),
    makeWall('foyer-s-r', 1.92, 10.35, 41.67, 42.33, 5.2, 'wainscot'),
    // West wall x=-10: doorways at z=[24..28] (Steam Gallery) and z=[36..40] (Gothic Library)
    makeWall('foyer-w-1a', -10.33, -9.67, 27.92, 36.08, 5.2, 'wainscot'),
    makeWall('foyer-w-1b', -10.33, -9.67, 39.92, 50.33, 5.2, 'wainscot'),
    makeWall('foyer-w-2', -10.33, -9.67, 17.67, 24.08, 5.2, 'wainscot'),
    // East wall x=10: doorways at z=[24..28] (Portrait Hall) and z=[37..41] (Banquet Hall)
    makeWall('foyer-e-1a', 9.67, 10.33, 27.92, 37.08, 5.2, 'wainscot'),
    makeWall('foyer-e-1b', 9.67, 10.33, 40.92, 50.33, 5.2, 'wainscot'),
    makeWall('foyer-e-2', 9.67, 10.33, 17.67, 24.08, 5.2, 'wainscot'),
    // North wall z=18: doorway at x=[-2..2]
    makeWall('foyer-n-l', -14.35, -1.92, 17.67, 18.33, 5.2, 'wainscot'),
    makeWall('foyer-n-r', 1.92, 10.35, 17.67, 18.33, 5.2, 'wainscot'),

    // Foyer Grand Staircase & Portrait Pillar (exact match with models.ts!)
    makeWall('foyer-stairs-pillar', -1.35, 1.35, 22.8, 26.2, 3.6, 'wainscot', true, true),
    makeWall('foyer-stairs-steps', -1.38, 1.38, 26.15, 29.75, 1.9, 'prop', false, false),
    // Foyer Chest of Drawers (2.8, 33.8) & Tall Grandfather Clock (8.6, 29.5)
    makeWall('prop-foyer-chest', 2.18, 3.42, 33.45, 34.15, 0.95, 'prop', false, false),
    makeWall('prop-foyer-clock', 8.28, 9.05, 29.0, 30.0, 2.75, 'prop', false, true),

    // === ZONE 2: WEST ARCHED STEAM GALLERY [-32..-10, 14..34] ===
    makeWall('steam-s', -32.35, -9.67, 33.67, 34.33, 4.6, 'plaster'),
    // West wall x=-32: doorway at z=[28..32] into Moonlit Courtyard
    makeWall('steam-w-1', -32.33, -31.67, 13.67, 28.08, 4.6, 'plaster'),
    makeWall('steam-w-2', -32.33, -31.67, 31.92, 34.33, 4.6, 'plaster'),
    // North wall z=14: doorway at x=[-24..-20]
    makeWall('steam-n-l', -34.35, -23.92, 13.67, 14.33, 4.6, 'plaster'),
    makeWall('steam-n-r', -20.08, -13.67, 13.67, 14.33, 4.6, 'plaster'),
    // Steam machinery center island + West wall pipe rack + South wall radiator
    makeWall('steam-boiler-island', -22.5, -19.5, 22.5, 26.5, 2.6, 'prop'),
    makeWall('prop-steam-pipes', -31.75, -30.72, 17.5, 26.3, 4.5, 'prop', false, false),
    makeWall('prop-steam-radiator', -21.15, -18.85, 33.05, 33.7, 0.9, 'prop', false, false),

    // === ZONE 3: SURVEILLANCE BUNKER [-34..-14, -10..14] ===
    // West wall x=-34: doorway at z=[2..6] into Forgotten Dungeon Cells
    makeWall('bunker-w-1', -34.33, -33.67, 5.92, 14.33, 4.4, 'bunker'),
    makeWall('bunker-w-2', -34.33, -33.67, -14.33, 2.08, 4.4, 'bunker'),
    makeWall('bunker-n', -34.35, -13.67, -10.33, -9.67, 4.4, 'bunker'),
    // East wall x=-14 (shared with Statue Hall & Steam Gallery step): doorway at z=[-4..0]
    makeWall('bunker-e-1', -14.33, -13.67, -0.08, 18.33, 4.8, 'bunker'),
    makeWall('bunker-e-2', -14.33, -13.67, -18.33, -3.92, 4.8, 'bunker'),
    // Bunker central server column + West CRT desk
    makeWall('bunker-pillar', -25.2, -22.8, 1.0, 3.4, 4.4, 'bunker'),
    makeWall('prop-bunker-desk', -33.65, -31.85, -5.45, -1.55, 1.8, 'prop', false, false),

    // === ZONE 4: EAST HAUNTED PORTRAIT HALLWAY [10..24, 8..36] ===
    makeWall('hall-s', 9.67, 24.35, 35.67, 36.33, 4.5, 'wainscot'),
    makeWall('hall-e', 23.67, 24.33, 7.67, 36.33, 4.5, 'wainscot'),
    // West wall segment z=[8..18] (shared with Statue Hall) + step seal at z=18
    makeWall('hall-w-n', 13.67, 14.33, 7.67, 18.33, 4.8, 'wainscot'),
    makeWall('hall-step-seal', 9.67, 14.33, 17.67, 18.33, 4.8, 'wainscot'),
    // North transition z=8 into Infirmary [14..36, -14..8]: wide archway at x=[17..21]
    makeWall('hall-n-l', 13.67, 17.0, 7.67, 8.33, 4.5, 'wainscot'),
    makeWall('hall-n-r', 21.0, 36.35, 7.67, 8.33, 4.5, 'infirmary'),

    // === ZONE 5: CURSED ALCHEMICAL INFIRMARY [14..36, -14..8] ===
    makeWall('infirm-e', 35.67, 36.33, -14.33, 8.33, 4.5, 'infirmary'),
    makeWall('infirm-n', 13.67, 36.35, -14.33, -13.67, 4.5, 'infirmary'),
    // West wall x=14 (shared with Statue Hall): doorway at z=[-4..0]
    makeWall('infirm-w-1', 13.67, 14.33, -0.08, 8.33, 4.8, 'infirmary'),
    makeWall('infirm-w-2', 13.67, 14.33, -18.33, -3.92, 4.8, 'infirmary'),
    // Infirmary central divider + Surgical vial cart (32.0, -6.5)
    makeWall('infirm-island', 23.5, 26.5, -4.5, -1.5, 2.2, 'prop'),
    makeWall('prop-infirm-cart', 31.42, 32.58, -7.38, -5.62, 1.1, 'prop', false, false),

    // === ZONE 6: HALL OF SIX VEILED STATUES [-14..14, -18..18] ===
    // North wall z=-18: Study doorway at [-11..-7], Crypt escape doorway at [6..10]
    makeWall('statue-n-1', -28.35, -10.92, -18.33, -17.67, 5.0, 'marble'),
    makeWall('statue-n-2', -7.08, 6.08, -18.33, -17.67, 5.0, 'marble'),
    makeWall('statue-n-3', 9.92, 26.35, -18.33, -17.67, 5.0, 'marble'),
    // Twin marble pillars inside Statue Hall
    makeWall('statue-pil-l', -6.8, -5.2, 2.2, 3.8, 5.0, 'marble'),
    makeWall('statue-pil-r', 5.2, 6.8, 2.2, 3.8, 5.0, 'marble'),

    // === ZONE 7: GRANDFATHER'S TROPHY STUDY [-28..-2, -42..-18] ===
    // West wall x=-28: doorway at z=[-31..-27] into Master Bedchamber
    makeWall('study-w-1', -28.33, -27.67, -27.08, -17.67, 4.6, 'wainscot'),
    makeWall('study-w-2', -28.33, -27.67, -42.33, -30.92, 4.6, 'wainscot'),
    makeWall('study-n', -28.35, -1.67, -42.33, -41.67, 4.6, 'wainscot'),
    // Shared wall x=-2 between Study and Crypt: doorway at z=[-32..-28]
    makeWall('study-crypt-1', -2.33, -1.67, -28.08, -17.67, 4.8, 'crypt'),
    makeWall('study-crypt-2', -2.33, -1.67, -42.33, -31.92, 4.8, 'crypt'),
    // Mahogany study desk + Royal Mirror Safe (-22.5, -38.5)
    makeWall('study-desk', -16.8, -13.2, -30.5, -28.5, 1.3, 'prop'),
    makeWall('prop-study-safe', -23.38, -21.62, -39.15, -37.85, 2.1, 'prop', false, true),

    // === ZONE 8: GRANDFATHER'S CRYPT & TOMB [-2..26, -42..-18] ===
    makeWall('crypt-e', 25.67, 26.33, -42.33, -17.67, 5.2, 'crypt'),
    makeWall('crypt-n', -2.35, 26.35, -42.33, -41.67, 5.2, 'crypt'),
    // Sarcophagus stone tomb base + Deed Altar Pedestal + Gothic Crypt Pillars
    makeWall('crypt-sarcophagus', 19.45, 21.55, -37.15, -33.85, 1.6, 'crypt', false, false),
    makeWall('prop-deed-pedestal', 12.92, 14.08, -31.58, -30.42, 1.15, 'crypt', false, false),
    makeWall('crypt-pil-1', 6.2, 7.8, -28.8, -27.2, 5.2, 'crypt'),
    makeWall('crypt-pil-2', 6.2, 7.8, -36.8, -35.2, 5.2, 'crypt'),

    // === ZONE 9: ABANDONED GOTHIC LIBRARY [-32..-10, 34..50] ===
    makeWall('lib-s', -32.35, -9.67, 49.67, 50.33, 5.0, 'wainscot'),
    makeWall('lib-w', -32.33, -31.67, 33.67, 50.33, 5.0, 'wainscot'),
    makeWall('prop-lib-shelf-1', -25.2, -23.6, 38.5, 45.2, 3.6, 'prop', false, true),
    makeWall('prop-lib-shelf-2', -18.8, -17.2, 38.5, 45.2, 3.6, 'prop', false, true),
    makeWall('prop-lib-desk', -28.6, -26.4, 35.8, 37.6, 1.1, 'prop', false, false),

    // === ZONE 10: ROTTING BANQUET HALL [10..36, 36..50] ===
    makeWall('banq-n-l', 23.67, 28.08, 35.67, 36.33, 5.0, 'wainscot'),
    makeWall('banq-n-r', 31.92, 36.35, 35.67, 36.33, 5.0, 'wainscot'),
    makeWall('banq-s', 9.67, 36.35, 49.67, 50.33, 5.0, 'wainscot'),
    makeWall('banq-e', 35.67, 36.33, 35.67, 50.33, 5.0, 'wainscot'),
    makeWall('prop-banq-table', 17.5, 27.5, 42.2, 44.2, 1.05, 'prop', false, false),
    makeWall('prop-banq-hearth', 34.4, 35.7, 41.5, 45.5, 3.4, 'crypt', false, true),

    // === ZONE 11: CASTLE KITCHEN & WINE CELLAR [24..44, 16..36] ===
    makeWall('kitch-s-ext', 35.67, 44.35, 35.67, 36.33, 4.4, 'plaster'),
    makeWall('kitch-n', 23.67, 44.35, 15.67, 16.33, 4.4, 'plaster'),
    makeWall('kitch-e', 43.67, 44.33, 15.67, 36.33, 4.4, 'plaster'),
    makeWall('prop-kitch-table', 31.8, 36.2, 24.8, 26.8, 1.05, 'prop', false, false),
    makeWall('prop-kitch-barrels', 27.5, 37.5, 16.4, 17.9, 2.2, 'prop', false, true),

    // === ZONE 12: FOGGY MOONLIT CONSERVATORY [-52..-32, 14..38] ===
    makeWall('court-n', -52.35, -31.67, 13.67, 14.33, 6.6, 'marble'),
    makeWall('court-s', -52.35, -31.67, 37.67, 38.33, 6.6, 'marble'),
    makeWall('court-w', -52.33, -51.67, 13.67, 38.33, 6.6, 'marble'),
    makeWall('prop-court-fountain', -43.4, -40.6, 24.6, 27.4, 1.8, 'marble', false, false),
    makeWall('prop-court-tree-1', -48.2, -46.8, 17.3, 18.7, 4.2, 'prop', false, true),
    makeWall('prop-court-tree-2', -37.2, -35.8, 33.8, 35.2, 4.2, 'prop', false, true),

    // === ZONE 13: FORGOTTEN DUNGEON CELLS [-52..-34, -14..10] ===
    makeWall('dung-n', -52.35, -33.67, -14.33, -13.67, 4.2, 'crypt'),
    makeWall('dung-s', -52.35, -33.67, 9.67, 10.33, 4.2, 'crypt'),
    makeWall('dung-w', -52.33, -51.67, -14.33, 10.33, 4.2, 'crypt'),
    makeWall('prop-dung-cell-1', -51.7, -45.5, -3.2, -2.6, 4.0, 'crypt', false, false),
    makeWall('prop-dung-cell-2', -51.7, -45.5, 3.6, 4.2, 4.0, 'crypt', false, false),
    makeWall('prop-dung-rack', -42.5, -40.5, -9.8, -6.8, 1.1, 'prop', false, false),

    // === ZONE 14: VICTOR'S MASTER BEDCHAMBER [-48..-28, -42..-18] ===
    makeWall('bed-n', -48.35, -27.67, -42.33, -41.67, 4.8, 'wainscot'),
    makeWall('bed-s', -48.35, -27.67, -18.33, -17.67, 4.8, 'wainscot'),
    makeWall('bed-w', -48.33, -47.67, -42.33, -17.67, 4.8, 'wainscot'),
    makeWall('prop-bed-canopy', -43.5, -38.5, -35.5, -31.0, 2.8, 'prop', false, true),
    makeWall('prop-bed-vanity', -36.2, -33.0, -41.6, -40.5, 1.8, 'prop', false, false),
  ];

  // Solid colliders for all 6 Veiled Marble Statues
  const statues = getSixStatuePositions();
  for (let i = 0; i < statues.length; i++) {
    const st = statues[i];
    walls.push(
      makeWall(
        `prop-statue-${i}`,
        st.x - 0.45,
        st.x + 0.45,
        st.z - 0.45,
        st.z + 0.45,
        2.3,
        'marble',
        false,
        false
      )
    );
  }

  // Solid colliders for all 7 Wooden Hiding Wardrobes (1.45m wide x 0.85m deep)
  const spots = createInitialHidingSpots();
  for (let i = 0; i < spots.length; i++) {
    const hs = spots[i];
    const cosA = Math.abs(Math.cos(hs.rotY));
    const sinA = Math.abs(Math.sin(hs.rotY));
    const halfX = 0.73 * cosA + 0.43 * sinA;
    const halfZ = 0.73 * sinA + 0.43 * cosA;
    walls.push(
      makeWall(
        `prop-wardrobe-${hs.id}`,
        hs.x - halfX,
        hs.x + halfX,
        hs.z - halfZ,
        hs.z + halfZ,
        2.55,
        'prop',
        false,
        true
      )
    );
  }

  // Solid colliders for Puzzle Lectern Podiums
  const puzzlePositions: Array<[string, number, number]> = [
    ['clock', 7.2, 29.5],
    ['valves', -28.0, 21.5],
    ['monitors', -30.5, -3.5],
    ['elixir', 30.5, -6.5],
    ['statues', 0.0, -8.5],
    ['safe', -22.5, -36.5],
  ];
  for (const [pid, px, pz] of puzzlePositions) {
    walls.push(
      makeWall(
        `prop-podium-${pid}`,
        px - 0.36,
        px + 0.36,
        pz - 0.36,
        pz + 0.36,
        1.1,
        'prop',
        false,
        false
      )
    );
  }

  return walls;
}

export function createCastleLightFixtures(): CastleLightFixture[] {
  return [
    { id: 'lt-foyer-1', x: 0, y: 4.5, z: 34, colorHex: 0xffd28a, intensity: 4.8, distance: 18, kind: 'globe' },
    { id: 'lt-foyer-2', x: 0, y: 4.5, z: 21.2, colorHex: 0xffc875, intensity: 3.8, distance: 16, kind: 'globe' },
    { id: 'lt-steam-1', x: -16, y: 3.9, z: 25, colorHex: 0xf59e0b, intensity: 3.6, distance: 15, kind: 'sconce' },
    { id: 'lt-steam-2', x: -27, y: 3.9, z: 21, colorHex: 0xfbbf24, intensity: 3.5, distance: 15, kind: 'sconce' },
    { id: 'lt-bunker-1', x: -24, y: 3.9, z: 4, colorHex: 0x7dd3fc, intensity: 3.8, distance: 17, kind: 'bunker_tube' },
    { id: 'lt-bunker-2', x: -28, y: 2.4, z: -4, colorHex: 0x34d399, intensity: 3.0, distance: 13, kind: 'bunker_tube' },
    { id: 'lt-hall-1', x: 17, y: 4.0, z: 28, colorHex: 0xfef3c7, intensity: 3.6, distance: 15, kind: 'globe' },
    { id: 'lt-hall-2', x: 17, y: 4.0, z: 15, colorHex: 0xfde68a, intensity: 3.4, distance: 15, kind: 'globe' },
    { id: 'lt-infirm-cyan', x: 24, y: 4.1, z: -2, colorHex: 0x22d3ee, intensity: 4.0, distance: 16, kind: 'cyan_tube' },
    { id: 'lt-infirm-red', x: 33.5, y: 2.8, z: -8, colorHex: 0xef4444, intensity: 4.2, distance: 14, kind: 'red_curtain' },
    { id: 'lt-statue-1', x: 0, y: 4.4, z: 6, colorHex: 0xcbd5e1, intensity: 3.4, distance: 17, kind: 'globe' },
    { id: 'lt-statue-2', x: 0, y: 4.4, z: -9, colorHex: 0x99f6e4, intensity: 3.8, distance: 17, kind: 'globe' },
    { id: 'lt-study-1', x: -15, y: 3.4, z: -40.5, colorHex: 0xfde047, intensity: 4.0, distance: 16, kind: 'sconce' },
    { id: 'lt-study-2', x: -22, y: 3.6, z: -26, colorHex: 0xf59e0b, intensity: 3.2, distance: 14, kind: 'sconce' },
    { id: 'lt-crypt-1', x: 13.5, y: 3.8, z: -31, colorHex: 0xfbbf24, intensity: 4.2, distance: 16, kind: 'crypt_torch' },
    { id: 'lt-crypt-2', x: 20.5, y: 3.8, z: -35.5, colorHex: 0xef4444, intensity: 4.6, distance: 16, kind: 'crypt_torch' },
    { id: 'lt-lib-1', x: -21, y: 4.3, z: 42, colorHex: 0xf59e0b, intensity: 3.8, distance: 17, kind: 'globe' },
    { id: 'lt-banq-1', x: 22.5, y: 4.3, z: 43, colorHex: 0xfde68a, intensity: 4.2, distance: 18, kind: 'globe' },
    { id: 'lt-kitch-1', x: 34, y: 3.8, z: 26, colorHex: 0xfb923c, intensity: 3.6, distance: 16, kind: 'sconce' },
    { id: 'lt-court-1', x: -42, y: 5.8, z: 26, colorHex: 0x93c5fd, intensity: 4.4, distance: 20, kind: 'globe' },
    { id: 'lt-dung-1', x: -41, y: 3.6, z: 0, colorHex: 0xef4444, intensity: 3.5, distance: 16, kind: 'crypt_torch' },
    { id: 'lt-bed-1', x: -37, y: 4.1, z: -28, colorHex: 0xfbbf24, intensity: 3.8, distance: 17, kind: 'sconce' },
  ];
}

function getDoorBox(door: CastleDoor): { minX: number; maxX: number; minZ: number; maxZ: number } | null {
  if (door.isOpen && door.openProgress > 0.55) return null;
  const half = door.width * 0.5 + 0.08;
  if (door.axis === 'x') {
    return {
      minX: door.x - half,
      maxX: door.x + half,
      minZ: door.z - 0.3,
      maxZ: door.z + 0.3,
    };
  }
  return {
    minX: door.x - 0.3,
    maxX: door.x + 0.3,
    minZ: door.z - half,
    maxZ: door.z + half,
  };
}

function pushCircleOutOfBox(
  pos: Vec2,
  radius: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): void {
  const closestX = Math.max(minX, Math.min(pos.x, maxX));
  const closestZ = Math.max(minZ, Math.min(pos.z, maxZ));
  const dx = pos.x - closestX;
  const dz = pos.z - closestZ;
  const distSq = dx * dx + dz * dz;
  if (distSq >= radius * radius) return;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const pen = radius - dist;
    pos.x += (dx / dist) * pen;
    pos.z += (dz / dist) * pen;
  } else {
    const leftPen = pos.x - minX;
    const rightPen = maxX - pos.x;
    const topPen = pos.z - minZ;
    const botPen = maxZ - pos.z;
    const minPen = Math.min(leftPen, rightPen, topPen, botPen);
    if (minPen === leftPen) pos.x = minX - radius;
    else if (minPen === rightPen) pos.x = maxX + radius;
    else if (minPen === topPen) pos.z = minZ - radius;
    else pos.z = maxZ + radius;
  }
}

export function resolveCastleCollisions(
  x: number,
  z: number,
  radius: number,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[],
  ignoreClosedDoors = false
): Vec2 {
  const pos: Vec2 = { x, z };
  // 4 relaxation passes guarantee zero corner-pinch penetration even when wedged between 2 walls
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      pushCircleOutOfBox(pos, radius, w.minX, w.maxX, w.minZ, w.maxZ);
    }
    if (!ignoreClosedDoors) {
      for (let i = 0; i < doors.length; i++) {
        const box = getDoorBox(doors[i]);
        if (box) {
          pushCircleOutOfBox(pos, radius, box.minX, box.maxX, box.minZ, box.maxZ);
        }
      }
    }
  }
  return pos;
}

/**
 * Swept sub-stepping movement (<= 0.055m per substep with separate X/Z axis resolution)
 * so high speeds (Dash, Sprint, Adrenaline) and slow frames (dt = 0.05s) NEVER tunnel through walls!
 */
export function sweepCastleMovement(
  startX: number,
  startZ: number,
  deltaX: number,
  deltaZ: number,
  radius: number,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[],
  ignoreClosedDoors = false
): Vec2 {
  const totalDist = Math.hypot(deltaX, deltaZ);
  if (totalDist < 1e-6) {
    return resolveCastleCollisions(startX, startZ, radius, walls, doors, ignoreClosedDoors);
  }
  const steps = Math.max(1, Math.min(24, Math.ceil(totalDist / 0.055)));
  const stepX = deltaX / steps;
  const stepZ = deltaZ / steps;
  let curX = startX;
  let curZ = startZ;

  for (let s = 0; s < steps; s++) {
    // Axis-separated sweep gives buttery-smooth wall sliding along angled movements
    const afterX = resolveCastleCollisions(
      curX + stepX,
      curZ,
      radius,
      walls,
      doors,
      ignoreClosedDoors
    );
    const afterZ = resolveCastleCollisions(
      afterX.x,
      afterX.z + stepZ,
      radius,
      walls,
      doors,
      ignoreClosedDoors
    );
    curX = afterZ.x;
    curZ = afterZ.z;
  }

  return { x: curX, z: curZ };
}

function segmentIntersectsAABB(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dz = z2 - z1;

  const checks: Array<[number, number]> = [
    [-dx, x1 - minX],
    [dx, maxX - x1],
    [-dz, z1 - minZ],
    [dz, maxZ - z1],
  ];

  for (let i = 0; i < 4; i++) {
    const p = checks[i][0];
    const q = checks[i][1];
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

export function hasCastleLineOfSight(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[]
): boolean {
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (!w.blocksSight || w.height < 1.9) continue;
    if (segmentIntersectsAABB(x1, z1, x2, z2, w.minX, w.maxX, w.minZ, w.maxZ)) {
      return false;
    }
  }
  for (let i = 0; i < doors.length; i++) {
    const box = getDoorBox(doors[i]);
    if (box && segmentIntersectsAABB(x1, z1, x2, z2, box.minX, box.maxX, box.minZ, box.maxZ)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether an actor of `radius` can walk in a straight line from (x1, z1) to (x2, z2)
 * without hitting ANY solid wall, staircase, table, pillar, or closed door!
 */
export function hasDirectWalkablePath(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  radius: number,
  walls: readonly WallBox[],
  doors: readonly CastleDoor[],
  allowGhostThroughUnlockedDoors = false
): boolean {
  const pad = Math.max(0.05, radius * 0.88);
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (
      segmentIntersectsAABB(
        x1,
        z1,
        x2,
        z2,
        w.minX - pad,
        w.maxX + pad,
        w.minZ - pad,
        w.maxZ + pad
      )
    ) {
      return false;
    }
  }
  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    if (allowGhostThroughUnlockedDoors && d.unlocked) continue;
    const box = getDoorBox(d);
    if (
      box &&
      segmentIntersectsAABB(
        x1,
        z1,
        x2,
        z2,
        box.minX - pad,
        box.maxX + pad,
        box.minZ - pad,
        box.maxZ + pad
      )
    ) {
      return false;
    }
  }
  return true;
}

export interface NavNode {
  id: string;
  x: number;
  z: number;
  neighbors: string[];
  doorId?: string;
}

export const CASTLE_NAV_GRAPH: readonly NavNode[] = [
  // Grand Foyer (8 nodes wrapping cleanly around staircase [x:-1.38..1.38, z:23.8..29.75] & desk [x:2.1..3.5, z:33.35..34.25])
  { id: 'foyer_s', x: 0, z: 36.8, neighbors: ['foyer_sw', 'foyer_se'] },
  { id: 'foyer_sw', x: -5.8, z: 36.8, neighbors: ['foyer_s', 'foyer_w', 'door_lib'] },
  { id: 'foyer_se', x: 5.8, z: 37.5, neighbors: ['foyer_s', 'foyer_e', 'door_banq'] },
  { id: 'foyer_w', x: -5.8, z: 26.5, neighbors: ['foyer_sw', 'foyer_nw', 'door_west', 'door_lib'] },
  { id: 'foyer_e', x: 5.8, z: 26.5, neighbors: ['foyer_se', 'foyer_ne', 'door_east', 'door_banq'] },
  { id: 'foyer_nw', x: -5.5, z: 21.2, neighbors: ['foyer_w', 'foyer_n', 'foyer_ne'] },
  { id: 'foyer_ne', x: 5.5, z: 21.2, neighbors: ['foyer_e', 'foyer_n', 'foyer_nw'] },
  { id: 'foyer_n', x: 0, z: 20.5, neighbors: ['foyer_nw', 'foyer_ne', 'door_statue_s'] },

  // Gothic Library Wing (wrapping around bookshelves)
  { id: 'door_lib', x: -10, z: 38, neighbors: ['foyer_sw', 'foyer_w', 'lib_e'], doorId: 'door-library' },
  { id: 'lib_e', x: -14.2, z: 38.0, neighbors: ['door_lib', 'lib_s', 'lib_n'] },
  { id: 'lib_n', x: -21.0, z: 37.5, neighbors: ['lib_e', 'lib_nw'] },
  { id: 'lib_s', x: -21.0, z: 47.5, neighbors: ['lib_e', 'lib_nw'] },
  { id: 'lib_nw', x: -29.0, z: 42.5, neighbors: ['lib_n', 'lib_s'] },

  // Banquet Hall & Kitchen Wing (wrapping around 10m banquet table [x:17.5..27.5, z:41.8..44.2])
  { id: 'door_banq', x: 10, z: 39, neighbors: ['foyer_se', 'foyer_e', 'banq_w'], doorId: 'door-banquet' },
  { id: 'banq_w', x: 14.2, z: 39.5, neighbors: ['door_banq', 'banq_nw', 'banq_s'] },
  { id: 'banq_nw', x: 22.5, z: 38.5, neighbors: ['banq_w', 'banq_ne', 'door_kitch'] },
  { id: 'banq_ne', x: 30.2, z: 38.5, neighbors: ['banq_nw', 'banq_e', 'door_kitch'] },
  { id: 'banq_s', x: 22.5, z: 47.5, neighbors: ['banq_w', 'banq_e'] },
  { id: 'banq_e', x: 31.5, z: 44.0, neighbors: ['banq_s', 'banq_ne'] },
  { id: 'door_kitch', x: 30, z: 36, neighbors: ['banq_nw', 'banq_ne', 'kitch_s'], doorId: 'door-kitchen' },
  { id: 'kitch_s', x: 29.0, z: 31.5, neighbors: ['door_kitch', 'kitch_e', 'kitch_n'] },
  { id: 'kitch_e', x: 39.5, z: 29.5, neighbors: ['kitch_s', 'kitch_n'] },
  { id: 'kitch_n', x: 39.5, z: 20.5, neighbors: ['kitch_s', 'kitch_e'] },

  // Steam Gallery & Moonlit Courtyard (wrapping around central fountain [-42, 26])
  { id: 'door_west', x: -10, z: 26, neighbors: ['foyer_w', 'steam_c'], doorId: 'door-west-gallery' },
  { id: 'steam_c', x: -15.5, z: 26, neighbors: ['door_west', 'steam_nw', 'steam_sw'] },
  { id: 'steam_sw', x: -26.5, z: 29.5, neighbors: ['steam_c', 'steam_nw', 'door_court'] },
  { id: 'steam_nw', x: -22, z: 18, neighbors: ['steam_c', 'steam_sw', 'door_sec'] },
  { id: 'door_court', x: -32, z: 30, neighbors: ['steam_sw', 'court_e'], doorId: 'door-courtyard' },
  { id: 'court_e', x: -36.5, z: 29.5, neighbors: ['door_court', 'court_n', 'court_s'] },
  { id: 'court_s', x: -42.0, z: 32.5, neighbors: ['court_e', 'court_w'] },
  { id: 'court_n', x: -42.0, z: 19.0, neighbors: ['court_e', 'court_w'] },
  { id: 'court_w', x: -47.5, z: 26.0, neighbors: ['court_s', 'court_n'] },

  // Surveillance Bunker & Forgotten Dungeon Cells
  { id: 'door_sec', x: -22, z: 14, neighbors: ['steam_nw', 'bunker_s'], doorId: 'door-security' },
  { id: 'bunker_s', x: -22, z: 8, neighbors: ['door_sec', 'bunker_w', 'bunker_e'] },
  { id: 'bunker_w', x: -29.5, z: 2.5, neighbors: ['bunker_s', 'bunker_n', 'door_dung'] },
  { id: 'bunker_n', x: -22, z: -5.5, neighbors: ['bunker_w', 'bunker_e'] },
  { id: 'bunker_e', x: -18, z: -2, neighbors: ['bunker_s', 'bunker_n', 'door_bunk_stat'] },
  { id: 'door_bunk_stat', x: -14, z: -2, neighbors: ['bunker_e', 'statue_w'], doorId: 'door-bunker-statue' },
  { id: 'door_dung', x: -34, z: 4, neighbors: ['bunker_w', 'dung_e'], doorId: 'door-dungeon' },
  { id: 'dung_e', x: -38.5, z: 4.0, neighbors: ['door_dung', 'dung_s', 'dung_n'] },
  { id: 'dung_s', x: -43.5, z: 7.0, neighbors: ['dung_e', 'dung_n'] },
  { id: 'dung_n', x: -46.5, z: -9.5, neighbors: ['dung_e', 'dung_s'] },

  // East Portrait Hallway & Infirmary
  { id: 'door_east', x: 10, z: 26, neighbors: ['foyer_e', 'hall_s'], doorId: 'door-east-hall' },
  { id: 'hall_s', x: 17, z: 26, neighbors: ['door_east', 'hall_n'] },
  { id: 'hall_n', x: 19, z: 11, neighbors: ['hall_s', 'infirm_s'] },
  { id: 'infirm_s', x: 19, z: 4, neighbors: ['hall_n', 'infirm_e', 'door_inf_stat'] },
  { id: 'infirm_e', x: 30, z: -1.5, neighbors: ['infirm_s', 'infirm_n'] },
  { id: 'infirm_n', x: 24, z: -9, neighbors: ['infirm_e', 'door_inf_stat'] },
  { id: 'door_inf_stat', x: 14, z: -2, neighbors: ['infirm_s', 'infirm_n', 'statue_e'], doorId: 'door-infirmary-statue' },

  // Hall of Six Statues
  { id: 'door_statue_s', x: 0, z: 18, neighbors: ['foyer_n', 'statue_s'], doorId: 'door-statue-hall' },
  { id: 'statue_s', x: 0, z: 11, neighbors: ['door_statue_s', 'statue_w', 'statue_e'] },
  { id: 'statue_w', x: -9, z: -2, neighbors: ['statue_s', 'statue_n', 'door_bunk_stat', 'door_study'] },
  { id: 'statue_e', x: 9, z: -2, neighbors: ['statue_s', 'statue_n', 'door_inf_stat', 'door_crypt_esc'] },
  { id: 'statue_n', x: 0, z: -14.8, neighbors: ['statue_w', 'statue_e', 'door_study', 'door_crypt_esc'] },

  // Grandfather's Study & Master Bedchamber
  { id: 'door_study', x: -9, z: -18, neighbors: ['statue_w', 'statue_n', 'study_s'], doorId: 'door-study' },
  { id: 'study_s', x: -9, z: -23, neighbors: ['door_study', 'study_w', 'door_crypt'] },
  { id: 'study_w', x: -22, z: -29, neighbors: ['study_s', 'study_n', 'door_bed'] },
  { id: 'study_n', x: -12, z: -36, neighbors: ['study_w', 'door_crypt'] },
  { id: 'door_bed', x: -28, z: -29, neighbors: ['study_w', 'bed_e'], doorId: 'door-bedroom' },
  { id: 'bed_e', x: -33.0, z: -29.0, neighbors: ['door_bed', 'bed_n', 'bed_s'] },
  { id: 'bed_n', x: -35.5, z: -37.5, neighbors: ['bed_e', 'bed_s'] },
  { id: 'bed_s', x: -42.5, z: -22.5, neighbors: ['bed_e', 'bed_n'] },

  // Crypt & Tomb
  { id: 'door_crypt', x: -2, z: -30, neighbors: ['study_s', 'study_n', 'crypt_w'], doorId: 'door-crypt' },
  { id: 'crypt_w', x: 3, z: -30, neighbors: ['door_crypt', 'crypt_deed', 'door_crypt_esc'] },
  { id: 'crypt_deed', x: 13.5, z: -28.0, neighbors: ['crypt_w', 'crypt_tomb', 'door_crypt_esc'] },
  { id: 'crypt_tomb', x: 17, z: -35, neighbors: ['crypt_deed'] },
  { id: 'door_crypt_esc', x: 8, z: -18, neighbors: ['crypt_w', 'crypt_deed', 'statue_e', 'statue_n'], doorId: 'door-crypt-escape' },
];

function pickBestAnchorNode(
  x: number,
  z: number,
  doors: readonly CastleDoor[],
  allowGhostThroughUnlockedDoors: boolean,
  walls?: readonly WallBox[]
): NavNode {
  const curRoomId = getRoomAt(x, z).id;
  let bestWalkable: NavNode | null = null;
  let bestWalkDist = Infinity;
  let bestSameRoom: NavNode | null = null;
  let bestSameRoomDist = Infinity;
  let bestOverall = CASTLE_NAV_GRAPH[0];
  let bestOverallDist = Infinity;

  for (const n of CASTLE_NAV_GRAPH) {
    if (n.doorId) {
      const door = doors.find((d) => d.id === n.doorId);
      if (door && !door.isOpen && !(allowGhostThroughUnlockedDoors && door.unlocked)) {
        continue;
      }
    }
    const d = Math.hypot(n.x - x, n.z - z);
    if (d < bestOverallDist) {
      bestOverallDist = d;
      bestOverall = n;
    }
    if (!n.doorId && getRoomAt(n.x, n.z).id === curRoomId && d < bestSameRoomDist) {
      bestSameRoomDist = d;
      bestSameRoom = n;
    }
    if (
      walls &&
      d < bestWalkDist &&
      hasDirectWalkablePath(x, z, n.x, n.z, 0.55, walls, doors, false)
    ) {
      bestWalkDist = d;
      bestWalkable = n;
    }
  }

  return bestWalkable || bestSameRoom || bestOverall;
}

export function getReachableNavNodes(
  fromX: number,
  fromZ: number,
  doors: readonly CastleDoor[],
  allowGhostThroughUnlockedDoors = true,
  walls?: readonly WallBox[]
): NavNode[] {
  const startNode = pickBestAnchorNode(fromX, fromZ, doors, allowGhostThroughUnlockedDoors, walls);

  const nodeMap = new Map<string, NavNode>();
  for (const n of CASTLE_NAV_GRAPH) nodeMap.set(n.id, n);

  const visited = new Set<string>([startNode.id]);
  const queue: string[] = [startNode.id];
  const result: NavNode[] = [];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    const cur = nodeMap.get(curId)!;
    if (!cur.doorId) {
      result.push(cur);
    }
    for (const nbId of cur.neighbors) {
      if (visited.has(nbId)) continue;
      const nb = nodeMap.get(nbId)!;
      if (nb.doorId) {
        const door = doors.find((d) => d.id === nb.doorId);
        if (door && !door.isOpen && !(allowGhostThroughUnlockedDoors && door.unlocked)) {
          continue;
        }
      }
      visited.add(nbId);
      queue.push(nbId);
    }
  }
  return result.length > 0 ? result : [startNode];
}

export function computeNextCastlePathStep(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  doors: readonly CastleDoor[],
  allowGhostThroughUnlockedDoors = true,
  walls?: readonly WallBox[]
): Vec2 {
  if (
    walls &&
    hasDirectWalkablePath(fromX, fromZ, toX, toZ, 0.56, walls, doors, false)
  ) {
    return { x: toX, z: toZ };
  }

  const startNode = pickBestAnchorNode(fromX, fromZ, doors, allowGhostThroughUnlockedDoors, walls);
  const endNode = pickBestAnchorNode(toX, toZ, doors, allowGhostThroughUnlockedDoors, walls);

  if (startNode.id === endNode.id) {
    // If direct line to (toX, toZ) is blocked by a local obstacle, route via startNode first if we aren't already on it!
    if (Math.hypot(startNode.x - fromX, startNode.z - fromZ) > 0.7) {
      return { x: startNode.x, z: startNode.z };
    }
    return { x: toX, z: toZ };
  }

  const nodeMap = new Map<string, NavNode>();
  for (const n of CASTLE_NAV_GRAPH) nodeMap.set(n.id, n);

  const visited = new Set<string>([startNode.id]);
  const parent = new Map<string, string>();
  const queue: string[] = [startNode.id];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    if (curId === endNode.id) break;
    const cur = nodeMap.get(curId)!;
    for (const nbId of cur.neighbors) {
      if (visited.has(nbId)) continue;
      const nb = nodeMap.get(nbId)!;
      if (nb.doorId) {
        const door = doors.find((d) => d.id === nb.doorId);
        if (door && !door.isOpen && !(allowGhostThroughUnlockedDoors && door.unlocked)) {
          continue;
        }
      }
      visited.add(nbId);
      parent.set(nbId, curId);
      queue.push(nbId);
    }
  }

  if (!visited.has(endNode.id)) {
    return { x: startNode.x, z: startNode.z };
  }

  // Reconstruct full path from startNode -> ... -> endNode
  const pathIds: string[] = [];
  let cur: string | undefined = endNode.id;
  while (cur) {
    pathIds.push(cur);
    cur = parent.get(cur);
  }
  pathIds.reverse();

  // Open any unlocked doorway along the immediate step so Grandfather swings doors open cleanly without ramming them!
  for (let i = 0; i < Math.min(2, pathIds.length); i++) {
    const nd = nodeMap.get(pathIds[i])!;
    if (nd.doorId && Math.hypot(nd.x - fromX, nd.z - fromZ) < 3.6) {
      const door = doors.find((d) => d.id === nd.doorId);
      if (door && door.unlocked && !door.isOpen && !door.isMainExit) {
        door.isOpen = true;
        door.openProgress = Math.max(door.openProgress, 0.65);
      }
    }
  }

  // Funnel / String-Pulling: pick the furthest node along the path that has an unobstructed walkable line from (fromX, fromZ)
  if (walls) {
    for (let i = Math.min(pathIds.length - 1, 3); i >= 1; i--) {
      const candidate = nodeMap.get(pathIds[i])!;
      if (
        hasDirectWalkablePath(
          fromX,
          fromZ,
          candidate.x,
          candidate.z,
          0.55,
          walls,
          doors,
          false
        )
      ) {
        return { x: candidate.x, z: candidate.z };
      }
    }
    // If startNode itself isn't reached yet, walk cleanly to startNode first!
    if (Math.hypot(startNode.x - fromX, startNode.z - fromZ) > 0.62) {
      return { x: startNode.x, z: startNode.z };
    }
  }

  const nextNode = nodeMap.get(pathIds[Math.min(1, pathIds.length - 1)])!;
  return { x: nextNode.x, z: nextNode.z };
}
