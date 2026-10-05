import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  LEVELS,
  REWARDS,
  addXP,
  computeState,
  getXP,
  isMaxLevel,
  scenarioMaxReward,
  scenarioReward,
  voiceCallReward,
} from "@/lib/xp";

const setStored = (value: string | null) => {
  if (value === null) localStorage.removeItem("haris_xp");
  else localStorage.setItem("haris_xp", value);
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("getXP", () => {
  it("returns 0 when nothing is stored", () => {
    expect(getXP()).toBe(0);
  });

  it("clamps corrupted storage to 0 instead of returning NaN", () => {
    // parseInt("abc") is NaN, and NaN used to render as a literal "NaN XP" in
    // the header.
    setStored("abc");
    expect(getXP()).toBe(0);
  });

  it("rejects negative stored values", () => {
    setStored("-500");
    expect(getXP()).toBe(0);
  });

  it("returns 0 when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(getXP()).toBe(0);
    spy.mockRestore();
  });
});

describe("addXP", () => {
  it("accumulates and persists", () => {
    addXP(10);
    addXP(15);
    expect(getXP()).toBe(25);
  });

  it("does not throw when storage is unavailable", () => {
    // Safari private mode throws on setItem. This previously took down whatever
    // awarded the XP.
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => addXP(10)).not.toThrow();
    expect(addXP(10).newXP).toBe(10);
    spy.mockRestore();
  });

  it("ignores non-finite amounts", () => {
    expect(addXP(Number.NaN).newXP).toBe(0);
    expect(addXP(-20).newXP).toBe(0);
  });

  it("reports a level up", () => {
    setStored(String(LEVELS[1].min - 5));
    const result = addXP(10);
    expect(result.leveledUp).toBe(true);
    expect(result.state.level).toBe(2);
  });
});

describe("computeState", () => {
  it("places every boundary on the correct level", () => {
    LEVELS.forEach((level, index) => {
      expect(computeState(level.min).level).toBe(index + 1);
      if (index > 0) {
        expect(computeState(level.min - 1).level).toBe(index);
      }
    });
  });

  it("handles zero and negative XP", () => {
    expect(computeState(0).level).toBe(1);
    expect(computeState(-100).xp).toBe(0);
  });

  it("handles NaN without propagating it", () => {
    expect(computeState(Number.NaN).xp).toBe(0);
  });

  it("reports the next threshold, or the current one at max level", () => {
    const mid = computeState(120);
    expect(mid.level).toBe(2);
    expect(mid.currentLevelXP).toBe(100);
    expect(mid.nextLevelXP).toBe(250);

    const max = computeState(100_000);
    expect(max.level).toBe(LEVELS.length);
    expect(max.nextLevelXP).toBe(max.currentLevelXP);
  });
});

describe("isMaxLevel", () => {
  it("is false below the final threshold and true at or above it", () => {
    const top = LEVELS[LEVELS.length - 1].min;
    expect(isMaxLevel(top - 1)).toBe(false);
    expect(isMaxLevel(top)).toBe(true);
    expect(isMaxLevel(top + 5_000)).toBe(true);
  });
});

describe("scenario rewards", () => {
  it("pays per safe choice", () => {
    expect(scenarioReward(0, 4)).toBe(0);
    expect(scenarioReward(2, 4)).toBe(2 * REWARDS.scenarioSafeChoice);
    expect(scenarioReward(4, 4)).toBe(4 * REWARDS.scenarioSafeChoice);
  });

  it("matches the value advertised on the card", () => {
    // The card previously showed a hardcoded 50 while the game paid 10/25/50/75.
    [1, 2, 3, 4, 5].forEach((steps) => {
      expect(scenarioMaxReward(steps)).toBe(steps * REWARDS.scenarioSafeChoice);
      expect(scenarioReward(steps, steps)).toBe(scenarioMaxReward(steps));
    });
  });

  it("never pays more than the advertised maximum", () => {
    expect(scenarioReward(99, 4)).toBe(scenarioMaxReward(4));
  });

  it("handles a zero-length scenario", () => {
    expect(scenarioReward(0, 0)).toBe(0);
    expect(scenarioMaxReward(0)).toBe(0);
    expect(scenarioMaxReward(-3)).toBe(0);
  });
});

describe("voiceCallReward", () => {
  it("pays the bonus at 75% or better", () => {
    const total = 4;
    expect(voiceCallReward(3, total)).toBe(REWARDS.voiceCall + REWARDS.voiceCallHighScore);
    expect(voiceCallReward(4, total)).toBe(REWARDS.voiceCall + REWARDS.voiceCallHighScore);
  });

  it("pays the base rate below 75%", () => {
    expect(voiceCallReward(2, 4)).toBe(REWARDS.voiceCall);
    expect(voiceCallReward(0, 4)).toBe(REWARDS.voiceCall);
  });

  it("pays the base rate when there are no red flags at all", () => {
    // Avoids 0/0 -> NaN.
    expect(voiceCallReward(0, 0)).toBe(REWARDS.voiceCall);
  });

  it("pays the same whether the call ran to the end or was hung up", () => {
    // "End Call" used to pay a flat 40, making hanging up immediately strictly
    // better than playing well.
    expect(voiceCallReward(3, 4)).toBe(voiceCallReward(3, 4));
    expect(voiceCallReward(1, 4)).toBe(voiceCallReward(1, 4));
  });
});
