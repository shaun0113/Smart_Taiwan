import React, { useState } from 'react';
import { login, register } from '../services/auth';

export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isRegister
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);ㄈ
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-7">
        <div className="text-center mb-7">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="text-2xl font-extrabold text-slate-900">智遊台灣</h1>
          <p className="text-sm text-slate-500 mt-2">登入後開始建立你的專屬旅遊行程</p>
        </div>

        <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2 rounded-lg text-sm font-bold transition ${!isRegister ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
          >
            登入
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2 rounded-lg text-sm font-bold transition ${isRegister ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
          >
            註冊
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">使用者名稱</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                minLength={2}
                maxLength={50}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                placeholder="例如：廷友"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">密碼</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={isRegister ? 8 : 1}
              maxLength={72}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder={isRegister ? '至少 8 個字元' : '請輸入密碼'}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 transition"
          >
            {loading ? '處理中…' : isRegister ? '建立帳號' : '登入系統'}
          </button>
        </form>
      </div>
    </div>
  );
}
