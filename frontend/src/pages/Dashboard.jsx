import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const TAIWAN_DISTRICTS = {
  "臺北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "汐止區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "淡水區", "萬里區", "金山區", "瑞芳區", "雙溪區", "貢寮區", "平溪區", "烏來區"],
  "桃園市": ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龍潭區", "大園區", "龜山區", "觀音區", "新屋區", "復興區"],
  "臺中市": ["中區", "東區", "南區", "西區", "北區", "北屯區", "西屯區", "南屯區", "太平區", "大里區", "霧峰區", "烏日區", "豐原區", "后里區", "石岡區", "東勢區", "和平區", "新社區", "潭子區", "大雅區", "神岡區", "大肚區", "沙鹿區", "龍井區", "梧棲區", "清水區", "大甲區", "外埔區", "大安區"],
  "臺南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區", "茄萣區"],
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "新竹市": ["東區", "北區", "香山區"],
  "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "橫山鄉", "北埔鄉", "寶山鄉", "峨眉鄉", "尖石鄉", "五峰鄉"],
  "苗栗縣": ["苗栗市", "頭份市", "竹南鎮", "後龍鎮", "通霄鎮", "苑裡鎮", "頭屋鄉", "公館鄉", "銅鑼鄉", "三義鄉", "西湖鄉", "造橋鄉", "三灣鄉", "南庄鄉", "大湖鄉", "獅潭鄉", "卓蘭鎮", "泰安鄉"],
  "彰化縣": ["彰化市", "員林市", "鹿港鎮", "和美鎮", "北斗鎮", "溪湖鎮", "田中鎮", "二林鎮", "線西鄉", "伸港鄉", "福興鄉", "秀水鄉", "花壇鄉", "芬園鄉", "大村鄉", "埔鹽鄉", "埔心鄉", "永靖鄉", "社頭鄉", "二水鄉", "田尾鄉", "埤頭鄉", "芳苑鄉", "大城鄉", "竹塘鄉", "溪州鄉"],
  "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"],
  "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "台西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"],
  "嘉義市": ["東區", "西區"],
  "嘉義縣": ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"],
  "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉", "雙流鄉"],
  "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
  "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "富里鄉", "秀林鄉", "萬榮鄉", "卓溪鄉"],
  "臺東縣": ["臺東市", "成功鎮", "關山鎮", "卑南鄉", "大武鄉", "太麻里鄉", "東河鄉", "長濱鄉", "鹿野鄉", "池上鄉", "綠島鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉", "蘭嶼鄉"]
};

