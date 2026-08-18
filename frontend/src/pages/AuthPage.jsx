import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com";

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://smart-taiwan.onrender.com';

export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  useEffect(() => {
    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'login') return;

    const handleGoogleResponse = async (response) => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          onAuthenticated(data.user);
        } else {
          setError(data.detail || 'Google 登入失敗');
        }
      } catch (err) {
        setError('連線伺服器失敗');
      } finally {
        setLoading(false);
      }
    };

    const renderGoogleButton = () => {
      const buttonDiv = document.getElementById('googleButtonDiv');
      if (window.google && buttonDiv) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          buttonDiv,
          { theme: 'outline', size: 'large', width: '100%' }
        );
      } else {
        setTimeout(renderGoogleButton, 100);
      }
    };

    renderGoogleButton();
  }, [mode, onAuthenticated]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
      const payload = isRegister 
        ? { username: form.username, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        onAuthenticated(data.user);
      } else {
        setError(data.detail || '操作失敗');
      }
    } catch (err) {
      setError('無法連線至伺服器');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setForm({ username: '', email: '', password: '' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-7">
        <div className="text-center mb-7">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="text-2xl font-extrabold text-slate-900">智遊台灣</h1>
          <p className="text-sm text-slate-500 mt-2">
            登入後開始建立你的專屬旅遊行程
          </p>
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
              placeholder="請輸入密碼"
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

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-xs text-slate-400 font-semibold">或使用第三方登入</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="w-full flex justify-center">
          <div id="googleButtonDiv" className="w-full flex justify-center"></div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;