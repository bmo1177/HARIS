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
  "nav.skip": "Skip to content",

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
  "analyzer.tagline": "Every verdict comes with the evidence behind it.",
  "analyzer.label": "Paste a suspicious message",
  "analyzer.placeholder":
    "Paste any suspicious message here — SMS, WhatsApp, email, DM... (Arabic or English)",
  "analyzer.counter": "{count} / {max}",
  "analyzer.tooLong":
    "Too long — {count} characters. Trim it to {max} or fewer.",
  "analyzer.tryExample": "Try an example:",
  "analyzer.submit": "Analyze with HARIS",
  "analyzer.submitting": "HARIS is analyzing...",
  "analyzer.rateLimited": "Rate limit reached — you can try again in {seconds}s.",
  "analyzer.wait.headline": "Reading the message for red flags",
  "analyzer.wait.elapsed": "{seconds}s",
  // Screen-reader-only equivalent of the visible timer. It has to be a separate
  // key because "{seconds}s" narrated aloud is just "0 s"; the visible text is
  // aria-hidden and this is the only thing assistive tech receives.
  "analyzer.wait.elapsedSr": "Elapsed time: {seconds} seconds",
  "analyzer.wait.typical": "This usually takes 15-30 seconds.",
  "analyzer.wait.slow": "Taking longer than usual. Still working.",
  "analyzer.wait.cancel": "Cancel",
  "analyzer.wait.cancelled": "Analysis cancelled.",
  "analyzer.wait.skeletonVerdict": "Your verdict will appear here",
  "analyzer.wait.keepOpen": "You can leave this page - the analysis will be cancelled.",
  "analyzer.method":
    "You get the verdict first, then the evidence one clue at a time — and you name the attack before HARIS does.",
  "analyzer.privacy":
    "Sent to an AI model for analysis; HARIS does not save it. Don't paste live passwords or card numbers.",
  "example.freePass": "Free conference pass",
  "example.phishingLink": "Phishing link",
  "example.safeMessage": "Safe message",
  "example.fakeRecruiter": "Fake recruiter",

  // Analysis results
  "results.whyFlagged": "Why HARIS flagged this",
  "results.whySafe": "Why this looks safe",
  "results.message": "The message",
  "results.whatThisIs": "What this is",
  "results.readIn": "Read in",
  "results.clueProgress": "{shown} of {total} clues",
  "results.nextSteps": "What to do now",
  "results.limits":
    "An AI assessment, not a guarantee. Verify anything that matters through the official app or site.",
  "results.next.dangerous.1": "Don't click links, open attachments or reply.",
  "results.next.dangerous.2":
    "Verify through the official app, or a number you already have — not the one in the message.",
  "results.next.dangerous.3":
    "Report it, then delete it. Keep a screenshot if it names your institution or employer.",
  "results.next.suspicious.1": "Verify the sender through a channel you already trust.",
  "results.next.suspicious.2": "Open the service directly instead of using the link.",
  "results.next.suspicious.3": "If it claims to be someone you know, call them.",
  "results.next.safe.1":
    "Nothing to act on. If you're still unsure, check the sender through another channel.",
  "results.next.safe.2": "Keep the habit: read the domain before you click, even on a quiet day.",
  "risk.verdict": "Verdict",
  "risk.zones": "Verdict scale: safe, suspicious, dangerous",
  "risk.summary.Safe":
    "Nothing in this message asks you to act, click, pay or disclose anything.",
  "risk.summary.Suspicious":
    "Parts of this message match known attack patterns, but not enough to call it. Treat it as unverified.",
  "risk.summary.Dangerous":
    "This message carries the patterns of an attack. Don't click links, open attachments or reply.",
  "risk.Safe": "Safe",
  "risk.Suspicious": "Suspicious",
  "risk.Dangerous": "Dangerous",
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
  "scenarios.subtitle": "Work through an attack as it unfolds. Make the call. Learn from it.",
  "scenarios.available": "{count} scenarios and {calls} voice calls available today.",
  "scenarios.upToXp": "up to {xp} XP",
  "scenarios.back": "Back",
  "scenarios.step": "Step {current} of {total}",
  "scenarios.seeResults": "See results",
  "scenarios.nextStep": "Next step",
  "scenarios.evaluating": "HARIS is evaluating...",
  "scenarios.redFlags": "Red flags to remember:",
  // Shown when the AI call fails and the app falls back to canned coaching.
  // These were hardcoded English inside the page, so an Arabic student whose
  // request failed was coached in the language they read least well.
  "scenarios.fallback.safe": "Smart move! You spotted the red flag.",
  "scenarios.fallback.unsafe":
    "Be careful — this could put your personal information at risk.",
  "scenarios.fallback.neutral": "Not the worst choice, but there's a safer option.",
  "scenarios.fallback.redFlag": "Watch for this pattern in real life.",
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
    "Hear a simulated scam call. Flag the red flags in real time. Train your ear.",
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
  // Architecture bullets. These were five English <li> elements on a page whose
  // headings and data were already bilingual, so an Arabic reader got an Arabic
  // section title above a paragraph of English.
  "sandbox.arch.tabs": "Sandbox page: mode tabs — RedSandbox, BlueWorkshop, SandboxSpec.",
  "sandbox.arch.red":
    "RedSandbox: level picker, console, state badge, hint box; state only, verdicts from the engine.",
  "sandbox.arch.blue":
    "BlueWorkshop: defense editors, run button, metric bars, execution log.",
  "sandbox.arch.engine":
    "Engine: sanitize, boundary, simulate, evaluate — pure functions, fully unit-tested.",
  "sandbox.arch.dataset":
    "Dataset: four red challenges, ten fixed battery cases; mock markers only.",

  // About
  "about.title": "About HARIS",
  "about.body":
    "HARIS is a cybersecurity awareness trainer for master's students in security. It assumes you already know what phishing is, and trains the part a lecture cannot: reading a live message and deciding, under time pressure, whether to trust it. Every analysis shows its evidence, every scenario asks for a decision, and every call makes you catch the wording as it goes past.",
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
    "Rather than lecturing students about threats, HARIS makes them work the message out. The verdict comes first, then the evidence arrives one clue at a time, so the reasoning is something a student reconstructs rather than something they are told. Scenarios and voice calls put the decision in their hands, and feedback arrives immediately afterwards while the reasoning is still fresh.",
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
  "notFound.home": "Analyze a message",
  "notFound.scenarios": "Browse scenarios",

  // Error boundary
  "error.title": "Something went wrong",
  "error.body":
    "HARIS hit an unexpected error and stopped. Your XP is safe — it is stored on this device.",
  "error.retry": "Try again",
  "error.reload": "Reload the page",
  // One key per HarisErrorCode, so an Arabic user gets an Arabic toast. These
  // mirror the server's SAFE_MESSAGE map: the server returns a fixed English
  // sentence per code, and the client previously rendered that sentence as-is
  // in every locale.
  "error.invalid_request": "That request could not be processed. Check the input and try again.",
  "error.rate_limited": "Too many requests. Take a short break, then try again.",
  "error.rate_limited_wait": "Too many requests. Try again in {seconds} seconds.",
  "error.service_unavailable": "HARIS is briefly unavailable. Please try again in a moment.",
  "error.provider_unauthorized":
    "HARIS cannot reach the AI provider right now. Please try again in a moment.",
  "error.upstream_error": "The analysis could not be completed. Please try again.",
  "error.internal_error": "Something went wrong. Please try again.",
  "error.network_error": "Could not reach HARIS. Check your connection and try again.",
  "error.timeout": "HARIS took too long to respond. Please try again.",
  "error.invalid_response": "HARIS sent back something unexpected. Please try again.",

  // Setup screen
  "setup.title": "HARIS needs its environment variables",
  "setup.body": "The app could not start because these variables are not set:",
  "setup.step1": "Copy .env.example to .env",
  "setup.step2":
    "Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from your Supabase project (Project Settings → API)",
  "setup.step3": "Restart the dev server",
  "setup.fix": "To fix it:",
  "setup.backend":
    "The backend also needs LLM_API_KEY and SUPABASE_SERVICE_ROLE_KEY as edge function secrets. See supabase/README.md.",

  // Route-level lazy-loading fallback
  "route.loading": "Loading...",
} as const;

export type MessageKey = keyof typeof en;
