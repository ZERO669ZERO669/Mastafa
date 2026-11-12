import {
  CluePlaque,
  DialogueLine,
  InventoryItemId,
  LoreNote,
  PuzzleStation,
} from './types';

export interface InventoryMeta {
  id: InventoryItemId;
  nameAr: string;
  nameEn: string;
  descAr: string;
}

export const INVENTORY_CATALOG: Record<InventoryItemId, InventoryMeta> = {
  west_wing_key: {
    id: 'west_wing_key',
    nameAr: 'مفتاح الرواق الغربي الصدئ',
    nameEn: 'West Gallery Key',
    descAr: 'يفتح باب الرواق المقنطر وغرفة الصمامات غرب البهو.',
  },
  security_key: {
    id: 'security_key',
    nameAr: 'بطاقة قبو المراقبة',
    nameEn: 'Security Bunker Pass',
    descAr: 'تفتح البوابة الحديدية المؤدية إلى قبو شاشات المراقبة.',
  },
  infirmary_key: {
    id: 'infirmary_key',
    nameAr: 'مفتاح الجناح الشرقي والمصحة',
    nameEn: 'East Wing & Infirmary Key',
    descAr: 'يفتح باب الممر المسكون باللوحات والمصحة المختبرية شرقاً.',
  },
  statue_hall_key: {
    id: 'statue_hall_key',
    nameAr: 'المفتاح الفضي لقاعة التماثيل',
    nameEn: 'Silver Statue Hall Key',
    descAr: 'يفتح البوابة الشمالية الكبرى المؤدية إلى قاعة التماثيل الستة المقنّعة.',
  },
  silver_lens: {
    id: 'silver_lens',
    nameAr: 'عدسة الفضة المشعّة',
    nameEn: 'Radiant Silver Lens',
    descAr: 'تُركّب على كشاف مارك لإطلاق ومضة فضية [Q] تشلّ روح الجد لـ 5.5 ثوانٍ!',
  },
  study_key: {
    id: 'study_key',
    nameAr: 'مفتاح مكتب الجد الملكي',
    nameEn: "Grandfather's Study Key",
    descAr: 'يفتح باب مكتب الجد السري حيث خزنة الميراث.',
  },
  crypt_key: {
    id: 'crypt_key',
    nameAr: 'مفتاح سرداب الضريح',
    nameEn: 'Crypt Vault Key',
    descAr: 'يفتح بوابة سرداب الضريح الحجري حيث يرقد قبر الجد ووَرقة الورث.',
  },
  inheritance_deed: {
    id: 'inheritance_deed',
    nameAr: 'وثيقة الميراث المختومة',
    nameEn: 'Sealed Inheritance Deed',
    descAr: 'صكّ ملكية القلعة والثروة الكاملة باسم مارك — اهرب بها نحو بوابة القلعة الرئيسية!',
  },
  master_exit_key: {
    id: 'master_exit_key',
    nameAr: 'مفتاح بوابة القلعة الكبرى',
    nameEn: 'Master Castle Exit Key',
    descAr: 'يفكّ أقفال بوابة الخروج الرئيسية في جنوب البهو الملكي للهروب النهائي!',
  },
};

/**
 * Full Complete Arabic Story Parchment shown when the player clicks "ابدأ اللعبة"
 */
