import type { HarisErrorCode } from "@/lib/api";
import type { AnalysisResult } from "@/types/analysis";

/**
 * A rule-based analyser for when the edge functions cannot be reached.
 *
 * The deployed Supabase project is a separate system with its own failure
 * modes: it can be paused, deleted, rate-limited, or missing a secret. When
 * that happens the analyzer used to stop at "Could not reach HARIS", which
 * turns a lesson into a blank screen. This keeps the exercise running.
 *
 * It is deliberately not a model. It is a small, inspectable set of signals —
 * links, credential requests, pressure, payment, impersonation — that a
 * student can read and disagree with. The result is labelled in the UI so a
 * rule-based verdict is never presented as an AI one, and the model path is
 * always tried first.
 *
 * The Arabic patterns are substring checks rather than regexes: JavaScript's
 * `\b` is ASCII-only, so a word boundary around Arabic text does not do what
 * it looks like it does.
 */

const FALLBACK_CODES: ReadonlySet<HarisErrorCode> = new Set([
  "network_error",
  "timeout",
  "service_unavailable",
  "provider_unauthorized",
  "upstream_error",
  "internal_error",
  "invalid_response",
]);

/** Codes where the lesson can continue locally. A rate limit cannot. */
export const shouldAnalyzeLocally = (code: HarisErrorCode): boolean =>
  FALLBACK_CODES.has(code);

const SCORE = { none: 5, medium: 45, high: 85 } as const;
type Band = keyof typeof SCORE;

interface Clue {
  en: string;
  ar: string;
}

interface Finding {
  id: string;
  weight: number;
  labelEn: string;
  labelAr: string;
  clueEn: string;
  clueAr: string;
}

interface LinkInfo {
  host: string;
  risk: 1 | 2 | 3;
  kind: "plain" | "lookalike" | "shortener" | "ip" | "tld" | "hyphen";
  tld: string;
}

const TLDS = new Set([
  "com",
  "net",
  "org",
  "io",
  "co",
  "ly",
  "info",
  "xyz",
  "top",
  "click",
  "link",
  "live",
  "icu",
  "cam",
  "rest",
  "monster",
  "sbs",
  "cfd",
  "buzz",
  "quest",
  "surf",
  "bar",
  "review",
  "online",
  "site",
  "website",
  "space",
  "store",
  "shop",
  "pro",
  "biz",
  "app",
  "dev",
  "me",
  "ai",
  "edu",
  "gov",
  "uk",
  "de",
  "sa",
  "ae",
  "us",
  "ca",
  "fr",
  "au",
  "in",
]);

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "link",
  "live",
  "icu",
  "cam",
  "rest",
  "monster",
  "sbs",
  "cfd",
  "buzz",
  "quest",
  "surf",
  "bar",
  "review",
]);

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "is.gd",
  "shorturl.at",
]);

