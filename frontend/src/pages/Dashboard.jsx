import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export const Dashboard = () => {
  const [formData, setFormData] = useState({
    cities: ['臺北市'],
    days: 3,
    group_size: '2-4人',
    tags: [],
    transport: '自駕' 
  });

  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [userNeed, setUserNeed] = useState('');
  const [spotsRecommendation, setSpotsRecommendation] = useState('');
  const [accumulatedSpots, setAccumulatedSpots] = useState('');
  const [apiMsg, setApiMsg] = useState(''); 
  const [userChoice, setUserChoice] = useState('');
  const [finalItinerary, setFinalItinerary] = useState('');

  const resultEndRef = useRef(null);

  const scrollToBottom = () => {
    resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [spotsRecommendation, finalItinerary, loading, apiMsg]);

  // 全域 Enter 鍵流暢控制機制
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') {
          return;
        }
        if (step === 0) { e.preventDefault(); setStep(1); }
        else if (step === 1) { e.preventDefault(); setStep(2); }
        else if (step === 2) { e.preventDefault(); handleRecommendSpots(); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [step, formData]);

  const handleCheckboxChange = (field, value) => {
    const currentList = [...formData[field]];
    if (currentList.includes(value)) {
      if (field === 'cities' && currentList.length === 1) return; 
      setFormData({ ...formData, [field]: currentList.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [field]: [...currentList, value] });
    }
  };

  // ==================== 1. 景點海選 (對齊本地 MySQL 讀取) ====================
  const handleRecommendSpots = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setStep(3); 

      const res = await fetch('http://127.0.0.1:8000/api/v1/recommend-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: formData.cities.join(','),
          days: formData.days,             
          group_size: formData.group_size,
          tags: formData.tags,
          accumulated_spots: accumulatedSpots || ""
        })
      });

      const data = await res.json();

      if (res.ok && data) {
        // 精確對齊後端 FastAPI 回傳的 JSON 欄位名稱
        setUserNeed(data.user_need || `預計行程天數：${formData.days}天`);
        setSpotsRecommendation(data.spots_recommendation || "");
        setAccumulatedSpots(data.accumulated_spots || "");
        setApiMsg("請檢閱右側由資料庫海選出的 AI 決策建議名單。您可以在下方輸入框進行調整，滿意後請點選『確定編排行程表』！");
      } else {
        setErrorMsg(`海選景點失敗：${data.detail || JSON.stringify(data)}`);
        setStep(2);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("景點海選連線失敗，請確認後端 Python 服務是否正常啟動。");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 2. 意圖網閘微調意見 ====================
  const handleAnalyzeSelection = async (e) => {
    if (e) e.preventDefault();
    if (!userChoice.trim() || loading) return;

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch('http://127.0.0.1:8000/api/v1/analyze-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_choice: userChoice,
          spots_recommendation: spotsRecommendation,
          accumulated_spots: accumulatedSpots,
          user_need: userNeed
        })
      });

      const data = await res.json();

      if (res.ok && data) {
        setAccumulatedSpots(data.accumulated_spots);
        setApiMsg(data.msg);
        setUserChoice(""); 

        if (data.status === "READY") {
          await handleGenerateFinal(data.accumulated_spots);
        }
      } else {
        setErrorMsg(`意見微調失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("微調意見發送失敗，請檢查後端連線。");
    } finally {
      setLoading(false);
    }
  };

  // ==================== 3. 終極排程 (對齊後端參數約束) ====================
  const handleGenerateFinal = async (targetSpots = null) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch('http://127.0.0.1:8000/api/v1/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accumulated_spots: targetSpots || accumulatedSpots, 
          user_need: userNeed || `預計行程天數：${formData.days}天`, 
          city: formData.cities.join(','),       
          transport: formData.transport || '自駕' 
        })
      });

      const data = await res.json();

      if (res.ok && data && data.result) {
        setFinalItinerary(data.result);
        setStep(4); 
      } else {
        setErrorMsg(`最終行程生成失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error("前端網絡請求發生錯誤:", err);
      setErrorMsg(`最終行程表生成失敗。原因：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UI 畫面渲染 ====================
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600 tracking-wide flex items-center gap-2">
            智遊台灣 Smart Tour
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            資管系畢業專題 – 國內智慧旅遊決策支援系統
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        
        {/* 頂部進度條 */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-600 tracking-wider">SYSTEM PROGRESS</span>
            <span className="text-xs font-semibold text-slate-400">目前步驟：{step + 1} / 5</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${(step + 1) * 20}%` }}
            ></div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-semibold text-sm mb-6 shadow-sm">
             {errorMsg}
          </div>
        )}

        {/* ==================== 第五步：生成最終行程結果 ==================== */}
        {step === 4 ? (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h2 className="text-base font-bold text-slate-900 mb-2">專屬行程路線導航</h2>
              <div className="h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.cities[0] + " 智慧旅遊")}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  智遊台灣 專屬旅遊行程規劃表
                </h2>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                    {formData.days} 天 {formData.group_size} ({formData.transport})
                  </span>
                  {formData.cities.map(c => (
                    <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-8 border border-slate-100 min-h-[450px] text-slate-700 tracking-wide">
                {loading ? (
                  <div className="h-[350px] flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-xs font-semibold text-emerald-600 mt-5 tracking-wide">
                      正在為您編排、優化動線中，請稍候...
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-emerald prose-base max-w-none text-left leading-loose space-y-6 md:prose-lg
                    prose-headings:mt-6 prose-headings:mb-4 prose-headings:font-extrabold prose-headings:text-slate-900
                    prose-p:mb-5 prose-p:leading-loose prose-p:text-slate-700
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-3
                    prose-li:my-2">
                    <ReactMarkdown>
                      {finalItinerary || ''}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-800 mb-2">🎯 對行程不滿意？告訴 AI 你想修改哪裡：</h3>
                <form onSubmit={handleAnalyzeSelection} className="flex gap-2">
                  <input 
                    type="text" 
                    value={userChoice}
                    onChange={(e) => setUserChoice(e.target.value)}
                    disabled={loading} 
                    placeholder={loading ? "AI 正在重新規劃行程中..." : "例如: 第二天下午改去大稻埕、行程排鬆一點..."}
                    className="flex-1 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || !userChoice.trim()} 
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 shadow-md shadow-emerald-600/10 transition-all"
                  >
                    {loading ? "修改中..." : "送出修改需求"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6 flex flex-col justify-between min-h-[460px]">
              {step === 0 && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">第一步：你想去哪些地方玩？（可複選）</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2 overflow-y-auto max-h-[320px] pr-1">
                      {[
                        "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", 
                        "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", 
                        "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"
                      ].map(city => {
                        const isSelected = formData.cities.includes(city);
                        return (
                          <div 
                            key={city}
                            onClick={() => handleCheckboxChange('cities', city)}
                            className={`py-2.5 text-center rounded-lg cursor-pointer text-xs font-semibold border transition-all select-none
                              ${isSelected ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                          >
                            {city}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">第二步：時間天數與交通方式設定</h2>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 my-4">
                      <p className="text-xs text-slate-500 mb-2">預計天數：{formData.days} 天</p>
                      <input type="range" min="1" max="7" value={formData.days} onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })} className="w-full accent-emerald-600" />
                    </div>
                    
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">交通方式：</p>
                    <div className="flex gap-3">
                      {['大眾運輸', '自駕'].map(type => (
                        <button 
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, transport: type })}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold border transition-all
                            ${formData.transport === type 
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {type === '大眾運輸' ? '大眾運輸' : '輕鬆自駕'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setStep(0)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                    <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">下一步</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">第三步：成員設定</h2>
                    <div className="flex flex-col gap-2 my-2">
                      {['獨旅', '2-4人', '5人以上小團體'].map(size => (
                        <button
                          key={size}
                          onClick={() => setFormData({ ...formData, group_size: size })}
                          className={`py-3 text-left px-4 rounded-xl text-xs font-semibold border transition-all
                            ${formData.group_size === size ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-6">
                    <button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                    <button onClick={handleRecommendSpots} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">開始海選景點！</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 mb-2">偏好意見調整控制台</h2>
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mb-4">
                      {apiMsg || "請看右側 AI 智慧決策建議名單。"}
                    </p>
                    <form onSubmit={handleAnalyzeSelection} className="flex gap-2 mt-2">
                      <input 
                        type="text" 
                        value={userChoice} 
                        onChange={(e) => setUserChoice(e.target.value)} 
                        disabled={loading} 
                        placeholder="例如：某些景點不要去、加入特定新景點..."
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500" 
                      />
                      <button type="submit" disabled={loading || !userChoice.trim()} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200">送出意見</button>
                    </form>
                  </div>
                  <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setStep(0)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-500">重新規劃</button>
                    <button onClick={() => handleGenerateFinal(null)} className="px-5 py-2 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10">確定！編排完整行程表</button>
                  </div>
                </div>
              )}
            </section>

            {/* 右側面板 */}
            <section className="flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5">
                <h2 className="text-base font-bold text-slate-900 mb-1">區域地圖導航（動態展示）</h2>
                <div className="mt-2 h-44 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.cities[0] + " 景點")}&output=embed`} allowFullScreen></iframe>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5 flex-1 flex flex-col">
                <h2 className="text-base font-bold text-slate-900 mb-2">智慧旅遊決策建議</h2>
                <div className="flex-1 bg-slate-50/70 rounded-xl p-4 border border-slate-100 min-h-[300px] max-h-[440px] overflow-y-auto text-sm text-slate-700">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-12">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      </div>
                      <p className="text-xs font-semibold text-emerald-600 mt-4">正在調度本地大數據與過濾篩選最佳推薦中...</p>
                    </div>
                  ) : step < 3 ? (
                    <p className="text-slate-400 text-xs text-center py-12 italic">尚未產生建議，請先在左側面板完成偏好設定。</p>
                  ) : (
                    <div className="prose prose-emerald prose-sm max-w-none text-left leading-relaxed">
                      <ReactMarkdown>
                        {spotsRecommendation || ''}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <div ref={resultEndRef} />
    </div>
  );
};