"use client";

import {KeyboardEvent, useState } from "react";


// message type for either user or AI
type chatMessage = {
  role: "user" | "ai";
  content: string;
}

type personality = {id: string; name: string; description: string; greeting:string};

const personalities: personality[] = [{
  id: "tutor",
  name: "Tutor",
  description: "Learn concepts through simple, step-by-step explainations.",
  greeting: "What would you like to learn today?"},
  {id: "ideator",
  name: "Ideator",
  description: "Brainstorm ideas and turn them into practical plans",
  greeting: "What should we brainstorm?"},
  {id: "listener",
  name: "Listener",
  description: "Talk through your thoughts with a supportive friend",
  greeting: "What is on your mind?"}]

export default function Home(){
  const [selected, setSelected] = useState<personality | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<chatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(){
    const cleanedInput = input.trim();
    if (!cleanedInput || !selected || isLoading){
      return;
    }

    const userMessage: chatMessage = {role: "user", content: cleanedInput};

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch ("/api/chat",{method: "POST", headers: {"Content-Type":"application/json"},body: JSON.stringify({personalityId: selected.id, messages:updatedMessages}),});

      const data:unknown = await response.json();
      if (!response.ok || typeof data !== "object" || data === null || !("reply" in data)){
        throw new Error ("invalid response");
      }
      const reply = data.reply;
      if (typeof reply !=="string"){
        throw new Error ("reply was not text");
      }
      setMessages ((current)=> [...current, {role:"ai", content: reply,},]);
    } catch(error){
      console.error(error);

      setMessages ((current) => [...current, {role:"ai", content: "something went wrong"},]);
    } finally {
      setIsLoading(false);
    }
  }
  function handleKeyDown(event:KeyboardEvent<HTMLInputElement>){
    if(event.key === "Enter"){
      void sendMessage();
    }
  }
  function changePersonality(){
    setSelected(null);
    setMessages([]);
    setInput("");
  }

  if (!selected){
    return (
      <main className = "min-h-screen bg-slate-100 px-6 py-16">
        <div className = "mx-auto max-w-5xl">
          <p className = "font-semibold text-blue-700">Glacier AI</p>
            <h1 className = "mt-2 text-4xl font-bold text-slate-900">
              What kind of help do you need?
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Choose an AI personality to begin
            </p>
            <div  className = "mt-10 grid gap-5 md:grid-cols-3">
              {personalities.map((personality)=> (<button
                key={personality.id}
                type="button"
                onClick={()=>setSelected(personality)}
                className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h2 className="text-xl font-semibold text-slate-900">
                  {personality.name}
                </h2>
                <p className="mt-2 text-slate-600">
                  {personality.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }
  return(
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Glacier AI</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {selected.name}
            </h1>
            <p className="text-slate-700">
              {selected.greeting}
            </p>
          </div>
          <button
            type = "button"
            onClick = {changePersonality}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
              Change Personality
            </button>
        </header>
        <section className="my-6 flex-1 space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-sm">
          {messages.length === 0 &&(<p className="text-slate-500">{selected.greeting}</p>)}
          {messages.map((message, index)=>(
            <div
              key = {`${message.role}-${index}`}
              className = {message.role==="user"?"ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-slate-900 px-4 py-3 text-white":"mr-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-slate-100 px-4 py-3 text-slate-900"}
              >{message.content}</div>
          ))}
          {isLoading&&(<div className="mr-auto rounded-2xl bg-slate-100 px-4 py-3 text-slate-500">Thinking...</div>)}
        </section>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event)=> setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type your message..."
            disabled = {isLoading}
            className="flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-slate-900"
            />
          <button
            type="button"
            onClick={()=> void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40">
              Send
            </button>
        </div>
      </div>
    </main>
  )
}