export const MARK_INHERITANCE_STORY = {
  titleAr: 'وصيّة القلعة الملعونة — قصة مارك وميراث الجد فيكتور',
  dateLineAr: 'الليلة السابعة من تشرين · قلعة آل مالاكور الجبلية',
  paragraphsAr: [
    'لم يبقَ أمام الشاب «مارك» سوى ساعات معدودة قبل أن يصادر الدائنون كل ما يملك ويلقوا به خلف القضبان، بعد أن تراكمت عليه الديون الخانقة وأُغلقت في وجهه كل الأبواب. وفي أشدّ لحظات يأسه، طرق ساعي البريد بابه في منتصف الليل حاملاً مظروفاً شمعياً أحمر من محامٍ مجهول، يبلغه فيه بوفاة جدّه الثري الغامض «فيكتور مالاكور» الذي هجره الجميع منذ عقود في قلعته الجبلية النائية.',
    'نصّت الرسالة على أن الجدّ لم يترك وريثاً شرعياً لثروته الطائلة وقلعته الشاسعة سوى حفيده «مارك»، بشرط واحد لا يقبل التأجيل: أن يحضر مارك بنفسه قبل طلوع الفجر إلى قلب القلعة، ويستخرج «وثيقة الميراث المختومة» بيده من سرداب العائلة ليُسقط ديونه إلى الأبد.',
    'وما إن عبر مارك البوابة الحديدية الصدئة لقلعة الجدّ حتى انطبقت المصاريع خلفه بصليلٍ مرعب وأوصدت الأقفال تلقائياً! حينها فقط أدرك الحقيقة المروّعة التي أخفتها الرسالة: لقد مات جسد الجدّ فيكتور ودُفن في ضريحه الحجري، لكن روحه الشريرة المهووسة بثروته لم تغادر جدران القلعة قط، بل نصبت فخّ الميراث لاستدراج حفيدها وقتله بضربة واحدة لكل من يجرؤ على الاقتراب من أموالها!',
    'الآن يقف مارك وحيداً في ظلام القلعة الشاسعة الممتدة عبر أربعة عشر جناحاً وقاعة؛ عليه أن يستكشف الممرات والغرف المنسية، يفتش عن الأدلة والمخطوطات بذكائه، يحلّ الألغاز المتسلسلة ليحصل على المفاتيح ويفتح الأبواب الموصدة حتى يصل إلى سرداب الضريح وينتزع «ورقة الورث»... وحذارِ اللحظة التي يلمس فيها الورقة، فحينها سينشقّ قبر الجدّ ويخرج منه ليطارده حتى البوابة الأخيرة!',
  ],
  signatureAr: '«من يدخل قلعتي طمعاً في ذهبي... لن يخرج منها إلا إذا سبق خطواتي نحو الفجر» — الجد فيكتور مالاكور',
};

export const CASTLE_DIALOGUES: Record<string, DialogueLine> = {
  intro_foyer: {
    id: 'intro_foyer',
    speakerAr: 'مارك',
    speakerRole: 'mark',
    textAr: 'أُغلقت بوابة القلعة خلفي بالسلاسل! عليّ استكشاف هذا البهو والأجنحة المفتوحة حوله للبحث عن خيط يقودني إلى أول مفتاح.',
    durationSec: 6.5,
  },
  west_wing_opened: {
    id: 'west_wing_opened',
    speakerAr: 'روح الجد فيكتور (صدى بعيد)',
    speakerRole: 'grandfather',
    textAr: 'أسمع خطواتك الطامعة في أروقتي يا مارك... ديونك لن تشفع لك إن أمسكتُ بك في الظلام!',
    durationSec: 6.5,
  },
  bunker_entered: {
    id: 'bunker_entered',
    speakerAr: 'مارك',
    speakerRole: 'mark',
    textAr: 'قبو مراقبة سري! كان جدي يراقب كل غرفة في القلعة عبر هذه الشاشات... لا بد أن سجلات الحراس تكشف طريقة فتح الجناح الشرقي.',
    durationSec: 6.0,
  },
  infirmary_solved: {
    id: 'infirmary_solved',
    speakerAr: 'مارك',
    speakerRole: 'mark',
    textAr: 'حصلتُ على المفتاح الفضي لقاعة التماثيل وعدسة الفضة المشعّة! أستطيع الآن إبهار روح جدي مؤقتاً إذا اقترب مني.',
    durationSec: 6.5,
  },
  statues_solved: {
    id: 'statues_solved',
    speakerAr: 'روح الجد فيكتور',
    speakerRole: 'grandfather',
    textAr: 'تقترب من مكتبي وخزنتي يا حفيدي العاق... خطوة أخرى وستذوق برد القبر!',
    durationSec: 6.0,
  },
  crypt_unlocked: {
    id: 'crypt_unlocked',
    speakerAr: 'مارك',
    speakerRole: 'mark',
    textAr: 'انفتح باب سرداب الضريح! وثيقة الميراث هناك أمام قبر جدي... سآخذها وأركض بكل قوتي نحو البوابة الرئيسية!',
    durationSec: 6.5,
  },
  tomb_eruption: {
    id: 'tomb_eruption',
    speakerAr: 'روح الجد فيكتور (صرخة من القبر!)',
    speakerRole: 'grandfather',
    textAr: 'أتظنّ أنك ستأخذ ورقة ورثي وتخرج حيّاً يا مارك؟! لقد خرجتُ من قبري لأقبض روحك بيدي!',
    durationSec: 8.0,
  },
};

