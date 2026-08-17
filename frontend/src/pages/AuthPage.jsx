import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com";

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://smart-taiwan.onrender.com';

export const AuthPage = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleGoogleResponse = async (response) => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          window.location.reload();
        } else {
          setErrorMsg(data.detail || 'Google 登入失敗');
        }
      } catch (err) {
        console.error("Google 登入例外錯誤:", err);
        setErrorMsg(`前端執行錯誤: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const loadGoogleScript = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleButtonDiv'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };

    if (!document.getElementById('google-client-script')) {
      const script = document.createElement('script');
      script.id = 'google-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = loadGoogleScript;
      document.body.appendChild(script);
    } else {
      loadGoogleScript();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'forgot') {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, new_password: password })
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg('密碼重設成功！請切換回登入頁面進行登入。');
          setPassword('');
        } else {
          setErrorMsg(data.detail || '重設失敗');
        }
      } else {
        const endpoint = authMode === 'login' ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
        const payload = authMode === 'login' ? { email, password } : { username, email, password };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          window.location.reload();
        } else {
          setErrorMsg(data.detail || '操作失敗');
        }
      }
    } catch (err) {
      console.error("登入表單例外錯誤:", err);
      setErrorMsg(`前端執行錯誤: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col gap-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">智遊台灣 Smart Tour</h1>
          <p className="text-xs text-slate-400 mt-1">你的專屬 AI 智慧旅遊排程系統</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold animate-fadeIn">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">使用者名稱</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入你的暱稱"
                className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">電子郵件</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {authMode === 'forgot' ? '新密碼 (至少8碼)' : '密碼'}
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md mt-2 cursor-pointer disabled:bg-slate-300"
          >
            {loading ? '處理中...' : (authMode === 'login' ? '登入系統' : authMode === 'register' ? '註冊帳號' : '確認重設密碼')}
          </button>
        </form>

        {authMode === 'login' && (
          <>
            <div className="flex items-center my-1">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-[11px] text-slate-400 font-semibold">或使用第三方登入</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <div className="w-full flex justify-center">
              <div id="googleButtonDiv" className="w-full flex justify-center"></div>
            </div>
          </>
        )}

        <div className="flex justify-between items-center mt-2 text-xs font-bold">
          {authMode === 'login' ? (
            <>
              <button type="button" onClick={() => setAuthMode('forgot')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                忘記密碼？
              </button>
              <button type="button" onClick={() => setAuthMode('register')} className="text-emerald-600 hover:text-emerald-700 cursor-pointer">
                註冊新帳號
              </button>
            </>
          ) : (
            <button type="button" onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="w-full text-center text-emerald-600 hover:text-emerald-700 cursor-pointer">
              ← 返回登入頁面
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthPage;