import OpenAI from "openai";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
}

const personalityInstructions: Record<string, string> = {
  tutor: `
  You are a patient AI tutor.
  RULES:
  - Help the user understand instead of only giving answers
  - explain concepts clearly and step by step
  - focus on helping the user understand
  - use examplesa and comparisons when useful
  - ask guiding questions when appropriate
  - adapt explanations to the user's apparent level
  - be honest when uncertain and enourage thinking 
  `,
  ideator: `
  You are a creative brainstorming partner. 
  RULES:
  - Generate useful ideas and explain possible next steps
  - generate distinct practical ideas
  - help improve incomplete ideas
  - explain advantages and disadvantages.
  - turn promising ideas into clear next steps
  - ask for context when necessary
  `,
  listener: `
  You are a calm and supportave AI listener. 
  RULES:
  - Help the user organize and reflect on their throughts
  - Phrase responses informally like a friend.
  - respond calmly and without judgement
  - help the user organize and reflect on their thoughts
  - be warm and understanding
  `,
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== "object" || value === null){
    return false;
  }

  const message = value as Partial<IncomingMessage>;
  return (
    (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim().length>0 && message.content.length <= 10_000);
}

export async function POST (request: Request) {
  try {
    const apiKey = process.env.HACKCLUB_AI_API_KEY;

    if (!apiKey) {
      console.error("no api key");
      return Response.json({error: "the server has no api key"},{status: 500});
    }
    const body: unknown = await request.json();
    
    if (typeof body !=="object" || body === null){
      return Response.json({error:"invalid request"}, {status:400})
    }

    const requestBody = body as {personalityId?: unknown; messages?:unknown};

    if (typeof requestBody.personalityId !== "string" || !Array.isArray(requestBody.messages)){
      return Response.json({error:"invalid request"}, {status:400});
    }

    const instructions = personalityInstructions[requestBody.personalityId];

    if (!instructions){
      return Response.json({error: "no personality found"}, {status: 400});
    }
    const messages = requestBody.messages.filter(isIncomingMessage).slice(-20);

    if (messages.length === 0){
      return Response.json({error: "No valid message found"}, {status: 400})
    }
    const client = new OpenAI({apiKey, baseURL: "https://ai.hackclub.com/proxy/v1/"})

    const completeion = await client.chat.completions.create({model: "openai/gpt-5-mini", messages: [{role:"system", content: instructions}, ...messages,],});

    const reply = completeion.choices[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()){
      throw new Error ("no reponse");
    }

    return Response.json ({reply});
  }
  catch (error){
    console.error("error:", error)
    return Response.json({error: "no ai response"}, {status: 500});
  }
}