import { Readable } from "node:stream";

export async function POST(req: Request, res: Response) {
  const modelResponse = await fetch("https://app-bwdy9p-7wesk6.a.mixlayer.ai", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MIXLAYER_APP_TOKEN}`,
    },
  });

  if (!modelResponse.ok) {
    return Response.json({ error: "model fetch failed" }, { status: 500 });
  }

  if (modelResponse.body === null) {
    console.error("Model response body is null");
    return;
  }

  // @ts-ignore
  //   Readable.fromWeb(modelResponse.body.getReader()).pipe(res);

  return new Response(modelResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
