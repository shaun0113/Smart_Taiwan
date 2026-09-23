import React from 'react';

const CORE_TECH = [
  {
    icon: '🧠',
    title: '結構化 Prompt 引擎',
    subtitle: 'Prompt Engineering Framework',
    desc: '使用 Python 撰寫 Prompt Generator，將使用者勾選的條件與 TDX 觀光局 API 資料自動組合，生成給 LLM 的指令，使用者完全不需要學習如何下提示詞。',
  },
  {
    icon: '🗄️',
    title: '資料持久化與快取技術',
    subtitle: 'Database & Caching',
    desc: '預先抓取全台景點的地址、介紹、寵物友善度、停車位資訊等存入資料庫（SQLite / PostgreSQL），系統反應速度極快，無需每次都呼叫觀光局 API。',
  },
  {
    icon: '🖱️',
    title: '動態互動介面開發',
    subtitle: 'Interactive Web Frontend',
    desc: '以 React 打造「拖拉式行程排序」與「分步引導」的操作流程，讓使用者像選擇地點與需求一樣簡單，背後已完成複雜的邏輯處理。',
  },
  {
    icon: '🔍',
    title: '檢索增強生成技術',
    subtitle: 'RAG Logic',
    desc: '系統先從資料庫撈出「確認存在」的景點清單，再交給 AI 排序，確保 AI 只能從提供的清單選擇，不會出現幻覺、亂編不存在的景點。',
  },
];

const FLOW_STEPS = [
  {
    step: '01',
    title: '簡單勾選，取代複雜對話',
    tag: '需求採集',
    desc: '不讓使用者對著空白對話框發呆，而是設計像測驗一樣的簡單勾選介面，透過地點、人數、預算取代複雜對話。',
  },
  {
    step: '02',
    title: '官方資料庫的「第一輪海選」',
    tag: '資料過濾',
    desc: '系統拿到需求後，會先到後台的官方景點資料庫進行精確篩選，剔除不符停車、預算、縣市條件的景點，防範 AI 虛構資訊。',
  },
  {
    step: '03',
    title: '自動生成指令',
    tag: 'Prompt',
    desc: '系統把篩選出的優質景點與需求，自動組裝成一段有條理的指令，將篩選結果與需求自動封裝成精準 Prompt。',
  },
  {
    step: '04',
    title: 'AI 的最後整理與排程',
    tag: '智慧產出',
    desc: 'AI 依據清單安排交通順位與行程邏輯，只需專心把提供的景點考慮各種因素後，排成一個好走的行程。',
  },
  {
    step: '05',
    title: '產出行程與彈性微調',
    tag: '最終呈現',
    desc: '把排好的內容變成清楚的網頁，並支援快速微調更新；只要重新輸入需求，系統會記住之前的選擇，快速更新出新行程。',
  },
];

const PAIN_POINTS = [
  { bad: '對著空白對話框，不知道怎麼跟 AI 描述需求', good: '勾選地點、人數、預算，介面直接引導完成需求' },
  { bad: 'AI 常常「幻覺」推薦不存在或已歇業的景點', good: '景點先經官方 TDX 資料庫驗證，AI 只能從真實清單挑選' },
  { bad: '行程路線繞來繞去，交通時間抓不準', good: 'AI 依距離與順路程度排序，減少繞路、抓好每日時間配置' },
  { bad: '每次規劃都要重新對話、無法保存與分享', good: '行程可以儲存紀錄，方便下次查看，也能直接跟別人分享' },
];

export function Landing({ onStart }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-emerald-700 text-lg">
            <span>🧭</span>
            <span>智遊台灣</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <a href="#why" className="hover:text-emerald-700">為什麼做這個</a>
            <a href="#tech" className="hover:text-emerald-700">核心技術</a>
            <a href="#flow" className="hover:text-emerald-700">系統流程</a>
            <a href="#data" className="hover:text-emerald-700">資料來源</a>
          </nav>
          <button
            onClick={onStart}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 transition"
          >
            登入
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 mb-5">
          畢業專題 · AI 旅遊行程規劃系統
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
          消除旅遊新手與專家間的<br className="hidden md:block" />規劃鴻溝
        </h1>
        <p className="text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          傳統旅遊規劃對新手而言門檻很高，即使使用大型語言模型（Gemini、ChatGPT），
          若缺乏提示工程（Prompt）技巧，往往只能得到雜亂、甚至包含錯誤與過時資訊的行程。
          智遊台灣讓使用者在零學習成本下，透過系統的結構化引導，產出與專業級旅遊團隊同等級的精準行程。
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={onStart}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 transition"
          >
            登入
          </button>
          <a
            href="#why"
            className="rounded-xl border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 font-bold px-6 py-3 transition"
          >
            了解系統設計
          </a>
        </div>
      </section>

      {/* Why / Pain points */}
      <section id="why" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">為什麼要做這個系統？</h2>
          <p className="text-slate-500 text-center mb-10">
            我們的解法很簡單：先用程式抓真實的資料把關，再交給 AI 專心排程。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-red-50 p-4">
                  <div className="text-xs font-bold text-red-500 mb-1">傳統做法 😩</div>
                  <p className="text-sm text-slate-700">{p.bad}</p>
                </div>
                <div className="bg-emerald-50 p-4">
                  <div className="text-xs font-bold text-emerald-600 mb-1">智遊台灣 ✅</div>
                  <p className="text-sm text-slate-700">{p.good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core tech */}
      <section id="tech" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">核心技術</h2>
          <p className="text-slate-500 text-center mb-10">四項技術分工合作，確保系統又快又準。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_TECH.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                <div className="text-3xl mb-3">{t.icon}</div>
                <h3 className="font-bold text-slate-900">{t.title}</h3>
                <p className="text-xs font-semibold text-emerald-600 mb-2">{t.subtitle}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="flow" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">系統運作流程</h2>
          <p className="text-slate-500 text-center mb-10">從勾選需求到產出行程，五個步驟一次搞定。</p>
          <div className="space-y-4">
            {FLOW_STEPS.map((s) => (
              <div key={s.step} className="flex gap-4 items-start rounded-2xl border border-slate-200 p-5 bg-slate-50">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center">
                  {s.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{s.title}</h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">{s.tag}</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data source */}
      <section id="data" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">資料來源</h2>
          <p className="text-slate-500 text-center mb-10">所有景點資料均對接交通部觀光局 TDX 官方 API，確保真實可信。</p>
          <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">資料來源</div>
              <div className="font-bold text-slate-900">觀光局觀光景點資料</div>
            </div>
            <code className="text-sm font-mono bg-slate-100 rounded-lg px-3 py-1.5 text-emerald-700">
              /v2/Tourism/ScenicSpot/{'{City}'}
            </code>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600 py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">不用學提示詞，也能拿到專家級行程</h2>
          <p className="text-emerald-50 mb-6">動幾下手指，勾選需求，剩下的交給智遊台灣。</p>
          <button
            onClick={onStart}
            className="rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold px-6 py-3 transition"
          >
            登入
          </button>
        </div>
      </section>

      <footer className="py-6 text-center text-xs text-slate-400">
        智遊台灣 · 畢業專題作品
      </footer>
    </div>
  );
}

export default Landing;
