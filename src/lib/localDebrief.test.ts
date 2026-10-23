import { describe, expect, it } from "vitest";
import { voiceCalls, type VoiceCall } from "@/data/voiceCalls";
import { buildLocalDebrief } from "@/lib/localDebrief";

const call = voiceCalls[0];

describe("buildLocalDebrief", () => {
  it("names a missed flag and marks the review as local", () => {
    const firstRedFlag = call.lines.findIndex((line) => line.isRedFlag);
    const result = buildLocalDebrief(call, 1, new Set([firstRedFlag]));

    expect(result.source).toBe("local");
    expect(result.debrief).toContain("1 of");
    expect(result.debrief).toContain("missed");
    expect(result.top_tip).toMatch(/clearest miss/);
    expect(result.debrief_ar).toBeTruthy();
    expect(result.top_tip_ar).toBeTruthy();
  });

  it("congratulates a clean run without inventing a miss", () => {
    const all = new Set(
      call.lines
        .map((line, index) => (line.isRedFlag ? index : -1))
        .filter((index) => index >= 0),
    );
    const result = buildLocalDebrief(call, all.size, all);

    expect(result.debrief).toContain("caught all");
    expect(result.top_tip).toContain("caught every flag");
  });

  it("uses neutral wording when a flag has no stored reason", () => {
    const bare: VoiceCall = {
      ...call,
      lines: [
        { text: "You won a prize.", lang: "en", isRedFlag: true },
        {
          text: "Send the fee.",
          lang: "en",
          isRedFlag: true,
          flagReason: "An unofficial payment channel",
        },
      ],
    };

    const result = buildLocalDebrief(bare, 0, new Set());

    expect(result.debrief).toContain("a red flag you did not flag");
    expect(result.debrief).toContain("An unofficial payment channel");
    expect(result.debrief_ar).toContain("علامة تحذير لم تلتقطها");
    expect(result.debrief_ar).toContain("An unofficial payment channel");
    expect(result.top_tip).toContain("a red flag");
    expect(result.top_tip_ar).toContain("علامة تحذير");
  });

  it("falls back to the English reason when the Arabic one is missing", () => {
    const englishOnly: VoiceCall = {
      ...call,
      lines: [
        {
          text: "Caller refuses to give a number.",
          lang: "en",
          isRedFlag: true,
          flagReason: "An unverified caller",
        },
      ],
    };

    const result = buildLocalDebrief(englishOnly, 0, new Set());

    expect(result.top_tip_ar).toContain("An unverified caller");
  });
});
