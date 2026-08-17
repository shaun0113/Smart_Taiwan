import { getToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

async function profileRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "個人資料操作失敗"
    );
  }

  return data;
}

export function getProfile() {
  return profileRequest("/api/profile");
}

export function updateProfile(profile) {
  return profileRequest("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}