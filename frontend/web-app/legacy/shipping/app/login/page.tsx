'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_KEY = 'ac_ship_auth';
const AUTH_CTX_KEY = 'ac_ship_auth_ctx';

function makeToken(email: string) {
  const now = new Date();
  const stamp = now.toISOString();
  return `demo.${btoa(unescape(encodeURIComponent(`${email}|${stamp}`)))}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('shipping@agrichain.local');
  const [password, setPassword] = useState('demo');
  const [role, setRole] = useState<'MANAGER' | 'SHIPPER'>('MANAGER');
  const [userId, setUserId] = useState('1');
  const [busy, setBusy] = useState(false);
  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.trim().length > 0 && !busy,
    [email, password, busy]
  );

  const onLogin = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const token = makeToken(email.trim().toLowerCase());
      localStorage.setItem(AUTH_KEY, token);
      localStorage.setItem(AUTH_CTX_KEY, JSON.stringify({ userId: userId.trim() || '1', role }));
      router.replace('/dashboard');
    } finally {
      setBusy(false);
    }
  };

  const onReset = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_CTX_KEY);
    setEmail('shipping@agrichain.local');
    setPassword('demo');
    setRole('MANAGER');
    setUserId('1');
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">

        {/* Brand pill */}
        <div className="auth-brand-pill">
          <div className="auth-logo">AC</div>
          <span className="auth-brand-name">AgriChain Shipping</span>
        </div>

        <h1 className="auth-h1">Đăng nhập</h1>
        <p className="auth-sub">Quản lý lô hàng, tài xế, tracking và sự kiện Kafka.</p>

        <div className="auth-divider" />

        <div className="auth-form">

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shipping@company.com"
              inputMode="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Mật khẩu</label>
            <input
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
            />
            <span className="auth-helper">Demo: bạn có thể dùng bất kỳ email, mật khẩu nào.</span>
          </div>

          <div className="auth-row2">
            <div className="auth-field">
              <label className="auth-label">Role</label>
              <select
                className="auth-input"
                value={role}
                onChange={(e) => setRole(e.target.value as 'MANAGER' | 'SHIPPER')}
              >
                <option value="MANAGER">MANAGER (Web)</option>
                <option value="SHIPPER">SHIPPER (Driver)</option>
              </select>
            </div>
            <div className="auth-field">
              <label className="auth-label">User ID (demo)</label>
              <input
                className="auth-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="1"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="auth-actions">
            <button className="auth-btn-ghost" onClick={onReset} disabled={busy}>
              Reset
            </button>
            <button className="auth-btn-primary" onClick={onLogin} disabled={!canSubmit}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập →'}
            </button>
          </div>

        </div>

        <p className="auth-footer">AgriChain · Blockchain Clean Agriculture · v0.1.0</p>
      </div>
    </div>
  );
}