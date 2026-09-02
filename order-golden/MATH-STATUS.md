# Golden Candy Math Status

Version: `goldenmath1`, 2026-09-02. Playtest prototype, not a real-money release or a certified 95% RTP configuration.

## Changes

- Need tickets: 45% short (0.20-0.50 of the template), 50% normal (0.90-1.25), 5% long (1.40-1.70). A new order is sampled independently; no short order or win is guaranteed.
- Main coin payout floors before upgrades: Easy 2x, Medium 3x, Hard 6x.
- Each tier independently selects a payout ticket: Standard 93%, Sweet 1.9%, Big 5%, Mega 0.1%. Big tickets pay at least 10x / 15x / 30x respectively. Factors scale with the actual order, not only the tier name.
- Upgrade chances: Easy 5%, Medium 20%, Hard 35%. These are completion-time rolls on coin-paying main orders. Upgrades multiply the sampled award; each simultaneous completion gets its own rolls and credit.
- Easy orders always include coins; 25% also include a scatter. Medium/Hard reward-type rules are unchanged.
- Main order templates and payout factors were retuned together. Medium/Hard goals are generally shorter; Easy templates are longer than before. Higher rare payouts do not mean every completion pays more.
- Golden arrival counts, reveal effects, checkpoints and Bonus payout rules are unchanged. No wallet-based payout adjustment or guaranteed return was added. Existing board-efficiency refill behavior remains part of this prototype.

## Independent validation

Five strategies, 200 independent sessions per strategy, starting bankroll 100 bets, fixed bet, at most 300 paid moves per session. Bankruptcy stops play; a triggered Bonus finishes before stopping. Total: 291,638 paid moves. Tuning used separate seeds from validation.

The local headless adapter runs this folder's actual move, match, gold, order, Bonus and settlement methods. Only rendering, sound and delays are removed. The older simulator without golden mechanics was not used as evidence for this release. Presentation RNG is omitted, so this is not a byte-for-byte browser random-sequence replay.

| Strategy | Paid moves | Main RTP | Bonus RTP | Total RTP | Approx. 95% interval |
| --- | ---: | ---: | ---: | ---: | ---: |
| Random legal move | 55,010 | 65.20% | 16.28% | 81.48% | 78.06-84.90% |
| Balanced visible strategy | 59,659 | 85.50% | 28.50% | 114.00% | 109.99-118.02% |
| Order priority | 59,085 | 79.64% | 25.39% | 105.03% | 101.67-108.39% |
| Immediate clears | 58,928 | 79.80% | 27.05% | 106.85% | 102.61-111.09% |
| Built-in AUTO | 58,956 | 77.54% | 23.95% | 101.49% | 98.16-104.81% |

RTP = actual credited rewards / actual paid bets. Bonus is credited once; its RTP uses the same paid-bet denominator. Intervals use session-cluster ratio variance and are approximate, particularly for rare prizes. Strategies are not averaged into a supposed overall RTP. This finite-bankroll, finite-horizon test is not a stationary long-run edge estimate and does not cover optimal/adversarial play or Bonus buys.

## Player experience

Old/new use 200 sessions per strategy with the same validation seed namespace and stopping rules. Changed rules consume RNG differently, so these are not paired identical boards.

| Metric | Old golden settings | goldenmath1 |
| --- | ---: | ---: |
| Paid steps per main award >=10x, across strategies | 49.8-64.9 | 51.0-68.3 |
| Paid steps per main award >=30x | 624.8-833.3 | 409.2-486.8 |
| Paid steps per main award >=50x | 6,000.0-8,568.4 | 1,104.8-1,281.0 |
| Random: profitable after 50 paid moves | 10.5% | 18.0% |
| AUTO: profitable after 50 paid moves | 21.0% | 31.0% |
| Random: ever doubled initial bankroll | 2.5% | 5.0% |
| AUTO: ever doubled initial bankroll | 10.0% | 15.5% |
| Random: paid steps per any main award | 5.7 | 7.1 |
| AUTO: paid steps per any main award | 4.9 | 6.1 |

These are observations, not scheduled payouts. The change increases the larger-award tail, not the frequency of every reward. Small awards are less frequent; long dry spells remain possible. The 200-session proportions are noisy and do not establish a precise probability of short-term profit. Stronger-strategy over-return must be addressed before any house-edge claim.

## Order timing example

Random strategy, main coin rewards only for the award-rate column:

| Tier | Old successful age | New successful age | Old paid steps per paid order | New paid steps per paid order | New average paid multiplier |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 6.1 | 9.4 | 6.4 | 9.7 | 2.88x |
| Medium | 41.3 | 26.9 | 46.7 | 29.8 | 5.40x |
| Hard | 93.8 | 60.1 | 121.3 | 74.2 | 12.80x |

Successful age is paid moves from creation to completion, excluding unfinished orders. Paid steps per paid order = all paid moves / actual coin-paying completions of that tier, including time spent without completing one. They are different metrics. The average paid multiplier includes upgrades, not only the displayed base range.

## Checks and reproducibility

- Wallet reconciled after every simulated move: starting wallet - debits + credited rewards = ending wallet.
- Legacy settings preserve baseline economic traces; immediate/omitted render callbacks preserve economic traces.
- All payout bands and 9,000 sampled draws stay within the corresponding displayed base range.
- Simultaneous completions settle independently; repeated processing cannot double-credit.
- Bonus cap and wallet credit reconcile exactly once in regression tests.
- All seven real Phaser visual regression checks passed, including 500 sprite removals and both board sizes. The fixture is separate from normal play; none of its scripted outcomes is used in the RTP sample.
- The playable browser build loaded its assets and ran AUTO without a captured JavaScript error; AUTO was stopped after the check.
- The complete run manifest, source snapshots and per-session records are retained locally, outside this game-only repository release.

Validation ID: `validation-d`; seed: `20260902-holdout-01`.

Canonical config SHA-256: `8a9e0f6605f7d95c5e395a33367c238ac515289d93e9fad54749b319953e80bd`.

Engine SHA-256: `93747ba9d1cc8ef0c0fdac8faad05a9f7a53973ddf5133a6f061fd91aa3dc11d`.

Remaining work: narrow the strategy RTP gap without hidden personal return control; evaluate longer funded sessions, Bonus buys, larger rare-event samples and browser/simulation statistical parity. Client-side RNG and wallet are for the demo only.
