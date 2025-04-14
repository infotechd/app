const API_URL = "http://localhost:5000/api";

export const login = async (email, senha) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  return response.json();
};
