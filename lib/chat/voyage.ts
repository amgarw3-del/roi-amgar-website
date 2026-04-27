// Voyage AI embeddings — model recommended by Anthropic, strong on Hebrew.
// Docs: https://docs.voyageai.com/reference/embeddings-api

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
export const VOYAGE_MODEL = "voyage-3-large";
export const VOYAGE_DIMENSION = 1024;

type VoyageInputType = "document" | "query";

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { total_tokens: number };
}

export async function embed(
  texts: string[],
  inputType: VoyageInputType
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");
  if (!texts.length) return [];

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: VOYAGE_DIMENSION,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as VoyageResponse;
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embed([text], "query");
  return v;
}
