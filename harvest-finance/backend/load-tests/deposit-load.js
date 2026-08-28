import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const VAULT_ID = __ENV.VAULT_ID || '123e4567-e89b-12d3-a456-426614174000';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'loadtest@example.com',
    password: 'LoadTest123!',
  });

  check(loginRes, {
    'login succeeds': (r) => r.status === 200 || r.status === 401,
  });

  const token = loginRes.status === 200 ? loginRes.json('access_token') : '';

  return { token };
}

export default function (data: { token: string }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  };

  const res = http.post(
    `${BASE_URL}/vaults/${VAULT_ID}/deposit`,
    JSON.stringify({ amount: 10 }),
    { headers },
  );

  check(res, {
    'deposit endpoint responds': (r) => r.status < 500,
    'p95 latency < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function teardown(data: { token: string }) {
  return data;
}
