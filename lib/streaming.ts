import { createTextStreamResponse } from "ai";

export { createTextStreamResponse };

export function createStreamResponse(
  textStream: ReadableStream<string>,
  headers?: Record<string, string>
) {
  return createTextStreamResponse({
    textStream,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...headers,
    },
  });
}
