import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://smart-taiwan.onrender.com';

const THEMES = {
  emerald: {
    name: '森林',
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 500: '#10b981', 600: '#059669', 700: '#047857',
    bgDay: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(2, 44, 34, 0.95)), url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop')"
  },
  blue: {
    name: '大海',
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    bgDay: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(23, 37, 84, 0.95)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2560&auto=format&fit=crop')"
  },
  rose: {
    name: '櫻花',
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    bgDay: "url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(76, 5, 25, 0.95)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2560&auto=format&fit=crop')"
  },
  violet: {
    name: '暗夜',
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    bgDay: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(46, 16, 101, 0.95)), url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560&auto=format&fit=crop')"
  },
  amber: {
    name: '咖啡',
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    bgDay: "url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(69, 26, 3, 0.95)), url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2560&auto=format&fit=crop')"
  },
  slate: {
    name: '城市',
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 500: '#64748b', 600: '#475569', 700: '#334155',
    bgDay: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2560&auto=format&fit=crop')",
    bgNight: "linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2560&auto=format&fit=crop')"
  },
  custom: {
    name: '自訂 (上傳圖片)',
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 500: '#64748b', 600: '#475569', 700: '#334155',
    bgDay: "none", 
    bgNight: "none"
  }
};

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

const OFFSHORE_ISLANDS = ["澎湖縣", "金門縣", "連江縣", "澎湖", "金門", "馬祖", "綠島", "蘭嶼", "琉球鄉"];

const sanitizeItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) return [];
  itinerary.forEach(day => {
    if (Array.isArray(day.spots)) {
      day.spots.forEach(spot => {
        const timeMatch = spot.time ? String(spot.time).match(/\d{2}:\d{2}/) : null;
        spot.time = timeMatch ? timeMatch[0] : "09:00"; 
      });
    }
  });
  return itinerary;
};

