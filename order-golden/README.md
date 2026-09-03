# Fixed Orders: Golden Candy Prototype

This folder is an isolated prototype derived from the checkpoint-order game.

- The repository root now opens this edition. The original remains at `fixed-orders.html`.
- Earlier conveyor work is kept separately; this release does not replace it.
- The local checkpoint-only experiment is not overwritten or required by this folder.
- This edition adds persistent golden candies with randomized reveal strength.

Milestones are shown as clean, unlabelled checkpoints on each progress bar. Their effects are revealed by a card and board animation when reached:

- Easy: candy shift.
- Medium: candy shift, then a striped candy.
- Hard: candy shift, a striped candy, then a bomb candy.

Golden candies can appear from ordinary paid moves, replace some checkpoint events, and join the bonus event ticket pool. A golden candy keeps its original match color. Its first clear cracks the shell and leaves a randomly selected special candy on the same cell for the player to use later.

## Play and math status

Open the repository root or `order-golden/index.html` through a static web server. All game assets are local to this folder; the simulator is not part of this release. Use `fixed-orders.html` at the repository root to play the original fixed-order edition.

Version `goldenmath1` adds tier-specific payout tickets and upgrade chances, more short-order tickets, and less extreme long targets for Medium/Hard orders. Golden candy arrival/reveal probabilities and Bonus payouts are unchanged. Rewards are sampled when the order completes; the reveal animation does not reroll them.

This is a playtest prototype, **not a validated 95% RTP game**. Independent finite-session results vary substantially by strategy, including results above 100%. See [math status and limitations](MATH-STATUS.md) before interpreting its rewards as a wagering model. No guaranteed player profit or operator profit is implied.

## Visual regression checks

Open `tests/golden-visuals.html` through the same local server to run the real Phaser sprite checks. This separate, labelled fixture is not loaded by the playable game and does not alter its probabilities or rewards.

The checks cover 500 normal/golden sprite removals, contour ownership and alignment for all five candy shapes on six- and nine-row boards, swaps, drops, simultaneous shell reveals, glow fade/pulse coordination, and a board reset while spawn animations are pending. The shape buttons expose static main/Bonus-size fixtures for visual inspection.