export function createInitialLoreNotes(): LoreNote[] {
  return [
    {
      id: 'note-1-clock',
      titleAr: 'رسالة المحامي: لغز البهو الملكي',
      titleEn: "Solicitor's Letter: The Grand Foyer",
      roomNameAr: 'البهو الملكي والدرج الكبير',
      bodyAr:
        'إلى مارك: إذا أردت النجاة بحياتك، فلا تدع روح جدك تقترب منك أبداً؛ قبضته قاتلة، لكنك شابّ وأسرع منه ركضاً فاستغلّ سرعتك والخزائن الخشبية للاختباء! لقد أخفى جدك مفتاح الرواق الغربي داخل الساعة الطويلة، وربط قفلها الرباعي بسنة تشييد هذه القلعة (1894 م) المنقوشة بماء الذهب أسفل لوحته الزيتية المتصدرة لأعلى الدرج الكبير.',
      bodyEn:
        'Mark: Grandfather locked the West Wing key inside the tall clock using the four-digit founding year (1894) engraved beneath his grand portrait on the central staircase.',
      relatedPuzzle: 'clock',
      x: 2.8,
      z: 33.8,
      discovered: false,
    },
    {
      id: 'note-2-valves',
      titleAr: 'سجلّ كبير المهندسين: مرجل البخار',
      titleEn: "Chief Engineer's Log: Steam Boiler",
      roomNameAr: 'الرواق المقنطر وغرفة الصمامات',
      bodyAr:
        'أمرنا السيد فيكتور بتأمين بوابة قبو المراقبة بصمام ضغط آلي لا يقبل التلاعب؛ لن يتحرر المزلاج الحديدي إلا عند فتح ثلاثة صمامات معاً ليستقر مؤشر المرجل عند ضغط (80 PSI) بالضبط دون زيادة أو نقصان. أي عدد آخر من الصمامات سيبقي البوابة مغلقة.',
      bodyEn:
        'The bunker steam lock disengages only when exactly three valves are opened simultaneously to stabilize boiler pressure at precisely 80 PSI.',
      relatedPuzzle: 'valves',
      x: -15.5,
      z: 30.2,
      discovered: false,
    },
    {
      id: 'note-3-monitors',
      titleAr: 'دفتر نوبة الحراسة الليلية',
      titleEn: 'Midnight Guard Duty Roster',
      roomNameAr: 'قبو المراقبة والأرشيف',
      bodyAr:
        'تعليمات النوبة الليلية لقفل الجناح الشرقي: يجب ضبط الشاشات الأربع من الأولى حتى الرابعة وفق الترتيب الزمني لجولة التفتيش المعتادة كل ليلة؛ تبدأ الجولة بتفقّد أنابيب «الرواق المقنطر»، ثم المرور على أسرّة «المصحة الشرقية»، يعقبها مراقبة مدخل «البهو الملكي»، وتُختتم الدورية عند «قاعة التماثيل».',
      bodyEn:
        'Align Monitors 1 to 4 with the nightly patrol sequence: first the Arched Steam Gallery, second the East Infirmary, third the Grand Foyer, and fourth the Hall of Statues.',
      relatedPuzzle: 'monitors',
      x: -19.5,
      z: 7.5,
      discovered: false,
    },
    {
      id: 'note-4-elixir',
      titleAr: 'مذكرات طبيب القصر: المعادلة النقية',
      titleEn: "Court Physician's Journal: Pure Formula",
      roomNameAr: 'الممر المسكون باللوحات (مدخل المصحة)',
      bodyAr:
        'لم يبقَ لإذابة الختم الفضي سوى تحضير المركّب الثلاثي النقي على عربة الجراحة. تذكّر القاعدة الصارمة: امزج ثلاث قوارير فقط بحيث يبلغ الحجم الكلي تسعة عشر ملليتراً (19 مل) بالتمام؛ أي زيادة في عدد القوارير أو اختلاف في المكيال سيفسد التفاعل الكيميائي فوراً.',
      bodyEn:
        'Dissolve the silver seal by combining strictly three chemical vials on the surgical cart to reach an exact volume of 19 ml.',
      relatedPuzzle: 'elixir',
      x: 18.0,
      z: 21.0,
      discovered: false,
    },
    {
      id: 'note-5-statues',
      titleAr: 'الرقعة السوداء: عهد الحراس المقنّعين',
      titleEn: 'Black Parchment: Oath of the Veiled',
      roomNameAr: 'قاعة التماثيل الستة المقنّعة',
      bodyAr:
        'احذر الحارس الرخامي الحيّ في هذه القاعة؛ فهو يتجمد كالصنم ما دامت عيناك مسلطتين عليه، وينقضّ حين تدير ظهرك! ولفتح باب مكتب سيد القلعة، أوقِد نيران أربعة تماثيل فقط على هذا العهد المتسلسل: «أوّلهم مَن أثقلَ عنقك بالديون، وثانيهم مَن استدرجك بالميراث، وثالثهم مَن أطبقَ شفتيه بالصمت، وآخرهم مَن ينتظرك في عتمة الضريح».',
      bodyEn:
        'Ignite four braziers in sequence according to the oath: first Debt, second Inheritance, third Silence, and fourth the Crypt.',
      relatedPuzzle: 'statues',
      x: 5.5,
      z: 6.5,
      discovered: false,
    },
    {
      id: 'note-6-safe',
      titleAr: 'وصية فيكتور الأخيرة: خزنة الضريح',
      titleEn: "Victor's Final Testament: Crypt Vault",
      roomNameAr: 'مكتب الجد السري وخزنة الميراث',
      bodyAr:
        'إن وصلتَ إلى مكتبي يا مارك فقد أثبتّ دهاءً لم أتوقعه من مديونٍ يائس. خلف هذه الخزنة البصرية يرقد مفتاح ضريحي الحجري؛ يدخل شعاع الضوء من أعلى اليسار وعليك تدوير المرايا المائلة ليخرج الشعاع من مستقبِل القفل أسفل اليمين. وحذارِ اللحظة التي ترفع فيها وثيقة الميراث أمام تابوتي، فحينها ستوقظ لعنتي من القبر!',
      bodyEn:
        'Behind this optical safe lies my Crypt Key. Touching the Inheritance Deed before my sarcophagus will awaken my spirit until you escape the front gate!',
      relatedPuzzle: 'safe',
      x: -11.5,
      z: -24.5,
      discovered: false,
    },
    // --- 5 Optional Exploration Lore Diaries in the Expanded AAA Castle Wings ---
    {
      id: 'note-opt-library',
      titleAr: 'يوميّات أمين المكتبة: الممرات المخفية',
      titleEn: "Librarian's Diary: Whispering Corridors",
      roomNameAr: 'المكتبة القوطية المهجورة',
      bodyAr:
        'منذ وفاة السيدة إيلينا، اعتكف اللورد فيكتور بين رفوف هذه المكتبة القوطية يدرس مخطوطات حبس الأرواح في الحجر. لقد بنى القلعة بحيث تتردد أصوات الركض عبر الأقبية، بينما تبتلع السجاجيد والخزائن الخشبية أنفاس المختبئين.',
      bodyEn:
        'Lord Victor studied soul-binding tomes in this Gothic Library. Sprinting echoes down corridors, while crouching and wooden wardrobes conceal intruders.',
      isOptionalLore: true,
      x: -25.2,
      z: 36.8,
      discovered: false,
    },
    {
      id: 'note-opt-banquet',
      titleAr: 'دعوة العشاء الأخير لآل مالاكور',
      titleEn: 'Invitation to the Last Malakor Banquet',
      roomNameAr: 'قاعة المأدبة الكبرى',
      bodyAr:
        'اجتمع سبعة من دائني العائلة وأقاربها حول مائدة المأدبة الكبرى عام 1921 مطالبين بحصصهم من المنجم... أُغلقت الأبواب تلك الليلة ولم يغادر أحدٌ القاعة قط، وبقيت الكؤوس الفضية شاهدةً على جشع فيكتور الذي لا يشبع.',
      bodyEn:
        'Seven relatives gathered at this banquet table demanding their share of the estate. The doors locked at midnight, and none ever left.',
      isOptionalLore: true,
      x: 22.5,
      z: 41.2,
      discovered: false,
    },
    {
      id: 'note-opt-courtyard',
      titleAr: 'مذكرة البستاني في حديقة الضباب',
      titleEn: "Gardener's Note in the Fog Conservatory",
      roomNameAr: 'حديقة الضباب الزجاجية',
      bodyAr:
        'ذبلت كل أشجار الفناء الزجاجي يوم دُفن السيّد فيكتور في السرداب الشمالي، غير أنني أقسم أنني ألمح ظلّه الطويل يتجول ليلاً بين النافورة الحجرية وممرات القصر البعيدة كلما سمع جلبةً عند الأبواب.',
      bodyEn:
        'Every tree in the glass conservatory withered the day Victor was entombed, yet his tall shadow still wanders far wings of the estate.',
      isOptionalLore: true,
      x: -39.5,
      z: 26.0,
      discovered: false,
    },
    {
      id: 'note-opt-dungeon',
      titleAr: 'نقش سجين في الزنازين المنسية',
      titleEn: "Prisoner's Scratching in the Dungeon",
      roomNameAr: 'الزنازين المنسية في القبو',
      bodyAr:
        'كنتُ المحامي السابق الذي صاغ مسودة الميراث الأولى... حبسني فيكتور في هذا القبو البارد كي لا أفشي سرّ العدسة الفضية المحفوظة في المصحة، فهي الشيء الوحيد الذي يجمد خطواته الملعونة لثوانٍ ثمينة!',
      bodyEn:
        'I drafted the first will before Victor locked me in these cells so none would learn of the Silver Lens kept in the Infirmary.',
      isOptionalLore: true,
      x: -41.5,
      z: -5.5,
      discovered: false,
    },
    {
      id: 'note-opt-bedroom',
      titleAr: 'اعترافات فيكتور على فراش الموت',
      titleEn: "Victor's Deathbed Confession",
      roomNameAr: 'جناح نوم الجد فيكتور',
      bodyAr:
        'تركتُ ثروتي كلها معروضةً باسم حفيدي «مارك» لا حبّاً به، بل لأن الديون ستدفعه حتماً للمجيء بقدميه إلى قلعتي. فليأخذ الورقة إن استطاع حلّ أقفالي الستة... وسأرى إن كانت قدماه الشابتان ستسبقان غضبي!',
      bodyEn:
        'I named Mark sole heir knowing his debts would force him into my castle. Let us see if youth can outrun my wrath.',
      isOptionalLore: true,
      x: -34.6,
      z: -39.5,
      discovered: false,
    },
  ];
}

