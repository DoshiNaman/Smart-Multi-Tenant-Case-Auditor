const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Suppress error throwing — useful for /auth/me where 401 is expected. */
  allowUnauthenticated?: boolean;
};

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const { body, headers, allowUnauthenticated, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const text = await response.text();
  const data: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    if (response.status === 401 && allowUnauthenticated) {
      throw new ApiError("Unauthorized", 401, data);
    }
    const message = extractMessage(data) ?? response.statusText;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const message = obj.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return null;
}
