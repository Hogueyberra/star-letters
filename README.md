# Star Letters

A bright, playful practice app for **Goldie** — letter names, letter sounds, and her Fountain Valley School District (FVSD **2022**) kindergarten word and phrase lists.

Built for Nick to open on a laptop or tablet. No account needed.

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (this project uses **http://127.0.0.1:4545**).

## On your phone

GitHub Pages hosts the app at:

**https://hogueyberra.github.io/star-letters/**

Pushes to `main` rebuild and republish automatically. Bookmark that link on your phone.

```bash
npm run build
```

The finished site lands in `dist/`. Preview it with `npm run preview`.

## How Goldie plays

The home screen greets **Hi Goldie!** (the name is editable). It also shows which FVSD unit she’s on.

1. Pick a mode: **Letters**, **Sounds**, **Words**, **Phrases**, or **Mix Review**.
2. Tap huge answer buttons. Correct answers earn stars. Wrong answers get a gentle “try again.”
3. The speaker reads letters, sounds, words, and phrases. Mute anytime.

Alphabet modes stay in the mix — she’s still shaky on letters.

## FVSD 2022 units (unlock in this order)

A unit unlocks when she masters about **80%** of it (8 of 10 items, after 3 correct answers each). A grown-up can also tap **Unlock next unit** in **Tips**.

**Words 1:** I, a, go, see, the, to, is, and, in, can  
**Phrases 1:** I go, a can, go in, I see, I see the, go to, is the, and see, in the, can see

**Words 2:** you, he, like, we, it, up, no, at, my, an  
**Phrases 2:** you can, he is, I like, we can, it is, up to, no go, at the, can my, see an

**Words 3:** me, do, on, am, so, come, was, are, as, his  
**Phrases 3:** like me, can do it, is on, I am, so you can, come to, it was, you are, as I go, I see his

**Words 4:** they, be, have, from, or, one, by, she, has, for  
**Phrases 4:** they like to, it can be, I have, from the, you or, the one, by his, she has, I can go, for his

**Words 5:** of, what, your, said, how, out, her, into, look, two  
**Phrases 5:** out of the, What is it, I see your, he said no, how do I, he is out, it was her, into the can, look for the, he is two

**Review Words:** you, come, are, was, they, have, from, what, said, how

**Phrases** uses flash (see it, hear it, tap) and hear-and-match with big readable text.

**Mix Review** mixes shaky letters with words and phrases she has already unlocked.

## Parent tips

- Keep sessions short — 5 to 10 minutes.
- Sit with her the first few times so she hears the speech.
- Progress (stars, mastered letters/words/phrases, unlocked units, mute, name) is saved in this browser with `localStorage`.
- Open **Tips** on the home screen to unlock the next unit or reset progress.

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
