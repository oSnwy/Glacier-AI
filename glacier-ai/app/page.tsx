"use client";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

type Personality = {
  id: string;
  name: string;
  description: string;
  greeting: string;
};

type SpeechRecognitionResultEvent = Event & {
  results: {
    0: {
      0: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const personalities: Personality[] = [
  {
    id: "tutor",
    name: "Tutor",
    description: "Learn concepts through clear, step-by-step explanations.",
    greeting: "What would you like to learn today?",
  },
  {
    id: "ideator",
    name: "Idea Partner",
    description: "Brainstorm ideas and turn them into practical plans.",
    greeting: "What should we brainstorm?",
  },
  {
    id: "listener",
    name: "Listener",
    description: "Talk through your thoughts with a supportive AI.",
    greeting: "What is on your mind?",
  },
];

export default function Home() {
  const [selected, setSelected] = useState<Personality | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  function speakText(text: string) {
    if (
      !voiceRepliesEnabled ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-CA";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    setVoiceError("");

    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        "Speech recognition is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "en-CA";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();

      setInput((current) => {
        if (!current.trim()) {
          return transcript;
        }

        return `${current.trim()} ${transcript}`;
      });
    };

    recognition.onerror = (event) => {
      setVoiceError(`Microphone error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }

  async function sendMessage() {
    const cleanedInput = input.trim();

    if (!cleanedInput || !selected || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: cleanedInput,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalityId: selected.id,
          messages: updatedMessages,
        }),
      });

      const data: unknown = await response.json();

      if (
        !response.ok ||
        typeof data !== "object" ||
        data === null ||
        !("reply" in data)
      ) {
        throw new Error("Invalid response");
      }

      const reply = data.reply;

      if (typeof reply !== "string") {
        throw new Error("Reply was not text");
      }

      setMessages((current) => [
        ...current,
        {
          role: "ai",
          content: reply,
        },
      ]);

      speakText(reply);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          role: "ai",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void sendMessage();
    }
  }

  function changePersonality() {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();

    setSelected(null);
    setMessages([]);
    setInput("");
    setIsListening(false);
    setIsSpeaking(false);
    setVoiceError("");
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!selected) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-semibold text-blue-800">Glacier AI</p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            What kind of help do you need?
          </h1>

          <p className="mt-3 text-lg text-slate-700">
            Choose an AI personality to begin.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {personalities.map((personality) => (
              <button
                key={personality.id}
                type="button"
                onClick={() => setSelected(personality)}
                className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold text-slate-950">
                  {personality.name}
                </h2>

                <p className="mt-2 text-slate-700">
                  {personality.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Glacier AI
            </p>

            <h1 className="text-2xl font-bold text-slate-950">
              {selected.name}
            </h1>

            <p className="text-slate-700">
              {selected.greeting}
            </p>

            <label className="mt-3 flex w-fit cursor-pointer items-center gap-3 text-sm font-medium text-slate-800">
              <button
                type="button"
                role="switch"
                aria-checked={voiceRepliesEnabled}
                onClick={() => {
                  const nextValue = !voiceRepliesEnabled;
                  setVoiceRepliesEnabled(nextValue);

                  if (!nextValue) {
                    stopSpeaking();
                  }
                }}
                className={
                  voiceRepliesEnabled
                    ? "relative h-6 w-11 rounded-full bg-blue-700 transition"
                    : "relative h-6 w-11 rounded-full bg-slate-400 transition"
                }
              >
                <span
                  className={
                    voiceRepliesEnabled
                      ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white transition"
                      : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition"
                  }
                />
              </button>

              Voice replies
            </label>
          </div>

          <button
            type="button"
            onClick={changePersonality}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Change Personality
          </button>
        </header>

        <section className="my-6 flex-1 space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-sm">
          {messages.length === 0 && (
            <p className="text-slate-700">
              {selected.greeting}
            </p>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-slate-900 px-4 py-3 text-white"
                  : "mr-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-slate-200 px-4 py-3 text-slate-950"
              }
            >
              {message.content}
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto rounded-2xl bg-slate-200 px-4 py-3 text-slate-800">
              Thinking...
            </div>
          )}
        </section>

        <div>
          {voiceError && (
            <p className="mb-2 text-sm font-medium text-red-700">
              {voiceError}
            </p>
          )}

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening..."
                  : "Type your message or use the microphone..."
              }
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            />

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={
                isListening
                  ? "rounded-xl bg-red-700 px-4 py-3 font-medium text-white"
                  : "rounded-xl bg-white px-4 py-3 font-medium text-slate-900 shadow-sm hover:bg-slate-50"
              }
            >
              {isListening ? "Stop" : "Mic"}
            </button>

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>

          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="mt-2 text-sm font-medium text-slate-800 underline"
            >
              Stop voice
            </button>
          )}
        </div>
      </div>
    </main>
  );
}