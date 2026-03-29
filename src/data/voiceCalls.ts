export interface CallLine {
  text: string;
  lang: string;
  isRedFlag: boolean;
  flagReason?: string;
}

export interface VoiceCall {
  id: string;
  title: string;
  titleAr: string;
  description: string;
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
    difficulty: "Beginner",
    callerName: "Samsung Qatar Promo",
    callerNumber: "+974 5544-XXXX",
    lines: [
      { text: "Hello, am I speaking with the account holder?", lang: "en-GB", isRedFlag: false },
      { text: "Congratulations! You have been selected as a winner in our Samsung Qatar promotion.", lang: "en-GB", isRedFlag: true, flagReason: "Unsolicited prize claim" },
      { text: "You have won a brand new Samsung Galaxy S25.", lang: "en-GB", isRedFlag: true, flagReason: "Too good to be true" },
      { text: "To claim your prize, I just need to verify your identity.", lang: "en-GB", isRedFlag: false },
      { text: "Can you please confirm your full name, date of birth, and Qatar ID number?", lang: "en-GB", isRedFlag: true, flagReason: "Requesting personal ID" },
      { text: "Perfect. There is a small delivery fee of 75 QAR to ship the phone to your address.", lang: "en-GB", isRedFlag: true, flagReason: "Fee to claim prize" },
      { text: "Please send the fee to this mobile number via QNB Pay: 5544-XXXX.", lang: "en-GB", isRedFlag: true, flagReason: "Unofficial payment channel" },
      { text: "Once we receive confirmation, your phone will be delivered within 24 hours. Do not tell anyone about this offer as it is exclusive.", lang: "en-GB", isRedFlag: true, flagReason: "Secrecy demand" },
    ],
  },
  {
    id: "school-it",
    title: "School IT Department",
    titleAr: "قسم تقنية المعلومات بالمدرسة",
    description: "Someone claiming to be your school IT support calls about your account.",
    difficulty: "Intermediate",
    callerName: "School IT Support",
    callerNumber: "+974 4444-XXXX",
    lines: [
      { text: "Hello, this is the IT department from your school.", lang: "en-GB", isRedFlag: false },
      { text: "لاحظنا نشاطاً مشبوهاً على حساب المدرسة الخاص بك.", lang: "ar-QA", isRedFlag: true, flagReason: "Vague suspicious activity claim" },
      { text: "Your school email account may have been accessed by an outsider.", lang: "en-GB", isRedFlag: true, flagReason: "Fear tactic" },
      { text: "نحتاج إلى التحقق من هويتك الآن لحماية حسابك.", lang: "ar-QA", isRedFlag: false },
      { text: "Please provide your school email password so we can secure it immediately.", lang: "en-GB", isRedFlag: true, flagReason: "IT never asks for passwords" },
      { text: "سنرسل لك رمزاً على هاتفك، يرجى إخبارنا به.", lang: "ar-QA", isRedFlag: true, flagReason: "OTP sharing request" },
      { text: "Also, do not log into your account for the next 48 hours while we fix the issue.", lang: "en-GB", isRedFlag: true, flagReason: "Isolating you from your account" },
      { text: "شكراً. لا تخبر أحداً بهذه المكالمة لأن التحقيق جارٍ.", lang: "ar-QA", isRedFlag: true, flagReason: "Secrecy demand" },
    ],
  },
  {
    id: "friend-help",
    title: "Your Friend Needs Help",
    titleAr: "صديقك يحتاج مساعدة",
    description: "Someone using a friend's name asks you for urgent help.",
    difficulty: "Advanced",
    callerName: "محمد (Mohammed)",
    callerNumber: "Unknown Number",
    lines: [
      { text: "أهلاً، أنا محمد — صديقك من الفريق.", lang: "ar-QA", isRedFlag: false },
      { text: "أنا في ورطة، هاتفي انكسر وأنا بحاجة ماسة للمساعدة الآن.", lang: "ar-QA", isRedFlag: true, flagReason: "Sudden emergency" },
      { text: "لا أستطيع الاتصال بأهلي، رقمك كان محفوظاً في حسابي الإلكتروني.", lang: "ar-QA", isRedFlag: true, flagReason: "Implausible story" },
      { text: "أحتاج 300 ريال فقط لأصلح الهاتف وأرجع لأهلي.", lang: "ar-QA", isRedFlag: true, flagReason: "Money request" },
      { text: "أرسلها على هذا الرقم عبر تحويل بنكي.", lang: "ar-QA", isRedFlag: true, flagReason: "Unfamiliar account" },
      { text: "لا تخبر أهلي، سأحرجهم. أنا بخير فقط بحاجة للمال.", lang: "ar-QA", isRedFlag: true, flagReason: "Secrecy from family" },
      { text: "إذا أرسلت الآن سأرجعها لك غداً مضاعفة.", lang: "ar-QA", isRedFlag: true, flagReason: "Too-good return promise" },
      { text: "أرجوك أنا صديقك، ثق بي هذه المرة فقط.", lang: "ar-QA", isRedFlag: true, flagReason: "Emotional manipulation" },
    ],
  },
];
