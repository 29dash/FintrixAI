const API_BASE_URL = "http://localhost:5001/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.detail || data.error || "Request failed");
  }

  return data;
}

export function getLoans() {
  return apiRequest("/loan/my-loans");
}

export function getLoanDetails(loanId) {
  return apiRequest(`/loan/my-loans/${loanId}/details`);
}

export function reassessLoan(loanId) {
  return apiRequest(`/loan/${loanId}/reassess`, { method: "POST" });
}

export function getProfile() {
  return apiRequest("/auth/profile");
}

export function payLoan(loanId, amount) {
  return apiRequest("/payment/pay", {
    method: "POST",
    body: JSON.stringify({ loanId, amount }),
  });
}

export function retryPaymentConfirmation(transactionId) {
  return apiRequest(`/payment/${transactionId}/retry`, { method: "POST" });
}

export function getAdminOverview() {
  return apiRequest("/admin/overview");
}

export function getAdminTransactions(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  ).toString();
  return apiRequest(`/admin/transactions${query ? `?${query}` : ""}`);
}

export function getAdminLoans(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  ).toString();
  return apiRequest(`/admin/loans${query ? `?${query}` : ""}`);
}

export function getAdminLoanDetails(loanId) {
  return apiRequest(`/admin/loans/${loanId}`);
}

export function submitLoanDecision(loanId, decision, comment) {
  return apiRequest(`/loan/${decision}/${loanId}`, {
    method: "PUT",
    body: JSON.stringify({ comment }),
  });
}

export function reassessAdminLoan(loanId) {
  return apiRequest(`/admin/loans/${loanId}/reassess`, { method: "POST" });
}

export { API_BASE_URL };
