const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "chatbot-demo-admin-token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function adminFetch(path: string, init?: RequestInit) {
  const token = getAdminToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) clearAdminToken();
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(res.status, body.message ?? `request failed (${res.status})`);
  }
  return res.json();
}

export interface AdminLoginResponse {
  token: string;
  admin: { id: string; email: string; name: string };
}

export function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return fetch(`${API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new AdminApiError(res.status, body.message ?? "เข้าสู่ระบบไม่สำเร็จ");
    }
    return res.json();
  });
}

export interface ConversationListItem {
  id: string;
  customerIdentifier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; sender: string; createdAt: string }[];
  _count: { messages: number };
}

export interface ConversationMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  customerIdentifier: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  escalations: { id: string; reason: string; resolvedBy: string | null; createdAt: string }[];
}

export function listConversations(status?: string): Promise<ConversationListItem[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminFetch(`/admin/conversations${query}`);
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return adminFetch(`/admin/conversations/${id}`);
}

export function replyToConversation(id: string, content: string): Promise<ConversationDetail> {
  return adminFetch(`/admin/conversations/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
