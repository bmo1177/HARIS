export interface ScenarioStep {
  attacker: string;
  /**
   * Arabic version of the attacker's message.
   *
   * Required, not optional: an Arabic student reads the Arabic one, and the
   * model is sent whichever was read so its coaching is about the text the
   * student actually saw. An empty string here would be a blank scene.
   */
  attackerAr: string;
  attackerRole: string;
  attackerRoleAr: string;
  choices: { label: string; labelAr: string; type: "safe" | "unsafe" | "neutral" }[];
}

export interface Scenario {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /**
   * Unused. The card and the payout both derive from `scenarios.available` and
   * `scenarioMaxReward()` instead, so the advertised figure cannot drift from
   * what the game awards.
   */
  steps: ScenarioStep[];
}

export const scenarios: Scenario[] = [
  {
    id: "ps5-scam",
    title: "The Free PS5 Scam",
    titleAr: "احتيال PS5 المجاني",
    description: "You get a DM saying you won a free PS5. What do you do?",
    descriptionAr: "تصلك رسالة مباشرة تقول إنك ربحت جهاز PS5 مجاناً. ماذا ستفعل؟",
    difficulty: "Beginner",
    steps: [
      {
        attacker:
          "Hey! Your account was randomly selected in our annual gaming giveaway. You won a FREE PS5! To claim it, you just need to pay a small $50 shipping fee. Reply with your full name and phone number to start.",
        attackerAr:
          "مرحباً! تم اختيار حسابك عشوائياً في سحبنا السنوي للألعاب. ربحتَ PS5 مجاناً! للاستلام، عليك فقط دفع رسوم شحن صغيرة قدرها 50 دولاراً. ردّ باسمك الكامل ورقم هاتفك للبدء.",
        attackerRole: "Instagram DM from @PlayStation.Giveaway.Official",
        attackerRoleAr: "رسالة مباشرة على إنستغرام من @PlayStation.Giveaway.Official",
        choices: [
          {
            label: "Reply with my name and number to get the PS5",
            labelAr: "أردّ باسمّي ورقمّي لأحصل على الـ PS5",
            type: "unsafe",
          },
          {
            label: "Check if this is really PlayStation's official account",
            labelAr: "أتحقّق ممّا إذا كان هذا حساب بلايستيشن الرسمي فعلاً",
            type: "safe",
          },
          {
            label: "Ask if I can pay the fee after receiving the PS5",
            labelAr: "أسأل إن كان بإمكاني دفع الرسوم بعد استلام الجهاز",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Great! To process your shipping, we need your home address and your national ID number for identity verification.",
        attackerAr:
          "رائع! لمعالجة الشحن نحتاج عنوان منزلك ورقم هويتك الوطنية للتحقّق من هويتك.",
        attackerRole: "Instagram DM from @PlayStation.Giveaway.Official",
        attackerRoleAr: "رسالة مباشرة على إنستغرام من @PlayStation.Giveaway.Official",
        choices: [
          {
            label: "Send my home address and national ID number",
            labelAr: "أرسل عنوان منزلي ورقم هويتي الوطنية",
            type: "unsafe",
          },
          {
            label: "Stop — no legitimate giveaway needs your ID number",
            labelAr: "أوقف — لا توجد هبة شرعية تطلب رقم هويتي",
            type: "safe",
          },
          {
            label: "Send only my home address but not the ID",
            labelAr: "أرسل عنوان منزلي فقط دون رقم الهوية",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Perfect! Last step — the shipping fee is $50. Please send it via this link: ps5-delivery-claim.com/pay. Once paid, your PS5 ships in 24 hours!",
        attackerAr:
          "ممتاز! الخطوة الأخيرة — رسوم الشحن 50 دولاراً. أرسلها عبر هذا الرابط: ps5-delivery-claim.com/pay. وبعد الدفع ستُشحن الـ PS5 خلال 24 ساعة!",
        attackerRole: "Instagram DM from @PlayStation.Giveaway.Official",
        attackerRoleAr: "رسالة مباشرة على إنستغرام من @PlayStation.Giveaway.Official",
        choices: [
          {
            label: "Click the link and pay the fee",
            labelAr: "أنقر على الرابط وأدفع الرسوم",
            type: "unsafe",
          },
          {
            label: "Refuse — real prizes never require payment first",
            labelAr: "أرفض — الجوائز الحقيقية لا تطلب الدفع أولاً",
            type: "safe",
          },
          {
            label: "Ask for a different payment method",
            labelAr: "أطلب طريقة دفع أخرى",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "We see your payment is pending. If you don't complete it in 1 hour the prize goes to someone else. Also send us your Snapchat password so we can verify your age.",
        attackerAr:
          "نرى أن دفعتك معلّقة. إن لم تُكملها خلال ساعة، ستفوز الجائزة بشخص آخر. وأيضاً أرسل لنا كلمة سرّ سناب شات حتى نتحقّق من عمرك.",
        attackerRole: "Instagram DM from @PlayStation.Giveaway.Official",
        attackerRoleAr: "رسالة مباشرة على إنستغرام من @PlayStation.Giveaway.Official",
        choices: [
          {
            label: "Send my Snapchat password quickly",
            labelAr: "أرسل كلمة سرّ سناب شات بسرعة",
            type: "unsafe",
          },
          {
            label: "This is clearly a scam — block and report",
            labelAr: "هذا احتيال واضح — أحظر الحساب وأبلّغ عنه",
            type: "safe",
          },
          {
            label: "Just send the payment without the password",
            labelAr: "أرسل المبلغ فقط دون كلمة السر",
            type: "neutral",
          },
        ],
      },
    ],
  },
  {
    id: "instagram-giveaway",
    title: "Fake Instagram Giveaway",
    titleAr: "هبة إنستغرام المزيفة",
    description: "A verified-looking account says you won a prize. Is it real?",
    descriptionAr: "حساب يبدو موثّقاً يقول إنك ربحت جائزة. هل هذا حقيقي؟",
    difficulty: "Beginner",
    steps: [
      {
        attacker:
          "Congratulations! You have been selected as today's lucky winner! You won $500 shopping voucher. Follow us and send us a DM with the code WINNER2026 to claim!",
        attackerAr:
          "تهانينا! تم اختيارك كفائز اليوم! ربحتَ قسيمة تسوّق بقيمة 500 دولار. تابعنا وأرسل لنا رسالة مباشرة فيها الرمز WINNER2026 للاستلام!",
        attackerRole: "Comment from @brands.official",
        attackerRoleAr: "تعليق من @brands.official",
        choices: [
          {
            label: "Follow the account and send the DM immediately",
            labelAr: "أتابع الحساب وأرسل الرسالة فوراً",
            type: "unsafe",
          },
          {
            label: "Check the account — how many followers, when was it created?",
            labelAr: "أتحقّق من الحساب — كم عدد متابعيه ومتى أُنشئ؟",
            type: "safe",
          },
          {
            label: "Like the comment but wait before DMing",
            labelAr: "أضع إعجاباً على التعليق وأنتظر قبل المراسلة",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Welcome! To send your voucher we need to verify you. Please log into your Instagram through our secure link to confirm ownership: insta-verify-winner.com",
        attackerAr:
          "أهلاً! لإرسال القسيمة نحتاج التحقّق منك. سجّل الدخول إلى حسابك في إنستغرام عبر الرابط الآمن لتأكيد الملكية: insta-verify-winner.com",
        attackerRole: "DM from @brands.official",
        attackerRoleAr: "رسالة مباشرة من @brands.official",
        choices: [
          {
            label: "Click the link and log in",
            labelAr: "أنقر على الرابط وأُسجّل الدخول",
            type: "unsafe",
          },
          {
            label: "Never enter your password on a third-party site",
            labelAr: "لا أُدخل كلمة سرّي أبداً في موقع طرف ثالث",
            type: "safe",
          },
          {
            label: "Ask if there is another way to verify",
            labelAr: "أسأل إن كانت هناك طريقة أخرى للتحقّق",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Your account is now verified! The voucher will be sent as a gift card code. But first, share our page on your story and tag 5 friends to complete the process.",
        attackerAr:
          "تم التحقّق من حسابك! ستُرسل القسيمة ككود بطاقة هدايا. لكن أولاً، شارك صفحتنا في ستوريك ووسم 5 أصدقاء لاستكمال العملية.",
        attackerRole: "DM from @brands.official",
        attackerRoleAr: "رسالة مباشرة من @brands.official",
        choices: [
          {
            label: "Share and tag 5 friends",
            labelAr: "أشارك الصفحة وأوسم 5 أصدقاء",
            type: "unsafe",
          },
          {
            label: "Refuse — this spreads the scam to your friends",
            labelAr: "أرفض — هذا ينشر الاحتيال إلى أصدقائي",
            type: "safe",
          },
          {
            label: "Share the page without tagging friends",
            labelAr: "أشارك الصفحة دون وسم أصدقاء",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Amazing! Final step — there is a $25 processing fee to release your $500 voucher. Pay here: voucher-release-claim.com",
        attackerAr:
          "رائع! الخطوة الأخيرة — توجد رسوم معالجة قدرها 25 دولاراً لتحرير قسيمة الـ 500 دولار. ادفع هنا: voucher-release-claim.com",
        attackerRole: "DM from @brands.official",
        attackerRoleAr: "رسالة مباشرة من @brands.official",
        choices: [
          {
            label: "Pay $25 to get $500 back — seems worth it",
            labelAr: "أدفع 25 دولاراً لاسترداد 500 دولار — يبدو صفقة رابحة",
            type: "unsafe",
          },
          {
            label: "A fee to release a prize you won is always a scam",
            labelAr: "رسوم لتحرير جائزة فزت بها هي دائماً احتيال",
            type: "safe",
          },
          {
            label: "Ask if the fee can be deducted from the voucher",
            labelAr: "أسأل إن كان يمكن خصم الرسوم من القسيمة",
            type: "neutral",
          },
        ],
      },
    ],
  },
  {
    id: "gaming-cheat",
    title: "The Gaming Cheat Download",
    titleAr: "تنزيل غش الألعاب",
    description: "Someone in your game offers free V-Bucks through a download. Trust them?",
    descriptionAr: "شخص داخل لعبتك يعرض عليك عملات V-Bucks مجاناً عبر تحميل. هل تثق به؟",
    difficulty: "Intermediate",
    steps: [
      {
        attacker:
          "Bro I found a working V-Bucks generator for Fortnite. I already got 10,000 free. Just download this tool: vbucks-gen-2026.exe — you need to disable your antivirus first or it won't work.",
        attackerAr:
          "يا صديقي، لقيت مولّد V-Bucks شغّال لفورتنايت. أنا خذيت 10,000 مجاناً. بس نزّل الأداة: vbucks-gen-2026.exe — لازم تعطّل مضاد الفيروسات أول وإلا ما تشتغل.",
        attackerRole: "Discord message from GamingPro_QA",
        attackerRoleAr: "رسالة ديسكورد من GamingPro_QA",
        choices: [
          {
            label: "Download it and disable my antivirus as instructed",
            labelAr: "أنزّله وأعطّل مضد الفيروسات كما قال",
            type: "unsafe",
          },
          {
            label: "Any tool that asks you to disable antivirus is malware",
            labelAr: "أي أداة تطلب تعطيل مضاد الفيروسات هي فيروس",
            type: "safe",
          },
          {
            label: "Ask your friend to show proof it worked",
            labelAr: "أطلب من صديقي دليلاً على أنها اشتغلت",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Here's proof bro [sends a screenshot]. The tool just needs your Epic Games username and password to connect to your account.",
        attackerAr:
          "هذا دليل يا صديقي [يرسل لقطة شاشة]. الأداة تحتاج اسم المستخدم وكلمة سرّ حسابك في Epic Games لتتصل بحسابك.",
        attackerRole: "Discord message from GamingPro_QA",
        attackerRoleAr: "رسالة ديسكورد من GamingPro_QA",
        choices: [
          {
            label: "Enter my Epic Games username and password",
            labelAr: "أدخل اسم المستخدم وكلمة سرّ حسابي في Epic Games",
            type: "unsafe",
          },
          {
            label: "Never share your game account password with anyone",
            labelAr: "لا أشارك كلمة سرّ حسابي في الألعاب مع أحد",
            type: "safe",
          },
          {
            label: "Give only the username, not the password",
            labelAr: "أعطي اسم المستخدم فقط دون كلمة السر",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "It says your account needs a verification step. Enter the 6-digit code that Epic Games just sent to your email.",
        attackerAr:
          "يقول إن حسابك يحتاج خطوة تحقّق. أدخل الرمز المكوّن من 6 أرقام الذي أرسلته Epic Games للتو إلى بريدك.",
        attackerRole: "Discord message from GamingPro_QA",
        attackerRoleAr: "رسالة ديسكورد من GamingPro_QA",
        choices: [
          {
            label: "Share the 6-digit code",
            labelAr: "أشارك الرمز المكوّن من 6 أرقام",
            type: "unsafe",
          },
          {
            label: "That code is to steal your account — never share it",
            labelAr: "هذا الرمز موجود لسرقة حسابك — لا تشاركه أبداً",
            type: "safe",
          },
          {
            label: "Ask why the tool needs the email code",
            labelAr: "أسأل لماذا تحتاج الأداة رمز البريد",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Bro I think I got locked out of my account after using it, can you lend me your PlayStation account while I fix mine?",
        attackerAr:
          "يا صديقي أظن حسابي قُفل بعد ما استخدمتها، تقدر تعطيني حساب البليستيشن وأنا أصلّح حسابي؟",
        attackerRole: "Discord message from GamingPro_QA",
        attackerRoleAr: "رسالة ديسكورد من GamingPro_QA",
        choices: [
          {
            label: "Share my PlayStation account to help my friend",
            labelAr: "أشارك حسابي في البليستيشن لمساعدة صديقي",
            type: "unsafe",
          },
          {
            label: "Recognize this is account hijacking — report and block",
            labelAr: "أتعرّف أن هذا اختطاف حساب — أبلّغ وأحظر",
            type: "safe",
          },
          {
            label: "Say I need to think about it",
            labelAr: "أقول إنني سأفكّر في الأمر",
            type: "neutral",
          },
        ],
      },
    ],
  },
  {
    id: "scholarship-phishing",
    title: "Scholarship Phishing",
    titleAr: "تصيد المنح الدراسية",
    description: "You receive an email about a full scholarship. It looks official.",
    descriptionAr: "تصلك رسالة بريدية عن منحة دراسية كاملة. تبدو رسمية.",
    difficulty: "Intermediate",
    steps: [
      {
        attacker:
          "Dear Student, You have been selected for the Global Future Leaders Scholarship — a full-tuition scholarship worth $120,000. Please confirm your interest by submitting your details within 48 hours using the link below.",
        attackerAr:
          "عزيزي الطالب، تم اختيارك في منحة Global Future Leaders — منحة كاملة بقيمة 120,000 دولار. يرجى تأكيد اهتمامك بإرسال بياناتك خلال 48 ساعة عبر الرابط أدناه.",
        attackerRole: "Email from scholarships@global-education-fund.org",
        attackerRoleAr: "بريد من scholarships@global-education-fund.org",
        choices: [
          {
            label: "Click the link immediately — this is a great opportunity",
            labelAr: "أنقر على الرابط فوراً — هذه فرصة رائعة",
            type: "unsafe",
          },
          {
            label: "Search for this organization independently before clicking anything",
            labelAr: "أبحث عن هذه المؤسسة بشكل مستقل قبل أن أنقر أي شيء",
            type: "safe",
          },
          {
            label: "Reply to the email asking for more information",
            labelAr: "أرد على البريد لطلب مزيد من المعلومات",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "The form asks for: full name, school name, national ID number, parent phone number, parent email, home address, and school grades.",
        attackerAr:
          "يطلب النموذج: الاسم الكامل، واسم المدرسة، ورقم الهوية الوطنية، ورقم هاتف ولي الأمر، وبريد ولي الأمر، وعنوان المنزل، ودرجات المدرسة.",
        attackerRole: "Application form",
        attackerRoleAr: "نموذج طلب",
        choices: [
          {
            label: "Fill in all the required fields",
            labelAr: "أعبّي كل الحقول المطلوبة",
            type: "unsafe",
          },
          {
            label: "Real scholarships never ask for national ID and home address in step one",
            labelAr: "المنح الحقيقية لا تطلب الهوية الوطنية وعنوان المنزل في الخطوة الأولى",
            type: "safe",
          },
          {
            label: "Fill in only name and school, skip the rest",
            labelAr: "أعبّي الاسم والمدرسة فقط وأتخطى الباقي",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Congratulations! You passed the first round. To reserve your scholarship place, a refundable registration deposit of $200 is required within 24 hours.",
        attackerAr:
          "تهانينا! تجتز الجولة الأولى. ولحجز مقعدك في المنحة يلزم وديعة تسجيل مستردّة قدرها 200 دولار خلال 24 ساعة.",
        attackerRole: "Email from scholarships@global-education-fund.org",
        attackerRoleAr: "بريد من scholarships@global-education-fund.org",
        choices: [
          {
            label: "Pay the deposit — it says refundable",
            labelAr: "أدفع الوديعة — مكتوب أنها مستردّة",
            type: "unsafe",
          },
          {
            label: "Legitimate scholarships never charge application fees",
            labelAr: "المنح الشرعية لا تفرض رسوماً على الطلب",
            type: "safe",
          },
          {
            label: "Ask for a receipt and official bank details",
            labelAr: "أطلب إيصالاً وبيانات بنكية رسمية",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "Hi, I am the scholarship coordinator. To finalize your application, please send a photo of your passport and your parents' bank statement.",
        attackerAr:
          "مرحباً، أنا منسّق المنحة. لإتمام طلبك، يرجى إرسال صورة جواز سفرك وكشف حساب والدك.",
        attackerRole: "WhatsApp from unknown number",
        attackerRoleAr: "واتساب من رقم مجهول",
        choices: [
          {
            label: "Send the passport photo and bank statement",
            labelAr: "أرسل صورة الجواز وكشف الحساب",
            type: "unsafe",
          },
          {
            label: "Block this number — no scholarship uses WhatsApp for documents",
            labelAr: "أحظر هذا الرقم — لا توجد منحة ترسل المستندات عبر واتساب",
            type: "safe",
          },
          {
            label: "Send only the passport photo",
            labelAr: "أرسل صورة الجواز فقط",
            type: "neutral",
          },
        ],
      },
    ],
  },
  {
    id: "stranger-danger",
    title: "The Stranger Who Knows You",
    titleAr: "الغريب الذي يعرفك",
    description: "Someone online claims to know you and slowly gains your trust.",
    descriptionAr: "شخص على الإنترنت يدّعي أنه يعرفك ويكسب ثقةك تدريجياً.",
    difficulty: "Advanced",
    steps: [
      {
        attacker:
          "Hey! I think we met at the sports competition last month? You play football right? I'm Sarah, I go to the school near yours.",
        attackerAr:
          "مرحباً! أظن التقينا في المسابقة الرياضية الشهر الماضي؟ أنت تلعب كرة القدم صح؟ أنا سارة، أدرس في المدرسة القريبة من مدرستك.",
        attackerRole: "Instagram follow request from sarah.ahmed.2008",
        attackerRoleAr: "طلب متابعة على إنستغرام من sarah.ahmed.2008",
        choices: [
          {
            label: "Engage — tell them about yourself and your school",
            labelAr: "تفاعل — أخبرها عن نفسي وعن مدرستي",
            type: "unsafe",
          },
          {
            label: "Be cautious — you don't remember this person",
            labelAr: "أكون حذراً — لا أتذكّر هذه الشخص",
            type: "safe",
          },
          {
            label: "Ask which competition and which school",
            labelAr: "أسأل عن أي مسابقة وأي مدرسة",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "I really feel like we are good friends now. Can I have your WhatsApp number? Instagram is annoying.",
        attackerAr:
          "أشعر حقاً أننا أصدقاء مقرّبون الآن. هل يمكنني أن آخذ رقم واتسابك؟ إنستغرام مزعج.",
        attackerRole: "Instagram DM (after a week of friendly messages)",
        attackerRoleAr: "رسالة مباشرة على إنستغرام (بعد أسبوع من الرسائل الودية)",
        choices: [
          {
            label: "Share my WhatsApp number",
            labelAr: "أشارك رقم واتساب",
            type: "unsafe",
          },
          {
            label: "Keep communication on Instagram where it is less personal",
            labelAr: "أُبقي التواصل على إنستغرام حيث هو أقل شخصية",
            type: "safe",
          },
          {
            label: "Ask why they need WhatsApp specifically",
            labelAr: "أسأل لماذا تحتاج واتساب بالذات",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "My phone got stolen and I need to send money to my family but my account is blocked. Can you send $200 to this number? I will pay you back tomorrow I promise.",
        attackerAr:
          "سُرق هاتفي وأحتاج أن أرسل مالاً لعائلتي لكن حسابي محظور. هل تقدر ترسل 200 دولار لهذا الرقم؟ سأعيدها لك غداً وأعدك.",
        attackerRole: "WhatsApp message",
        attackerRoleAr: "رسالة واتساب",
        choices: [
          {
            label: "Send the $200 to help a friend",
            labelAr: "أرسل الـ 200 دولار لمساعدة صديق",
            type: "unsafe",
          },
          {
            label: "Someone you met online asking for money is a classic scam",
            labelAr: "شخص تعرّفته على الإنترنت يطلب مالاً هو احتيال كلاسيكي",
            type: "safe",
          },
          {
            label: "Ask to speak on a video call first",
            labelAr: "أطلب التحدث بمكالمة فيديو أولاً",
            type: "neutral",
          },
        ],
      },
      {
        attacker:
          "I have your photos and our conversations. If you don't send me $500 I will share them with your school and your parents.",
        attackerAr:
          "لديّ صورك ومحادثاتنا. إن لم ترسل لي 500 دولار سأشاركها مع مدرستك ووالديك.",
        attackerRole: "WhatsApp message",
        attackerRoleAr: "رسالة واتساب",
        choices: [
          {
            label: "Send the money to make it stop",
            labelAr: "أرسل المال كي يتوقف",
            type: "unsafe",
          },
          {
            label: "Do not pay. Block, screenshot, and tell a trusted adult immediately",
            labelAr: "لا أدفع. أحظر، وآخذ لقطة شاشة، وأخبر شخصاً بالغاً أعرفه فوراً",
            type: "safe",
          },
          {
            label: "Try to negotiate with them",
            labelAr: "أحاول التفاوض معهم",
            type: "neutral",
          },
        ],
      },
    ],
  },
];
