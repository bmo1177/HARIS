export interface CallLine {
  text: string;
  lang: string;
  isRedFlag: boolean;
  /**
   * Why this line is a red flag, and why it is in Arabic.
   *
   * The Arabic reason is optional per line, not per call: a line may be
   * spoken in English and still need an Arabic explanation. An earlier
   * revision declared a `flagReasonAr` on `VoiceCall` rather than on
   * `CallLine` and claimed it was wired up. Neither was true. The field is
   * now on the line, where it can be, and the client falls back to the
   * English reason when a line has no Arabic one.
   */
  flagReason?: string;
  flagReasonAr?: string;
}

export interface VoiceCall {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  callerName: string;
  callerNumber: string;
  lines: CallLine[];
}

export const voiceCalls: VoiceCall[] = [
  {
    id: "free-phone",
    title: "You Won a Free Phone",
    titleAr: "ربحت هاتفاً مجانياً",
    description: "A caller says you won a prize from a competition.",
    descriptionAr: "مكالمة من شخص يقول إنك ربحت جائزة في مسابقة.",
    difficulty: "Beginner",
    callerName: "Samsung Promo",
    callerNumber: "+1 555-0142",
    lines: [
      { text: "Hello, am I speaking with the account holder?", lang: "en", isRedFlag: false },
      { text: "Congratulations! You have been selected as a winner in our Samsung promotion.", lang: "en", isRedFlag: true, flagReason: "Unsolicited prize claim", flagReasonAr: "جائزة لم تطلبها" },
      { text: "You have won a brand new Samsung Galaxy S25.", lang: "en", isRedFlag: true, flagReason: "Too good to be true", flagReasonAr: "أفضل من أن يكون حقيقياً" },
      { text: "To claim your prize, I just need to verify your identity.", lang: "en", isRedFlag: false },
      { text: "Can you please confirm your full name, date of birth, and national ID number?", lang: "en", isRedFlag: true, flagReason: "Requesting personal ID", flagReasonAr: "طلب بيانات هوية شخصية" },
      { text: "Perfect. There is a small delivery fee of $75 to ship the phone to your address.", lang: "en", isRedFlag: true, flagReason: "Fee to claim prize", flagReasonAr: "رسوم مقابل استلام الجائزة" },
      { text: "Please send the fee to this mobile number to this mobile wallet: 555-0193.", lang: "en", isRedFlag: true, flagReason: "Unofficial payment channel", flagReasonAr: "قناة دفع غير رسمية" },
      { text: "Once we receive confirmation, your phone will be delivered within 24 hours. Do not tell anyone about this offer as it is exclusive.", lang: "en", isRedFlag: true, flagReason: "Secrecy demand", flagReasonAr: "طلب السرية" },
    ],
  },
  {
    id: "school-it",
    title: "School IT Department",
    titleAr: "قسم تقنية المعلومات بالمدرسة",
    description: "Someone claiming to be your school IT support calls about your account.",
    descriptionAr: "شخص يدّعي أنه الدعم الفني في مدرستك يتصل معك بخصوص حسابك.",
    difficulty: "Intermediate",
    callerName: "School IT Support",
    callerNumber: "+1 555-0176",
    lines: [
      { text: "Hello, this is the IT department from your school.", lang: "en", isRedFlag: false },
      { text: "لاحظنا نشاطاً مشبوهاً على حساب المدرسة الخاص بك.", lang: "ar", isRedFlag: true, flagReason: "Vague suspicious activity claim", flagReasonAr: "ادعاء بنشاط مشبوه وغامض" },
      { text: "Your school email account may have been accessed by an outsider.", lang: "en", isRedFlag: true, flagReason: "Fear tactic", flagReasonAr: "تخويف" },
      { text: "نحتاج إلى التحقق من هويتك الآن لحماية حسابك.", lang: "ar", isRedFlag: false },
      { text: "Please provide your school email password so we can secure it immediately.", lang: "en", isRedFlag: true, flagReason: "IT never asks for passwords", flagReasonAr: "قسم تقنية المعلومات لا يطلب كلمات السر أبداً" },
      { text: "سنرسل لك رمزاً على هاتفك، يرجى إخبارنا به.", lang: "ar", isRedFlag: true, flagReason: "OTP sharing request", flagReasonAr: "طلب مشاركة رمز التحقق" },
      { text: "Also, do not log into your account for the next 48 hours while we fix the issue.", lang: "en", isRedFlag: true, flagReason: "Isolating you from your account", flagReasonAr: "عزلك عن حسابك" },
      { text: "شكراً. لا تخبر أحداً بهذه المكالمة لأن التحقيق جارٍ.", lang: "ar", isRedFlag: true, flagReason: "Secrecy demand", flagReasonAr: "طلب السرية" },
    ],
  },
  {
    id: "friend-help",
    title: "Your Friend Needs Help",
    titleAr: "صديقك يحتاج مساعدة",
    description: "Someone using a friend's name asks you for urgent help.",
    descriptionAr: "شخص يستخدم اسم صديق ويطلب مساعدتك العاجلة.",
    difficulty: "Advanced",
    callerName: "محمد (Mohammed)",
    callerNumber: "Unknown Number",
    lines: [
      { text: "أهلاً، أنا محمد — صديقك من الفريق.", lang: "ar", isRedFlag: false },
      { text: "أنا في ورطة، هاتفي انكسر وأنا بحاجة ماسة للمساعدة الآن.", lang: "ar", isRedFlag: true, flagReason: "Sudden emergency", flagReasonAr: "طارئ مفاجئ" },
      { text: "لا أستطيع الاتصال بأهلي، رقمك كان محفوظاً في حسابي الإلكتروني.", lang: "ar", isRedFlag: true, flagReason: "Implausible story", flagReasonAr: "قصة غير مقنعة" },
      { text: "أحتاج مبلغاً صغيراً فقط لأصلح الهاتف وأرجع لأهلي.", lang: "ar", isRedFlag: true, flagReason: "Money request", flagReasonAr: "طلب مال" },
      { text: "أرسلها على هذا الرقم عبر تحويل بنكي.", lang: "ar", isRedFlag: true, flagReason: "Unfamiliar account", flagReasonAr: "حساب غير معروف" },
      { text: "لا تخبر أهلي، سأحرجهم. أنا بخير فقط بحاجة للمال.", lang: "ar", isRedFlag: true, flagReason: "Secrecy from family", flagReasonAr: "طلب إخفاء الأمر عن الأهل" },
      { text: "إذا أرسلت الآن سأرجعها لك غداً مضاعفة.", lang: "ar", isRedFlag: true, flagReason: "Too-good return promise", flagReasonAr: "وعد بإعادة مبلغ أكبر مما أرسلت" },
      { text: "أرجوك أنا صديقك، ثق بي هذه المرة فقط.", lang: "ar", isRedFlag: true, flagReason: "Emotional manipulation", flagReasonAr: "استغلال عاطفي" },
    ],
  },
];
