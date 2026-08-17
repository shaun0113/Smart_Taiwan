import React, { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com";

export const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleGoogleResponse = async (response) => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch('http://127.0.0.1:8000/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          onLoginSuccess(data.user);
        } else {
          setErrorMsg(data.detail || 'Google 登入失敗');
        }
      } catch (err) {
        setErrorMsg('連線伺服器失敗');
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
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isLogin ? 'http://127.0.0.1:8000/api/auth/login' : 'http://127.0.0.1:8000/api/auth/register';
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.detail || '操作失敗');
      }
    } catch (err) {
      setErrorMsg('無法連線至伺服器');
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">使用者名稱</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入你的暱稱"
                className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none"
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
              className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">密碼</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs rounded-xl border border-slate-300 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 mt-2 cursor-pointer disabled:bg-slate-300"
          >
            {loading ? '處理中...' : (isLogin ? '登入系統' : '註冊帳號')}
          </button>
        </form>

        <div className="flex items-center my-1">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[11px] text-slate-400 font-semibold">或使用第三方登入</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="w-full flex justify-center">
          <div id="googleButtonDiv" className="w-full flex justify-center"></div>
        </div>

        <div className="text-center mt-2">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            {isLogin ? '沒有帳號？點此註冊新帳號' : '已經有帳號了？點此登入'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;