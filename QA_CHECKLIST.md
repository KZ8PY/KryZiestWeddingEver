Visual QA Checklist — KryZiestWeddingEver

Purpose

- Quick visual smoke tests to confirm consolidation and style-audit changes didn't cause regressions.

How to run

1. Open `index.html` in your browser (double-click the file or run a static server).
   - Optional (Windows PowerShell):
     - python -m http.server 8000 ; then open http://localhost:8000 in your browser
2. Navigate to the home/hero section where the countdown and header live.

Checks

- Countdown visuals
  - Each countdown segment renders as a top-view coffee cup with a saucer.
  - Numbers are centered inside each cup and use the Prata font.
  - Labels (Days/Hours/Minutes/Seconds) appear beneath cups and are styled in the dark-roast token (look for warm, dark-brown tone).
  - Colons/separators are vertically aligned with the cup centers.
- Animation
  - Change a numeric value (simulate by editing the target date in `src/js/countdown.js` or wait until a change) and confirm only the changed cup animates.
- Header & layout
  - The floating menu (hamburger) is pinned to the left-most side of the header and visually aligned with the header content.
  - The monogram remains in the hero and uses the fixed/mobile size.
  - Header height and hero heading sizes remain stable and do not shrink unexpectedly.
- Typography & tokens
  - Page font uses Prata across headings and body where applicable.
  - There are no visible color regressions—shadows, cup cream tones, and text color look consistent.
- Responsiveness
  - Check small screens (device toolbar or narrow window): header shrinks as expected and countdown uses the `.small` modifier sizes.

If something looks off

- Capture a screenshot and note which check failed.
- Revert recent CSS tweaks in your editor and re-test small changes one at a time.

Optional: Run linter (recommended)

- To enforce no hex colors and no `!important`, install stylelint locally (node & npm required):
  - npm install --save-dev stylelint stylelint-config-standard
- Run stylelint from the project root:
  - npx stylelint "src/\*_/_.css"

Notes

- The `.small` modifier (on `#headerCountdown` or `.header-countdown`) preserves downsized header behavior; if you remove legacy classes from markup, adapt any script that toggles `.small` accordingly.

End of checklist.
