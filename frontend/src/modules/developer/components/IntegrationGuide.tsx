import React, { useState } from 'react';
import { HiOutlineClipboard, HiOutlineCheck } from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';

export const IntegrationGuide: React.FC = () => {
  const [lang, setLang] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  const snippets: Record<'python' | 'node' | 'curl', string> = {
    python: `from openai import OpenAI

# Kết nối qua VeloX AI Gateway trung gian
client = OpenAI(
    base_url="http://localhost:8000/v1",  # Hoặc URL server VeloX của bạn
    api_key="sk-velox-your_secret_key_here"
)

# 1. Sinh Video AI (Meta Video Gen / Animate)
response = client.images.generate(
    model="meta-video-gen",
    prompt="Một phi thuyền không gian bay qua các vì sao rực rỡ neon",
)
print("Video URL:", response.data[0].url)

# 2. Sinh Ảnh AI (Meta Imagine)
img_res = client.images.generate(
    model="meta-imagine",
    prompt="Chú mèo máy tương lai phong cách Cyberpunk 8K",
    n=1
)
print("Image URL:", img_res.data[0].url)`,

    node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:8000/v1", // VeloX Gateway URL
  apiKey: "sk-velox-your_secret_key_here",
});

async function main() {
  // Sinh Ảnh hoặc Video
  const response = await openai.images.generate({
    model: "meta-video-gen",
    prompt: "Cảnh biển hoàng hôn 4K với sóng biển phát quang",
    n: 1,
  });

  console.log("Media URL:", response.data[0].url);
}

main();`,

    curl: `# Gọi sinh Video qua VeloX Gateway
curl -X POST "http://localhost:8000/v1/videos/generations" \\
  -H "Authorization: Bearer sk-velox-your_secret_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-video-gen",
    "prompt": "Một chú kỳ lân chạy trên dải ngân hà 4K",
    "duration_sec": 5
  }'`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      marginTop: '28px', background: '#111520', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161b2a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
          <RiOpenaiFill size={20} color="#10b981" />
          <span>Hướng Dẫn Tích Hợp Cho Developer (OpenAI Compatible)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['python', 'node', 'curl'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLang(t)}
              style={{
                padding: '4px 12px', borderRadius: '6px', border: 'none',
                background: lang === t ? '#6366f1' : 'transparent',
                color: lang === t ? '#fff' : '#94a3b8',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase'
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
              borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
              background: '#1e2433', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px'
            }}
          >
            {copied ? <><HiOutlineCheck color="#34d399" /> Copied</> : <><HiOutlineClipboard /> Copy Code</>}
          </button>
        </div>
      </div>
      <pre style={{
        margin: 0, padding: '18px 20px', background: '#0b0f19', color: '#e2e8f0',
        fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', lineHeight: '1.6',
        overflowX: 'auto'
      }}>
        {snippets[lang]}
      </pre>
    </div>
  );
};
