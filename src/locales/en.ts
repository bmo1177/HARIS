/**
 * English source of truth.
 *
 * `MessageKey` is derived from this object, so `ar.ts` is typed as
 * `Record<MessageKey, string>` and a missing Arabic string is a compile error
 * rather than a silent English fallback at runtime.
 *
 * `{name}` placeholders are substituted by `t()`.
 */
export const en = {
  // Navigation and chrome
  "nav.home": "Home",
  "nav.scenarios": "Scenarios",
  "nav.voiceLab": "Voice Lab",
  "nav.sandbox": "Sandbox",
  "nav.about": "About",
  "nav.main": "Main",
  "nav.toggleTheme": "Toggle theme",
  "nav.switchToDark": "Switch to dark theme",
  "nav.switchToLight": "Switch to light theme",
  "nav.switchToArabic": "Switch to Arabic",
  "nav.switchToEnglish": "Switch to English",

  // XP
  "xp.level": "Lv {level}",
  "xp.total": "{xp} XP",
  "xp.progress": "Level {level} progress",
  "xp.maxLevel": "Level {level}, maximum level reached",
  "xp.earned": "+{amount} XP",
  "xp.levelUp": "Level up",

  // Level titles, keyed by index into LEVELS
  "level.0": "Digital Newbie",
  "level.1": "Scam Spotter",
  "level.2": "Threat Hunter",
  "level.3": "Cyber Guardian",
  "level.4": "HARIS Elite",

  // Analyzer
  "analyzer.title": "Got a suspicious message?",
  "analyzer.subtitle":
    "Paste it below. HARIS will analyze it and teach you exactly what it is.",
  "analyzer.tagline": "Train your instinct. Get ahead of the threats.",
  "analyzer.label": "Paste a suspicious message",
  "analyzer.placeholder":
    "Paste any suspicious message here — SMS, WhatsApp, email, DM... (Arabic or English)",
  "analyzer.counter": "{count} / {max}",
  "analyzer.tooLong":
    "Too long — {count} characters. Trim it to {max} or fewer.",
  "analyzer.tryExample": "Try an example:",
  "analyzer.submit": "Analyze with HARIS",
  "analyzer.submitting": "HARIS is analyzing...",
  "analyzer.wait.headline": "Reading the message for red flags",
  "analyzer.wait.elapsed": "{seconds}s",
  "analyzer.wait.typical": "This usually takes 5-15 seconds.",
  "analyzer.wait.slow": "Taking longer than usual. Still working.",
  "analyzer.wait.cancel": "Cancel",
  "analyzer.wait.cancelled": "Analysis cancelled.",
  "analyzer.wait.skeletonVerdict": "Your verdict will appear here",
  "analyzer.wait.keepOpen": "You can leave this page - the analysis will be cancelled.",
  "analyzer.step1": "Paste the message",
  "analyzer.step2": "HARIS scores the threat",
  "analyzer.step3": "Discover it through clues",
  "example.fakePrize": "Fake prize",
  "example.phishingLink": "Phishing link",
  "example.safeMessage": "Safe message",
  "example.gamingScam": "Gaming scam",

  // Analysis results
  "results.whyFlagged": "Why HARIS flagged this",
  "risk.score": "Risk score",
  "risk.scoreOf": "Risk score {score} out of 100",
  "risk.level": "Verdict {level}",
  "risk.scale": "Risk scale from 0 to 100",
  "risk.Safe": "Safe",
  "risk.Suspicious": "Suspicious",
  "risk.Dangerous": "Dangerous",
  "results.doNotClick": "Do not click any links in this message!",
  "results.english": "English",
  "results.arabic": "العربية",
  "results.revealClue": "Reveal clue {n}",
  "results.clue": "Clue {n}",
  "results.analyzeAnother": "Analyze another message",

  // Guess the attack
  "guess.title": "What type of attack is this? Take a guess!",
  "guess.placeholder": "What type of attack is this?",
  "guess.label": "Your guess at the attack type",
  "guess.submit": "Submit",
  "guess.retry": "Not quite — try again ({count} {unit} left)",
  "guess.attempt": "attempt",
  "guess.attempts": "attempts",
  "guess.correct": "Correct! It's {type}",
  "guess.revealed": "It's {type}! No worries — now you know it.",
  "guess.nothingToGuess":
    "Nothing to guess here. This message showed no attack indicators — noticing that is the skill. Try a message you suspect is hostile and see what HARIS spots.",

  // Scenarios
  "scenarios.title": "Scenario Simulator",
  "scenarios.subtitle": "Live through a real attack. Make smart choices. Earn XP.",
  "scenarios.available": "{count} scenarios and {calls} voice calls available today.",
  "scenarios.upToXp": "up to {xp} XP",
  "scenarios.back": "Back",
  "scenarios.step": "Step {current} of {total}",
  "scenarios.seeResults": "See results",
  "scenarios.nextStep": "Next step",
  "scenarios.evaluating": "HARIS is evaluating...",
  "scenarios.redFlags": "Red flags to remember:",
  "scenarios.tryAnother": "Try another scenario",
  "scenarios.testReal": "Test a real message",
  "scenarios.caught": "You caught this!",
  "scenarios.missed": "Missed: {reason}",
  "scenarios.overFlagged": "Good instinct, but this one was safe.",
  "scenarios.perfect": "Perfect score! You are a human firewall.",
  "scenarios.strong": "Strong instincts! One slip — review what you missed.",
  "scenarios.gettingThere": "Getting there. Scammers almost had you.",
  "scenarios.fooled": "This scenario would have fooled you — but not anymore.",
  "scenarios.scoreTitle": "{safe}/{total} Safe Choices",
  "scenarios.scoreXp": "+{xp} XP",

  // Voice lab
  "voice.title": "Voice Lab",
  "voice.subtitle":
    "Hear a real scam call. Flag the red flags in real time. Train your ear.",
  "voice.redFlagCount": "{count} red flags",
  "voice.answer": "Answer Call",
  "voice.endCall": "End Call",
  "voice.flag": "FLAG — Suspicious!",
  "voice.flagged": "Flagged",
  "voice.instructions":
    "Answer the call. Tap FLAG the moment a line feels off — you will not be told whether you were right until the debrief.",
  "voice.unsupported":
    "This browser cannot read the call aloud. Chrome, Edge or Safari support it.",
  "voice.skipToDebrief": "Skip to the debrief",
  "voice.debrief": "Call Debrief",
  "voice.caught": "You caught {caught} of {total} red flags.",
  "voice.writingDebrief": "HARIS is writing your debrief...",
  "voice.tryAnother": "Try another call",
  "voice.goToScenarios": "Go to Scenarios",
  "voice.line": "Line {current} of {total}",
  "voice.callProgress": "Call progress",

  // Difficulty levels
  "difficulty.Beginner": "Beginner",
  "difficulty.Intermediate": "Intermediate",
  "difficulty.Advanced": "Advanced",

  // Prompt Injection Sandbox
  "sandbox.title": "Prompt Injection Sandbox",
  "sandbox.subtitle": "Practice attacks in a sealed simulator, then build defenses that stop them.",
  "sandbox.safety":
    "Everything here is simulated with mock data. Never use real credentials, and never try these techniques outside the sandbox.",
  "sandbox.redTab": "Red Team",
  "sandbox.blueTab": "Blue Team",
  "sandbox.specTab": "Spec & Dataset",

  "sandbox.red.title": "Red Team Attack Sandbox",
  "sandbox.red.choose": "Choose a level",
  "sandbox.red.level": "Level {level}",
  "sandbox.red.objective": "Objective",
  "sandbox.red.target": "Target state",
  "sandbox.red.operational": "Operational",
  "sandbox.red.degraded": "Degraded",
  "sandbox.red.locked": "Locked",
  "sandbox.red.console": "Console",
  "sandbox.red.inputLabel": "Your attack",
  "sandbox.red.placeholder": "Ask the simulated assistant for something it should refuse...",
  "sandbox.red.submit": "Send attack",
  "sandbox.red.reset": "Reset target",
  "sandbox.red.attempts": "Attempts: {count}",
  "sandbox.red.matched": "Matched flags",
  "sandbox.red.progress": "{solved} of {total} solved",
  "sandbox.red.success": "Success",
  "sandbox.red.stopped": "Stopped",
  "sandbox.red.hint": "Hint",
  "sandbox.red.complete": "Challenge complete",

  "sandbox.blue.title": "Blue Team Guardrail Workshop",
  "sandbox.blue.systemPrompt": "System prompt",
  "sandbox.blue.stripControl": "Strip control characters",
  "sandbox.blue.removeFences": "Remove forged boundary tags",
  "sandbox.blue.neutralizeOverrides": "Neutralize override instructions",
  "sandbox.blue.open": "Opening delimiter",
  "sandbox.blue.close": "Closing delimiter",
  "sandbox.blue.requireClosed": "Require a closed boundary",
  "sandbox.blue.denyOutput": "Block restricted markers in output",
  "sandbox.blue.run": "Run evaluation",
  "sandbox.blue.enableAll": "Enable all defenses",
  "sandbox.blue.reset": "Reset defenses",
  "sandbox.blue.defense": "Defense efficacy",
  "sandbox.blue.utility": "Utility",
  "sandbox.blue.log": "Execution log",
  "sandbox.blue.blocked": "Blocked",
  "sandbox.blue.allowed": "Allowed",
  "sandbox.blue.passed": "Passed",
  "sandbox.blue.failed": "Failed",
  "sandbox.blue.noRun": "Run the evaluation to see results.",

  "sandbox.spec.title": "System specification",
  "sandbox.spec.schemas": "Data schemas",
  "sandbox.spec.engine": "Logic engine",
  "sandbox.spec.architecture": "Component architecture",
  "sandbox.spec.dataset": "Evaluation battery",
  "sandbox.spec.redLevels": "Red challenges",
  "sandbox.spec.vectors": "Attack vectors",
  "sandbox.spec.benign": "Benign baseline",

  // About
  "about.title": "About HARIS",
  "about.builtFor": "Built for students",
  "about.body":
    "HARIS is a cybersecurity awareness platform designed for high school students (K11–K12). In a world where teenagers face online threats daily — through social media, gaming, messaging apps, and fake offers — HARIS trains real instincts through AI-powered analysis, interactive scenarios, and voice simulations.",
  "about.threeWays": "Ways to learn",
  "about.analyzerTitle": "Message Analyzer",
  "about.analyzerDesc":
    "Paste any suspicious message and discover through clues what kind of attack it is.",
  "about.scenariosTitle": "Scenario Simulator",
  "about.scenariosDesc":
    "Live through realistic attack scenarios. Make choices. Learn from every decision.",
  "about.voiceTitle": "Voice Lab",
  "about.voiceDesc":
    "Hear vishing calls in Arabic and English. Flag red flags in real time. Train your ear.",
  "about.howItTeaches": "How it teaches",
  "about.teachesBody1":
    "Rather than lecturing students about threats, HARIS makes them work them out. Every analysis reveals one clue at a time, so a student forms their own hypothesis before seeing the verdict. Scenarios and voice calls put the decision in their hands, and feedback arrives immediately afterwards while the reasoning is still fresh.",
  "about.teachesBody2":
    "The aim is to make the skill automatic: not “HARIS said this was a scam” but “I noticed the urgency and the payment channel, so I stopped.”",
  "about.threatTypes": "Supported threat types",

  // Threat type names. These are also what the model returns in `attack_type`,
  // so they are kept identical rather than translated per-locale.
  "threat.phishing": "Phishing",
  "threat.vishing": "Vishing",
  "threat.smishing": "Smishing",
  "threat.fakeGiveaways": "Fake Giveaways",
  "threat.gamingScams": "Gaming Scams",
  "threat.socialEngineering": "Social Engineering",
  "threat.strangerDanger": "Stranger Danger",
  "threat.safeMessages": "Safe Messages",

  // 404
  "notFound.title": "This page does not exist",
  "notFound.body":
    "The link may be out of date, or the address may have a typo. Nothing was lost — your XP is stored on this device.",
  "notFound.home": "Analyse a message",
  "notFound.scenarios": "Browse scenarios",

  // Error boundary
  "error.title": "Something went wrong",
  "error.body":
    "HARIS hit an unexpected error and stopped. Your XP is safe — it is stored on this device.",
  "error.retry": "Try again",
  "error.reload": "Reload the page",

  // Setup screen
  "setup.title": "HARIS needs its environment variables",
  "setup.body": "The app could not start because these variables are not set:",
  "setup.step1": "Copy .env.example to .env",
  "setup.step2":
    "Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from your Supabase project (Project Settings → API)",
  "setup.step3": "Restart the dev server",
  "setup.backend":
    "The backend also needs LLM_API_KEY and SUPABASE_SERVICE_ROLE_KEY as edge function secrets. See supabase/README.md.",
} as const;

export type MessageKey = keyof typeof en;
