import type { VoiceCall } from "@/data/voiceCalls";
import type { VoiceDebrief } from "@/types/analysis";

/**
 * The debrief the client can write without a model.
 *
 * A completed call should not end in a spinner because the edge function is
 * unreachable. The transcript already contains every red flag and the reason
 * it is one, so the review can be assembled from the exercise itself. It is
 * marked `source: "local"` and labelled in the debrief panel.
 */
export function buildLocalDebrief(
  call: VoiceCall,
  caught: number,
  flags: ReadonlySet<number>,
): VoiceDebrief {
  const redFlags = call.lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.isRedFlag);
  const total = redFlags.length;
  const missed = redFlags.filter(({ index }) => !flags.has(index));

  const reasonsEn = missed
    .map(({ line }) => line.flagReason ?? "a red flag you did not flag")
    .join("; ");
  const reasonsAr = missed
    .map(
      ({ line }) =>
        line.flagReasonAr ?? line.flagReason ?? "علامة تحذير لم تلتقطها",
    )
    .join("؛ ");

  const debrief =
    missed.length > 0
      ? `You caught ${caught} of ${total} red flags. The ones you missed: ${reasonsEn}. The pattern is what matters: pressure, identity data or an unofficial payment channel in one call.`
      : `You caught all ${total} red flags. The next step is to hang up and verify through an official number.`;
  const debrief_ar =
    missed.length > 0
      ? `التقطت ${caught} من ${total} من علامات التحذير. ما فاتك: ${reasonsAr}. النمط هو المهم: ضغط وطلب بيانات هوية أو قناة دفع غير رسمية في مكالمة واحدة.`
      : `التقطت كل علامات التحذير وعددها ${total}. الخطوة التالية هي إنهاء المكالمة والتحقق عبر رقم رسمي.`;

  const firstMiss = missed[0]?.line;
  const top_tip =
    firstMiss !== undefined
      ? `The clearest miss: ${firstMiss.flagReason ?? "a red flag"}. Treat that line as your stop signal next time.`
      : "You caught every flag. Keep using the same rule: hang up, then call back on a number you already have.";
  const top_tip_ar =
    firstMiss !== undefined
      ? `أوضح ما فاتك: ${firstMiss.flagReasonAr ?? firstMiss.flagReason ?? "علامة تحذير"}. اعتبر ذلك السطر إشارة توقف في المرة القادمة.`
      : "التقطت كل العلامات. استمر في القاعدة نفسها: أنهِ المكالمة ثم اتصل برقم لديك مسبقاً.";

  return { debrief, debrief_ar, top_tip, top_tip_ar, source: "local" };
}
