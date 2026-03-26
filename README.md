# Halal Scan AI

A universal multilingual **Islamic food guidance chat app** built with Expo + React Native.

The app lets users:
- ask halal/haram food questions in any language style,
- send ingredient text and product images,
- get structured AI answers with Islamic references,
- keep chat history in a drawer with latest chats first.

---

## Features

- **AI chat powered by Gemini**
- **Image + text input** (camera/gallery support)
- **Halal verdicts**: `halal`, `haram`, `mashbooh`, `not-food`, `general`
- **Language auto-detection** from user input
- **Persistent chat history** using AsyncStorage
- **Recent chats in drawer** with **New Chat** flow
- **Title generation** from first user message
- **Sorted sessions** by latest `updatedAt`

---

## Tech Stack

- [Expo](https://expo.dev/)
- React Native
- Expo Router
- AsyncStorage
- Gemini API (Google Generative Language API)

---

## Project Structure

- `app/`
  - `_layout.tsx` — app navigation and drawer setup
  - `index.tsx` — main chat screen
- `components/chat/`
  - `chat-input.tsx` — input + camera/gallery/send actions
  - `message-bubble.tsx` — user/assistant message UI
- `components/navigation/`
  - `app-drawer-content.tsx` — custom drawer with recent chats
  - `header-menu-button.tsx`
- `lib/`
  - `gemini.ts` — Gemini request/response handling
  - `chat-storage.ts` — AsyncStorage chat persistence
- `types/`
  - `chat.ts`, `analysis.ts`
- `data/`
  - `halal-keywords.json`
  - `haram-keywords.json`
  - `mashbooh-keywords.json`

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Add environment variable

Create a `.env` file in project root:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

> The app expects `EXPO_PUBLIC_GEMINI_API_KEY`.

### 3) Run the app

```bash
npx expo start
```

Optional:
```bash
npx expo start -c
```
(clears Metro cache)

---

## iOS / Android Icons & Splash

Configure assets in `app.json` under:
- `expo.icon`
- `expo.splash`
- `expo.ios.icon`
- `expo.android.icon`
- `expo.android.adaptiveIcon`

> Note: Expo Go has limitations for icon/splash preview. For full behavior, use a dev build.

---

## Chat Behavior

- New chats are created in-memory first.
- Empty chats are **not** saved.
- A chat is saved after first message is sent.
- Each response updates:
  - `messages`
  - `title` (from first user message)
  - `updatedAt`
- Drawer list is loaded from AsyncStorage and ordered by latest chat.

---

## Development Notes

- If drawer history does not refresh, verify `saveChatSession()` emits updates and drawer reloads session list.
- If input or loader feels delayed, ensure `onSend()` updates local state before awaiting network call.
- If Gemini returns non-JSON, app falls back to a safe parsed response path.

---

## Scripts (common Expo)

```bash
npm run start
npm run android
npm run ios
npm run web
```

---

## License

Private project. Add your preferred license before publishing.