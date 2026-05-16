import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Intercept 401 "Invalid or expired token" responses and force logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.response?.data?.message === "Invalid or expired token."
    ) {
      // Notify AuthContext to clear user state
      window.dispatchEvent(new Event("auth:token-expired"));
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed"
    );
  }
  return "Unexpected error";
};
