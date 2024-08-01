export const maxDuration = 300;
export async function POST(req: Request, res: Response) {
  const bodyText = await req.text();
  const modelResponse = await fetch(
    `https://${process.env.MIXLAYER_APP_HOST}`,
    {
      method: "POST",
      body: bodyText,
      headers: {
        Authorization: `Bearer ${process.env.MIXLAYER_APP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!modelResponse.ok) {
    return Response.json({ error: "model fetch failed" }, { status: 500 });
  }

  if (modelResponse.body === null) {
    console.error("Model response body is null");
    return;
  }

  // @ts-ignore
  return new Response(modelResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