export const Dashboard = () => {
  const [formData, setFormData] = useState({
    start_location: '臺北市',
    cities: ['臺北市'],
    days: 3,
    group_size: '2人',
    tags: [],
    transport: '自駕',
    start_time: '08:00'
  });

  const [selectedCity, setSelectedCity] = useState("臺北市"); 
  const [selectedDistrict, setSelectedDistrict] = useState(""); 
  const [detailRoad, setDetailRoad] = useState(""); 

  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [userNeed, setUserNeed] = useState('');
  const [spotsRecommendation, setSpotsRecommendation] = useState('');
  const [accumulatedSpots, setAccumulatedSpots] = useState('');
  const [apiMsg, setApiMsg] = useState(''); 
  const [userChoice, setUserChoice] = useState('');
  const [finalItinerary, setFinalItinerary] = useState('');
  
  const [copySuccess, setCopySuccess] = useState(false);

  // 地圖即時定位
  const [mapQuery, setMapQuery] = useState('臺北市');

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSpots, setSelectedSpots] = useState([]); 
  const spotsPerPage = 10;

  const resultEndRef = useRef(null);
  const itineraryRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (!loading && step === 5) { 
      const currentSpots = getPagedSpots();
      if (currentSpots.length > 0 && currentSpots[0].title) {
        setMapQuery(currentSpots[0].title);
      }
    }
  }, [currentPage, spotsRecommendation]);

  // 組合起點地址並即時更新地圖
  useEffect(() => {
    const combinedAddress = `${selectedCity}${selectedDistrict}${detailRoad}`.trim();
    setFormData(prev => ({ ...prev, start_location: combinedAddress || selectedCity }));
    setMapQuery(combinedAddress || selectedCity);
  }, [selectedCity, selectedDistrict, detailRoad]);

  // 解析器
  const parseSpotsToArray = () => {
    if (!spotsRecommendation) return [];
    
    const normalizedText = spotsRecommendation.replace(/\r\n/g, '\n');
    const lines = normalizedText.split('\n');
    let parsedSpots = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split('|');
      if (parts[0] === '1' && parts.length >= 3) {
        const title = parts[1].trim().replace(/[\*#_`📍🐾]/g, '');
        const location = parts.length >= 4 ? parts[2].trim() : title;
        const desc = parts.length >= 4 ? parts[3].trim() : parts[2].trim();
        
        if (title && title.length >= 2 && title.length < 30) {
          parsedSpots.push({
            title: title,
            rawMarkdown: `📍 **地點**：${location}\n\n💡 ${desc}`
          });
        }
      }
    });

    if (parsedSpots.length >= 3) return parsedSpots.slice(0, 100);

    let tempTitle = "";
    let tempDesc = "";

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(\d+[\.、\s]|📍|🔸|-|\*)\s*(.+)/) || trimmed.match(/【([^】]+)】/);
      const isNoise = ["推薦理由", "景點", "清單", "規劃師", "指南", "小叮嚀", "注意事項", "Day", "區域"].some(w => trimmed.includes(w) && trimmed.length > 20);

      if (match && !isNoise) {
        if (tempTitle) {
          parsedSpots.push({ title: tempTitle, rawMarkdown: tempDesc || tempTitle });
        }
        tempTitle = (match[2] || match[1]).replace(/[\*#_`\[\]\(\)【】\s📍🐾：:]/g, '').trim();
        tempDesc = "";
      } else if (tempTitle) {
        tempDesc += trimmed + "\n";
      }
    });

    if (tempTitle) {
      parsedSpots.push({ title: tempTitle, rawMarkdown: tempDesc || tempTitle });
    }

    return parsedSpots.filter(s => s.title && s.title.length >= 2 && s.title.length < 30).slice(0, 100);
  };

  const getPagedSpots = () => {
    const allSpots = parseSpotsToArray();
    const indexOfLastSpot = currentPage * spotsPerPage;
    const indexOfFirstSpot = indexOfLastSpot - spotsPerPage;
    return allSpots.slice(indexOfFirstSpot, indexOfLastSpot);
  };

  const handleToggleSpotCheckbox = (spotTitle) => {
    if (selectedSpots.includes(spotTitle)) {
      setSelectedSpots(selectedSpots.filter(t => t !== spotTitle));
    } else {
      setSelectedSpots([...selectedSpots, spotTitle]);
    }
  };

  // 🚀 地圖來源邏輯修正：非 Step 6 時只顯示地點位置搜尋，不出現導航路線
  const getMapSrc = () => {
    const travelMode = formData.transport === '自駕' ? 'd' : 'r';
    const targetCity = formData.cities[0] || '臺北市';

    // 只有在產出最終行程（Step 6）時才啟動起點到第一站的導航路線
    if (step === 6 && finalItinerary) { 
      const lines = finalItinerary.split('\n');
      let firstSpot = null;
      let inDetailSection = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Day 1') || line.includes('DAY 1') || line.includes('第一天')) {
          inDetailSection = true;
        }

        if (inDetailSection) {
          if (line.match(/\d{2}:\d{2}/)) {
            let potentialName = line.replace(/^\d{2}:\d{2}\s*[-─～]\s*\d{2}:\d{2}/, '').trim();
            potentialName = potentialName.replace(/[\*#_`\d\.\、\-\[\]\(\)【】\s📍🐾：:]/g, '').trim();

            if (!potentialName || potentialName.length <= 1) {
              if (i + 1 < lines.length) {
                potentialName = lines[i + 1].replace(/[\*#_`\d\.\、\-\[\]\(\)【】\s📍🐾：:]/g, '').trim();
              }
            }

            const noiseWords = ['出發', '前往', '車程', '交通', '飯店', '民宿', '抵達', '台北', '臺北', '出發地', '集合'];
            const isNoise = noiseWords.some(w => potentialName.includes(w));

            if (potentialName && potentialName.length >= 2 && potentialName.length < 25 && !isNoise) {
              firstSpot = potentialName;
              break; 
            }
          }
        }
      }

      if (!firstSpot && selectedSpots.length > 0) {
        firstSpot = selectedSpots[0];
      }

      if (firstSpot) {
        const origin = formData.start_location;
        const secureDestination = firstSpot.includes(targetCity.substring(0, 2)) ? firstSpot : `${targetCity}${firstSpot}`;
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(secureDestination)}&dirflg=${travelMode}&output=embed`;
      }
    }

    // Step 0 ~ Step 5：只顯示使用者當前輸入的完整地址/地點（純定位，無導航藍線）
    const locationToDisplay = mapQuery || formData.start_location || targetCity;
    const cleanQuery = locationToDisplay.replace(/(想去|我想去|加入|不要去|改去|、|,|，)/g, ' ').trim().split(/\s+/)[0];
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery || locationToDisplay)}&z=15&output=embed`;
  };

  // 全域 Enter 鍵按步切換
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (step === 5 || step === 6) return;

        if (step !== 4 && document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') {
          return;
        }
        if (step === 0) { 
          e.preventDefault(); 
          if (selectedCity) setStep(1); 
        } 
        else if (step === 1) { 
          e.preventDefault(); 
          setStep(2); 
        } 
        else if (step === 2) { e.preventDefault(); setStep(3); } 
        else if (step === 3) { e.preventDefault(); setStep(4); }
        else if (step === 4) { 
          e.preventDefault(); 
          if (formData.group_size && formData.group_size.trim() !== '') {
            handleRecommendSpots(); 
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [step, formData, selectedCity]);

  const handleCheckboxChange = (field, value) => {
    const currentList = [...formData[field]];
    if (currentList.includes(value)) {
      if (field === 'cities' && currentList.length === 1) return; 
      const remaining = currentList.filter(item => item !== value);
      setFormData({ ...formData, [field]: remaining });
      setMapQuery(remaining[0] || formData.start_location);
    } else {
      const newList = [...currentList, value];
      setFormData({ ...formData, [field]: newList });
      setMapQuery(value);
    }
  };

  const handleRecommendSpots = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setStep(5); 
      setCurrentPage(1);
      setSelectedSpots([]); 

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
        setApiMsg("請在左側名單中勾選您本次旅行「必定要去」的景點。勾選完畢後，點選下方按鈕，AI 將自動進行最合理的拓撲排程與順路景點優化穿插！");
        setMapQuery(formData.cities[0]);
      } else {
        setErrorMsg(`海選景點失敗：${data.detail || JSON.stringify(data)}`);
        setStep(4);
      }
    } catch (error) {
      setErrorMsg("景點海選連線失敗，請確認 Render 後端雲端服務是否正常啟動。");
      setStep(4);
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
      setErrorMsg("微調意見發送失敗，請檢查雲端後端連線。");
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
    window.print();
  };

  const handleConfirmAndGenerateFinal = async () => {
    let finalSpotsPayload = accumulatedSpots;
    if (selectedSpots.length > 0) {
      const selectedString = selectedSpots.join('+');
      finalSpotsPayload = finalSpotsPayload ? `${finalSpotsPayload}+${selectedString}` : selectedString;
    }

    const topologyConstraintPrompt = `${userNeed || ''} 
    【資管專題動態排程約束律】：
    1. 使用者標記必定要去且已選進清單的景點為：[ ${selectedSpots.join(', ')} ]。在規劃各天行程表時，這些勾選景點「必須 100% 被完整排入」，絕對不准漏掉。
    2. 行程路線規劃必須符合地理鄰近性邏輯。嚴禁出現硬接、跨區大幅度來回折返、或前一站跟下一站相隔極遠的極端動線。排程以「同區域、距離近優先」為首要導向。
    3. 如果使用者勾選的景點數量太少，無法排滿總計 ${formData.days} 天的行程空檔，AI 必須根據當前路線軌跡，在相隔較遠的 A 點與 B 點中間，主動「穿插推薦 1~2 個完全順路、鄰近的免費熱門小景點或美食」，讓時間動線流暢飽滿且完全順路。`;

    await handleGenerateFinal(finalSpotsPayload, topologyConstraintPrompt);
  };

  const handleGenerateFinal = async (targetSpots = null, OverrideUserNeed = null) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch('https://smart-taiwan.onrender.com/api/v1/generate-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accumulated_spots: targetSpots || accumulatedSpots, 
          user_need: OverrideUserNeed || userNeed || `出發地：${formData.start_location}，預計行程天數：${formData.days}天`, 
          city: formData.cities.join(','),       
          transport: formData.transport || '自駕',
          start_location: formData.start_location, 
          start_time: formData.start_time || '08:00'
        })
      });

      const data = await res.json();

      if (res.ok && data && data.result) {
        setFinalItinerary(data.result);
        setStep(6); 
      } else {
        setErrorMsg(`最終行程生成失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (err) {
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
      setErrorMsg("行程表微調請求失敗，請確認 Render 後端雲端服務是否正常。");
    } finally {
      setLoading(false);
    }
  };

  const allParsedSpots = parseSpotsToArray();
  const totalPages = Math.ceil(allParsedSpots.length / spotsPerPage);
  const currentPagedSpots = getPagedSpots();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <style>{`
        @media print {
          body, html { background-color: #ffffff !important; color: #000000 !important; }
          header, .mb-6, iframe, h2, .no-print, form, h3, .mt-6 { display: none !important; }
          main { max-width: 100% !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-area { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .bg-slate-50\\/70 { background: transparent !important; border: none !important; padding: 0 !important; }
        }
      `}</style>

      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800" onClick={() => setStep(0)} style={{ cursor: 'pointer' }}>
            智遊台灣 Smart Tour
          </h1>
          <span className="text-xs text-slate-500 font-medium">資管系畢業專題 – 國內智慧旅遊決策</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-600 tracking-wider">SYSTEM PROGRESS</span>
            <span className="text-xs font-semibold text-slate-400">目前步驟：{step + 1} / 7</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${(step + 1) * 14.28}%` }}></div>
          </div>
        </div>

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-semibold text-sm mb-6 shadow-sm">{errorMsg}</div>}

        {step === 6 ? (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h2 className="text-base font-bold text-slate-900 mb-2"> 智慧啟程導航（出發地 ➔ 目的地首站）</h2>
              <div className="h-96 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen title="Map Navigation"></iframe>
              </div>
            </div>

            <div ref={itineraryRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col print-area">
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
                    <p className="text-xs font-semibold text-emerald-600 mt-5 tracking-wide">正在排程動線中，請稍候...</p>
                  </div>
                ) : (
                  <div className="prose prose-emerald prose-sm max-w-none text-left leading-relaxed space-y-3 
                    prose-headings:text-emerald-800 prose-headings:font-black prose-headings:tracking-wide
                    prose-h1:text-2xl prose-h1:border-b prose-h1:pb-2 prose-h1:mt-6 prose-h1:mb-4
                    prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-lg prose-h3:font-black prose-h3:text-emerald-700 prose-h3:mt-5 prose-h3:mb-2 prose-h3:bg-emerald-50/80 prose-h3:p-2.5 prose-h3:rounded-lg prose-h3:border-l-4 prose-h3:border-emerald-600
                    prose-p:mb-2 prose-p:leading-relaxed prose-p:text-slate-700 prose-strong:font-bold prose-strong:text-slate-900
                    prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1 prose-li:my-0.5">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {step === 5 ? (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[620px] lg:col-span-1 animate-fadeIn">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"> 景點推薦名單</h2>
                    {selectedSpots.length > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-bold">
                        已勾選必去 {selectedSpots.length} 個景點
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 tracking-wide">
                    {loading ? (
                      <div className="h-full flex flex-col items-center justify-center py-12">
                        <div className="flex items-center space-x-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></div></div>
                        <p className="text-xs font-semibold text-emerald-600 mt-4">正在調度數據...</p>
                      </div>
                    ) : currentPagedSpots.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs italic">
                        未偵測到景點...
                        <div className="text-left mt-4 not-italic text-slate-700 whitespace-pre-line">
                          {spotsRecommendation}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentPagedSpots.map((spot, idx) => {
                          const isChecked = selectedSpots.includes(spot.title);
                          return (
                            <div 
                              key={idx} 
                              className={`p-3.5 rounded-xl transition-all shadow-none flex flex-col gap-2 ${
                                isChecked 
                                  ? 'bg-emerald-50 border border-emerald-50' 
                                  : 'bg-slate-100/70 border border-slate-100 hover:bg-slate-200/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => handleToggleSpotCheckbox(spot.title)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                  />
                                  <h3 className="text-sm font-extrabold text-slate-900 m-0 flex items-center gap-1.5 cursor-pointer select-none" onClick={() => handleToggleSpotCheckbox(spot.title)}>
                                    <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">#{((currentPage - 1) * spotsPerPage) + idx + 1}</span> {spot.title}
                                  </h3>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setMapQuery(spot.title)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  定位
                                </button>
                              </div>
                              <div className="text-xs text-slate-600 leading-snug space-y-0.5 prose prose-sm max-w-none prose-p:my-0.5 prose-p:leading-snug prose-strong:text-slate-800 pl-6">
                                <ReactMarkdown>{spot.rawMarkdown}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100 no-print">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        上一頁
                      </button>
                      <span className="text-xs font-bold text-slate-500 px-2">
                        頁次 {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        下一頁
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-4 mt-4">
                  <button onClick={() => setStep(4)} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">重新規劃</button>
                  <button onClick={handleConfirmAndGenerateFinal} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">確定選好了！排定最優路線</button>
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6 flex flex-col justify-between min-h-[460px]">
                {/* 第一步：僅選擇出發縣市 */}
                {step === 0 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-base font-bold text-slate-900 mb-1">第一步：你的出發地在哪裡？</h2>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">選擇出發縣市</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[320px] pr-1">
                          {Object.keys(TAIWAN_DISTRICTS).map(city => {
                            const isSelected = selectedCity === city;
                            return (
                              <div 
                                key={city} 
                                onClick={() => { 
                                  setSelectedCity(city); 
                                  setSelectedDistrict(""); 
                                }} 
                                className={`py-2.5 text-center rounded-lg cursor-pointer text-xs font-semibold border transition-all select-none ${isSelected ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                              >
                                {city}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={() => setStep(1)} 
                        disabled={!selectedCity}
                        className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        下一步
                      </button>
                    </div>
                  </div>
                )}

                {/* 第二步：選擇行政區與詳細路段 */}
                {step === 1 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-base font-bold text-slate-900 mb-1">第二步：選擇詳細出發位置</h2>
                      
                      {/* 選擇行政區 */}
                      {selectedCity && TAIWAN_DISTRICTS[selectedCity] && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">選擇行政區（{selectedCity}）</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[180px] pr-1">
                            {TAIWAN_DISTRICTS[selectedCity].map(dist => {
                              const isSelected = selectedDistrict === dist;
                              return (
                                <div 
                                  key={dist} 
                                  onClick={() => setSelectedDistrict(dist)} 
                                  className={`py-2 text-center rounded-lg cursor-pointer text-xs font-medium border transition-all select-none ${isSelected ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                >
                                  {dist}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 輸入詳細道路/地標（選填） */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">輸入詳細道路/地標（選填）</label>
                        <input 
                          type="text"
                          value={detailRoad}
                          onChange={(e) => setDetailRoad(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setStep(2);
                            }
                          }}
                          placeholder="例如：台北車站、大坪林、二十張路105巷9號..."
                          className="w-full text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-3 py-2.5 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner font-semibold"
                        />
                      </div>

                      <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                        <span className="text-[11px] text-slate-400 block font-semibold">即時預估出發地：</span>
                        <span className="text-xs font-extrabold text-emerald-700">
                          {selectedCity}{selectedDistrict}{detailRoad || "(未輸入詳細路段)"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <button onClick={() => setStep(0)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button>
                    </div>
                  </div>
                )}

                {/* 第三步：選擇目的地 */}
                {step === 2 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第三步：你想去哪些目的地玩？（可複選）</h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2 overflow-y-auto max-h-[320px] pr-1">
                        {["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "臺東縣", "澎湖縣", "金門縣", "連江縣"].map(city => {
                          const isSelected = formData.cities.includes(city);
                          return (
                            <div key={city} onClick={() => handleCheckboxChange('cities', city)} className={`py-2.5 text-center rounded-lg cursor-pointer text-xs font-semibold border transition-all select-none ${isSelected ? 'bg-emerald-600 text-white border-emerald-700 shadow-md font-bold' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>{city}</div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <button onClick={() => setStep(1)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button>
                    </div>
                  </div>
                )}

                {/* 第四步：天數與偏好設定 */}
                {step === 3 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第四步：天數與偏好設定</h2>
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
                          <p className="text-[10px] text-slate-400 mt-1"> 輸入你想去的目的後按 Enter 鍵即可成功加入標籤清單。</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.tags && formData.tags.filter(t => !['情侶約會', '遊樂園', '親子同遊', '網美打卡', '美食吃貨', '大自然放鬆'].includes(t)).map(customTag => (
                              <span key={customTag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1 rounded-md border border-slate-200">{customTag}<button type="button" className="font-bold text-slate-400 hover:text-slate-600" onClick={() => { let newTags = formData.tags ? [...formData.tags] : []; newTags = newTags.filter(t => t !== customTag); setFormData({ ...formData, tags: newTags }); }}>×</button></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6">
                      <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(4)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">下一步</button>
                    </div>
                  </div>
                )}

                {/* 第五步：成員設定 */}
                {step === 4 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第五步：成員設定</h2>
                      <p className="text-xs text-slate-500 mb-4">請輸入本次旅遊的人數或成員結構（例如：3人、獨旅、5人公司出遊）</p>
                      <div className="mt-2"><input type="text" placeholder="例如：2-4人、獨旅、家族旅遊10人..." value={formData.group_size || ''} onChange={(e) => setFormData({ ...formData, group_size: e.target.value })} className="w-full text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" autoFocus /></div>
                    </div>
                    <div className="flex justify-between mt-6"><button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button><button onClick={handleRecommendSpots} disabled={!formData.group_size || formData.group_size.trim() === ''} className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-colors ${(!formData.group_size || formData.group_size.trim() === '') ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>開始海選景點！</button></div>
                  </div>
                )}
              </section>
            )}

            {step === 5 ? (
              <section className="flex flex-col gap-6 lg:col-span-1 animate-fadeIn lg:sticky lg:top-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">區域地圖智慧導航</h2>
                  <div className="h-[240px] rounded-xl overflow-hidden border border-slate-100">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen title="Live Map Preview"></iframe>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-1">偏好意見調整</h2>
                    <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/70">{apiMsg || "請檢閱左側 AI 智慧決策建議名單。"}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <form onSubmit={handleAnalyzeSelection} className="flex gap-2">
                      <input type="text" value={userChoice} onChange={(e) => setUserChoice(e.target.value)} disabled={loading} placeholder="例如：某些景點不要去、加入特定新景點..." className="flex-1 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" />
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5 flex-1 flex flex-col">
                  <h2 className="text-base font-bold text-slate-900 mb-1">區域地圖智慧導航（動態路線預覽）</h2>
                  <div className="mt-2 h-[460px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen title="Initial Map Preview"></iframe>
                  </div>
                </div>

                {step > 1 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-5 flex-1 flex flex-col animate-fadeIn">
                    <h2 className="text-base font-bold text-slate-900 mb-2">智慧旅遊決策建議</h2>
                    <div className="flex-1 bg-slate-50/70 rounded-xl p-4 border border-slate-100 min-h-[260px] max-h-[360px] overflow-y-auto text-sm text-slate-700 flex items-center justify-center">
                      <p className="text-slate-400 text-xs text-center italic">尚未產生建議，請先在左側面板完成偏好設定。</p>
                    </div>
                  </div>
                )}
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