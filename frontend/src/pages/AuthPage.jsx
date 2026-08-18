import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com";

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://smart-taiwan.onrender.com';

export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); 
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isRegister = mode === 'register';
  
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgot) {
        if (form.password !== form.confirmPassword) {
          setError('兩次輸入的新密碼不相符，請重新確認');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, new_password: form.password, otp: form.otp })
        });
        const data = await res.json();

        if (res.ok) {
          setSuccessMsg('密碼重設成功！請使用新密碼登入。');
          setTimeout(() => {
            setMode('login');
            setSuccessMsg('');
            setForm({ username: '', email: '', password: '', confirmPassword: '', otp: '' });
          }, 1500);
        } else {
          setError(data.detail || '重設失敗');
        }
      } else {
        const endpoint = isRegister ? `${API_BASE_URL}/api/auth/register` : `${API_BASE_URL}/api/auth/login`;
        const payload = isRegister 
          ? { username: form.username, email: form.email, password: form.password, otp: form.otp }
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
    setSuccessMsg('');
    setCountdown(0);
    setForm({ username: '', email: '', password: '', confirmPassword: '', otp: '' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-7">
        <div className="text-center mb-7">
          <div className="text-4xl mb-3">🧭</div>
          <h1 className="text-2xl font-extrabold text-slate-900">智遊台灣</h1>
          <p className="text-sm text-slate-500 mt-2">
            {isForgot ? '重設您的帳號密碼' : '登入後開始建立你的專屬旅遊行程'}
          </p>
        </div>

        {!isForgot && (
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
        )}

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

          {(isRegister || isForgot) && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">驗證碼</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  maxLength={6}
                  required
                  className="flex-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 font-mono tracking-widest"
                  placeholder="輸入6位數驗證碼"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-200 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown} 秒後重發` : '取得驗證碼'}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {isForgot ? '新密碼' : '密碼'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={isRegister || isForgot ? 8 : 1}
              maxLength={72}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder={isForgot ? '請輸入新密碼 (至少 8 個字元)' : '請輸入密碼'}
            />
          </div>

          {isForgot && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">確認新密碼</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                minLength={8}
                maxLength={72}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                placeholder="請再次輸入新密碼"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 transition"
          >
            {loading ? '處理中…' : isForgot ? '確認重設密碼' : isRegister ? '驗證並建立帳號' : '登入系統'}
          </button>
        </form>
        
        {!isForgot && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-xs text-slate-400 font-semibold">或一鍵登入</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <div className="w-full flex justify-center">
              <div id="googleButtonDiv" className="w-full flex justify-center"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthPage;