import { describe, expect, it } from "vitest";
import { analyzeLocally, shouldAnalyzeLocally } from "@/lib/localAnalysis";

const UNIVERSITY_PHISH =
  "IT Helpdesk: your university account will be disabled in 24 hours for a security review. Re-verify your credentials here to keep access: univ-sso-verify.net/login";

describe("analyzeLocally", () => {
  it("recognises a credential phish and keeps every field bilingual", () => {
    const result = analyzeLocally(UNIVERSITY_PHISH);

    expect(result.risk_level).toBe("Dangerous");
    expect(result.is_threat).toBe(true);
    expect(result.attack_type).toMatch(/Credential/);
    expect(result.analysis_source).toBe("local");
    expect(result.clue_1_ar).toBeTruthy();
    expect(result.clue_2_ar).toBeTruthy();
    expect(result.clue_3_ar).toBeTruthy();
    expect(result.explanation_ar).toBeTruthy();
  });

  it("leaves a routine seminar message alone", () => {
    const result = analyzeLocally(
      "The seminar has moved to Room 204 on Thursday at 10:00. Bring the reading from last week — we'll start with the case study.",
    );

    expect(result.risk_level).toBe("Safe");
    expect(result.is_threat).toBe(false);
    expect(result.attack_type).toBe("Safe");
    expect(result.risk_score).toBeLessThan(25);
  });

  it("does not call a prize scam safe", () => {
    const result = analyzeLocally(
      "You've won a free pass to the AI Security Summit 2026! Claim it within 2 hours: ai-security-summit-tickets.com/claim",
    );

    expect(result.is_threat).toBe(true);
    expect(result.risk_score).toBeGreaterThanOrEqual(25);
  });

  it("reads Arabic pressure and credential terms", () => {
    const result = analyzeLocally(
      "عزيزي العميل، سيتم تعطيل حسابك خلال 24 ساعة. أعد التحقق من بيانات الدخول هنا: univ-sso-verify.net/login",
    );

    expect(result.risk_level).toBe("Dangerous");
    expect(result.is_threat).toBe(true);
    expect(result.clue_1_ar).toBeTruthy();
  });

  it("identifies a job scam that asks for identity and bank details", () => {
    const result = analyzeLocally(
      "Hi, I found your CV on LinkedIn. We're hiring a remote security analyst at $180/hour. Send your ID and bank details today: careers-verify.io/apply",
    );

    expect(result.is_threat).toBe(true);
    expect(result.attack_type).toBe("Employment Scam");
  });
});

describe("link classification", () => {
  it.each([
    {
      name: "a brand used outside its own domain",
      message: "Your PayPal account needs attention: paypal-secure.net",
      clue: /borrows a familiar name/,
    },
    {
      name: "a shortener",
      message: "Track your parcel: bit.ly/3abc",
      clue: /shortened/,
    },
    {
      name: "a raw IP address",
      message: "Open http://192.0.2.10/track",
      clue: /raw IP address/,
    },
    {
      name: "a raw IP address on a port",
      message: "Open http://192.0.2.10:8080/track",
      clue: /raw IP address/,
    },
    {
      name: "a disposable TLD",
      message: "Your account will be closed. Details at mystery-box.xyz",
      clue: /cheap extension/,
    },
    {
      name: "a padded domain",
      message: "Your account will be suspended. Reset at secure-account-check.net",
      clue: /strings several words/,
    },
  ])("flags $name", ({ message, clue }) => {
    const result = analyzeLocally(message);
    const clues = `${result.clue_1} ${result.clue_2} ${result.clue_3}`;

    expect(result.risk_level).toBe("Suspicious");
    expect(clues).toMatch(clue);
  });

  it("does not treat an official brand domain as a lookalike", () => {
    expect(analyzeLocally("Pay at https://paypal.com/checkout").risk_level).toBe("Safe");
    expect(analyzeLocally("Pay at https://checkout.paypal.com/order").risk_level).toBe("Safe");
  });

  it("ignores hosts it cannot classify instead of inventing a link", () => {
    // An unknown TLD, a malformed URL and a repeated host: none is evidence of
    // an attack, and none should become a link clue.
    expect(analyzeLocally("Download from files.internal").risk_level).toBe("Safe");
    expect(analyzeLocally("Open https:/// now").risk_level).toBe("Safe");
    expect(analyzeLocally("Notes at example.org and example.org").risk_level).toBe("Safe");
    expect(analyzeLocally("See ab-cd-ef.org for the schedule").risk_level).toBe("Safe");
  });

  it("keeps a routine message with a link safe, without calling the link harmless", () => {
    const result = analyzeLocally(
      "The reading is at example.org/reading. We meet on Thursday at 10:00.",
    );

    expect(result.risk_level).toBe("Safe");
    expect(result.clue_1).toMatch(/link alone is not evidence/i);
  });
});

describe("single signals", () => {
  it.each([
    ["a credential request", "Enter your one-time code", "Credential Phishing"],
    ["a threat", "Your account will be terminated", "Social Engineering"],
    ["a prize", "You are our winner", "Prize or Payment Scam"],
    ["a secrecy demand", "Keep this between us", "Social Engineering"],
  ])("does not call %s safe", (_name, message, attackType) => {
    const result = analyzeLocally(message);

    expect(result.risk_level).toBe("Suspicious");
    expect(result.attack_type).toBe(attackType);
  });

  it("fills the three clues when there is only one finding", () => {
    const result = analyzeLocally("Keep this between us");

    expect(result.clue_2).toMatch(/Start from the organisation/);
    expect(result.clue_3).toMatch(/report it/);
  });

  it("keeps a deadline in an otherwise safe message from adding a no-pressure clue", () => {
    const result = analyzeLocally("Urgent: the seminar starts at 10:00.");

    expect(result.risk_level).toBe("Safe");
    expect(result.clue_1).toMatch(/no link/i);
    expect(result.clue_2).toMatch(/does not ask for a password/i);
  });

  it("reads an attachment instruction", () => {
    const result = analyzeLocally("Please open the attached file and enable macros.");

    expect(result.risk_level).toBe("Safe");
  });

  it("names a payment-only scam and a fee attached to a job", () => {
    const payment = analyzeLocally("Pay the invoice within 24 hours");
    expect(payment.risk_level).toBe("Suspicious");
    expect(payment.attack_type).toBe("Prize or Payment Scam");

    const job = analyzeLocally("We are hiring remote staff. A $50 training fee applies.");
    expect(job.attack_type).toBe("Employment Scam");
  });
});

describe("Arabic signals", () => {
  it.each([
    ["a credential request", "يرجى إدخال كلمة المرور", "Suspicious"],
    ["urgency", "عاجل: حدّث بياناتك", "Safe"],
    ["a threat", "سيتم إغلاق حسابك", "Suspicious"],
    ["a prize", "ربحت جائزة مجاناً", "Suspicious"],
    ["a payment", "يرجى دفع رسوم الشحن", "Suspicious"],
    ["an authority claim", "رسالة من البنك", "Safe"],
    ["a secrecy demand", "لا تخبر أحداً", "Suspicious"],
    ["an attachment", "حمّل الملف المرفق", "Safe"],
    ["a call to action", "اضغط هنا", "Safe"],
    ["a job offer", "عرض عمل براتب جيد", "Safe"],
  ])("reads %s written only in Arabic", (_name, message, level) => {
    const result = analyzeLocally(message);

    expect(result.risk_level).toBe(level);
    expect(result.explanation_ar).toBeTruthy();
    expect(result.clue_1_ar).toBeTruthy();
  });
});

describe("shouldAnalyzeLocally", () => {
  it("continues the lesson when the deployment is unreachable", () => {
    expect(shouldAnalyzeLocally("network_error")).toBe(true);
    expect(shouldAnalyzeLocally("service_unavailable")).toBe(true);
    expect(shouldAnalyzeLocally("timeout")).toBe(true);
  });

  it("does not bypass a rate limit or a rejected request", () => {
    expect(shouldAnalyzeLocally("rate_limited")).toBe(false);
    expect(shouldAnalyzeLocally("invalid_request")).toBe(false);
  });
});
