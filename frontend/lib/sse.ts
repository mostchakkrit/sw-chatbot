export interface SseEvent {
  event: string;
  data: string;
}

function parseSseFrame(rawEvent: string): SseEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  return dataLines.length > 0 ? { event, data: dataLines.join("\n") } : null;
}

/** Parses a raw SSE byte stream into discrete `event`/`data` frames as they arrive. */
export async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const frame = parseSseFrame(rawEvent);
      if (frame) yield frame;
    }
  }
}

/**
 * Parses a complete (already-buffered) SSE payload. Used as a fallback when a browser
 * extension replaces `window.fetch` with an implementation whose Response has no
 * readable `body` stream, so we can't consume the response incrementally.
 */
export function parseSseText(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  let buffer = raw;
  let boundary: number;
  while ((boundary = buffer.indexOf("\n\n")) !== -1) {
    const rawEvent = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 2);
    const frame = parseSseFrame(rawEvent);
    if (frame) events.push(frame);
  }
  return events;
}