const BRANDS: Record<string, readonly string[]> = {
  paypal: ["paypal.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com"],
  apple: ["apple.com", "icloud.com"],
  google: ["google.com", "gmail.com"],
  amazon: ["amazon.com"],
  netflix: ["netflix.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com"],
  whatsapp: ["whatsapp.com"],
  linkedin: ["linkedin.com"],
  github: ["github.com"],
  playstation: ["playstation.com"],
  xbox: ["xbox.com"],
  spotify: ["spotify.com"],
  dropbox: ["dropbox.com"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  coinbase: ["coinbase.com"],
  binance: ["binance.com"],
  metamask: ["metamask.io"],
};

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>"'()]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s<>"'()]*)?/gi;
const IP_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;

const CREDENTIAL =
  /\b(?:password|passcode|credentials?|log\s?in|sign\s?in|re-?verify|verify (?:your )?(?:account|identity|email)|one[-\s]?time (?:code|password)|otp|2fa|mfa|seed phrase|recovery phrase|bank details|card number|cvv|national id|social security|date of birth)\b/i;
const URGENCY =
  /\b(?:(?:24|48|72)\s?-?\s?hours?|within \d+\s?(?:hours?|minutes?|days?)|immediately|urgent|final (?:warning|notice)|act now|expires? (?:today|soon)|last chance|today only|right away)\b/i;
const THREAT =
  /\b(?:disabled|suspended|closed|terminated|blocked|legal action|penalt(?:y|ies)|lose (?:access|your account)|account will be)\b/i;
const PRIZE = /\b(?:prize|winner|won|free|gift card|lottery|giveaway)\b/i;
const PAYMENT =
  /(?:\b(?:payment|wire transfer|shipping fee|delivery fee|refund|invoice|bitcoin|crypto|usdt)\b|\$\s?\d+|\b\d+\s?(?:usd|dollars?)\b)/i;
const AUTHORITY =
  /\b(?:it (?:helpdesk|department|support)|helpdesk|bank|university|college|police|government|tax (?:office|authority)|hr|payroll|courier|delivery|parcel|microsoft|apple|amazon|paypal|netflix|linkedin)\b/i;
const SECRECY =
  /\b(?:do not tell|don't tell|keep (?:this )?(?:secret|confidential)|between us|no one else)\b/i;
const ATTACHMENT =
  /\b(?:attachment|attached (?:file|document)|download|open the file|enable macros|\.exe|\.zip)\b/i;
const CTA =
  /\b(?:click|claim|verify|confirm|update|reply|send|download|open|sign in|log in|re-?enter|follow (?:this|the) link)\b/i;
const JOB =
  /\b(?:hiring|job offer|recruiter|remote (?:role|position)|salary|per hour|per month|apply now|cv|resume)\b/i;

const ARABIC = {
  credential: [
    "كلمة المرور",
    "كلمة السر",
    "بيانات الدخول",
    "رمز التحقق",
    "رقم الهوية",
    "بطاقة الائتمان",
    "بيانات البنك",
    "تاريخ الميلاد",
    "أعد التحقق",
    "تحقق من حسابك",
  ],
  urgency: [
    "خلال 24 ساعة",
    "خلال 48 ساعة",
    "فوراً",
    "فورا",
    "عاجل",
    "آخر فرصة",
    "ينتهي",
    "اليوم فقط",
    "حالاً",
    "حالا",
  ],
  threat: [
    "سيتم تعطيل",
    "سيتم إيقاف",
    "سيتم إغلاق",
    "سيُغلق",
    "معلّق",
    "محظور",
    "حظر",
    "ستفقد",
  ],
  prize: ["جائزة", "ربحت", "مجاناً", "مجانا", "مكافأة", "سحب"],
  payment: ["رسوم", "دفع", "تحويل", "فاتورة", "استرداد", "دولار", "محفظة"],
  authority: [
    "قسم تقنية المعلومات",
    "الدعم الفني",
    "البنك",
    "الجامعة",
    "الشرطة",
    "الحكومة",
    "التوصيل",
    "الشحن",
    "الموارد البشرية",
  ],
  secrecy: ["لا تخبر", "لا تقل", "بيننا", "سراً", "سرا"],
  attachment: ["مرفق", "حمّل", "حمل الملف", "افتح الملف", "تنزيل"],
  cta: ["اضغط", "أرسل", "سجّل الدخول", "سجل الدخول", "أكد", "تحقق"],
  job: ["وظيفة", "توظيف", "راتب", "سيرة ذاتية", "مقابلة", "عرض عمل"],
} as const;

const NO_LINK: Clue = {
  en: "There is no link to click, so there is no page to verify.",
  ar: "لا يوجد رابط للضغط عليه، لذا لا توجد صفحة تحتاج إلى التحقق.",
};
const LINK_ALONE: Clue = {
  en: "There is a link. A link alone is not evidence of an attack, but reach the organisation's site yourself rather than through it.",
  ar: "هناك رابط. الرابط وحده ليس دليلاً على هجوم، لكن افتح موقع الجهة بنفسك بدلاً من اتباعه.",
};
const NO_CREDENTIALS: Clue = {
  en: "It does not ask for a password, one-time code or identity document.",
  ar: "لا تطلب كلمة مرور أو رمزاً لمرة واحدة أو وثيقة هوية.",
};
const NO_PRESSURE: Clue = {
  en: "There is no deadline, threat or secrecy demand pushing you to act.",
  ar: "لا يوجد موعد نهائي أو تهديد أو طلب سرية يدفعك للتصرف.",
};
const PLAIN: Clue = {
  en: "It reads like routine logistics — a time, a place, a document — with nothing to gain by replying.",
  ar: "تبدو كترتيبات روتينية — وقت ومكان ووثيقة — ولا شيء يُكسب من الرد.",
};
const CAVEAT: Clue = {
  en: "A safe verdict is not a guarantee. If it concerns an account, open the app yourself.",
  ar: "الحكم بالسلامة ليس ضماناً. إن كانت الرسالة تخص حساباً، فافتح التطبيق بنفسك.",
};
const VERIFY: Clue = {
  en: "Verify through a channel you already trust: the official app, a saved number, or a person you can name.",
  ar: "تحقّق عبر قناة تثق بها أصلاً: التطبيق الرسمي، أو رقم محفوظ، أو شخص تعرفه بالاسم.",
};
const OFFICIAL: Clue = {
  en: "Start from the organisation's own site or app rather than from the message.",
  ar: "ابدأ من موقع الجهة أو تطبيقها الرسمي، لا من الرسالة.",
};
const REPORT: Clue = {
  en: "If it names your institution or employer, report it — that is how the next person gets warned.",
  ar: "إن ذكرت الرسالة جامعتك أو جهة عملك، فأبلغ عنها؛ هكذا يُنبَّه الشخص التالي.",
};

const snippet = (value: string): string =>
  value.replace(/\s+/g, " ").trim().slice(0, 56);

const firstArabic = (words: readonly string[], message: string): string =>
  words.find((word) => message.includes(word)) ?? "";

function hostOf(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, "")
    .toLowerCase();
}

function hostsIn(message: string): string[] {
  const hosts: string[] = [];
  for (const raw of message.match(URL_PATTERN) ?? []) {
    const host = hostOf(raw);
    if (!host) continue;
    const labels = host.split(".");
    const tld = labels[labels.length - 1];
    if (!IP_HOST.test(host) && !TLDS.has(tld)) continue;
    if (!hosts.includes(host)) hosts.push(host);
  }
  return hosts;
}

function classifyHost(host: string): LinkInfo {
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  if (IP_HOST.test(host)) return { host, risk: 3, kind: "ip", tld };
  if (SHORTENERS.has(host)) return { host, risk: 3, kind: "shortener", tld };
  if (SUSPICIOUS_TLDS.has(tld)) return { host, risk: 2, kind: "tld", tld };

  for (const [brand, official] of Object.entries(BRANDS)) {
    if (!labels.some((label) => label.includes(brand))) continue;
    const isOfficial = official.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    if (!isOfficial) return { host, risk: 3, kind: "lookalike", tld };
  }

  const words = labels
    .slice(0, -1)
    .flatMap((label) => label.split("-"))
    .filter(Boolean);
  if (words.length >= 3 && words.some((word) => word.length >= 4)) {
    return { host, risk: 2, kind: "hyphen", tld };
  }
  return { host, risk: 1, kind: "plain", tld };
}

function linkClue(link: LinkInfo): { labelEn: string; labelAr: string } & Clue {
  switch (link.kind) {
    case "lookalike":
      return {
        labelEn: "a disguised link",
        labelAr: "رابط متنكّر",
        en: `The link goes to ${link.host}, which borrows a familiar name without being that organisation's domain.`,
        ar: `الرابط يؤدي إلى ${link.host}، وهو يستعير اسماً مألوفاً من دون أن يكون نطاق الجهة نفسها.`,
      };
    case "shortener":
      return {
        labelEn: "a shortened link",
        labelAr: "رابط مختصر",
        en: `The link is shortened (${link.host}), so the real destination is hidden until you click.`,
        ar: `الرابط مختصر (${link.host})، لذا الوجهة الحقيقية مخفية حتى تضغط.`,
      };
    case "ip":
      return {
        labelEn: "a raw IP link",
        labelAr: "رابط بعنوان IP",
        en: `The link is a raw IP address (${link.host}), not a domain an organisation would ask you to use.`,
        ar: `الرابط عنوان IP مباشر (${link.host})، وليس نطاقاً تطلب منك جهة رسمية استخدامه.`,
      };
    case "tld":
      return {
        labelEn: "a disposable domain",
        labelAr: "نطاق مؤقت",
        en: `The domain ends in .${link.tld}, a cheap extension common in throwaway phishing sites.`,
        ar: `النطاق ينتهي بـ .${link.tld}، وهو امتداد رخيص شائع في مواقع التصيّد المؤقتة.`,
      };
    case "hyphen":
      return {
        labelEn: "a padded domain",
        labelAr: "نطاق مزدحم بالكلمات",
        en: `The domain ${link.host} strings several words together, a common way to look close to a real name.`,
        ar: `النطاق ${link.host} يجمع عدة كلمات، وهي طريقة شائعة للاقتراب من اسم حقيقي.`,
      };
    default:
      return {
        labelEn: "a link",
        labelAr: "رابط",
        en: `The message contains a link to ${link.host}. Reach the organisation from its own site rather than from the link.`,
        ar: `تحتوي الرسالة على رابط إلى ${link.host}. افتح موقع الجهة بنفسك بدلاً من اتباع الرابط.`,
      };
  }
}

/**
 * Analyse a message without a model.
 *
 * The score is not shown to the student; it only chooses the band, exactly as
 * the server does with the model's categorical answer.
 */
export function analyzeLocally(message: string): AnalysisResult {
  const findings: Finding[] = [];
  let score = 0;

  // Each finding is added at most once: every rule below runs once, and the
  // rules are keyed by distinct ids. An earlier `some` guard here was dead.
  const add = (finding: Finding) => {
    findings.push(finding);
    score += finding.weight;
  };

  const link = hostsIn(message).map(classifyHost).sort((a, b) => b.risk - a.risk)[0];
  if (link) {
    const clue = linkClue(link);
    add({
      id: "link",
      weight: link.risk,
      labelEn: clue.labelEn,
      labelAr: clue.labelAr,
      clueEn: clue.en,
      clueAr: clue.ar,
    });
  }

  const credentialMatch = message.match(CREDENTIAL);
  const credentialWord = firstArabic(ARABIC.credential, message);
  if (credentialMatch || credentialWord) {
    const detail = snippet(credentialMatch?.[0] ?? credentialWord);
    add({
      id: "credential",
      weight: 3,
      labelEn: "a credential request",
      labelAr: "طلب بيانات دخول",
      clueEn: `It asks for credentials or identity data ("${detail}"). That is how accounts are taken over.`,
      clueAr: `تطلب بيانات دخول أو هوية ("${detail}"). هكذا تُستولى على الحسابات.`,
    });
  }

  const urgencyMatch = message.match(URGENCY);
  const urgencyWord = firstArabic(ARABIC.urgency, message);
  if (urgencyMatch || urgencyWord) {
    const detail = snippet(urgencyMatch?.[0] ?? urgencyWord);
    add({
      id: "urgency",
      weight: 1,
      labelEn: "a deadline",
      labelAr: "موعد نهائي",
      clueEn: `It sets a deadline ("${detail}") to stop you checking.`,
      clueAr: `تضع موعداً نهائياً ("${detail}") لتمنعك من التحقق.`,
    });
  }

  const threatMatch = message.match(THREAT);
  const threatWord = firstArabic(ARABIC.threat, message);
  if (threatMatch || threatWord) {
    const detail = snippet(threatMatch?.[0] ?? threatWord);
    add({
      id: "threat",
      weight: 3,
      labelEn: "a threat",
      labelAr: "تهديد",
      clueEn: `It threatens loss of access or money ("${detail}") if you do not comply.`,
      clueAr: `تهدد بفقدان الوصول أو المال ("${detail}") إن لم تستجب.`,
    });
  }

  const prizeMatch = message.match(PRIZE);
  const prizeWord = firstArabic(ARABIC.prize, message);
  if (prizeMatch || prizeWord) {
    const detail = snippet(prizeMatch?.[0] ?? prizeWord);
    add({
      id: "prize",
      weight: 3,
      labelEn: "a prize offer",
      labelAr: "عرض جائزة",
      clueEn: `It offers a prize or something free ("${detail}"). Unsolicited winnings are the oldest opening there is.`,
      clueAr: `تعرض جائزة أو شيئاً مجانياً ("${detail}"). المكاسب غير المطلوبة أقدم مدخل للاحتيال.`,
    });
  }

  const paymentMatch = message.match(PAYMENT);
  const paymentWord = firstArabic(ARABIC.payment, message);
  if (paymentMatch || paymentWord) {
    const detail = snippet(paymentMatch?.[0] ?? paymentWord);
    add({
      id: "payment",
      weight: 3,
      labelEn: "a payment request",
      labelAr: "طلب دفع",
      clueEn: `It introduces money ("${detail}"). A fee, refund or transfer is a common way to make the request concrete.`,
      clueAr: `تذكر مالاً ("${detail}"). الرسوم أو الاسترداد أو التحويل طريقة شائعة لجعل الطلب ملموساً.`,
    });
  }

  const authorityMatch = message.match(AUTHORITY);
  const authorityWord = firstArabic(ARABIC.authority, message);
  if (authorityMatch || authorityWord) {
    const detail = snippet(authorityMatch?.[0] ?? authorityWord);
    add({
      id: "authority",
      weight: 1,
      labelEn: "an authority claim",
      labelAr: "انتحال صفة جهة",
      clueEn: `It claims to be ${detail}. Impersonating authority is cheaper than compromising it.`,
      clueAr: `تدّعي أنها ${detail}. انتحال الهوية أرخص من اختراقها.`,
    });
  }

  const secrecyMatch = message.match(SECRECY);
  const secrecyWord = firstArabic(ARABIC.secrecy, message);
  if (secrecyMatch || secrecyWord) {
    const detail = snippet(secrecyMatch?.[0] ?? secrecyWord);
    add({
      id: "secrecy",
      weight: 2,
      labelEn: "a secrecy demand",
      labelAr: "طلب سرية",
      clueEn: `It asks you to keep it secret ("${detail}"), which isolates you from anyone who could check it.`,
      clueAr: `تطلب منك إبقاء الأمر سراً ("${detail}")، وهذا يعزلك عمن يستطيع التحقق.`,
    });
  }

  const attachmentMatch = message.match(ATTACHMENT);
  const attachmentWord = firstArabic(ARABIC.attachment, message);
  if (attachmentMatch || attachmentWord) {
    const detail = snippet(attachmentMatch?.[0] ?? attachmentWord);
    add({
      id: "attachment",
      weight: 1,
      labelEn: "an attachment",
      labelAr: "مرفق",
      clueEn: `It asks you to open or download something ("${detail}"). Files can carry the payload a link would.`,
      clueAr: `تطلب منك فتح أو تنزيل شيء ("${detail}"). الملفات قد تحمل ما يحمله الرابط.`,
    });
  }

  const ctaMatch = message.match(CTA);
  const ctaWord = firstArabic(ARABIC.cta, message);
  if (ctaMatch || ctaWord) {
    add({
      id: "cta",
      weight: 1,
      labelEn: "a call to action",
      labelAr: "طلب إجراء",
      clueEn: "It asks you to act inside the message rather than through a channel you chose.",
      clueAr: "تطلب منك التصرف داخل الرسالة بدلاً من قناة اخترتها بنفسك.",
    });
  }

  const jobMatch = message.match(JOB);
  const jobWord = firstArabic(ARABIC.job, message);
  if (jobMatch || jobWord) {
    add({
      id: "job",
      weight: 1,
      labelEn: "a job offer",
      labelAr: "عرض عمل",
      clueEn: "It offers a role and wants identity or bank details before a proper interview.",
      clueAr: "تعرض وظيفة وتطلب بيانات هوية أو بنك قبل أي مقابلة حقيقية.",
    });
  }

  const has = (id: string) => findings.some((finding) => finding.id === id);
  const hasCredential = has("credential");
  const hasThreat = has("threat");
  const hasSecrecy = has("secrecy");
  const hasPrize = has("prize");
  const hasUrgency = has("urgency");
  const hasPayment = has("payment");
  const hasJob = has("job");

  let band: Band = score >= 6 ? "high" : score >= 4 ? "medium" : "none";
  // A single unmistakable signal is enough for "stop and check", even when the
  // weighted sum is low. A credential request on its own is not a safe message.
  if (
    band === "none" &&
    (link?.risk === 3 || hasCredential || hasThreat || hasSecrecy || hasPrize)
  ) {
    band = "medium";
  }

  const isSafe = band === "none";
  const level = band === "high" ? "Dangerous" : band === "medium" ? "Suspicious" : "Safe";

  const attackType = isSafe
    ? { en: "Safe", ar: "آمن" }
    : hasJob && (hasCredential || hasPayment)
      ? { en: "Employment Scam", ar: "احتيال توظيف" }
      : hasCredential
        ? { en: "Credential Phishing", ar: "تصيّد بيانات الدخول" }
        : hasPayment || hasPrize
          ? { en: "Prize or Payment Scam", ar: "احتيال جائزة أو دفع" }
          : { en: "Social Engineering", ar: "هندسة اجتماعية" };

  const ranked = [...findings].sort((a, b) => b.weight - a.weight);
  const labelsEn = ranked
    .slice(0, 4)
    .map((finding) => finding.labelEn)
    .join(", ");
  const labelsAr = ranked
    .slice(0, 4)
    .map((finding) => finding.labelAr)
    .join("، ");

  const explanation = isSafe
    ? "Nothing here asks you to hand over credentials, money or identity data, and there is no deadline pushing you to act. That is not a guarantee: if the message concerns an account, open the app yourself."
    : band === "high"
      ? `This message combines ${labelsEn} — the pattern of ${attackType.en.toLowerCase()}. Treat it as hostile: do not use the link or reply, and reach the organisation through a channel you already trust.`
      : `This message carries parts of that pattern: ${labelsEn}. That is not proof of an attack, but it is enough to stop and verify through an independent channel.`;

  const explanationAr = isSafe
    ? "لا شيء هنا يطلب منك تسليم بيانات دخول أو مال أو هوية، ولا يوجد موعد نهائي يدفعك للتصرف. هذا ليس ضماناً: إن كانت الرسالة تخص حساباً، فافتح التطبيق بنفسك."
    : band === "high"
      ? `تجمع هذه الرسالة ${labelsAr} — وهو نمط ${attackType.ar}. تعامل معها كرسالة عدائية: لا تتبع الرابط ولا تردّ، وتواصل مع الجهة عبر قناة تثق بها.`
      : `تحمل هذه الرسالة أجزاء من ذلك النمط: ${labelsAr}. هذا ليس دليلاً على هجوم، لكنه كافٍ للتوقف والتحقق عبر قناة مستقلة.`;

  const safeClues: Clue[] = link
    ? [LINK_ALONE, NO_CREDENTIALS]
    : [NO_LINK, NO_CREDENTIALS];
  if (!hasUrgency && !hasThreat && !hasSecrecy) safeClues.push(NO_PRESSURE);
  safeClues.push(PLAIN, CAVEAT, VERIFY);

  const selected: Clue[] = isSafe
    ? safeClues.slice(0, 3)
    : ranked.slice(0, 3).map((finding) => ({ en: finding.clueEn, ar: finding.clueAr }));
  const fillers = [VERIFY, OFFICIAL, REPORT];
  while (selected.length < 3) selected.push(fillers[selected.length % fillers.length]);

  return {
    risk_score: SCORE[band],
    risk_level: level,
    is_threat: !isSafe,
    attack_type: attackType.en,
    attack_type_ar: attackType.ar,
    clue_1: selected[0].en,
    clue_2: selected[1].en,
    clue_3: selected[2].en,
    clue_1_ar: selected[0].ar,
    clue_2_ar: selected[1].ar,
    clue_3_ar: selected[2].ar,
    explanation,
    explanation_ar: explanationAr,
    analysis_source: "local",
  };
}
