# Candy Orders - Conveyor Rush

Standalone three-lane conveyor-order prototype. All runtime files, vendor code,
and visual assets are local copies; the original game in the repository root is
not referenced at runtime.

Open `index.html` through a local static server to play this version.

The payout and ticket formulas live in `math-engine.js` and are shared with the
RTP simulator. Validate the current math configuration with:

```powershell
node --test math-engine.test.js
```
