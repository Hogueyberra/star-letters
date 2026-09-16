# Star Letters

A bright, playful practice app for a kindergarten reader. She can learn **letter names**, **letter sounds**, and **sight words** with big buttons, cheerful colors, spoken audio, and stars for progress.

Built for Nick to open on a laptop or tablet — no account, no internet required after install.

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (this project uses **http://127.0.0.1:4545**).

To make a folder you can host anywhere (Netlify, GitHub Pages, a shared folder):

```bash
npm run build
```

The finished site lands in `dist/`. Preview it with `npm run preview`.

## How she plays

1. Type her name on the home screen (or leave it blank — she will be **Friend**).
2. Pick a mode: **Letters**, **Sounds**, **Sight Words**, or **Mix Review**.
3. Tap huge answer buttons. Correct answers earn stars and a little celebration. Wrong answers get a gentle “try again,” never a harsh fail.
4. The speaker reads letters, sounds, and words out loud. Use the mute button anytime.

**Sight word sets**

- Set A: I, a, the, to, and
- Set B: you, is, it, in, at
- Set C: me, my, we, go, see
- Set D: can, look, like, for, on
- Set E: he, she, said, come, here

A set unlocks when she masters the words in the set before it (3 correct answers per word). A grown-up can also unlock sets from **Tips**.

**Mix Review** mixes shaky letters with sight words she already unlocked.

## Parent tips

- Keep sessions short — 5 to 10 minutes.
- Sit with her the first few times so she hears the speech.
- Progress (stars, mastered letters and words, unlocked sets, mute, name) is saved in this browser with `localStorage`.
- Open **Tips** on the home screen to unlock sets or reset progress.

Audio uses the browser’s **Web Speech API** (`speechSynthesis`). Chrome, Edge, and Safari work well. The first tap on the page wakes up sound.

## Keyboard (optional)

- `1`–`4` (or more) pick an answer
- `Space` / `Enter` hear the question again, or continue a flash card
- `Esc` go back home

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local app |
| `npm run build` | Typecheck and build `dist/` |
| `npm run preview` | Serve the production build |
