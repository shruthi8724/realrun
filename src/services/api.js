const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      `Could not connect to ${API_BASE_URL}. Start the backend in a second terminal with `
      + `".\\.venv\\Scripts\\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload", `
      + `then check ${API_BASE_URL}/health.`,
    );
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }
    throw new Error(detail);
  }
  return response.json();
}

const jsonOptions = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const fetchOrders = () => request('/orders');
export const fetchMachines = () => request('/machines');
export const fetchMaterials = () => request('/materials');
export const fetchDisruptions = () => request('/disruptions');
export const fetchAnalytics = () => request('/analytics');
export const fetchOrderById = (id) => request(`/orders/${encodeURIComponent(id)}`);
export const fetchAssessment = (orderId) => request(`/assessment/${encodeURIComponent(orderId)}`);
export const simulateDecisions = (orderId) => request(`/simulate/${encodeURIComponent(orderId)}`, jsonOptions('POST'));
export const getRecommendationAndExplanation = (orderId, apiKey = null) => request(
  `/recommend/${encodeURIComponent(orderId)}`,
  jsonOptions('POST', { order_id: orderId, api_key: apiKey }),
);
export const commitDecision = (payload) => request('/outcomes', jsonOptions('POST', payload));
export const fetchHistory = (orderId = 'all') => request(`/history/${encodeURIComponent(orderId)}`);
export const resetDemoData = () => request('/reset-demo', jsonOptions('POST'));