/**
 * 6 Physical Architectural Clue Plaques & Wall Boards mounted directly inside the 3D Castle!
 * Players can read them visually with their flashlight OR inspect them up close with [E].
 */
export function createCastleCluePlaques(): CluePlaque[] {
  return [
    {
      id: 'plaque-foyer-1894',
      puzzleId: 'clock',
      roomId: 'foyer',
      roomNameAr: 'البهو الملكي والدرج الكبير',
      titleAr: 'النقش الذهبي لتأسيس القلعة (أمام الدرج الكبير)',
      featuredCode: '1894',
      inscriptionAr:
        'نُقش بماء الذهب أسفل لوحة اللورد فيكتور مالاكور وعند قاعدة الدرج: «شُيّدت هذه القلعة وتأسس مجد العائلة في عام 1894 م».',
      subInscriptionAr:
        'سنة التأسيس المكوّنة من أربعة أرقام من اليسار لليمين: 1 - 8 - 9 - 4',
      interactX: 0,
      interactZ: 30.65,
      discovered: false,
    },
    {
      id: 'plaque-steam-80psi',
      puzzleId: 'valves',
      roomId: 'steam_gallery',
      roomNameAr: 'الرواق المقنطر وغرفة الصمامات',
      titleAr: 'لوحة تحذير كبير المهندسين على المرجل البخاري',
      featuredCode: '3 صمامات = 80 PSI',
      inscriptionAr:
        'تعليمات الأمان الهندسية: «لتحرير مزلاج القبو، افتح ثلاثة (3) صمامات فقط بحيث يستقر ضغط البخار عند 80 PSI تماماً».',
      subInscriptionAr:
        'قيم الصمامات الخمسة المثبتة على الجدار: (+35) ، (+30) ، (+25) ، (-15) ، (+20) PSI',
      interactX: -29.3,
      interactZ: 24.8,
      discovered: false,
    },
    {
      id: 'plaque-bunker-patrol',
      puzzleId: 'monitors',
      roomId: 'security_bunker',
      roomNameAr: 'قبو المراقبة والأرشيف',
      titleAr: 'لوح جدول الدورية الليلية للحراس',
      featuredCode: '١: الرواق ← ٢: المصحة ← ٣: البهو ← ٤: التماثيل',
      inscriptionAr:
        'مخطط مسار الدورية على الشاشات الأربع بالترتيب: ١- الرواق المقنطر ← ٢- المصحة الشرقية ← ٣- البهو الملكي ← ٤- قاعة التماثيل.',
      subInscriptionAr:
        'اضبط الشاشة ١ على كاميرا الرواق، والشاشة ٢ على المصحة، والشاشة ٣ على البهو، والشاشة ٤ على التماثيل.',
      interactX: -26.5,
      interactZ: -8.1,
      discovered: false,
    },
    {
      id: 'plaque-infirmary-19ml',
      puzzleId: 'elixir',
      roomId: 'infirmary',
      roomNameAr: 'المصحة المختبرية الملعونة',
      titleAr: 'لوح المعادلة الكيميائية لطبيب القصر',
      featuredCode: '3 قوارير = 19 مل',
      inscriptionAr:
        'معادلة إذابة الختم الفضي: «امزج ثلاث (3) قوارير كيميائية فقط بحيث يساوي مجموع حجمها 19 مل بالضبط».',
      subInscriptionAr:
        'مقادير القوارير على عربة الجراحة: الزئبق (9 مل) · القرمزي (8 مل) · الكبريت (6 مل) · الفضة (4 مل) · الأثير (3 مل)',
      interactX: 33.8,
      interactZ: -6.5,
      discovered: false,
    },
    {
      id: 'plaque-statues-oath',
      puzzleId: 'statues',
      roomId: 'statue_hall',
      roomNameAr: 'قاعة التماثيل الستة المقنّعة',
      titleAr: 'اللوح الرخامي المنقوش في قاعة التماثيل',
      featuredCode: '١: الديون ← ٢: الميراث ← ٣: الصمت ← ٤: الضريح',
      inscriptionAr:
        'عهد القرابين الأربعة بالترتيب: «أوّلهم حارس الديون، وثانيهم حارس الميراث، وثالثهم حارس الصمت، ورابعهم حارس الضريح».',
      subInscriptionAr:
        'تفحّص الأرقام المنقوشة على قواعد التماثيل الستة (#1 إلى #6) وأشعل شعلاتها الأربع بهذا التسلسل.',
      interactX: 12.1,
      interactZ: -2.0,
      discovered: false,
    },
    {
      id: 'plaque-study-safe',
      puzzleId: 'safe',
      roomId: 'trophy_study',
      roomNameAr: 'مكتب الجد السري وخزنة الميراث',
      titleAr: 'المخطط البصري المحفور بجانب الخزنة',
      featuredCode: 'أعلى اليسار ▶ [ ╱ · ╲ ] ▶ أسفل اليمين',
      inscriptionAr:
        'مخطط العدسات: «يدخل الشعاع الذهبي من أعلى اليسار؛ أدر المرايا المائلة (╱ و ╲) لينعكس المسار ويخرج من مستقبِل القفل أسفل اليمين».',
      subInscriptionAr:
        'اضغط على مربعات الشبكة (3×3) لتبديل زاوية كل مرآة حتى يضيء مسار الليزر بالكامل نحو مخرج القفل.',
      interactX: -18.2,
      interactZ: -39.8,
      discovered: false,
    },
  ];
}

