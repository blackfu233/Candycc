# Candy Orders

Two independent playable editions are included:

| Edition | Entry | Status |
| --- | --- | --- |
| Fixed orders with checkpoints and golden candies | [index.html](index.html) or [order-golden/index.html](order-golden/index.html) | Default; `goldenbonusrefresh1` playtest prototype |
| Original fixed orders | [fixed-orders.html](fixed-orders.html) | Original game preserved |

Serve this repository with a static web server. The root URL redirects to `/order-golden/`, preserving query parameters and the URL fragment. Use `/fixed-orders.html` to play the original. Each edition has its own game code, math config and assets. No build step or external asset CDN is required.

GitHub Pages: [current game](https://blackfu233.github.io/Candycc/) and [original fixed orders](https://blackfu233.github.io/Candycc/fixed-orders.html).

The golden edition is not a validated 95% RTP or real-money release. Its mathematical findings and remaining strategy risk are recorded in [MATH-STATUS.md](order-golden/MATH-STATUS.md). The simulator and raw simulation records are intentionally not included in this game-only repository.

The original game code, math config, styles and assets remain unchanged from commit `08a3e48`. Its former entry page is preserved as `fixed-orders.html`; only the default entry is switched. Switching editions does not require replacing game files.
