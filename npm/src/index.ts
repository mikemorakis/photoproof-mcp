/**
 * Typed client for the photoproof.io public read-only API.
 * No API key needed. Docs: https://photoproof.io/developers · Spec: https://photoproof.io/openapi.json
 */

export const DEFAULT_BASE_URL = "https://photoproof.io";
export const MCP_URL = "https://photoproof.io/mcp";

export type PlanId = "free" | "gallery_pass" | "pro" | "studio";
export type PlanKind = "plan" | "one_off";
export type PageSection = "product" | "use-cases" | "compare" | "guides" | "case-studies" | "company" | "legal";
export type HealthCheckName = "d1" | "r2" | "watermark";

export interface Price { amount: number; currency: string; interval: "month" | "year" | null }
export interface Plan {
  id: PlanId; name: string; kind: PlanKind;
  storage_gb?: number; max_gallery_days?: number; badge?: boolean;
  prices: Price[]; summary: string;
}
export interface PlansResponse { currency: string; vat_included: boolean; pricing_url: string; plans: Plan[]; white_label?: string; notes?: string }
export interface Page { url: string; markdown_url: string; title: string; description?: string; section?: string }
export interface PagesResponse { pages: Page[] }
export interface SearchResult { title: string; url: string; markdown_url?: string; section?: string; snippet?: string; score?: number }
export interface SearchResponse { query: string; results: SearchResult[] }
export interface HealthCheck { ok: boolean; latency_ms: number; detail?: string }
export interface HealthResponse { ok: boolean; checked_at: string; checks: Partial<Record<HealthCheckName, HealthCheck>> }
export interface ApiErrorBody { error: string; message: string; docs?: string }

export class PhotoproofApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;
  constructor(status: number, code: string, message: string, body: unknown) {
    super(message);
    this.name = "PhotoproofApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export interface ClientOptions {
  /** Defaults to https://photoproof.io */
  baseUrl?: string;
  /** Custom fetch (defaults to globalThis.fetch, Node 18+). */
  fetch?: typeof fetch;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
}

export class PhotoproofClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly headers: Record<string, string>;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const f = options.fetch ?? globalThis.fetch;
    if (typeof f !== "function") throw new Error("No fetch available. Use Node 18+ or pass options.fetch.");
    this.fetchImpl = f;
    this.headers = { accept: "application/json", ...options.headers };
  }

  /** Plans and prices in euro (VAT included). Filter by plan id or kind. */
  getPlans(filter: { id?: PlanId; kind?: PlanKind } = {}): Promise<PlansResponse> {
    return this.get<PlansResponse>("/api/v1/plans", filter);
  }

  /** Every public page with title, description, section and Markdown URL. */
  listPages(filter: { section?: PageSection } = {}): Promise<PagesResponse> {
    return this.get<PagesResponse>("/api/v1/pages", filter);
  }

  /** Keyword search over guides, comparisons, case studies and product pages. */
  search(q: string, options: { limit?: number } = {}): Promise<SearchResponse> {
    return this.get<SearchResponse>("/api/v1/search", { q, limit: options.limit });
  }

  /** Live service health. Resolves for 503 too (check `ok`). */
  getHealth(options: { check?: HealthCheckName } = {}): Promise<HealthResponse> {
    return this.get<HealthResponse>("/api/health", options, [503]);
  }

  private async get<T>(path: string, query: Record<string, string | number | undefined>, okStatuses: number[] = []): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    const res = await this.fetchImpl(url, { headers: this.headers });
    const text = await res.text();
    let body: unknown;
    try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
    if (!res.ok && !okStatuses.includes(res.status)) {
      const e = (body && typeof body === "object" ? body : {}) as Partial<ApiErrorBody>;
      throw new PhotoproofApiError(res.status, e.error ?? "http_error", e.message ?? `HTTP ${res.status} from ${url.pathname}`, body);
    }
    return body as T;
  }
}