export function createInitialPuzzleStations(): PuzzleStation[] {
  return [
    {
      id: 'clock',
      chapter: 1,
      titleAr: 'ساعة الجد الملعونة',
      titleEn: 'Grandfather Midnight Clock',
      districtAr: 'البهو الملكي والدرج الكبير',
      districtEn: 'Grand Foyer',
      goalAr: 'المطلوب: ضبط الخانات الأربع للقفل الزمني لفتح درج الساعة واستخراج مفتاح الجناح الغربي.',
      x: 7.2,
      z: 29.5,
      rewardItem: 'west_wing_key',
      solved: false,
    },
    {
      id: 'valves',
      chapter: 2,
      titleAr: 'صمامات المرجل البخاري',
      titleEn: 'Arched Gallery Steam Valves',
      districtAr: 'الرواق المقنطر الغربي',
      districtEn: 'Arched Steam Gallery',
      goalAr: 'المطلوب: فتح الصمامات الحديدية المناسبة لموازنة ضغط البخار وفكّ قفل قبو المراقبة.',
      x: -28.0,
      z: 21.5,
      requiredItem: 'west_wing_key',
      rewardItem: 'security_key',
      solved: false,
    },
    {
      id: 'monitors',
      chapter: 3,
      titleAr: 'مصفوفة شاشات المراقبة',
      titleEn: 'Surveillance CRT Matrix',
      districtAr: 'قبو المراقبة والأرشيف',
      districtEn: 'Surveillance Bunker',
      goalAr: 'المطلوب: ضبط القنوات الأربع لشاشات المراقبة لفكّ القفل الإلكتروني للجناح الشرقي.',
      x: -30.5,
      z: -3.5,
      requiredItem: 'security_key',
      rewardItem: 'infirmary_key',
      solved: false,
    },
    {
      id: 'elixir',
      chapter: 4,
      titleAr: 'جهاز الترياق الكيميائي',
      titleEn: 'Apothecary Elixir Mixer',
      districtAr: 'المصحة المختبرية الملعونة',
      districtEn: 'Cursed Infirmary',
      goalAr: 'المطلوب: دمج القوارير الكيميائية بالمقدار الصحيح لإذابة الختم الفضي واستلام المفتاح.',
      x: 30.5,
      z: -6.5,
      requiredItem: 'infirmary_key',
      rewardItem: 'statue_hall_key',
      secondaryRewardItem: 'silver_lens',
      solved: false,
    },
    {
      id: 'statues',
      chapter: 5,
      titleAr: 'طقس التماثيل الستة المقنّعة',
      titleEn: 'Six Veiled Statues Offering',
      districtAr: 'قاعة التماثيل الستة',
      districtEn: 'Hall of Six Veiled Statues',
      goalAr: 'المطلوب: إشعال أوعية القرابين لأربعة تماثيل بالتسلسل الطقسي الصحيح لفتح مكتب الجد.',
      x: 0,
      z: -8.5,
      requiredItem: 'statue_hall_key',
      rewardItem: 'study_key',
      solved: false,
    },
    {
      id: 'safe',
      chapter: 6,
      titleAr: 'خزنة المرايا البصرية',
      titleEn: "Grandfather's Royal Mirror Safe",
      districtAr: 'مكتب الجد السري',
      districtEn: "Grandfather's Trophy Study",
      goalAr: 'المطلوب: تدوير المرايا الداخلية لتوصيل شعاع الضوء من المدخل إلى قفل الخزنة.',
      x: -22.5,
      z: -36.5,
      requiredItem: 'study_key',
      rewardItem: 'crypt_key',
      solved: false,
    },
  ];
}

