# Candy Orders

Two independent playable editions are included:

| Edition | Entry | Status |
| --- | --- | --- |
| Original fixed orders | [index.html](index.html) | Original game preserved |
| Fixed orders with checkpoints and golden candies | [order-golden/index.html](order-golden/index.html) | `goldenmath1` playtest prototype |

Serve this repository with a static web server. The root URL opens the original; append `/order-golden/` to play the golden edition. Each edition has its own game code, math config and assets. No build step or external asset CDN is required.

The golden edition is not a validated 95% RTP or real-money release. Its mathematical findings and remaining strategy risk are recorded in [MATH-STATUS.md](order-golden/MATH-STATUS.md). The simulator and raw simulation records are intentionally not included in this game-only repository.

The original root game files remain unchanged from commit `08a3e48`. Switching editions does not require replacing the original files.
