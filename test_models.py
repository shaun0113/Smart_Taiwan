import os
import google.generativeai as genai
from dotenv import load_dotenv

# 讀取你的環境變數
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ 找不到 GEMINI_API_KEY，請確認 .env 檔案")
else:
    # 初始化金鑰
    genai.configure(api_key=api_key)
    
    print("🔄 正在向 Google 伺服器撈取支援的免費模型型號...\n")
    try:
        # 遍歷所有支援 generateContent 的模型
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"型號代碼: {m.name}")
                print(f"顯示名稱: {m.display_name}")
                print(f"說明: {m.description}\n")
    except Exception as e:
        print(f"發生錯誤: {e}")