// ============================================================================
// Pure Deterministic Validators for All 6 Castle Puzzles
// ============================================================================

export const TARGET_CLOCK_DIGITS = [1, 8, 9, 4] as const;

export function validateGrandfatherClock(digits: readonly [number, number, number, number]): boolean {
  return (
    digits[0] === TARGET_CLOCK_DIGITS[0] &&
    digits[1] === TARGET_CLOCK_DIGITS[1] &&
    digits[2] === TARGET_CLOCK_DIGITS[2] &&
    digits[3] === TARGET_CLOCK_DIGITS[3]
  );
}

export const STEAM_VALVES = [
  { id: 'v0', psi: 35, labelAr: 'الصمام ١ · أنبوب المرجل (+35 PSI)' },
  { id: 'v1', psi: 30, labelAr: 'الصمام ٢ · أنبوب القبو (+30 PSI)' },
  { id: 'v2', psi: 25, labelAr: 'الصمام ٣ · أنبوب القنطرة (+25 PSI)' },
  { id: 'v3', psi: -15, labelAr: 'الصمام ٤ · صمام التفريغ (-15 PSI)' },
  { id: 'v4', psi: 20, labelAr: 'الصمام ٥ · أنبوب البهو (+20 PSI)' },
] as const;

export function computeSteamPressure(openFlags: readonly boolean[]): {
  psi: number;
  openCount: number;
  solved: boolean;
} {
  let psi = 0;
  let openCount = 0;
  for (let i = 0; i < STEAM_VALVES.length; i++) {
    if (openFlags[i]) {
      psi += STEAM_VALVES[i].psi;
      openCount++;
    }
  }
  return {
    psi,
    openCount,
    solved: openCount === 3 && psi === 80,
  };
}

