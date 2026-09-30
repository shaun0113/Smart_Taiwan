import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Compass,
  Database,
  HeartHandshake,
  MapPin,
  Menu,
  MousePointer2,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';

const features = [
  ['01', MousePointer2, '不用學 Prompt，也能問出好答案', '用簡單的選項帶你整理旅遊需求，把腦中的想法變成 AI 看得懂的完整條件。', 'mint'],
  ['02', ShieldCheck, '先驗證資料，再交給 AI', '串接官方觀光資料，先把不存在、過時或不符合條件的景點過濾掉。', 'sun'],
  ['03', HeartHandshake, '真正為旅伴量身安排', '把預算、交通、長輩體力、幼兒與寵物需求，轉成可執行的行程決策。', 'peach'],
];

const steps = [
  ['勾選需求', '告訴我們你想去哪裡、和誰一起去，以及旅程的偏好。', Search],
  ['資料過濾', '系統先用程式檢查官方資料，只留下符合條件的真實選項。', ShieldCheck],
  ['智慧排程', '依照移動距離、時間與旅伴狀態，整理出一份合理的旅遊路線。', Route],
];

export default function Home({ onStart }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function start() {
    setMenuOpen(false);
    onStart();
  }

  return (
    <div className="site-shell">
      <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <a className="brand" href="#top" aria-label="智遊台灣首頁"><span className="brand-mark"><Compass size={21} /></span><span><strong>智遊台灣</strong><small>SMART TRAVEL TAIWAN</small></span></a>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#why">為什麼需要</a><a href="#how">怎麼運作</a><a href="#features">核心功能</a>
          <button className="mobile-login" onClick={start}>登入</button>
        </nav>
        <button type="button" className="outline-button nav-login" onClick={start}><CircleUserRound size={17} />登入</button>
        <button className="icon-button mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="開啟選單">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-noise" />
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="kicker"><span className="kicker-dot" />畢業專題 · AI 旅遊規劃系統</div>
              <h1><span className="fixed-title-line">每一趟旅程，</span><br /><span className="fixed-title-line"><em>都值得</em>被好好安排。</span></h1>
              <p className="hero-lede">不用苦想怎麼問，也不用在錯誤資訊裡迷路。智遊台灣，把你的旅遊想法整理成一趟真正走得通的旅程。</p>
              <div className="hero-actions"><a className="primary-button" href="#how">看看它怎麼做到 <ArrowDownRight size={18} /></a><button className="ghost-button" onClick={start}>登入開始規劃 <ChevronRight size={17} /></button></div>
              <div className="hero-note"><Sparkles size={15} />讓旅遊新手，也能做出專業領隊等級的規劃</div>
            </div>
            <div className="hero-visual" aria-label="行程規劃預覽示意">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="map-doodle map-doodle-one"><span>台北</span></div><div className="map-doodle map-doodle-two"><span>宜蘭</span></div><div className="map-doodle map-doodle-three"><span>花蓮</span></div>
              <div className="route-line route-line-one" /><div className="route-line route-line-two" />
              <div className="trip-card"><div className="trip-card-top"><span>YOUR NEXT ESCAPE</span><MapPin size={16} /></div><div className="trip-title">宜蘭・慢旅 3 日</div><div className="trip-meta"><span><CalendarDays size={14} />05.18 — 05.20</span><span><TrainFront size={14} />大眾運輸</span></div><div className="trip-route"><div className="route-row"><span className="route-dot active" /><span>羅東林場</span><b>09:30</b></div><div className="route-connector" /><div className="route-row"><span className="route-dot" /><span>林場咖啡</span><b>12:10</b></div><div className="route-connector" /><div className="route-row"><span className="route-dot final" /><span>冬山河親水公園</span><b>15:00</b></div></div><div className="trip-footer"><span><Check size={14} />條件已驗證</span><span className="confidence"></span></div></div>
              <div className="floating-chip chip-ai"><Sparkles size={15} />AI 智慧排程</div><div className="floating-chip chip-data"><Database size={15} />官方資料</div><div className="stamp">TRAVEL<br /><strong>SMARTER</strong></div>
            </div>
          </div>
          <div className="hero-bottom container"><span className="scroll-hint"><span className="scroll-line" />向下探索</span><div className="hero-stats"><span><strong>01</strong>需求結構化</span><span><strong>02</strong>資料先驗證</span><span><strong>03</strong>行程智慧化</span></div></div>
        </section>

        <section id="why" className="manifesto-section section-pad"><div className="container manifesto-grid"><div className="section-label"><span>01</span><span className="label-rule" /><span>WHY SMART TRAVEL</span></div><div className="manifesto-copy"><p className="eyebrow">不是陪你聊天，是幫你做決策</p><h2><span className="fixed-title-line">把「不知道怎麼問」</span><br /><span className="fixed-title-line">變成「一勾就懂」。</span></h2></div><div className="manifesto-aside"><p>對旅遊新手來說，最困難的從來不是想去哪裡，而是要同時考慮交通、時間、預算與同行者的需求。</p><p>我們把旅遊專家的思考方式藏進系統裡，讓每個人都能從一個清楚的選擇開始。</p><a className="inline-link" href="#features">認識核心功能 <ArrowRight size={16} /></a></div></div></section>

        <section id="features" className="features-section section-pad"><div className="container"><div className="section-heading"><div><p className="eyebrow">DESIGNED FOR REAL TRIPS</p><h2>為了讓每個選擇，<br /><em>都更接近理想。</em></h2></div><p className="heading-side">從資料開始，而不是從猜測開始。<br />這是智遊台灣和一般聊天機器人的差別。</p></div><div className="feature-grid">{features.map(([number, Icon, title, text, tone]) => <article className={`feature-card ${tone}`} key={number}><div className="feature-top"><span className="feature-number">{number}</span><span className="feature-icon"><Icon size={21} /></span></div><h3>{title}</h3><p>{text}</p><span className="card-arrow"><ArrowRight size={17} /></span></article>)}</div></div></section>

        <section id="how" className="process-section section-pad"><div className="container process-grid"><div className="process-intro"><div className="section-label light"><span>02</span><span className="label-rule" /><span>HOW IT WORKS</span></div><p className="eyebrow light-text">三個步驟，少一點混亂</p><h2>從一個想法，<br /><em>走成一條路。</em></h2><p className="process-lede">系統不要求你成為 Prompt 專家，只需要你告訴我們：這次旅行，對你來說什麼最重要。</p><a className="light-link" href="#top">回到頁首 <ArrowRight size={16} /></a></div><div className="steps-list">{steps.map(([title, text, Icon], index) => <div className="step-item" key={title}><div className="step-index">0{index + 1}</div><div className="step-content"><h3>{title}</h3><p>{text}</p></div><div className="step-icon"><Icon size={19} /></div></div>)}</div></div></section>

        <section className="closing-section section-pad"><div className="container closing-wrap"><div className="closing-badge"><Compass size={18} />A BETTER WAY TO GO</div><h2>下一趟，<em>讓我們一起規劃。</em></h2><p>先登入保存你的旅遊偏好，從你真正想要的旅程開始。</p><button type="button" className="primary-button" onClick={start}>登入智遊台灣 <ArrowRight size={18} /></button><div className="closing-orbit" /></div></section>
      </main>
      <footer className="site-footer"><div className="container footer-inner"><div className="brand footer-brand"><span className="brand-mark"><Compass size={19} /></span><span><strong>智遊台灣</strong><small>SMART TRAVEL TAIWAN</small></span></div><p>畢業專題 · AI 旅遊規劃系統</p><span>© 2026</span></div></footer>
    </div>
  );
}