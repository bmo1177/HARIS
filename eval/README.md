# HARIS evaluation

"How accurate is HARIS?" is the first question any reviewer asks about a security tool. This
directory answers it — or at least makes the question answerable.

```bash
# Harness self-test. No API key, no network. Proves the runner works and the
# arithmetic is right; says nothing about accuracy.
deno run --allow-env --allow-net eval/run.ts

# Real numbers. Needs LLM_API_KEY (plus optionally LLM_BASE_URL / LLM_MODEL).
deno run --allow-env --allow-net eval/run.ts --provider=live

# Machine-readable, for CI or a results file.
deno run --allow-env --allow-net eval/run.ts --provider=live --json > results.json

# Narrow in on a class while iterating on the prompt.
deno run --allow-env --allow-net eval/run.ts --provider=live --filter=benign
```

## What it measures

| Metric                                      | Why it is here                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **False-positive rate** on the benign class | The headline number. A tool that flags ordinary messages teaches students to ignore it, and then it has taught them nothing.                                                                |
| **Recall** on the hostile class             | The other half. A miss is a student who clicks the link.                                                                                                                                    |
| **Injection robustness**                    | Whether the `inject-*` cases still get scored on their content, rather than on the instructions riding inside them.                                                                         |
| **Attack-type accuracy**                    | Reported separately and never gating. Category naming is genuinely fuzzy — is a prize scam "Phishing" or "Social Engineering"? — and a strict metric would mostly measure annotation taste. |

The dataset is at [`dataset.ts`](dataset.ts). It is **deliberately weighted towards benign
messages**, because that is the class that fails quietly.

## Design notes

**It calls the analysis code directly.** Not through HTTP, not through a deployed function.
`analyzeMessage()` lives in [`_shared/analysis.ts`](../supabase/functions/_shared/analysis.ts) and
is imported by both `analyze-message/index.ts` and this harness, so what gets measured is the code
path that serves students. A harness pointed at the transport would mostly prove that HTTP works.

**Verdicts are derived, not model-authored.** `risk_level` and `is_threat` are computed from
`risk_score` in `reconcile()`. The harness asserts on the derived fields deliberately: that
indirection is the main defence against prompt injection (see
[the threat model](../supabase/README.md)), and it is only meaningful if something checks it.

**Labels are coarse.** `expected_risk` is a band, not a score. "Is this message dangerous?" is
answerable. "Is 62 the right score?" is not, and a metric built on it would be noise.

**Some cases are genuinely ambiguous on purpose.** `benign-006` (a courier address-update notice)
and `benign-015` (a genuine new-device login alert) are real cases where reasonable people disagree.
They are in the set because a dataset containing only easy cases measures nothing. They are also the
first place to look when the false-positive rate moves.

## CI

`.github/workflows/ci.yml` runs the mock provider on every push, which verifies the harness itself:
that the dataset parses, that the metrics compute, and that the injection gate fires when it should.

The `live` job is gated behind a repository secret and only runs when `LLM_API_KEY` is present:

```yaml
- name: Live evaluation
  if: ${{ secrets.LLM_API_KEY != '' }}
  run: deno run --allow-env --allow-net eval/run.ts --provider=live
```

## Why it does not gate on accuracy

Accuracy moves with the model and the prompt, and a hard threshold turns a routine model upgrade
into a red build that everyone learns to bypass. Two things _are_ gated, because they are
correctness failures rather than tuning knobs:

- any case failing to produce a verdict
- any prompt-injection case being steered by its payload

If you want to track accuracy over time, `--json` output is stable enough to commit to `results/`
and diff between runs. Do that before adding a gate.

## Measured results

Full 45-case run against **`nvidia/nemotron-3-super-120b-a12b` on NVIDIA Build**
(`integrate.api.nvidia.com`), which honours `response_format` and has no daily
cap. Exit 0, zero errors, every case measured.

```
overall accuracy        84.4%
FALSE POSITIVE RATE      0.0%
recall on hostile       77.3%
precision              100.0%
F1                      87.2%
attack-type accuracy    45.5%   (22 labelled, advisory)
injection robustness    4/4

  Safe         23/23  100.0%
  Suspicious    0/4    0.0%
  Dangerous    15/18   83.3%
```

**The false-positive fix is confirmed: 93.3% → 0.0%.** Mapping `low` below the
suspicious threshold, rather than above it, is what did that.

### What the numbers do not cover

This model is **binary in practice**. It used `none` and `low` for every benign
message and `high` for every obvious attack, and never once chose `medium` —
which is why Suspicious scores 0/4. All the lost recall is the middle register:

- `subtle-003` (a friend's name turned against the reader) came back **Safe**.
- The four `Suspicious` cases are deliberately borderline, and all four came back
  Safe.

So the failure mode is now *under*-detection on subtle social engineering, not
false alarms. For a classroom that is the safer direction — a student is never
scared by a normal message — but it means a genuinely tricky message reads as
harmless. Whether to accept that is a judgement call about the audience, not
something the harness should quietly paper over.

`attack-type` accuracy is 45.5% and advisory only: the model returns reasonable
but generic categories, which does not affect the verdict the student sees.

Neither number is a property of HARIS. Another model may use the middle band.
NVIDIA Build also offers `kimi-k3`, `glm-5.3-flash`, `deepseek-v4.1-flash`,
`nemotron-3-ultra` and others on the same key; measure with:

```bash
LLM_API_KEY=nvapi-... \
LLM_BASE_URL=https://integrate.api.nvidia.com/v1 \
LLM_MODEL=<candidate> \
npm run eval:live
```

Re-running on OpenRouter is still useful for comparison, but its 50/day ceiling
means a 45-case run cannot complete in one day.
