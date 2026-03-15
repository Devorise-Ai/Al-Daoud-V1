const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("aldaoud_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aldaoud_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An unexpected error occurred",
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const apiClient = {
  async get<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },
};
