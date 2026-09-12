# Glacier AI

Glacier AI is a web-based AI assistant with multiple personalities designed for different kinds of conversations.

Instead of using one general-purpose chatbot for everything, users can choose a personality depending on what they need, such as learning a concept, brainstorming ideas, or simply talking something through.

The app supports both typed messages and voice input, with an optional voice-response mode.

|   <img src="/images/home.jpg" width="333"></p> |   <img src="/images/tutor.jpg" width="334"></p> |  <img src="/images/session.jpg" width="333"></p> |
| - | - | - |

## Features

- Multiple AI personalities
- Text-based chat
- Voice input using browser speech recognition
- Optional spoken AI responses
- Conversation history within the current session
- Responsive interface built with Next.js and Tailwind CSS
- Secure server-side API requests
- Hack Club AI integration

## Current Personalities

### Tutor

Designed to help users learn concepts through clear explanations, examples, and step-by-step guidance.

### Idea Partner

Designed for brainstorming, developing ideas, comparing options, and turning rough ideas into practical next steps.

### Listener

Designed for calm, supportive conversations that help users organize and reflect on their thoughts.

## How It Works

The user first chooses an AI personality.

```text
Choose Personality
        ↓
Type or speak a message
        ↓
Next.js frontend
        ↓
/api/chat
        ↓
Hack Club AI API
        ↓
AI response
        ↓
Text response + optional voice output
```

Each personality uses the same underlying AI model but has its own system instructions that change how the AI responds.

The frontend uses `"user"` and `"ai"` message roles internally. Before messages are sent to the AI API, `"ai"` is converted to the standard `"assistant"` role.

## Tech Stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **OpenAI JavaScript SDK**
- **Hack Club AI**
- **Web Speech API**

## Project Structure

```text
glacier-ai/
├── public/
├── src/
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── .env.local
├── package.json
└── README.md
```

### `page.tsx`

Contains the main user interface, including:

- Personality selection
- Chat messages
- Text input
- Microphone controls
- Voice response toggle
- Speech synthesis

### `api/chat/route.ts`

Handles server-side communication with Hack Club AI.

It:

- Receives the selected personality and chat history
- Validates incoming messages
- Converts frontend message roles into API-compatible roles
- Adds personality instructions
- Sends the request to the AI model
- Returns the generated response

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd glacier-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create an environment file

Create:

```text
.env.local
```

Add your Hack Club AI API key:

```env
HACKCLUB_AI_API_KEY=your_api_key_here
```

Do not commit this file or expose your API key publicly.

Make sure `.gitignore` contains:

```gitignore
.env*
```

### 4. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Voice Features

Glacier AI supports voice input through the browser's Web Speech API.

Press the **Mic** button and speak. The browser converts speech into text, which can then be reviewed and sent normally.

The **Voice Replies** toggle allows AI responses to be read aloud using browser text-to-speech.

### Browser Support

Text-to-speech is supported by most modern browsers.

Speech recognition support is more limited. Chrome and Edge generally provide better support than Firefox.

## API

Glacier AI currently uses Hack Club AI through its OpenAI-compatible API.

The API key is stored server-side and is never sent directly to the browser.

Example client configuration:

```ts
const client = new OpenAI({
  apiKey: process.env.HACKCLUB_AI_API_KEY,
  baseURL: "https://ai.hackclub.com/proxy/v1",
});
```

## Security

API keys are stored in `.env.local` and used only inside the server-side API route.

The frontend never has direct access to the Hack Club AI API key.

Incoming messages are also validated before being forwarded to the AI provider.

## Planned Features

Possible future additions include:

- User accounts
- Saved conversations
- Long-term user preferences
- More personalities
- Custom personalities
- Better voice selection
- Continuous voice conversations
- File and image uploads
- Search and external tools
- Conversation memory
- Mobile-friendly improvements
- Custom personality icons and themes

## Development Status

Glacier AI is currently an early prototype.

The current goal is to build a simple, reliable personality-based AI chat experience before adding more advanced features.

## License

No license has been selected yet.

## Preview

Add a screenshot to `public/screenshot.png`, then this image will display in the README:

```md
![Glacier AI interface](./public/screenshot.png)
```
