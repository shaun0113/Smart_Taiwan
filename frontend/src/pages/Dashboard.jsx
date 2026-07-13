import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export const Dashboard = () => {
  const [formData, setFormData] = useState({
    start_location: '臺北市',
    cities: ['臺北市'],
    days: 3,
    group_size: '2-4人',
    tags: [],
    transport: '自駕',
    start_time: '08:00'
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
  
  // 控制複製成功提示的狀態
  const [copySuccess, setCopySuccess] = useState(false);

  // 地圖即時定位狀態
  const [mapQuery, setMapQuery] = useState('臺北市');

  const resultEndRef = useRef(null);
  const itineraryRef = useRef(null);

  const scrollToBottom = () => {
    resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (!loading && step === 5) { 
      scrollToBottom();
    }
  }, [spotsRecommendation, finalItinerary, loading, apiMsg, step]);

  // 智慧多點停靠路徑地圖生成器
  const getMapSrc = () => {
    const travelMode = formData.transport === '自駕' ? 'd' : 'r';

    // 最終行程頁：自動解析 AI 排出的景點順序，轉化為 Google 停靠站導航
    if (step === 5 && finalItinerary) {
      const lines = finalItinerary.split('\n');
      let matchedSpots = [];
      lines.forEach(line => {
        if ((line.includes('**') || line.match(/^\d+[\.\、]/)) && line.length < 50) {
          const cleanName = line.replace(/[\*#_`\d\.\、\-\[\]\(\)]/g, '').replace(/(推薦理由|預計停留|停留|交通|大眾運輸|自駕|時間)[:：].*$/, '').trim();
          if (cleanName && cleanName.length > 1 && cleanName.length < 15 && !cleanName.includes('行程') && !cleanName.includes('第') && !cleanName.includes('天')) {
            matchedSpots.push(cleanName);
          }
        }
      });

      const uniqueSpots = [...new Set(matchedSpots)].slice(0, 8); 

      if (uniqueSpots.length > 0) {
        const origin = formData.start_location;
        const destination = uniqueSpots[uniqueSpots.length - 1]; 
        const waypoints = uniqueSpots.slice(0, uniqueSpots.length - 1).join('+'); 
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&to=${encodeURIComponent(waypoints)}&dirflg=${travelMode}&output=embed`;
      }
    }

    // 基礎海選步驟與即時按鈕聯動地圖邏輯
    if (mapQuery && mapQuery !== formData.start_location && mapQuery !== formData.cities[0]) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }

    if (formData.start_location === formData.cities[0]) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(formData.cities[0] + ' 景點')}&output=embed`;
    }

    return `https://maps.google.com/maps?saddr=${encodeURIComponent(formData.start_location)}&daddr=${encodeURIComponent(formData.cities[0])}&dirflg=${travelMode}&output=embed`;
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (step === 4 || step === 5) return;
        if (step !== 3 && document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') {
          return;
        }
        if (step === 0) { e.preventDefault(); setStep(1); } 
        else if (step === 1) { e.preventDefault(); setStep(2); } 
        else if (step === 2) { e.preventDefault(); setStep(3); } 
        else if (step === 3) { 
          e.preventDefault(); 
          if (formData.group_size && formData.group_size.trim() !== '') {
            handleRecommendSpots(); 
          }
        }
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

  const handleRecommendSpots = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setStep(4); 

      const res = await fetch('https://smart-taiwan.onrender.com/api/v1/recommend-spots', {
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
        setUserNeed(data.user_need || `出發地：${formData.start_location}，預計行程天數：${formData.days}天`);
        setSpotsRecommendation(data.spots_recommendation || "");
        setAccumulatedSpots(data.accumulated_spots || "");
        setApiMsg("請檢閱左側由資料庫海選出的 AI 決策建議名單。您可以在右側控制台輸入偏好進行調整，滿意後請點選『確定編排行程表』！");
        setMapQuery(formData.cities[0]);
      } else {
        setErrorMsg(`海選景點失敗：${data.detail || JSON.stringify(data)}`);
        setStep(3);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("景點海選連線失敗，請確認 Render 後端雲端服務是否正常啟動。");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSelection = async (e) => {
    if (e) e.preventDefault();
    if (!userChoice.trim() || loading) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setMapQuery(userChoice);

      const res = await fetch('https://smart-taiwan.onrender.com/api/v1/analyze-selection', {
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
      setErrorMsg("微調意見發送失敗，請檢查雲端後端連線。");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFinal = async (targetSpots = null) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch('https://smart-taiwan.onrender.com/api/v1/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accumulated_spots: targetSpots || accumulatedSpots, 
          user_need: userNeed || `出發地：${formData.start_location}，預計行程天數：${formData.days}天`, 
          city: formData.cities.join(','),       
          transport: formData.transport || '自駕',
          start_location: formData.start_location, 
          start_time: formData.start_time || '08:00'
        })
      });

      const data = await res.json();

      if (res.ok && data && data.result) {
        setFinalItinerary(data.result);
        setStep(5); 
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

  const handleModifyItinerary = async (e) => {
    if (e) e.preventDefault();
    if (!userChoice.trim() || loading) return;

    try {
      setLoading(true);
      setErrorMsg("");
      setMapQuery(userChoice);

      const res = await fetch('https://smart-taiwan.onrender.com/api/v1/modify-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_itinerary: finalItinerary,
          modification_demand: userChoice
        })
      });

      const data = await res.json();

      if (res.ok && data && data.status === "success") {
        setFinalItinerary(data.result);
        setUserChoice(""); 
      } else {
        setErrorMsg(`微調行程失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("行程表微調請求失敗，請確認 Render 後端雲端服務是否正常。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!finalItinerary) return;
    navigator.clipboard.writeText(finalItinerary)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); 
      })
      .catch((err) => console.error('無法複製行程: ', err));
  };

  const handlePrintPDF = () => {
    if (!itineraryRef.current) return;
    const printContent = itineraryRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<div style="padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">${printContent}</div>`;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800" onClick={() => setStep(0)} style={{ cursor: 'pointer' }}>
            智遊台灣 Smart Tour
          </h1>
          <span className="text-xs text-slate-500 font-medium">資管系畢業專題 – 國內智慧旅遊決策支援系統</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-600 tracking-wider">SYSTEM PROGRESS</span>
            <span className="text-xs font-semibold text-slate-400">目前步驟：{step + 1} / 6</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${(step + 1) * 16.66}%` }}></div>
          </div>
        </div>

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-semibold text-sm mb-6 shadow-sm">{errorMsg}</div>}

        {step === 5 ? (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h2 className="text-base font-bold text-slate-900 mb-2">🗺️ 智慧串聯拓撲導航（出發地 ➔ 停靠景點 ➔ 終點）</h2>
              <div className="h-96 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen></iframe>
              </div>
            </div>

            <div ref={itineraryRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">智遊台灣 專屬旅遊行程規劃表</h2>
                <div className="flex gap-2 items-center">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                    出發地：{formData.start_location} | {formData.days} 天 {formData.group_size} ({formData.transport})
                  </span>
                  {formData.cities.map(c => <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-semibold">{c}</span>)}
                </div>
              </div>
      
              <div className="mb-4 flex gap-2 justify-end no-print">
                <button onClick={handleCopyToClipboard} className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {copySuccess ? " 已複製到剪貼簿" : " 複製文字行程"}
                </button>
                <button onClick={handlePrintPDF} className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-all flex items-center gap-1.5 shadow-sm">匯出 PDF / 列印</button>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-8 border border-slate-100 min-h-[450px] text-slate-700 tracking-wide">
                {loading ? (
                  <div className="h-[350px] flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-xs font-semibold text-emerald-600 mt-5 tracking-wide">正在為您編排、優化動線中，請稍候...</p>
                  </div>
                ) : (
                  <div className="prose prose-emerald prose-sm max-w-none text-left leading-relaxed space-y-2 prose-headings:mt-3 prose-headings:mb-1 prose-headings:font-bold prose-headings:text-slate-900 prose-p:mb-2 prose-p:leading-relaxed prose-p:text-slate-700 prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1 prose-li:my-0.5">
                    <ReactMarkdown>{finalItinerary.replace(/<br\s*\/?>/gi, '\n') || ''}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 no-print">
                <h3 className="text-sm font-bold text-slate-800 mb-2"> 對行程不滿意？你想修改哪裡：</h3>
                <form onSubmit={handleModifyItinerary} className="flex gap-2">
                  <input type="text" value={userChoice} onChange={(e) => setUserChoice(e.target.value)} disabled={loading} placeholder={loading ? "正在重新規劃行程中..." : "例如: 第二天下午改去大稻埕、行程排鬆一點..."} className="flex-1 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" />
                  <button type="submit" disabled={loading || !userChoice.trim()} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 shadow-md shadow-emerald-600/10 transition-all">{loading ? "修改中..." : "送出修改需求"}</button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {step === 4 ? (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[580px] lg:col-span-1 animate-fadeIn">
                <div className="flex-1 flex flex-col min-h-0">
                  <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">💡 智慧旅遊決策建議</h2>
                  
                  <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line tracking-wide">
                    {loading ? (
                      <div className="h-full flex flex-col items-center justify-center py-12">
                        <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></div></div>
                        <p className="text-xs font-semibold text-emerald-600 mt-4">正在調度本地大數據與過濾篩選最佳推薦中...</p>
                      </div>
                    ) : (
                      <div className="prose prose-emerald prose-sm max-w-none text-left leading-relaxed space-y-2 prose-headings:mt-3 prose-headings:mb-1 prose-headings:font-bold prose-headings:text-slate-900 prose-p:mb-2 prose-p:leading-relaxed prose-p:text-slate-700 prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1 prose-li:my-0.5">
                        <ReactMarkdown 
                          components={{
                            p: ({node, children}) => {
                              const hasSpot = children.some(child => 
                                child?.props?.children && 
                                (child.props.children.toString().length < 15)
                              );
                              
                              if (hasSpot) {
                                let spotName = "";
                                children.forEach(child => {
                                  if (child?.props?.children) spotName += child.props.children.toString();
                                  else if (typeof child === 'string') spotName += child;
                                });
                                const cleanSpotName = spotName.replace(/[\*#_`\d\.\、\-\[\]\(\)【】\s📍🐾]/g, '').trim();

                                if (cleanSpotName.length > 1 && cleanSpotName.length < 15 && !cleanSpotName.includes("推薦理由") && !cleanSpotName.includes("景點候選")) {
                                  return (
                                    <div className="flex items-center justify-between gap-3 my-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">
                                      <p className="!m-0 text-slate-800 font-semibold">{children}</p>
                                      <button 
                                        type="button"
                                        onClick={() => setMapQuery(cleanSpotName)}
                                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                                      >
                                        🗺️ 查看景點
                                      </button>
                                    </div>
                                  );
                                }
                              }
                              return <p>{children}</p>;
                            }
                          }}
                        >
                          {spotsRecommendation ? spotsRecommendation.replace(/<br\s*\/?>/gi, '\n') : ''}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4 mt-4">
                  <button onClick={() => setStep(3)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">重新規劃</button>
                  <button onClick={() => handleGenerateFinal(null)} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">確定！編排完整行程表</button>
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6 flex flex-col justify-between min-h-[460px]">
                
                {step === 0 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第一步：你的出發地在哪裡？（單選）</h2>
                      <p className="text-xs text-slate-500 mb-4">系統將以此出發點精確估算第一天起點與交通路線時間。</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2 overflow-y-auto max-h-[320px] pr-1">
                        {["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣"].map(city => {
                          const isSelected = formData.start_location === city;
                          return (
                            <div key={city} onClick={() => { setFormData({ ...formData, start_location: city }); setMapQuery(city); }} className={`py-2.5 text-center rounded-lg cursor-pointer text-xs font-semibold border transition-all select-none ${isSelected ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>{city}</div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4"><button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button></div>
                  </div>
                )}

                {step === 1 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第二步：你想去哪些目的地玩？（可複選）</h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2 overflow-y-auto max-h-[320px] pr-1">
                        {["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"].map(city => {
                          const isSelected = formData.cities.includes(city);
                          return (
                            <div key={city} onClick={() => { handleCheckboxChange('cities', city); setMapQuery(city); }} className={`py-2.5 text-center rounded-lg cursor-pointer text-xs font-semibold border transition-all select-none ${isSelected ? 'bg-emerald-600 text-white border-emerald-700 shadow-md font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>{city}</div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <button onClick={() => setStep(0)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第三步：天數與偏好設定</h2>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-600">預計天數</label>
                          <span className="text-sm font-bold text-emerald-600">{formData.days} 天</span>
                        </div>
                        <input type="range" min="1" max="7" value={formData.days} onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                        <div className="flex justify-between text-[10px] text-slate-400 px-1 mt-1"><span>1天</span><span>2天</span><span>3天</span><span>4天</span><span>5天</span><span>6天</span><span>7天</span></div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">交通工具</label>
                        <div className="flex gap-2">
                          {['自駕', '大眾運輸'].map(t => (
                            <button key={t} type="button" onClick={() => setFormData({ ...formData, transport: t })} className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold border transition-all ${formData.transport === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">旅遊目的 / 偏好標籤</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {['情侶約會', '遊樂園', '親子同遊', '網美打卡', '美食吃貨', '大自然放鬆'].map(tag => {
                            const isSelected = formData.tags && formData.tags.includes(tag);
                            return (
                              <button key={tag} type="button" onClick={() => { let newTags = formData.tags ? [...formData.tags] : []; if (isSelected) { newTags = newTags.filter(t => t !== tag); } else { newTags.push(tag); } setFormData({ ...formData, tags: newTags }); }} className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{tag}</button>
                            );
                          })}
                        </div>
                        <div className="mt-2">
                          <input type="text" placeholder="請輸入其他旅遊目的，輸入完按 Enter 新增標籤" className="w-full text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim() !== '') { e.preventDefault(); const newTag = e.target.value.trim(); let currentTags = formData.tags ? [...formData.tags] : []; if (!currentTags.includes(newTag)) { currentTags.push(newTag); } setFormData({ ...formData, tags: currentTags }); e.target.value = ''; } }} />
                          <p className="text-[10px] text-slate-400 mt-1">💡 輸入你想去的目的後按 Enter 鍵即可成功加入標籤清單。</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.tags && formData.tags.filter(t => !['情侶約會', '遊樂園', '親子同遊', '網美打卡', '美食吃貨', '大自然放鬆'].includes(t)).map(customTag => (
                              <span key={customTag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2 py-1 rounded-md border border-slate-200">{customTag}<button type="button" className="font-bold text-slate-400 hover:text-slate-600" onClick={() => { setFormData({ ...formData, tags: formData.tags.filter(t => t !== customTag) }); }}>×</button></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6"><button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button><button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">下一步</button></div>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第四步：成員設定</h2>
                      <p className="text-xs text-slate-500 mb-4">請輸入本次旅遊的人數或成員結構（例如：3人、獨旅、5人公司出遊）</p>
                      <div className="mt-2"><input type="text" placeholder="例如：2-4人、獨旅、家族旅遊10人..." value={formData.group_size || ''} onChange={(e) => setFormData({ ...formData, group_size: e.target.value })} className="w-full text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" autoFocus /></div>
                    </div>
                    <div className="flex justify-between mt-6"><button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button><button onClick={handleRecommendSpots} disabled={!formData.group_size || formData.group_size.trim() === ''} className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors ${(!formData.group_size || formData.group_size.trim() === '') ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>開始海選景點！</button></div>
                  </div>
                )}
              </section>
            )}

            {step === 4 ? (
              <section className="flex flex-col gap-6 lg:col-span-1 animate-fadeIn">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">區域地圖智慧導航（即時連動）</h2>
                  <div className="h-[240px] rounded-xl overflow-hidden border border-slate-100">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen></iframe>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">偏好意見調整控制台</h2>
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/70">{apiMsg || "請檢閱左側 AI 智慧決策建議名單。"}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <form onSubmit={handleAnalyzeSelection} className="flex gap-2">
                      <input type="text" value={userChoice} onChange={(e) => setUserChoice(e.target.value)} disabled={loading} placeholder="例如：輸入特定想查看的景點，地圖會即時切換定位..." className="flex-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" />
                      <button type="submit" disabled={loading || !userChoice.trim()} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 transition-colors">送出意見</button>
                    </form>

                    {accumulatedSpots && accumulatedSpots.trim() !== "" && (
                      <div className="mt-1">
                        <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">已提交的變更需求紀錄：</span>
                        <div className="flex flex-wrap gap-1.5">
                          {accumulatedSpots.split('+').map((opinion, idx) => {
                            const cleanOpinion = opinion.trim();
                            if (!cleanOpinion) return null;
                            return <span key={idx} className="inline-flex items-center bg-slate-50 text-slate-600 text-[11px] px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs font-medium">🎯 {cleanOpinion}</span>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5">
                  <h2 className="text-base font-bold text-slate-900 mb-1">區域地圖智慧導航（動態路線預覽）</h2>
                  <div className="mt-2 h-52 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen></iframe>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5 flex-1 flex flex-col">
                  <h2 className="text-base font-bold text-slate-900 mb-2">智慧旅遊決策建議</h2>
                  <div className="flex-1 bg-slate-50/70 rounded-xl p-4 border border-slate-100 min-h-[260px] max-h-[360px] overflow-y-auto text-sm text-slate-700 flex items-center justify-center">
                    <p className="text-slate-400 text-xs text-center italic">尚未產生建議，請先在左側面板完成偏好設定。</p>
                  </div>
                </div>
              </section>
            )}

          </div>
        )}
      </main>
      <div ref={resultEndRef} />
    </div>
  );
};

export default Dashboard;