export const MONITOR_CHANNEL_LABELS = [
  { ch: 1, nameAr: 'قناة ١ · كاميرا البهو الملكي' },
  { ch: 2, nameAr: 'قناة ٢ · كاميرا الرواق المقنطر' },
  { ch: 3, nameAr: 'قناة ٣ · كاميرا قاعة التماثيل' },
  { ch: 4, nameAr: 'قناة ٤ · كاميرا المصحة الشرقية' },
] as const;

export const TARGET_MONITOR_CHANNELS = [2, 4, 1, 3] as const;

export function validateSecurityMonitors(channels: readonly [number, number, number, number]): boolean {
  return (
    channels[0] === TARGET_MONITOR_CHANNELS[0] &&
    channels[1] === TARGET_MONITOR_CHANNELS[1] &&
    channels[2] === TARGET_MONITOR_CHANNELS[2] &&
    channels[3] === TARGET_MONITOR_CHANNELS[3]
  );
}

export const ELIXIR_VIALS = [
  { id: 'mercury', ml: 9, nameAr: 'قارورة الزئبق الأزرق (9 مل)' },
  { id: 'crimson', ml: 8, nameAr: 'مصل القرمزي المركز (8 مل)' },
  { id: 'sulfur', ml: 6, nameAr: 'محلول الكبريت الأصفر (6 مل)' },
  { id: 'silver', ml: 4, nameAr: 'مستخلص الفضة النقية (4 مل)' },
  { id: 'ether', ml: 3, nameAr: 'قطرات الأثير المخدّر (3 مل)' },
] as const;