export const Dashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    start_location: '臺北市',
    cities: ['臺北市'],
    days: 3,
    group_size: '2人',
    tags: [],
    transport: '自駕',
    offshore_transit: '飛機',
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
  
  const [itineraryBlocks, setItineraryBlocks] = useState([]);
  const [isRouteModified, setIsRouteModified] = useState(false);
  
  const [dragItem, setDragItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [mapQuery, setMapQuery] = useState('臺北市');

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSpots, setSelectedSpots] = useState([]); 
  const spotsPerPage = 10;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('emerald');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState(''); 

  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const resultEndRef = useRef(null);
  const itineraryRef = useRef(null);

  const isOffshoreSelected = formData.cities.some(c => OFFSHORE_ISLANDS.some(island => c.includes(island)));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCustomBgUrl(imageUrl);
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('access_token');
          if (!token) return;

          const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setHistoryList(data);
          }
        } catch (e) {
          console.error("讀取雲端歷史紀錄失敗", e);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

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

  useEffect(() => {
    const combinedAddress = `${selectedCity}${selectedDistrict}${detailRoad}`.trim();
    setFormData(prev => ({ ...prev, start_location: combinedAddress || selectedCity }));
    setMapQuery(combinedAddress || selectedCity);
  }, [selectedCity, selectedDistrict, detailRoad]);

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
          parsedSpots.push({ title: title, rawMarkdown: `📍 **地點**：${location}\n\n💡 ${desc}` });
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
        if (tempTitle) parsedSpots.push({ title: tempTitle, rawMarkdown: tempDesc || tempTitle });
        tempTitle = (match[2] || match[1]).replace(/[\*#_`\[\]\(\)【】\s📍🐾：:]/g, '').trim();
        tempDesc = "";
      } else if (tempTitle) {
        tempDesc += trimmed + "\n";
      }
    });
    if (tempTitle) parsedSpots.push({ title: tempTitle, rawMarkdown: tempDesc || tempTitle });
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

  const getMapSrc = () => {
    const travelMode = formData.transport === '自駕' ? 'd' : 'r';
    const targetCity = formData.cities[0] || '臺北市';

    if (step === 6 && itineraryBlocks.length > 0) { 
      const origin = formData.start_location;

      if (isOffshoreSelected) {
        let transitDestination = "";
        if (formData.offshore_transit === '飛機') {
          transitDestination = origin.includes('高雄') || origin.includes('屏東') ? '高雄小港國際機場' : '臺北松山機場';
        } else {
          if (targetCity.includes('連江') || targetCity.includes('馬祖')) transitDestination = '基隆港西岸旅客碼頭';
          else if (targetCity.includes('澎湖')) transitDestination = '嘉義布袋遊艇港';
          else if (targetCity.includes('琉球')) transitDestination = '屏東東港鹽埔漁港碼頭';
          else if (targetCity.includes('綠島') || targetCity.includes('蘭嶼')) transitDestination = '臺東富岡漁港';
          else transitDestination = '基隆港西岸旅客碼頭';
        }
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(transitDestination)}&dirflg=${travelMode}&output=embed`;
      }

      const day1Spots = itineraryBlocks[0]?.spots || [];
      const noiseWords = ['出發', '前往', '車程', '交通', '飯店', '民宿', '抵達', '台北', '臺北', '集合', '啟程', '跨縣市', '自駕', '機場', '碼頭', '登機', '車站', '高鐵', '台鐵', '火車'];
      
      const validSpots = day1Spots.filter(spot => {
        const isNoise = noiseWords.some(w => spot.name.includes(w));
        return spot.name && spot.name.length >= 2 && !isNoise;
      });

      if (validSpots.length > 0) {
        const waypoints = validSpots.map(spot => {
          return spot.name.includes(targetCity.substring(0, 2)) ? spot.name : `${targetCity}${spot.name}`;
        });
        const daddrStr = waypoints.map(wp => encodeURIComponent(wp)).join('+to:');
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${daddrStr}&dirflg=${travelMode}&output=embed`;
      }
    }

    const locationToDisplay = mapQuery || formData.start_location || targetCity;
    const cleanQuery = locationToDisplay.replace(/(想去|我想去|加入|不要去|改去|、|,|，)/g, ' ').trim().split(/\s+/)[0];
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery || locationToDisplay)}&z=15&output=embed`;
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (step === 5 || step === 6) return;
        e.preventDefault();
        if (step === 0) { if (selectedCity) setStep(1); } 
        else if (step === 1) { setStep(2); } 
        else if (step === 2) { setStep(isOffshoreSelected ? 2.5 : 3); }
        else if (step === 2.5) { setStep(3); }
        else if (step === 3) { setStep(4); }
        else if (step === 4) { 
          if (formData.group_size && formData.group_size.trim() !== '') handleRecommendSpots(); 
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [step, formData, selectedCity, isOffshoreSelected]);

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

      const res = await fetch(`${API_BASE_URL}/api/v1/recommend-spots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: formData.cities.join(','),
          days: formData.days,             
          group_size: formData.group_size,
          tags: isOffshoreSelected ? [...formData.tags, `外島交通:${formData.offshore_transit}`] : formData.tags,
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
      setErrorMsg("景點海選連線失敗，請確認後端服務是否正常運作。");
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

      const res = await fetch(`${API_BASE_URL}/api/v1/analyze-selection`, {
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
        if (data.status === "READY") await handleGenerateFinal(data.accumulated_spots);
      } else {
        setErrorMsg(`意見微調失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (error) {
      setErrorMsg("微調意見發送失敗，請檢查後端連線。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (itineraryBlocks.length === 0) return;
    const textFormat = itineraryBlocks.map(day => 
      `${day.day_title}\n` + day.spots.map(s => `${s.time} - ${s.name} (${s.desc})`).join('\n')
    ).join('\n\n');

    navigator.clipboard.writeText(textFormat).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); 
    });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const maxRecommendedSpots = formData.days * 4;
  const isOvercrowded = selectedSpots.length > maxRecommendedSpots;

  const handleConfirmAndGenerateFinal = () => {
    if (isOvercrowded) setShowWarningModal(true);
    else executeGenerateFinal();
  };

  const handleSaveItinerary = async () => {
    if (itineraryBlocks.length === 0) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) {
        setErrorMsg("請先登入才能儲存行程！");
        setIsSaving(false);
        return;
      }

      const locationName = formData.cities[0] ? formData.cities[0] : '台灣';
      
      const payload = {
        title: `${locationName}${formData.days}日遊`,
        itinerary_data: itineraryBlocks,
        form_data: formData
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        setErrorMsg(`儲存失敗: ${data.detail || '未知錯誤'}`);
      }
    } catch (e) {
      console.error("儲存失敗", e);
      setErrorMsg("連線失敗，請確認後端是否啟動");
    } finally {
      setIsSaving(false);
    }
  };

  const loadHistory = (item) => {
    setFormData(item.formData);
    setItineraryBlocks(item.blocks);
    setStep(6);
    setIsSidebarOpen(false); 
  };

  const handleClearHistory = async () => {
    if (!window.confirm("確定要刪除所有歷史紀錄嗎？這個動作無法復原喔！")) return;
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/itineraries`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setHistoryList([]); 
      } else {
        const data = await res.json();
        setErrorMsg(`刪除失敗: ${data.detail || '未知錯誤'}`);
      }
    } catch (e) {
      console.error("刪除歷史紀錄失敗", e);
      setErrorMsg("連線失敗，請確認後端是否啟動");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const executeGenerateFinal = async () => {
    setShowWarningModal(false);
    let finalSpotsPayload = accumulatedSpots;
    if (selectedSpots.length > 0) {
      const selectedString = selectedSpots.join('+');
      finalSpotsPayload = finalSpotsPayload ? `${finalSpotsPayload}+${selectedString}` : selectedString;
    }

    const topologyConstraintPrompt = `${userNeed || ''} 
    【資管專題動態排程約束律】：
    1. 使用者標記必定要去且已選進清單的景點為：[ ${selectedSpots.join(', ')} ]。在規劃各天行程表時，這些勾選景點「必須 100% 被完整排入」，絕對不准漏掉。
    ${isOffshoreSelected ? `2. 【外島交通約束】：使用者選擇搭乘【${formData.offshore_transit}】前往 ${formData.cities.join(',')}。請在 Day 1 第一站前精準標註本島至外島的交通接駁（如機場報到/碼頭搭船）與預估航程時間。` : ''}
    3. 使用者勾選了 ${selectedSpots.length} 個景點，預計行程天數為 ${formData.days} 天。若勾選景點數量較多，請在【行程概要總覽】下方特別標註一行警示：「⚠️ 提醒：您選取的景點數量較多，部分景點停留時間將壓縮，請注意行程節奏。」
    4. 行程路線規劃必須符合地理鄰近性邏輯。嚴禁出現硬接、跨區大幅度來回折返、或前一站跟下一站相隔極遠的極端動線。排程以「同區域、距離近優先」為首要導向。
    5. 如果使用者勾選的景點數量太少，無法排滿總計 ${formData.days} 天的行程空檔，AI 必須根據當前路線軌跡，主動「穿插推薦 1~2 個完全順路、鄰近的免費熱門小景點或美食」。
    
    【⚠️ 系統輸出格式強制要求】：
    你必須「只」回傳一個合法的 JSON 格式字串，絕對不能包含任何其他說明文字或 Markdown 標記（如 \`\`\`json ）。
    請嚴格遵守以下 JSON 結構（注意："time" 欄位必須是嚴格的 24 小時制 "HH:MM" 格式，絕對不可包含時間範圍或中文）：
    {
      "itinerary": [
        {
          "day_title": "Day 1：標題",
          "spots": [
            { "id": "1", "time": "09:00", "name": "景點名稱", "desc": "簡短描述" }
          ]
        }
      ]
    }`;

    await handleGenerateFinal(finalSpotsPayload, topologyConstraintPrompt);
  };

  const handleGenerateFinal = async (targetSpots = null, OverrideUserNeed = null) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(`${API_BASE_URL}/api/v1/generate-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accumulated_spots: targetSpots || accumulatedSpots, 
          user_need: OverrideUserNeed || userNeed || `出發地：${formData.start_location}，預計行程天數：${formData.days}天`, 
          city: formData.cities.join(','),       
          transport: isOffshoreSelected ? `外島(${formData.offshore_transit})+當地${formData.transport}` : formData.transport,
          start_location: formData.start_location, 
          start_time: formData.start_time || '08:00'
        })
      });

      const data = await res.json();
      if (res.ok && data && data.result) {
        try {
          let cleanJson = data.result.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.error) throw new Error(parsed.error);
          
          const safeItinerary = sanitizeItinerary(parsed.itinerary);
          
          setItineraryBlocks(safeItinerary);
          setIsRouteModified(false);
          setStep(6); 
        } catch (e) {
          setErrorMsg(`JSON 解析失敗: ${e.message}。系統收到格式錯誤的資料，請再試一次。`);
        }
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

      const res = await fetch(`${API_BASE_URL}/api/v1/modify-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_itinerary: JSON.stringify({ itinerary: itineraryBlocks }),
          modification_demand: userChoice + "\n【請保持與原本相同的 JSON 結構回傳，不要包含 ```json 等 Markdown 標記，time 欄位僅限 HH:MM 格式】"
        })
      });

      const data = await res.json();
      if (res.ok && data && data.status === "success") {
        try {
          let cleanJson = data.result.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          
          const safeItinerary = sanitizeItinerary(parsed.itinerary);
          
          setItineraryBlocks(safeItinerary);
          setIsRouteModified(true);
          setUserChoice(""); 
        } catch (e) {
          setErrorMsg(`JSON 解析失敗: ${e.message}`);
        }
      } else {
        setErrorMsg(`微調行程失敗：${data.detail || JSON.stringify(data)}`);
      }
    } catch (error) {
      setErrorMsg("行程表微調請求失敗，請確認後端連線。");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, dayIndex, spotIndex) => {
    setDragItem({ dayIndex, spotIndex });
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => e.target.classList.add("opacity-50"), 0);
  };

  const handleDragEnter = (e, dayIndex, spotIndex) => {
    e.preventDefault();
    setDragOverItem({ dayIndex, spotIndex });
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("opacity-50");
    if (!dragItem || !dragOverItem) return;

    if (dragItem.dayIndex === dragOverItem.dayIndex && dragItem.spotIndex === dragOverItem.spotIndex) {
      setDragItem(null);
      setDragOverItem(null);
      return;
    }

    const newBlocks = [...itineraryBlocks];
    const sourceDay = newBlocks[dragItem.dayIndex];
    const targetDay = newBlocks[dragOverItem.dayIndex];

    const [movedSpot] = sourceDay.spots.splice(dragItem.spotIndex, 1);
    targetDay.spots.splice(dragOverItem.spotIndex, 0, movedSpot);

    setItineraryBlocks(newBlocks);
    setIsRouteModified(true); 
    setDragItem(null);
    setDragOverItem(null);
  };

  const handleDeleteSpot = (dayIndex, spotIndex) => {
    const newBlocks = [...itineraryBlocks];
    newBlocks[dayIndex].spots.splice(spotIndex, 1);
    setItineraryBlocks(newBlocks);
    setIsRouteModified(true);
  };

  const handleEditSpot = (dayIndex, spotIndex, field, value) => {
    const newBlocks = [...itineraryBlocks];
    newBlocks[dayIndex].spots[spotIndex][field] = value;
    setItineraryBlocks(newBlocks);
    setIsRouteModified(true);
  };

  const handleAddSpot = (dayIndex) => {
    const newBlocks = [...itineraryBlocks];
    newBlocks[dayIndex].spots.push({
      id: `new-${Date.now()}`,
      time: "12:00",
      name: "新景點",
      desc: "點擊修改描述"
    });
    setItineraryBlocks(newBlocks);
    setIsRouteModified(true);
  };

  const allParsedSpots = parseSpotsToArray();
  const totalPages = Math.ceil(allParsedSpots.length / spotsPerPage);
  const currentPagedSpots = getPagedSpots();

  const currentThemeData = THEMES[activeTheme];
  const displayBgDay = activeTheme === 'custom' && customBgUrl ? `url('${customBgUrl}')` : currentThemeData.bgDay;
  const displayBgNight = activeTheme === 'custom' && customBgUrl ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.95)), url('${customBgUrl}')` : currentThemeData.bgNight;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative">
      <style>{`
        :root {
          --theme-50: ${currentThemeData[50]};
          --theme-100: ${currentThemeData[100]};
          --theme-200: ${currentThemeData[200]};
          --theme-500: ${currentThemeData[500]};
          --theme-600: ${currentThemeData[600]};
          --theme-700: ${currentThemeData[700]};
          --theme-bg-day: ${displayBgDay};
          --theme-bg-night: ${displayBgNight};
        }

        html, body, #root, .min-h-screen {
          background-color: var(--theme-50) !important;
          background-image: var(--theme-bg-day) !important;
          background-attachment: fixed !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }

        html:not(.dark-mode) .bg-white {
          background-color: rgba(255, 255, 255, 0.94) !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .bg-emerald-50 { background-color: var(--theme-50) !important; }
        .bg-emerald-100 { background-color: var(--theme-100) !important; }
        .bg-emerald-500 { background-color: var(--theme-500) !important; }
        .bg-emerald-600 { background-color: var(--theme-600) !important; }
        .bg-emerald-700 { background-color: var(--theme-700) !important; }
        .hover\\:bg-emerald-100:hover { background-color: var(--theme-100) !important; }
        .hover\\:bg-emerald-700:hover { background-color: var(--theme-700) !important; }
        
        .text-emerald-600 { color: var(--theme-600) !important; }
        .text-emerald-700 { color: var(--theme-700) !important; }
        .hover\\:text-emerald-600:hover { color: var(--theme-600) !important; }
        .hover\\:text-emerald-700:hover { color: var(--theme-700) !important; }
        
        .border-emerald-100 { border-color: var(--theme-100) !important; }
        .border-emerald-200 { border-color: var(--theme-200) !important; }
        .border-emerald-500 { border-color: var(--theme-500) !important; }
        .border-emerald-600 { border-color: var(--theme-600) !important; }
        .border-emerald-700 { border-color: var(--theme-700) !important; }
        .hover\\:border-emerald-400:hover { border-color: var(--theme-500) !important; }
        .focus\\:border-emerald-500:focus { border-color: var(--theme-500) !important; }
        
        .accent-emerald-600 { accent-color: var(--theme-600) !important; }
        .focus\\:ring-emerald-500:focus { --tw-ring-color: var(--theme-500) !important; }

        html.dark-mode {
          --bg-main: #0f172a;     
          --bg-card: #1e293b;     
          --bg-hover: #334155;    
          --border-light: #1e293b;
          --border-main: #334155;
          --border-dark: #475569;
          --text-900: #f8fafc;    
          --text-800: #f1f5f9;
          --text-700: #e2e8f0;
          --text-600: #cbd5e1;
          --text-500: #94a3b8;
          --text-400: #64748b;
          
          --theme-50: color-mix(in srgb, var(--theme-500) 15%, var(--bg-main)) !important;
          --theme-100: color-mix(in srgb, var(--theme-500) 25%, var(--bg-main)) !important;
          --theme-200: color-mix(in srgb, var(--theme-500) 40%, var(--bg-main)) !important;
          --theme-700: color-mix(in srgb, var(--theme-500) 20%, #ffffff) !important; 
          
          color-scheme: dark; 
        }

        html.dark-mode, html.dark-mode body, html.dark-mode #root, html.dark-mode .min-h-screen {
          background-color: var(--bg-main) !important;
          background-image: var(--theme-bg-night) !important;
          color: var(--text-800) !important;
        }

        html.dark-mode .bg-white { 
          background-color: rgba(30, 41, 59, 0.88) !important; 
          backdrop-filter: blur(8px) !important;
        }
        html.dark-mode .bg-slate-50 { background-color: var(--bg-main) !important; }
        html.dark-mode .bg-slate-100 { background-color: var(--bg-hover) !important; }
        html.dark-mode .bg-slate-200 { background-color: var(--border-main) !important; }
        html.dark-mode .bg-slate-800 { background-color: var(--text-800) !important; color: var(--bg-main) !important; }
        html.dark-mode .bg-slate-900 { background-color: var(--text-900) !important; color: var(--bg-main) !important; }

        html.dark-mode .hover\\:bg-slate-50:hover { background-color: var(--bg-hover) !important; }
        html.dark-mode .hover\\:bg-slate-100:hover { background-color: var(--border-main) !important; }
        html.dark-mode .hover\\:bg-slate-200:hover { background-color: var(--border-dark) !important; }
        html.dark-mode .hover\\:bg-slate-900:hover { background-color: var(--text-900) !important; }

        html.dark-mode .border-slate-100 { border-color: var(--border-light) !important; }
        html.dark-mode .border-slate-200 { border-color: var(--border-main) !important; }
        html.dark-mode .border-slate-300 { border-color: var(--border-dark) !important; }
        html.dark-mode .border-slate-800 { border-color: var(--text-800) !important; }

        html.dark-mode .text-slate-900 { color: var(--text-900) !important; }
        html.dark-mode .text-slate-800 { color: var(--text-800) !important; }
        html.dark-mode .text-slate-700 { color: var(--text-700) !important; }
        html.dark-mode .text-slate-600 { color: var(--text-600) !important; }
        html.dark-mode .text-slate-500 { color: var(--text-500) !important; }
        html.dark-mode .text-slate-400 { color: var(--text-400) !important; }
        
        html.dark-mode .bg-slate-900\\/60 { background-color: rgba(15, 23, 42, 0.8) !important; }
        
        html.dark-mode .bg-amber-50 { background-color: rgba(69, 26, 3, 0.5) !important; border-color: rgba(120, 53, 15, 0.6) !important; color: #fde68a !important; }
        html.dark-mode .text-amber-600 { color: #fbbf24 !important; }
        html.dark-mode .text-amber-800 { color: #fef3c7 !important; }

        @media print {
          body, html { background-color: #ffffff !important; color: #000000 !important; }
          header, .mb-6, iframe, h2, .no-print, form, h3, .mt-6, .map-section { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
          main { max-width: 100% !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-area { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .bg-slate-50\\/70 { background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>

      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-extrabold text-slate-900 m-0">行程可能太緊湊！</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0 bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-xl">
              您規劃了 <span className="font-extrabold text-amber-900">{formData.days} 天</span> 的行程，但目前勾選了 <span className="font-extrabold text-amber-900">{selectedSpots.length} 個必去景點</span>（建議平均每天最多 3~4 個）。
              <br /><br />
              景點過多會導致<span className="font-bold text-slate-900">拉車時間大幅變長、景點停留時間受限</span>，影響旅遊品質。
            </p>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                 返回修改
              </button>
              <button 
                onClick={executeGenerateFinal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                 確定要去
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm no-print relative z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          
          <h1 className="text-2xl font-black cursor-pointer m-0 tracking-tight text-slate-800 dark:text-slate-100" onClick={() => setStep(0)}>
            智遊台灣 Smart Tour
          </h1>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{user?.username}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">{user?.email}</div>
            </div>
            
            <button 
              onClick={() => setIsThemeModalOpen(true)}
              className="text-xl hover:scale-110 hover:rotate-90 transition-all outline-none grayscale-[0.2]"
              title="外觀與主題設定"
            >
              ⚙️
            </button>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col gap-1.5 justify-center items-center h-10 w-10 outline-none"
              title="歷史對話"
            >
              <span className="block h-[2px] w-5 bg-slate-800 dark:bg-slate-200"></span>
              <span className="block h-[2px] w-5 bg-slate-800 dark:bg-slate-200"></span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="ml-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              登出
            </button>
          </div>

        </div>
      </header>

      {isThemeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-fadeIn no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-extrabold text-slate-900 m-0">⚙️ 外觀與主題設定</h3>
              <button onClick={() => setIsThemeModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold leading-none">&times;</button>
            </div>
            
            <div className="mb-2">
              <label className="block text-xs font-bold text-slate-500 mb-2"> 顯示模式</label>
              <div className="flex gap-2">
                <button onClick={() => setIsDarkMode(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${!isDarkMode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>☀️ 日間</button>
                <button onClick={() => setIsDarkMode(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${isDarkMode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>🌙 夜間</button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 my-1"></div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2"> 主色調</label>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTheme(key)}
                    className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${activeTheme === key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                  >
                    <span className={`font-bold text-sm ${activeTheme === key ? 'text-emerald-700' : 'text-slate-700'}`}>{theme.name}</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: theme[200] }}></div>
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: theme[500] }}></div>
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: theme[700] }}></div>
                    </div>
                  </button>
                ))}
              </div>
              
              {activeTheme === 'custom' && (
                 <div className="mt-3 p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center animate-fadeIn">
                    <input type="file" id="customBg" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <label htmlFor="customBg" className="cursor-pointer text-xs font-bold text-slate-600 hover:text-emerald-600 block w-full py-2">
                      {customBgUrl ? '✅ 已成功套用自訂背景，點擊重新上傳' : '📸 點擊選擇電腦/手機裡的圖片'}
                    </label>
                 </div>
              )}
            </div>

            <button onClick={() => setIsThemeModalOpen(false)} className="mt-2 w-full py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-colors shadow-md">確認套用</button>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-50 transition-opacity no-print ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <aside className={`absolute top-0 right-0 w-80 h-full bg-slate-50 dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col border-l border-slate-200 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800">
            <span className="font-extrabold text-slate-800 dark:text-slate-800 flex items-center gap-2">
              <span className="text-xl">歷史紀錄</span> 我的專屬行程簿
            </span>
            <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="text-center text-xs text-slate-400 mt-10">載入歷史紀錄中...</div>
            ) : historyList.length === 0 ? (
              <div className="text-center text-xs text-slate-400 mt-10">尚無儲存的行程紀錄。</div>
            ) : (
              historyList.map((item, i) => (
                <div key={item.id || i} onClick={() => loadHistory(item)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-500 truncate pr-2">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.created_at}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-bold rounded-lg transition-colors pointer-events-none">
                      載入行程
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {historyList.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <button 
                onClick={handleClearHistory}
                disabled={isLoadingHistory}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                 清除所有歷史紀錄
              </button>
            </div>
          )}
        </aside>
      </div>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-600 tracking-wider">SYSTEM PROGRESS</span>
            <span className="text-xs font-semibold text-slate-400">目前步驟：{Math.floor(step + 1)} / 7</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${(step + 1) * 14.28}%` }}></div>
          </div>
        </div>

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg font-semibold text-sm mb-6 shadow-sm no-print max-w-6xl mx-auto">{errorMsg}</div>}

        {step === 6 ? (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 map-section no-print">
              <h2 className="text-base font-bold text-slate-900 mb-2"> 智慧啟程導航（點擊更多選項可以看第一天所有行程導航圖）</h2>
              <div className="h-96 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen title="Map Navigation"></iframe>
              </div>
            </div>

            <div ref={itineraryRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col print-area">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">智遊台灣 專屬旅遊行程規劃表</h2>
                <div className="flex gap-2 items-center">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold border border-emerald-200">
                    出發地：{formData.start_location} | {formData.days} 天 {formData.group_size} ({isOffshoreSelected ? `外島:${formData.offshore_transit}` : formData.transport})
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

              <div className="bg-slate-50/70 rounded-xl p-8 border border-slate-100 min-h-[450px]">
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
                  <>
                    {isRouteModified && (
                      <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <span className="text-xl">⚠️</span>
                        系統提醒：預設行程為計算出的最佳路線。手動新增、刪除或拖曳方塊更改順序，可能導致動線折返或不順路。
                      </div>
                    )}

                    <div className="flex flex-col gap-6">
                      {itineraryBlocks.map((day, dayIndex) => (
                        <div key={dayIndex} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-black text-emerald-700">{day.day_title}</h3>
                            <button onClick={() => handleAddSpot(dayIndex)} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors no-print">+ 新增方塊</button>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            {day.spots.map((spot, spotIndex) => (
                              <div
                                key={spot.id || spotIndex}
                                draggable
                                onDragStart={(e) => handleDragStart(e, dayIndex, spotIndex)}
                                onDragEnter={(e) => handleDragEnter(e, dayIndex, spotIndex)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-xs flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md transition-all group"
                              >
                                <div className="text-slate-300 cursor-grab px-1 no-print">⣿</div>
                                
                                <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                                  <input 
                                    type="time"
                                    className="col-span-3 lg:col-span-2 text-sm font-bold text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors cursor-pointer"
                                    value={spot.time}
                                    onChange={(e) => handleEditSpot(dayIndex, spotIndex, 'time', e.target.value)}
                                  />
                                  <input 
                                    className="col-span-9 lg:col-span-4 text-sm font-extrabold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors"
                                    value={spot.name}
                                    onChange={(e) => handleEditSpot(dayIndex, spotIndex, 'name', e.target.value)}
                                  />
                                  <input 
                                    className="col-span-12 lg:col-span-6 text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none transition-colors"
                                    value={spot.desc}
                                    onChange={(e) => handleEditSpot(dayIndex, spotIndex, 'desc', e.target.value)}
                                  />
                                </div>

                                <button onClick={() => handleDeleteSpot(dayIndex, spotIndex)} className="text-slate-300 hover:text-red-500 font-bold px-2 transition-colors opacity-0 group-hover:opacity-100 no-print">✕</button>
                              </div>
                            ))}
                            {day.spots.length === 0 && (
                              <div 
                                className="p-5 border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-sm font-bold bg-slate-50"
                                onDragEnter={(e) => handleDragEnter(e, dayIndex, 0)}
                                onDragOver={(e) => e.preventDefault()}
                              >
                                拖曳方塊至此
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 no-print flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-bold text-slate-800 mb-2"> 對行程不滿意？你想修改哪裡：</h3>
                  <form onSubmit={handleModifyItinerary} className="flex gap-2">
                    <input type="text" value={userChoice} onChange={(e) => setUserChoice(e.target.value)} disabled={loading} placeholder={loading ? "正在重新規劃行程中..." : "例如: 第二天下午改去大稻埕、行程排鬆一點..."} className="flex-1 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" />
                    <button type="submit" disabled={loading || !userChoice.trim()} className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 shadow-md shadow-emerald-600/10 transition-all">{loading ? "修改中..." : "送出修改需求"}</button>
                  </form>
                </div>
                
                <button 
                  onClick={handleSaveItinerary} 
                  disabled={isSaving || saveSuccess}
                  className={`px-6 py-3 w-full md:w-auto rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    saveSuccess ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  {isSaving ? "儲存中..." : saveSuccess ? " 行程已儲存" : " 儲存行程至紀錄"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {step === 5 ? (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[730px] lg:col-span-5 animate-fadeIn">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"> 景點推薦名單</h2>
                    {selectedSpots.length > 0 && (
                      <span className={`text-xs border px-2 py-1 rounded-md font-bold ${
                        isOvercrowded 
                          ? 'bg-amber-50 text-amber-800 border-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        已勾選必去 {selectedSpots.length} 個景點
                      </span>
                    )}
                  </div>

                  {isOvercrowded && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold mb-3 flex items-start gap-2 shadow-sm animate-fadeIn">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <p className="font-extrabold text-amber-900 mb-0.5">景點數量偏多提示</p>
                        <p className="leading-relaxed">
                          預計旅遊天數為 <span className="font-black text-amber-950">{formData.days} 天</span>，已勾選 <span className="font-black text-amber-950">{selectedSpots.length} 個景點</span>。
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 tracking-wide max-h-[520px]">
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
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6 flex flex-col justify-between min-h-[730px] lg:col-span-5">
                {step === 0 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-base font-bold text-slate-900 mb-1">第一步：你的出發地在哪裡？</h2>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">選擇出發縣市</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[380px] pr-1">
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

                {step === 1 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-base font-bold text-slate-900 mb-1">第二步：選擇詳細出發位置</h2>
                      
                      {selectedCity && TAIWAN_DISTRICTS[selectedCity] && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">選擇行政區（{selectedCity}）</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto max-h-[220px] pr-1">
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

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">輸入詳細道路/地標（選填）</label>
                        <input 
                          type="text"
                          value={detailRoad}
                          onChange={(e) => setDetailRoad(e.target.value)}
                          placeholder="例如：台北車站、大坪林、二十張路..."
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

                {step === 2 && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">第三步：你想去哪些目的地玩？（可複選）</h2>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 my-2 overflow-y-auto max-h-[380px] pr-1">
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
                      <button 
                        onClick={() => setStep(isOffshoreSelected ? 2.5 : 3)} 
                        className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all"
                      >
                        下一步
                      </button>
                    </div>
                  </div>
                )}

                {step === 2.5 && (
                  <div className="flex-1 flex flex-col justify-between animate-fadeIn">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-1">選擇離島跨海交通方式</h2>
                      <p className="text-xs text-slate-500 mb-4">
                        偵測到您選擇了離島目的地（<span className="font-bold text-emerald-700">{formData.cities.filter(c => OFFSHORE_ISLANDS.some(i => c.includes(i))).join('、')}</span>），請選擇您預計採用的跨海交通方式：
                      </p>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div 
                          onClick={() => setFormData({ ...formData, offshore_transit: '飛機' })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                            formData.offshore_transit === '飛機'
                              ? 'border-emerald-500 bg-emerald-50/60 shadow-md'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                          }`}
                        >
                          <span className="text-4xl">✈️</span>
                          <span className="text-sm font-extrabold text-slate-800">搭乘飛機</span>
                          <span className="text-[11px] text-slate-500 text-center">快速省時，導航將自動引導至本島機場</span>
                        </div>

                        <div 
                          onClick={() => setFormData({ ...formData, offshore_transit: '輪船' })}
                          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                            formData.offshore_transit === '輪船'
                              ? 'border-emerald-500 bg-emerald-50/60 shadow-md'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                          }`}
                        >
                          <span className="text-4xl">🚢</span>
                          <span className="text-sm font-extrabold text-slate-800">搭乘輪船</span>
                          <span className="text-[11px] text-slate-500 text-center">悠閒渡輪，導航將自動引導至出海港口碼頭</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(3)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 transition-all">下一步</button>
                    </div>
                  </div>
                )}

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
                        <label className="block text-xs font-semibold text-slate-600 mb-2">當地交通工具</label>
                        <div className="flex gap-2">
                          {['自駕', '大眾運輸'].map(t => (
                            <button key={t} type="button" onClick={() => setFormData({ ...formData, transport: t })} className={`flex-1 py-2 text-center rounded-xl text-xs font-semibold border transition-all ${formData.transport === t ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">旅遊目的 / 偏好標籤</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {['情侶約會', '遊樂園', '親子同遊', '網美打卡', '大自然放鬆'].map(tag => {
                            const isSelected = formData.tags && formData.tags.includes(tag);
                            return (
                              <button key={tag} type="button" onClick={() => { let newTags = formData.tags ? [...formData.tags] : []; if (isSelected) { newTags = newTags.filter(t => t !== tag); } else { newTags.push(tag); } setFormData({ ...formData, tags: newTags }); }} className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{tag}</button>
                            );
                          })}
                        </div>
                        <div className="mt-2">
                          <input type="text" placeholder="請輸入其他旅遊目的，輸入完按 Enter 新增標籤" className="w-full text-xs rounded-xl border border-slate-300 bg-white text-slate-800 px-4 py-3 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors shadow-inner" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim() !== '') { e.preventDefault(); e.stopPropagation(); const newTag = e.target.value.trim(); let currentTags = formData.tags ? [...formData.tags] : []; if (!currentTags.includes(newTag)) { currentTags.push(newTag); } setFormData({ ...formData, tags: currentTags }); e.target.value = ''; } }} />
                          <p className="text-[10px] text-slate-400 mt-1"> 輸入你想去的目的後按 Enter 鍵即可成功加入標籤清單。</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {formData.tags && formData.tags.filter(t => !['情侶約會', '遊樂園', '親子同遊', '網美打卡', '大自然放鬆'].includes(t)).map(customTag => (
                              <span key={customTag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1 rounded-md border border-slate-200">{customTag}<button type="button" className="font-bold text-slate-400 hover:text-slate-600" onClick={() => { let newTags = formData.tags ? [...formData.tags] : []; newTags = newTags.filter(t => t !== customTag); setFormData({ ...formData, tags: newTags }); }}>×</button></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-6">
                      <button onClick={() => setStep(isOffshoreSelected ? 2.5 : 2)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-500">上一步</button>
                      <button onClick={() => setStep(4)} className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700">下一步</button>
                    </div>
                  </div>
                )}

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

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hidden lg:flex flex-col h-[730px] lg:col-span-7 sticky top-6">
              <h2 className="text-base font-bold text-slate-900 mb-2"> 地點即時預覽</h2>
              <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={getMapSrc()} allowFullScreen title="Map Preview"></iframe>
              </div>
            </section>

          </div>
        )}
      </main>
      <div ref={resultEndRef} />
    </div>
  );
};

export default Dashboard;