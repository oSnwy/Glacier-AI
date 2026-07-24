import OpenAI from "openai";

type IncomingMessage = {
  role: "user" | "ai";
  content: string;
}

const personalityInstructions: Record<string, string> = {
  tutor: "",
  ideator: "",
  listener: "",
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== "object" || value === null){
    return false;
  }

  const message = value as Partial<IncomingMessage>;
  return (
    (message.role === "user" || message.role === "ai") && typeof message.content === "string" && message.content.trim().length>0 && message.content.length <= 10_000);
}

export async function POST (request: Request) {
  try {
    const apiKey = process,env.HACKCLUB_AI_API_KEY;

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
    const client = new OpenAI({apiKey, baseURL: ""})

    const completeion = await client.chat.completions.create({model: "", messages: [{role:"system", content: instructions}, ...messages],});

    const reply = completeion.choices[0]?.message?.content;

    if (typeof reply != "string" || reply.trim()){
      throw new Error ("no reponse");
    }

    return Response.json ({reply});
  }
  catch (error){
    console.error("error:", error)
    return Response.json({error: "no ai response"}, {status: 500});
  }
}