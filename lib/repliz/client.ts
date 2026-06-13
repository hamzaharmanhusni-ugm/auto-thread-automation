import type {
  ReplizAccount,
  ReplizCreds,
  ReplizScheduleInput,
  ReplizWebhook,
} from "./types";

const DEFAULT_BASE = process.env.REPLIZ_BASE_URL || "https://api.repliz.com";

export class ReplizError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ReplizError";
  }
  /** Threads (via Repliz) caps API posts at ~250 / 24h per account. */
  get isRateLimited() {
    return this.status === 429;
  }
}

/**
 * Typed Repliz API client. All Threads communication goes through here.
 * Credentials are per-workspace (from `repliz_credentials`) or the global
 * REPLIZ_USERNAME/PASSWORD fallback. HTTP Basic auth per the OpenAPI spec.
 */
export class ReplizClient {
  private readonly authHeader: string;

  constructor(
    creds: ReplizCreds,
    private readonly baseUrl: string = DEFAULT_BASE,
  ) {
    const token = Buffer.from(`${creds.username}:${creds.password}`).toString("base64");
    this.authHeader = `Basic ${token}`;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // Repliz is an external service; never cache.
      cache: "no-store",
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) {
      const friendly =
        res.status === 429
          ? "Batas posting Threads tercapai (±250 post / 24 jam per akun). Coba lagi nanti."
          : `Repliz ${method} ${path} gagal (${res.status})`;
      throw new ReplizError(friendly, res.status, path, data);
    }
    return data as T;
  }

  /** GET /public/account — list connected accounts (filter type=threads in caller). */
  listAccounts(params?: { page?: number; limit?: number; type?: string; search?: string }) {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.search ? { search: params.search } : {}),
    });
    return this.request<{ docs: ReplizAccount[]; totalDocs?: number }>(
      "GET",
      `/public/account?${q.toString()}`,
    );
  }

  /** GET /public/account/threads/authorize — start in-app Threads OAuth. */
  getThreadsAuthorizeUrl(redirect: string) {
    return `${this.baseUrl}/public/account/threads/authorize?redirect=${encodeURIComponent(redirect)}`;
  }

  /** POST /public/account/threads/connect — complete OAuth with the returned code. */
  connectThreads(code: string) {
    return this.request<ReplizAccount>("POST", `/public/account/threads/connect`, { code });
  }

  /** POST /public/schedule — create a scheduled post (Single or thread via replies[]). */
  createSchedule(input: ReplizScheduleInput) {
    return this.request<{ scheduleId: string }>("POST", `/public/schedule`, {
      meta: { title: "", description: "", url: "" },
      additionalInfo: {
        isAiGenerated: true,
        isDraft: false,
        collaborators: [],
        music: null,
        products: [],
        tags: [],
        mentions: [],
      },
      replies: [],
      ...input,
    });
  }

  /** DELETE /public/schedule/{id} */
  deleteSchedule(scheduleId: string) {
    return this.request<unknown>("DELETE", `/public/schedule/${scheduleId}`);
  }

  /** PUT /public/schedule/{id}/retry */
  retrySchedule(scheduleId: string) {
    return this.request<unknown>("PUT", `/public/schedule/${scheduleId}/retry`);
  }

  /** POST /public/comment/{id} — reply to a stored comment (id = webhook data.id). */
  replyComment(commentRecordId: string, text: string) {
    return this.request<unknown>("POST", `/public/comment/${commentRecordId}`, { text });
  }

  /** PUT /public/comment/{id}/status */
  updateCommentStatus(commentRecordId: string, status: string) {
    return this.request<unknown>("PUT", `/public/comment/${commentRecordId}/status`, { status });
  }

  /**
   * POST /public/content/{contentId}/comment — leave a comment on a published
   * content (engagement seeding from a connected account). `accountId` selects
   * which connected account posts the comment.
   */
  commentOnContent(contentId: string, text: string, accountId?: string) {
    return this.request<unknown>(
      "POST",
      `/public/content/${contentId}/comment`,
      accountId ? { text, accountId } : { text },
    );
  }

  /** GET /public/content/{id}/statistic?accountId — engagement insights. */
  getContentStatistic(contentId: string, accountId: string) {
    return this.request<Record<string, unknown>>(
      "GET",
      `/public/content/${contentId}/statistic?accountId=${encodeURIComponent(accountId)}`,
    );
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Build a ReplizClient from the global env fallback (per-workspace creds preferred). */
export function replizFromEnv(): ReplizClient | null {
  const username = process.env.REPLIZ_USERNAME;
  const password = process.env.REPLIZ_PASSWORD;
  if (!username || !password) return null;
  return new ReplizClient({ username, password });
}

export type { ReplizWebhook };