export function evaluateElixirMix(selectedFlags: readonly boolean[]): {
  totalMl: number;
  count: number;
  solved: boolean;
} {
  let totalMl = 0;
  let count = 0;
  for (let i = 0; i < ELIXIR_VIALS.length; i++) {
    if (selectedFlags[i]) {
      totalMl += ELIXIR_VIALS[i].ml;
      count++;
    }
  }
  return {
    totalMl,
    count,
    solved: count === 3 && totalMl === 19,
  };
}

export const VEILED_STATUES = [
  { num: 1, nameAr: 'تمثال ١ · حارس الديون', freq: 392.0 },
  { num: 2, nameAr: 'تمثال ٢ · حارس الصمت', freq: 329.63 },
  { num: 3, nameAr: 'تمثال ٣ · حارس الرماد', freq: 349.23 },
  { num: 4, nameAr: 'تمثال ٤ · حارس الميراث', freq: 440.0 },
  { num: 5, nameAr: 'تمثال ٥ · حارس الظل', freq: 311.13 },
  { num: 6, nameAr: 'تمثال ٦ · حارس الضريح', freq: 523.25 },
] as const;

export const TARGET_STATUE_SEQUENCE = [1, 4, 2, 6] as const;

export function validateStatueOffering(sequence: readonly number[]): boolean {
  if (sequence.length !== TARGET_STATUE_SEQUENCE.length) return false;
  for (let i = 0; i < TARGET_STATUE_SEQUENCE.length; i++) {
    if (sequence[i] !== TARGET_STATUE_SEQUENCE[i]) return false;
  }
  return true;
}

export interface BeamStepVisit {
  r: number;
  c: number;
  inDr: number;
  inDc: number;
  outDr: number;
  outDc: number;
}

export interface BeamTraceResult {
  visitedCells: BeamStepVisit[];
  solved: boolean;
}

export const INITIAL_SAFE_GRID: readonly number[] = [
  0, 1, 2,
  2, 2, 1,
  1, 0, 1,
];

export function traceSafeLaserBeam(grid: readonly number[]): BeamTraceResult {
  const visited: BeamStepVisit[] = [];
  let r = 0;
  let c = 0;
  let dr = 0;
  let dc = 1;

  for (let step = 0; step < 18; step++) {
    if (r < 0 || r >= 3 || c < 0 || c >= 3) break;
    const inDr = dr;
    const inDc = dc;
    const cell = grid[r * 3 + c];
    if (cell === 1) {
      const nextDr = -dc;
      const nextDc = -dr;
      dr = nextDr;
      dc = nextDc;
    } else if (cell === 2) {
      const nextDr = dc;
      const nextDc = dr;
      dr = nextDr;
      dc = nextDc;
    }
    visited.push({ r, c, inDr, inDc, outDr: dr, outDc: dc });
    r += dr;
    c += dc;
  }

  return {
    visitedCells: visited,
    solved: r === 2 && c === 3 && dr === 0 && dc === 1,
  };
}
