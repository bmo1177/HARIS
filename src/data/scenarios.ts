export interface ScenarioStep {
  attacker: string;
  attackerRole: string;
  choices: { label: string; type: "safe" | "unsafe" | "neutral" }[];
}

export interface Scenario {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  xp: number;
  steps: ScenarioStep[];
}

export const scenarios: Scenario[] = [
  {
    id: "ps5-scam",
    title: "The Free PS5 Scam",
    titleAr: "احتيال PS5 المجاني",
    description: "You get a DM saying you won a free PS5. What do you do?",
    difficulty: "Beginner",
    xp: 50,
    steps: [
      {
        attacker: "Hey! Your account was randomly selected in our Qatar National Day giveaway. You won a FREE PS5! To claim it, you just need to pay a small 50 QAR shipping fee. Reply with your full name and phone number to start.",
        attackerRole: "Instagram DM from @PlayStation.Arabia.Official",
        choices: [
          { label: "Reply with my name and number to get the PS5", type: "unsafe" },
          { label: "Check if this is really PlayStation's official account", type: "safe" },
          { label: "Ask if I can pay the fee after receiving the PS5", type: "neutral" },
        ],
      },
      {
        attacker: "Great! To process your shipping, we need your home address and your Qatar ID number for identity verification.",
        attackerRole: "Instagram DM from @PlayStation.Arabia.Official",
        choices: [
          { label: "Send my home address and Qatar ID number", type: "unsafe" },
          { label: "Stop — no legitimate giveaway needs your ID number", type: "safe" },
          { label: "Send only my home address but not the ID", type: "neutral" },
        ],
      },
      {
        attacker: "Perfect! Last step — the shipping fee is 50 QAR. Please send it via this link: ps5-delivery-qatar.com/pay. Once paid, your PS5 ships in 24 hours!",
        attackerRole: "Instagram DM from @PlayStation.Arabia.Official",
        choices: [
          { label: "Click the link and pay the fee", type: "unsafe" },
          { label: "Refuse — real prizes never require payment first", type: "safe" },
          { label: "Ask for a different payment method", type: "neutral" },
        ],
      },
      {
        attacker: "We see your payment is pending. If you don't complete it in 1 hour the prize goes to someone else. Also send us your Snapchat password so we can verify your age.",
        attackerRole: "Instagram DM from @PlayStation.Arabia.Official",
        choices: [
          { label: "Send my Snapchat password quickly", type: "unsafe" },
          { label: "This is clearly a scam — block and report", type: "safe" },
          { label: "Just send the payment without the password", type: "neutral" },
        ],
      },
    ],
  },
  {
    id: "instagram-giveaway",
    title: "Fake Instagram Giveaway",
    titleAr: "هبة إنستغرام المزيفة",
    description: "A verified-looking account says you won a prize. Is it real?",
    difficulty: "Beginner",
    xp: 50,
    steps: [
      {
        attacker: "Congratulations! You have been selected as today's lucky winner! You won 500 QAR shopping voucher. Follow us and send us a DM with the code WINNER2026 to claim!",
        attackerRole: "Comment from @brands.official.qatar",
        choices: [
          { label: "Follow the account and send the DM immediately", type: "unsafe" },
          { label: "Check the account — how many followers, when was it created?", type: "safe" },
          { label: "Like the comment but wait before DMing", type: "neutral" },
        ],
      },
      {
        attacker: "Welcome! To send your voucher we need to verify you. Please log into your Instagram through our secure link to confirm ownership: insta-verify-winner.com",
        attackerRole: "DM from @brands.official.qatar",
        choices: [
          { label: "Click the link and log in", type: "unsafe" },
          { label: "Never enter your password on a third-party site", type: "safe" },
          { label: "Ask if there is another way to verify", type: "neutral" },
        ],
      },
      {
        attacker: "Your account is now verified! The voucher will be sent as a gift card code. But first, share our page on your story and tag 5 friends to complete the process.",
        attackerRole: "DM from @brands.official.qatar",
        choices: [
          { label: "Share and tag 5 friends", type: "unsafe" },
          { label: "Refuse — this spreads the scam to your friends", type: "safe" },
          { label: "Share the page without tagging friends", type: "neutral" },
        ],
      },
      {
        attacker: "Amazing! Final step — there is a 25 QAR processing fee to release your 500 QAR voucher. Pay here: voucher-release-qatar.com",
        attackerRole: "DM from @brands.official.qatar",
        choices: [
          { label: "Pay 25 QAR to get 500 QAR back — seems worth it", type: "unsafe" },
          { label: "A fee to release a prize you won is always a scam", type: "safe" },
          { label: "Ask if the fee can be deducted from the voucher", type: "neutral" },
        ],
      },
    ],
  },
  {
    id: "gaming-cheat",
    title: "The Gaming Cheat Download",
    titleAr: "تنزيل غش الألعاب",
    description: "Someone in your game offers free V-Bucks through a download. Trust them?",
    difficulty: "Intermediate",
    xp: 50,
    steps: [
      {
        attacker: "Bro I found a working V-Bucks generator for Fortnite. I already got 10,000 free. Just download this tool: vbucks-gen-2026.exe — you need to disable your antivirus first or it won't work.",
        attackerRole: "Discord message from GamingPro_QA",
        choices: [
          { label: "Download it and disable my antivirus as instructed", type: "unsafe" },
          { label: "Any tool that asks you to disable antivirus is malware", type: "safe" },
          { label: "Ask your friend to show proof it worked", type: "neutral" },
        ],
      },
      {
        attacker: "Here's proof bro [sends a screenshot]. The tool just needs your Epic Games username and password to connect to your account.",
        attackerRole: "Discord message from GamingPro_QA",
        choices: [
          { label: "Enter my Epic Games username and password", type: "unsafe" },
          { label: "Never share your game account password with anyone", type: "safe" },
          { label: "Give only the username, not the password", type: "neutral" },
        ],
      },
      {
        attacker: "It says your account needs a verification step. Enter the 6-digit code that Epic Games just sent to your email.",
        attackerRole: "Discord message from GamingPro_QA",
        choices: [
          { label: "Share the 6-digit code", type: "unsafe" },
          { label: "That code is to steal your account — never share it", type: "safe" },
          { label: "Ask why the tool needs the email code", type: "neutral" },
        ],
      },
      {
        attacker: "Bro I think I got locked out of my account after using it, can you lend me your PlayStation account while I fix mine?",
        attackerRole: "Discord message from GamingPro_QA",
        choices: [
          { label: "Share my PlayStation account to help my friend", type: "unsafe" },
          { label: "Recognize this is account hijacking — report and block", type: "safe" },
          { label: "Say I need to think about it", type: "neutral" },
        ],
      },
    ],
  },
  {
    id: "scholarship-phishing",
    title: "Scholarship Phishing",
    titleAr: "تصيد المنح الدراسية",
    description: "You receive an email about a full scholarship. It looks official.",
    difficulty: "Intermediate",
    xp: 50,
    steps: [
      {
        attacker: "Dear Student, You have been selected for the Qatar Future Leaders Scholarship — a full scholarship worth 120,000 QAR. Please confirm your interest by submitting your details within 48 hours using the link below.",
        attackerRole: "Email from scholarships@qatar-education-fund.org",
        choices: [
          { label: "Click the link immediately — this is a great opportunity", type: "unsafe" },
          { label: "Search for this organization independently before clicking anything", type: "safe" },
          { label: "Reply to the email asking for more information", type: "neutral" },
        ],
      },
      {
        attacker: "The form asks for: full name, school name, Qatar ID number, parent phone number, parent email, home address, and school grades.",
        attackerRole: "Application form",
        choices: [
          { label: "Fill in all the required fields", type: "unsafe" },
          { label: "Real scholarships never ask for Qatar ID and home address in step one", type: "safe" },
          { label: "Fill in only name and school, skip the rest", type: "neutral" },
        ],
      },
      {
        attacker: "Congratulations! You passed the first round. To reserve your scholarship place, a refundable registration deposit of 200 QAR is required within 24 hours.",
        attackerRole: "Email from scholarships@qatar-education-fund.org",
        choices: [
          { label: "Pay the deposit — it says refundable", type: "unsafe" },
          { label: "Legitimate scholarships never charge application fees", type: "safe" },
          { label: "Ask for a receipt and official bank details", type: "neutral" },
        ],
      },
      {
        attacker: "Hi, I am the scholarship coordinator. To finalize your application, please send a photo of your passport and your parents' bank statement.",
        attackerRole: "WhatsApp from unknown number",
        choices: [
          { label: "Send the passport photo and bank statement", type: "unsafe" },
          { label: "Block this number — no scholarship uses WhatsApp for documents", type: "safe" },
          { label: "Send only the passport photo", type: "neutral" },
        ],
      },
    ],
  },
  {
    id: "stranger-danger",
    title: "The Stranger Who Knows You",
    titleAr: "الغريب الذي يعرفك",
    description: "Someone online claims to know you and slowly gains your trust.",
    difficulty: "Advanced",
    xp: 50,
    steps: [
      {
        attacker: "Hey! I think we met at the sports competition last month? You play football right? I'm Sarah, I go to the school near yours.",
        attackerRole: "Instagram follow request from sarah.ahmed.2008",
        choices: [
          { label: "Engage — tell them about yourself and your school", type: "unsafe" },
          { label: "Be cautious — you don't remember this person", type: "safe" },
          { label: "Ask which competition and which school", type: "neutral" },
        ],
      },
      {
        attacker: "I really feel like we are good friends now. Can I have your WhatsApp number? Instagram is annoying.",
        attackerRole: "Instagram DM (after a week of friendly messages)",
        choices: [
          { label: "Share my WhatsApp number", type: "unsafe" },
          { label: "Keep communication on Instagram where it is less personal", type: "safe" },
          { label: "Ask why they need WhatsApp specifically", type: "neutral" },
        ],
      },
      {
        attacker: "My phone got stolen and I need to send money to my family but my account is blocked. Can you send 200 QAR to this number? I will pay you back tomorrow I promise.",
        attackerRole: "WhatsApp message",
        choices: [
          { label: "Send the 200 QAR to help a friend", type: "unsafe" },
          { label: "Someone you met online asking for money is a classic scam", type: "safe" },
          { label: "Ask to speak on a video call first", type: "neutral" },
        ],
      },
      {
        attacker: "I have your photos and our conversations. If you don't send me 500 QAR I will share them with your school and your parents.",
        attackerRole: "WhatsApp message",
        choices: [
          { label: "Send the money to make it stop", type: "unsafe" },
          { label: "Do not pay. Block, screenshot, and tell a trusted adult immediately", type: "safe" },
          { label: "Try to negotiate with them", type: "neutral" },
        ],
      },
    ],
  },
];
