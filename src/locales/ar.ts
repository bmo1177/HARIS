import type { MessageKey } from "./en";

/**
 * Arabic translations.
 *
 * Typed as `Record<MessageKey, string>`, so any key added to `en.ts` and
 * forgotten here fails the build rather than silently rendering English to an
 * Arabic-speaking student.
 *
 * Tone: Modern Standard Arabic, addressed to a teenager — direct and plain, not
 * the formal register of a textbook. Latin digits are kept in the UI (see
 * `formatNumber` in `lib/i18n.tsx`) because they read faster for numbers that
 * carry meaning in a security context.
 */
export const ar: Record<MessageKey, string> = {
  "nav.home": "الرئيسية",
  "nav.scenarios": "السيناريوهات",
  "nav.voiceLab": "المكالمات",
  "nav.about": "عن هاريس",
  "nav.main": "القائمة الرئيسية",
  "nav.toggleTheme": "تبديل المظهر",
  "nav.switchToDark": "التبديل إلى المظهر الداكن",
  "nav.switchToLight": "التبديل إلى المظهر الفاتح",
  "nav.switchToArabic": "التبديل إلى العربية",
  "nav.switchToEnglish": "التبديل إلى الإنجليزية",

  "xp.level": "المستوى {level}",
  "xp.total": "{xp} نقطة",
  "xp.progress": "تقدم المستوى {level}",
  "xp.maxLevel": "المستوى {level}، وقد وصلت لأعلى مستوى",
  "xp.earned": "+{amount} نقطة",
  "xp.levelUp": "ترقية مستوى",

  "level.0": "مبتدئ رقمي",
  "level.1": "كاشف الاحتيال",
  "level.2": "صائد التهديدات",
  "level.3": "حارس إلكتروني",
  "level.4": "نخبة هاريس",

  "analyzer.title": "وصلتك رسالة مشبوهة؟",
  "analyzer.subtitle": "الصقها بالأسفل. هاريس يحللها ويشرح لك بالضبط ما هي.",
  "analyzer.tagline": "درّب حدسك. تفوّق على التهديدات.",
  "analyzer.label": "الصق رسالة مشبوهة",
  "analyzer.placeholder":
    "الصق أي رسالة مشبوهة هنا — رسالة نصية، واتساب، بريد إلكتروني، أو محادثة خاصة... (بالعربية أو الإنجليزية)",
  "analyzer.counter": "{count} / {max}",
  "analyzer.tooLong": "الرسالة طويلة — {count} حرف. اختصرها إلى {max} أو أقل.",
  "analyzer.tryExample": "جرّب مثالاً:",
  "analyzer.submit": "حلّل بهاريس",
  "analyzer.submitting": "هاريس يحلل...",
  "analyzer.step1": "الصق الرسالة",
  "analyzer.step2": "هاريس يقيّم التهديد",
  "analyzer.step3": "اكتشف نوعها عبر القرائن",
  "example.fakePrize": "جائزة وهمية",
  "example.phishingLink": "رابط تصيّد",
  "example.safeMessage": "رسالة آمنة",
  "example.gamingScam": "احتيال ألعاب",

  "results.whyFlagged": "لماذا رصد هاريس هذه الرسالة",
  "results.doNotClick": "لا تضغط على أي رابط في هذه الرسالة!",
  "results.english": "English",
  "results.arabic": "العربية",
  "results.revealClue": "اكشف القرينة {n}",
  "results.clue": "القرينة {n}",
  "results.analyzeAnother": "حلّل رسالة أخرى",

  "guess.title": "ما نوع هذا الهجوم؟ خمّن!",
  "guess.placeholder": "ما نوع هذا الهجوم؟",
  "guess.label": "تخمينك لنوع الهجوم",
  "guess.submit": "إرسال",
  "guess.retry": "ليس تماماً — حاول مرة أخرى (بقي {count} {unit})",
  "guess.attempt": "محاولة",
  "guess.attempts": "محاولات",
  "guess.correct": "إجابة صحيحة! هذا {type}",
  "guess.revealed": "هذا {type}! لا تقلق — صرت تعرفه الآن.",
  "guess.explanationBelow": "الشرح الكامل بالأسفل.",
  "guess.nothingToGuess":
    "لا شيء تخمّنه هنا. لم تظهر في الرسالة أي مؤشرات هجوم — ملاحظتها هي المهارة نفسها. جرّب رسالة تشك أنها عدائية وشاهد ما يرصده هاريس.",

  "scenarios.title": "محاكي السيناريوهات",
  "scenarios.subtitle": "عش تجربة هجوم حقيقي. اتخذ القرارات الصحيحة. اكسب النقاط.",
  "scenarios.available": "يتوفر {count} سيناريو و{calls} مكالمة صوتية اليوم.",
  "scenarios.upToXp": "حتى {xp} نقطة",
  "scenarios.back": "رجوع",
  "scenarios.step": "الخطوة {current} من {total}",
  "scenarios.seeResults": "شاهد النتيجة",
  "scenarios.nextStep": "الخطوة التالية",
  "scenarios.evaluating": "هاريس يقيّم قرارك...",
  "scenarios.redFlags": "علامات تحذير لتتذكرها:",
  "scenarios.tryAnother": "جرّب سيناريو آخر",
  "scenarios.testReal": "جرّب رسالة حقيقية",
  "scenarios.caught": "التقطتها!",
  "scenarios.missed": "فاتتك: {reason}",
  "scenarios.overFlagged": "حدسك جيد، لكن هذه الرسالة كانت آمنة.",
  "scenarios.perfect": "علامة كاملة! أنت جدار بشري.",
  "scenarios.strong": "حدسك قوي! خطأ واحد — راجع ما فاتك.",
  "scenarios.gettingThere": "أنت تتحسن. كاد المحتالون ينجحون معك.",
  "scenarios.fooled": "كان هذا السيناريو سيخدعك — لكن ليس بعد اليوم.",
  "scenarios.scoreTitle": "{safe}/{total} قرارات آمنة",
  "scenarios.scoreXp": "+{xp} نقطة",

  "voice.title": "مختبر المكالمات",
  "voice.subtitle": "استمع إلى مكالمة احتيال حقيقية. ضع علامة على المؤشرات فوراً. درّب أذنك.",
  "voice.redFlagCount": "{count} علامات تحذير",
  "voice.answer": "ردّ على المكالمة",
  "voice.endCall": "أنهاء المكالمة",
  "voice.flag": "علامة — مشبوهة!",
  "voice.flagged": "تم وضع العلامة",
  "voice.instructions":
    "ردّ على المكالمة. اضغط «علامة» في اللحظة التي تشعر فيها أن جملة ما غير طبيعية — لن تُخبَر إن كنت على صواب إلا في التقرير النهائي.",
  "voice.unsupported": "هذا المتصفح لا يستطيع قراءة المكالمة صوتياً. جرّب Chrome أو Edge أو Safari.",
  "voice.skipToDebrief": "تخطَّ إلى التقرير",
  "voice.debrief": "تقرير المكالمة",
  "voice.caught": "التقطت {caught} من {total} من علامات التحذير.",
  "voice.writingDebrief": "هاريس يكتب تقريرك...",
  "voice.tryAnother": "جرّب مكالمة أخرى",
  "voice.goToScenarios": "إلى السيناريوهات",
  "voice.line": "الجملة {current} من {total}",
  "voice.callProgress": "تقدّم المكالمة",

  "difficulty.Beginner": "مبتدئ",
  "difficulty.Intermediate": "متوسط",
  "difficulty.Advanced": "متقدّم",

  "about.title": "عن هاريس",
  "about.builtFor": "صُمّم للطلاب",
  "about.body":
    "هاريس منصة توعية أمنية سيبراني مصممة لطلاب المرحلة الثانوية. في عالم يواجه فيه المراهقون تهديدات عبر الإنترنت يومياً — عبر وسائل التواصل والألعاب وتطبيقات الرسائل والعروض المزيفة — يدرّب هاريس حدسهم الحقيقي من خلال تحليل ذكي وسيناريوهات تفاعلية ومكالمات صوتية.",
  "about.threeWays": "ثلاث طرق للتعلّم",
  "about.analyzerTitle": "محلّل الرسائل",
  "about.analyzerDesc": "الصق أي رسالة مشبوهة واكتشف عبر القرائن نوع الهجوم الذي تخفيه.",
  "about.scenariosTitle": "محاكي السيناريوهات",
  "about.scenariosDesc": "عش سيناريوهات هجمات واقعية. اتخذ القرار. تعلّم من كل خطوة.",
  "about.voiceTitle": "مختبر المكالمات",
  "about.voiceDesc": "استمع لمكالمات تصيّد بالعربية والإنجليزية. ضع العلامات فوراً. درّب أذنك.",
  "about.howItTeaches": "كيف يعلّم هاريس",
  "about.teachesBody1":
    "بدلاً من أن يلقي هاريس محاضرة عن التهديدات، يجعل الطالب يكتشفها بنفسه. كل تحليل يكشف قرينة واحدة في كل مرة، فيكوّن الطالب فرضيته قبل أن يرى الحكم. أما السيناريوهات والمكالمات ف تضع القرار بيده، ويصله التقييم فوراً بينما التفكير ما زال حاضراً.",
  "about.teachesBody2":
    "الهدف أن تصبح المهارة تلقائية: لا «هاريس قال إن هذه رسالة احتيال» بل «لاحظت الاستعجال وقناة الدفع، فتوقفت».",
  "about.threatTypes": "أنواع التهديدات المدعومة",

  // Attack-type names are left in English on purpose: these are the labels the
  // model itself returns in `attack_type`, and translating only the UI copy
  // would leave a student unable to match what they read to what HARIS said.
  "threat.phishing": "Phishing",
  "threat.vishing": "Vishing",
  "threat.smishing": "Smishing",
  "threat.fakeGiveaways": "Fake Giveaways",
  "threat.gamingScams": "Gaming Scams",
  "threat.socialEngineering": "Social Engineering",
  "threat.strangerDanger": "Stranger Danger",
  "threat.safeMessages": "Safe Messages",

  "notFound.title": "هذه الصفحة غير موجودة",
  "notFound.body": "قد يكون الرابط قديماً، أو قد يكون في العنوان خطأ مطبعي. لم تفقد شيئاً — نقاطك محفوظة على هذا الجهاز.",
  "notFound.home": "حلّل رسالة",
  "notFound.scenarios": "تصفّح السيناريوهات",

  "error.title": "حدث خطأ ما",
  "error.body": "توقف هاريس بسبب خطأ غير متوقع. نقاطك محفوظة — وهي مخزّنة على هذا الجهاز.",
  "error.retry": "حاول مرة أخرى",
  "error.reload": "أعد تحميل الصفحة",

  "setup.title": "هارس يحتاج متغيّرات البيئة",
  "setup.body": "تعذّر تشغيل التطبيق لأن هذه المتغيّرات غير مضبوطة:",
  "setup.step1": "انسخ .env.example إلى .env",
  "setup.step2":
    "املأ VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY من مشروع Supabase (إعدادات المشروع ← API)",
  "setup.step3": "أعد تشغيل خادم التطوير",
  "setup.backend":
    "يحتاج الخادم أيضاً إلى LLM_API_KEY و SUPABASE_SERVICE_ROLE_KEY كأسرار لدوال الحافة. راجع supabase/README.md.",
};
