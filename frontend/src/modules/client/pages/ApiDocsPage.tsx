import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiOutlineCommandLine,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineMusicalNote,
  HiOutlineServerStack,
  HiOutlineWallet,
  HiOutlineQuestionMarkCircle,
  HiOutlineCircleStack,
  HiOutlineCubeTransparent,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import styles from './ApiDocsPage.module.scss';

export const ApiDocsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLang = (searchParams.get('lang') || 'vi').toLowerCase() === 'en' ? 'en' : 'vi';
  const initialSection = searchParams.get('section') || 'part-1';

  const [docLang, setDocLang] = useState<'vi' | 'en'>(initialLang);
  const [models, setModels] = useState<PublicModelItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState<boolean>(true);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>(initialSection);

  // Sync section with URL param when URL changes (back/forward button)
  useEffect(() => {
    const s = searchParams.get('section');
    if (s && s !== activeSection) {
      setActiveSection(s);
    }
  }, [searchParams]);

  // Handler to switch section and sync with URL
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('section', sectionId);
      return p;
    });
    // Smooth scroll up to top of content
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Filters for models pricing table
  const [pricingCategory, setPricingCategory] = useState<string>('ALL');
  const [searchModelQuery, setSearchModelQuery] = useState<string>('');

  // Code snippet tab states
  const [chatSnippetTab, setChatSnippetTab] = useState<'curl' | 'python_sdk' | 'python_requests' | 'nodejs'>('curl');
  const [imageSnippetTab, setImageSnippetTab] = useState<'curl' | 'python'>('curl');
  const [videoSnippetTab, setVideoSnippetTab] = useState<'curl' | 'python'>('curl');

  // Load live models from Database Admin via public API
  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const data = await modelService.getPublicModels();
        if (isMounted && data) {
          setModels(data);
        }
      } catch (err) {
        console.error('Failed to load public models:', err);
      } finally {
        if (isMounted) setModelsLoading(false);
      }
    };
    fetchModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync lang with URL
  const handleLangChange = (newLang: 'vi' | 'en') => {
    setDocLang(newLang);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('lang', newLang);
      return p;
    });
  };

  // 1-Click Copy helper
  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Filter models for table
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchCat = pricingCategory === 'ALL' || m.category?.toUpperCase() === pricingCategory.toUpperCase();
      const q = searchModelQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.model_code.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [models, pricingCategory, searchModelQuery]);

  // Sidebar Table of Contents items
  const tocItems = useMemo(() => {
    if (docLang === 'en') {
      return [
        { id: 'part-1', title: '1. Base URLs & Authentication' },
        { id: 'part-2', title: '2. Models Catalog & Credit Pricing' },
        { id: 'part-3', title: '3. Chat / Reasoning Integration' },
        { id: 'part-4', title: '4. Multimodal Vision (Image Analysis)' },
        { id: 'part-5', title: '5. Text-to-Image Generations' },
        { id: 'part-6', title: '6. Image-to-Image Editing' },
        { id: 'part-7', title: '7. Multi-Reference Image Merging' },
        { id: 'part-8', title: '8. AI Video Generations (/v1/videos)' },
        { id: 'part-9', title: '9. Text-to-Speech (TTS) & Whisper STT' },
        { id: 'part-10', title: '10. Quick Setup in Popular AI Clients' },
        { id: 'part-11', title: '11. Technical Best Practices & Caching' },
        { id: 'part-12', title: '12. Balance & Quota API (/v1/balance)' },
        { id: 'part-13', title: '13. Frequently Asked Questions (FAQ)' },
      ];
    }
    return [
      { id: 'part-1', title: '1. Thông Tin Endpoint & Base URLs' },
      { id: 'part-2', title: '2. Danh Mục Model & Bảng Trừ Credit' },
      { id: 'part-3', title: '3. Tích Hợp Chat / Suy Luận (Text & Code)' },
      { id: 'part-4', title: '4. Multimodal Vision (Phân Tích Ảnh)' },
      { id: 'part-5', title: '5. Tạo Ảnh AI (Text-to-Image)' },
      { id: 'part-6', title: '6. Chỉnh Sửa Ảnh (Image-to-Image)' },
      { id: 'part-7', title: '7. Ghép Nhiều Ảnh Tham Chiếu (2+ Ảnh)' },
      { id: 'part-8', title: '8. Tạo Video AI Chuẩn /v1/videos' },
      { id: 'part-9', title: '9. Giọng Nói AI (TTS) & Bóc Băng Whisper' },
      { id: 'part-10', title: '10. Cấu Hình Nhanh Trên Client AI (No-Code)' },
      { id: 'part-11', title: '11. Lưu Ý Kỹ Thuật, Streaming & Cache' },
      { id: 'part-12', title: '12. Tra Cứu Số Dư Ví Qua API (/v1/balance)' },
      { id: 'part-13', title: '13. Câu Hỏi Thường Gặp (FAQ)' },
    ];
  }, [docLang]);

  // Determine previous and next topics for footer navigation
  const currentIndex = tocItems.findIndex((item) => item.id === activeSection);
  const prevSection = currentIndex > 0 ? tocItems[currentIndex - 1] : null;
  const nextSection = currentIndex >= 0 && currentIndex < tocItems.length - 1 ? tocItems[currentIndex + 1] : null;

  return (
    <div className={styles.docsContainer}>
      {/* Top Banner Header */}
      <div className={styles.docsHeader}>
        <div className={styles.headerTopRow}>
          <div className={styles.badgeRow}>
            <span className={styles.protocolBadge}>OpenAI & Anthropic Compatible</span>
            <span className={styles.versionBadge}>VeloX Gateway API v2.0</span>
          </div>

          <div className={styles.langToggleGroup}>
            <button
              type="button"
              className={`${styles.langBtn} ${docLang === 'vi' ? styles.langActive : ''}`}
              onClick={() => handleLangChange('vi')}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              className={`${styles.langBtn} ${docLang === 'en' ? styles.langActive : ''}`}
              onClick={() => handleLangChange('en')}
            >
              English
            </button>
          </div>
        </div>

        <h1 className={styles.mainTitle}>
          {docLang === 'en' ? (
            <>
              VeloX AI Gateway <span className={styles.highlightOrange}>Technical Integration Docs</span>
            </>
          ) : (
            <>
              Tài Liệu Kỹ Thuật <span className={styles.highlightOrange}>Tích Hợp & Móc API VeloX Gateway</span>
            </>
          )}
        </h1>

        <p className={styles.subTitle}>
          {docLang === 'en'
            ? 'Complete technical reference guide for integrating 100+ leading AI models directly into your applications, IDEs, Cursor, and automated pipelines with transparent credit pricing.'
            : 'Hướng dẫn kỹ thuật toàn diện giúp lập trình viên và khách hàng tự tích hợp trực tiếp hơn 100+ mô hình AI hàng đầu vào hệ thống, ứng dụng, Cursor IDE với bảng trừ credit minh bạch và tốc độ cao.'}
        </p>
      </div>

      {/* Main Layout: Sticky Sidebar TOC + Content Sections */}
      <div className={styles.docsLayout}>
        {/* Sticky Sidebar Navigation */}
        <aside className={styles.sidebarSticky}>
          <div className={styles.tocTitle}>
            {docLang === 'en' ? 'Table of Contents' : 'Mục Lục Tài Liệu'}
          </div>
          <ul className={styles.tocList}>
            {tocItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.tocItem} ${isActive ? styles.tocActive : ''}`}
                    onClick={() => handleSectionChange(item.id)}
                  >
                    <span>{item.title}</span>
                    {isActive && <HiOutlineChevronRight style={{ flexShrink: 0, fontSize: '0.85rem' }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Content Area */}
        <main className={styles.contentArea}>
          {/* ══════════════════════════════════════════════════════════════
              PART 1: BASE URLS & AUTHENTICATION
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-1"
            className={`${styles.docSection} ${activeSection === 'part-1' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineServerStack className={styles.sectionIcon} />
                <h2>
                  {docLang === 'en'
                    ? 'Part 1: Endpoint Information & High-Speed Base URLs'
                    : 'Phần 1: Thông Tin Endpoint & Đường Dẫn Base URL'}
                </h2>
              </div>
              <span className={styles.tagPill}>Cloudflare Global Edge</span>
            </div>

            <p className={styles.sectionDesc}>
              {docLang === 'en'
                ? 'All VeloX Gateway endpoints strictly conform to official OpenAI API and Anthropic API specifications. You can seamlessly drop VeloX into any official SDK or third-party client by simply switching the Base URL and API Key.'
                : 'Toàn bộ endpoint của VeloX AI Gateway tuân thủ 100% chuẩn quy cách OpenAI API và Anthropic API. Bạn có thể sử dụng trực tiếp các thư viện OpenAI SDK, LangChain, LlamaIndex hoặc các phần mềm client bằng cách thay đổi Base URL và API Key.'}
            </p>

            <div className={styles.routeGrid}>
              <div className={styles.routeCard}>
                <span className={styles.routeTag}>Production Main Route (Tối Ưu Tốc Độ)</span>
                <div className={styles.routeUrlRow}>
                  <span>https://velox.nexoratech.com.vn/v1</span>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => handleCopyCode('base_url_prod', 'https://velox.nexoratech.com.vn/v1')}
                  >
                    {copiedMap['base_url_prod'] ? <HiOutlineCheck size={14} /> : <HiOutlineDocumentDuplicate size={14} />}
                  </button>
                </div>
                <span className={styles.routeDesc}>
                  Đường truyền chính thức ổn định 99.9%, hỗ trợ toàn bộ OpenAI GPT, Claude, DeepSeek, Google Gemini, Midjourney, FLUX, Runway, Luma.
                </span>
              </div>

              <div className={styles.routeCard}>
                <span className={styles.routeTag}>Staging & Testing Route</span>
                <div className={styles.routeUrlRow}>
                  <span>https://testvelox.nexoratech.com.vn/v1</span>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => handleCopyCode('base_url_staging', 'https://testvelox.nexoratech.com.vn/v1')}
                  >
                    {copiedMap['base_url_staging'] ? <HiOutlineCheck size={14} /> : <HiOutlineDocumentDuplicate size={14} />}
                  </button>
                </div>
                <span className={styles.routeDesc}>
                  Môi trường thử nghiệm tính năng mới dành cho lập trình viên và kiểm thử ứng dụng trước khi ra mắt thị trường.
                </span>
              </div>
            </div>

            <div className={`${styles.alertBox} ${styles.info}`}>
              <HiOutlineShieldCheck className={styles.alertIcon} />
              <div>
                <strong>Cơ chế xác thực (Authentication Headers):</strong>
                <br />
                • Tiêu chuẩn OpenAI: <code>Authorization: Bearer &lt;YOUR_API_KEY&gt;</code>
                <br />
                • Tiêu chuẩn Anthropic Claude: <code>x-api-key: &lt;YOUR_API_KEY&gt;</code>
                <br />
                • <code>Content-Type: application/json</code> (hoặc <code>multipart/form-data</code> cho file ảnh/âm thanh).
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 2: MODEL CATALOG & DYNAMIC CREDIT PRICING
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-2"
            className={`${styles.docSection} ${activeSection === 'part-2' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineCircleStack className={styles.sectionIcon} />
                <h2>
                  {docLang === 'en'
                    ? 'Part 2: Model Catalog & Detailed Credit Deduction Pricing'
                    : 'Phần 2: Danh Mục Model & Bảng Trừ Credit Khấu Trừ Chi Tiết'}
                </h2>
              </div>
              <span className={styles.tagPill}>Trực Tiếp Từ Database Hệ Thống</span>
            </div>

            <p className={styles.sectionDesc}>
              {docLang === 'en'
                ? 'Credit deduction formula for chat & coding: Deducted Credits = (Input Tokens × Input Rate / 1,000,000) + (Output Tokens × Output Rate / 1,000,000) + (Cache Read Tokens × Cache Rate / 1,000,000). Prompt Caching saves up to 80% on long repeated contexts.'
                : 'Công thức trừ Credit cho Chat, Lập trình và Suy luận: Số Credit bị trừ = (Input Tokens × Đơn giá Input / 1.000.000) + (Output Tokens × Đơn giá Output / 1.000.000) + (Cache Read Tokens × Đơn giá Cache / 1.000.000). Prompt Caching giúp tiết kiệm tới 70-80% chi phí cho các lượt gọi lặp lại.'}
            </p>

            {/* Filter and Search Bar for Pricing Table */}
            <div className={styles.pricingFilterRow}>
              <div className={styles.filterTabs}>
                {['ALL', 'CHAT', 'IMAGE', 'VIDEO', 'DEV_REQ'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.tabBtn} ${pricingCategory === cat ? styles.tabActive : ''}`}
                    onClick={() => setPricingCategory(cat)}
                  >
                    {cat === 'ALL'
                      ? 'Tất Cả'
                      : cat === 'CHAT'
                      ? 'Chat & Code'
                      : cat === 'IMAGE'
                      ? 'Hình Ảnh'
                      : cat === 'VIDEO'
                      ? 'Video'
                      : 'Agent / Dev'}
                  </button>
                ))}
              </div>

              <div className={styles.searchBox}>
                <HiOutlineMagnifyingGlass size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Tìm kiếm Model ID..."
                  value={searchModelQuery}
                  onChange={(e) => setSearchModelQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Dynamic Models Pricing Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.pricingTable}>
                <thead>
                  <tr>
                    <th>Model Code (API ID)</th>
                    <th>Tên Hiển Thị & Hãng</th>
                    <th>Loại</th>
                    <th>Input Tokens (cr/1M)</th>
                    <th>Output Tokens (cr/1M)</th>
                    <th>Đọc Cache (cr/1M)</th>
                    <th>Đơn Giá / Lượt (Min)</th>
                  </tr>
                </thead>
                <tbody>
                  {modelsLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        Đang nạp bảng giá thời gian thực từ database...
                      </td>
                    </tr>
                  ) : filteredModels.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        Không tìm thấy model nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredModels.map((m) => {
                      const isMedia = m.category === 'IMAGE' || m.category === 'VIDEO';
                      return (
                        <tr key={m.id || m.model_code}>
                          <td className={styles.modelCodeCell}>{m.model_code}</td>
                          <td>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{m.name}</div>
                            <span className={styles.providerCell}>{m.provider}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.74rem', background: '#1c2538', padding: '2px 7px', borderRadius: '4px' }}>
                              {m.category}
                            </span>
                          </td>
                          <td className={styles.rateCell}>
                            {isMedia
                              ? '—'
                              : m.input_credit_price
                              ? `${m.input_credit_price.toLocaleString()} cr`
                              : 'Miễn phí'}
                          </td>
                          <td className={styles.rateCell}>
                            {isMedia
                              ? '—'
                              : m.output_credit_price
                              ? `${m.output_credit_price.toLocaleString()} cr`
                              : 'Miễn phí'}
                          </td>
                          <td className={styles.cacheCell}>
                            {isMedia
                              ? '—'
                              : m.cache_read_credit_price
                              ? `${m.cache_read_credit_price.toLocaleString()} cr (-80%)`
                              : 'Theo token'}
                          </td>
                          <td className={styles.minCostCell}>
                            {isMedia
                              ? `${m.selling_credit_price} cr / ${m.category === 'IMAGE' ? 'ảnh' : 'video'}`
                              : `${m.selling_credit_price || 15} cr / req`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 3: CHAT / REASONING (TEXT & CODE)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-3"
            className={`${styles.docSection} ${activeSection === 'part-3' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineCommandLine className={styles.sectionIcon} />
                <h2>Phần 3: Tích Hợp Chat & Suy Luận (Text, Code & Reasoning)</h2>
              </div>
              <span className={styles.tagPill}>POST /v1/chat/completions</span>
            </div>

            <p className={styles.sectionDesc}>
              Hỗ trợ đầy đủ Streaming SSE, Tool Calling (Function Calling), JSON Mode và System Prompts cho toàn bộ mô hình GPT-4o, Claude 3.5 Sonnet, DeepSeek V3/R1.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <div className={styles.codeLangPills}>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${chatSnippetTab === 'curl' ? styles.tabActive : ''}`}
                    onClick={() => setChatSnippetTab('curl')}
                  >
                    cURL (Streaming)
                  </button>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${chatSnippetTab === 'python_sdk' ? styles.tabActive : ''}`}
                    onClick={() => setChatSnippetTab('python_sdk')}
                  >
                    Python (OpenAI SDK)
                  </button>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${chatSnippetTab === 'python_requests' ? styles.tabActive : ''}`}
                    onClick={() => setChatSnippetTab('python_requests')}
                  >
                    Python (Requests)
                  </button>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${chatSnippetTab === 'nodejs' ? styles.tabActive : ''}`}
                    onClick={() => setChatSnippetTab('nodejs')}
                  >
                    Node.js / TS
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code =
                      chatSnippetTab === 'curl'
                        ? `curl -X POST "https://velox.nexoratech.com.vn/v1/chat/completions" \\\n  -H "Authorization: Bearer sk-velox-yourkey" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "deepseek-chat",\n    "messages": [\n      {"role": "system", "content": "Bạn là chuyên gia lập trình cao cấp tại VeloX."},\n      {"role": "user", "content": "Viết thuật toán QuickSort bằng Python có giải thích chi tiết."}\n    ],\n    "stream": true\n  }'`
                        : chatSnippetTab === 'python_sdk'
                        ? `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="sk-velox-yourkey",\n    base_url="https://velox.nexoratech.com.vn/v1"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[\n        {"role": "system", "content": "You are a professional software engineer."},\n        {"role": "user", "content": "Explain Python Decorators with clean practical examples."}\n    ],\n    stream=True\n)\n\nfor chunk in response:\n    content = chunk.choices[0].delta.content or ""\n    print(content, end="", flush=True)\nprint()`
                        : chatSnippetTab === 'nodejs'
                        ? `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "sk-velox-yourkey",\n  baseURL: "https://velox.nexoratech.com.vn/v1",\n});\n\nasync function main() {\n  const stream = await client.chat.completions.create({\n    model: "claude-3-5-sonnet-20241022",\n    messages: [{ role: "user", content: "Tạo cấu trúc Clean Architecture cho dự án Node.js" }],\n    stream: true,\n  });\n\n  for await (const chunk of stream) {\n    process.stdout.write(chunk.choices[0]?.delta?.content || "");\n  }\n}\nmain();`
                        : `import requests, json\n\nURL = "https://velox.nexoratech.com.vn/v1/chat/completions"\nheaders = {\n    "Authorization": "Bearer sk-velox-yourkey",\n    "Content-Type": "application/json"\n}\npayload = {\n    "model": "deepseek-chat",\n    "messages": [{"role": "user", "content": "Giải bài toán tháp Hà Nội 4 đĩa."}],\n    "stream": True\n}\n\nres = requests.post(URL, headers=headers, json=payload, stream=True)\nfor line in res.iter_lines():\n    if line:\n        decoded = line.decode('utf-8')\n        if decoded.startswith("data: ") and decoded != "data: [DONE]":\n            chunk = json.loads(decoded[6:])\n            print(chunk["choices"][0]["delta"].get("content", ""), end="", flush=True)`;
                    handleCopyCode('chat_code', code);
                  }}
                >
                  {copiedMap['chat_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['chat_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
                {chatSnippetTab === 'curl' &&
`curl -X POST "https://velox.nexoratech.com.vn/v1/chat/completions" \\
  -H "Authorization: Bearer sk-velox-yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "system", "content": "Bạn là chuyên gia lập trình cao cấp tại VeloX."},
      {"role": "user", "content": "Viết thuật toán QuickSort bằng Python có giải thích chi tiết."}
    ],
    "stream": true
  }'`}

                {chatSnippetTab === 'python_sdk' &&
`from openai import OpenAI

client = OpenAI(
    api_key="sk-velox-yourkey",
    base_url="https://velox.nexoratech.com.vn/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a professional software engineer."},
        {"role": "user", "content": "Explain Python Decorators with clean practical examples."}
    ],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
print()`}

                {chatSnippetTab === 'python_requests' &&
`import requests, json

URL = "https://velox.nexoratech.com.vn/v1/chat/completions"
headers = {
    "Authorization": "Bearer sk-velox-yourkey",
    "Content-Type": "application/json"
}
payload = {
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Giải bài toán tháp Hà Nội 4 đĩa."}],
    "stream": True
}

res = requests.post(URL, headers=headers, json=payload, stream=True)
for line in res.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith("data: ") and decoded != "data: [DONE]":
            chunk = json.loads(decoded[6:])
            print(chunk["choices"][0]["delta"].get("content", ""), end="", flush=True)
print()`}

                {chatSnippetTab === 'nodejs' &&
`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-velox-yourkey",
  baseURL: "https://velox.nexoratech.com.vn/v1",
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "claude-3-5-sonnet-20241022",
    messages: [{ role: "user", content: "Tạo cấu trúc Clean Architecture cho dự án Node.js" }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}
main();`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 4: MULTIMODAL VISION (IMAGE ANALYSIS)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-4"
            className={`${styles.docSection} ${activeSection === 'part-4' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlinePhoto className={styles.sectionIcon} />
                <h2>Phần 4: Multimodal Vision (Phân Tích Hình Ảnh AI)</h2>
              </div>
              <span className={styles.tagPill}>Base64 & Image URL Support</span>
            </div>

            <p className={styles.sectionDesc}>
              Khuyến nghị truyền hình ảnh dưới dạng Base64 Data URL (<code>data:image/png;base64,...</code>) hoặc đường dẫn ảnh URL công khai.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Python (OpenAI Vision SDK)</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code = `import base64\nfrom openai import OpenAI\n\nwith open("receipt.png", "rb") as f:\n    b64_img = base64.b64encode(f.read()).decode("utf-8")\n\nclient = OpenAI(\n    api_key="sk-velox-yourkey",\n    base_url="https://velox.nexoratech.com.vn/v1"\n)\n\nres = client.chat.completions.create(\n    model="gpt-4o",  # or claude-3-5-sonnet-20241022\n    messages=[{\n        "role": "user",\n        "content": [\n            {"type": "text", "text": "Trích xuất toàn bộ thông tin hóa đơn này sang JSON chuẩn."},\n            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}}\n        ]\n    }],\n    max_tokens=1500\n)\n\nprint(res.choices[0].message.content)`;
                    handleCopyCode('vision_code', code);
                  }}
                >
                  {copiedMap['vision_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['vision_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
{`import base64
from openai import OpenAI

with open("receipt.png", "rb") as f:
    b64_img = base64.b64encode(f.read()).decode("utf-8")

client = OpenAI(
    api_key="sk-velox-yourkey",
    base_url="https://velox.nexoratech.com.vn/v1"
)

res = client.chat.completions.create(
    model="gpt-4o",  # hoặc claude-3-5-sonnet-20241022
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Trích xuất toàn bộ thông tin hóa đơn này sang JSON chuẩn."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}}
        ]
    }],
    max_tokens=1500
)

print(res.choices[0].message.content)`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 5: TEXT-TO-IMAGE GENERATIONS
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-5"
            className={`${styles.docSection} ${activeSection === 'part-5' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineSparkles className={styles.sectionIcon} />
                <h2>Phần 5: Tạo Ảnh AI (Text-to-Image /v1/images/generations)</h2>
              </div>
              <span className={styles.tagPill}>FLUX.1 · Midjourney · DALL-E 3</span>
            </div>

            <p className={styles.sectionDesc}>
              Khởi tạo hình ảnh nghệ thuật độ phân giải 1024x1024, 2K hoặc 4K hoàn toàn từ câu lệnh mô tả văn bản (Prompt). Khấu trừ 35 - 45 credit cho mỗi bức ảnh.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <div className={styles.codeLangPills}>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${imageSnippetTab === 'curl' ? styles.tabActive : ''}`}
                    onClick={() => setImageSnippetTab('curl')}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${imageSnippetTab === 'python' ? styles.tabActive : ''}`}
                    onClick={() => setImageSnippetTab('python')}
                  >
                    Python (Lưu File Tự Động)
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code =
                      imageSnippetTab === 'curl'
                        ? `curl -X POST "https://velox.nexoratech.com.vn/v1/images/generations" \\\n  -H "Authorization: Bearer sk-velox-yourkey" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "flux-1-dev",\n    "prompt": "Cyberpunk city night view, neon reflections in rain puddle, ultra-realistic 8k, octane render",\n    "n": 1,\n    "size": "1024x1024"\n  }'`
                        : `import requests\n\nAPI_KEY = "sk-velox-yourkey"\nURL = "https://velox.nexoratech.com.vn/v1/images/generations"\n\nheaders = {\n    "Authorization": f"Bearer {API_KEY}",\n    "Content-Type": "application/json"\n}\npayload = {\n    "model": "flux-1-dev",\n    "prompt": "Futuristic neon athlete sprinting in dark studio, dramatic lighting, 8k",\n    "n": 1,\n    "size": "1024x1024"\n}\n\nres = requests.post(URL, headers=headers, json=payload, timeout=60).json()\nif "data" in res and len(res["data"]) > 0:\n    img_url = res["data"][0]["url"]\n    with open("output.png", "wb") as f:\n        f.write(requests.get(img_url).content)\n    print("Đã lưu ảnh thành công vào output.png!")`;
                    handleCopyCode('img_gen_code', code);
                  }}
                >
                  {copiedMap['img_gen_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['img_gen_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
                {imageSnippetTab === 'curl' ? (
`curl -X POST "https://velox.nexoratech.com.vn/v1/images/generations" \\
  -H "Authorization: Bearer sk-velox-yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "flux-1-dev",
    "prompt": "Cyberpunk city night view, neon reflections in rain puddle, ultra-realistic 8k, octane render",
    "n": 1,
    "size": "1024x1024"
  }'`
                ) : (
`import requests

API_KEY = "sk-velox-yourkey"
URL = "https://velox.nexoratech.com.vn/v1/images/generations"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}
payload = {
    "model": "flux-1-dev",
    "prompt": "Futuristic neon athlete sprinting in dark studio, dramatic lighting, 8k",
    "n": 1,
    "size": "1024x1024"
}

res = requests.post(URL, headers=headers, json=payload, timeout=60).json()
if "data" in res and len(res["data"]) > 0:
    img_url = res["data"][0]["url"]
    with open("output.png", "wb") as f:
        f.write(requests.get(img_url).content)
    print("Đã lưu ảnh thành công vào output.png!")`
                )}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 6: IMAGE-TO-IMAGE EDITING (1 REFERENCE)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-6"
            className={`${styles.docSection} ${activeSection === 'part-6' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlinePhoto className={styles.sectionIcon} />
                <h2>Phần 6: Chỉnh Sửa Ảnh (Image-to-Image /v1/images/edits)</h2>
              </div>
              <span className={styles.tagPill}>POST /v1/images/edits</span>
            </div>

            <p className={styles.sectionDesc}>
              Áp dụng khi bạn đã có ảnh gốc và muốn thay đổi trang phục, bối cảnh nền hoặc biến đổi phong cách hội họa (từ ảnh chụp sang Anime, 3D Pixar, Sơn dầu) mà vẫn giữ nguyên đường nét khuôn mặt.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>cURL (JSON Data URL)</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code = `curl -X POST "https://velox.nexoratech.com.vn/v1/images/edits" \\\n  -H "Authorization: Bearer sk-velox-yourkey" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "midjourney-v6.1",\n    "prompt": "Giữ nguyên khuôn mặt, thay đổi phông nền phía sau thành quán cà phê vintage ngập tràn ánh nắng",\n    "image": "data:image/png;base64,<BASE64_STRING_ANH_GOC>",\n    "n": 1,\n    "size": "1024x1024"\n  }'`;
                    handleCopyCode('img_edit_code', code);
                  }}
                >
                  {copiedMap['img_edit_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['img_edit_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
{`curl -X POST "https://velox.nexoratech.com.vn/v1/images/edits" \\
  -H "Authorization: Bearer sk-velox-yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "midjourney-v6.1",
    "prompt": "Giữ nguyên khuôn mặt, thay đổi phông nền phía sau thành quán cà phê vintage ngập tràn ánh nắng",
    "image": "data:image/png;base64,<BASE64_STRING_ANH_GOC>",
    "n": 1,
    "size": "1024x1024"
  }'`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 7: MULTI-REFERENCE IMAGE MERGING (2+ IMAGES)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-7"
            className={`${styles.docSection} ${activeSection === 'part-7' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineCubeTransparent className={styles.sectionIcon} />
                <h2>Phần 7: Ghép Nhiều Ảnh Tham Chiếu (2+ Reference Images)</h2>
              </div>
              <span className={styles.tagPill}>Multi-Image Synthesis</span>
            </div>

            <p className={styles.sectionDesc}>
              Tính năng vượt trội cho phép truyền 2, 3 hoặc 4 bức ảnh khác nhau vào mảng <code>"image": [&lt;b64_1&gt;, &lt;b64_2&gt;]</code>. AI sẽ lấy nhân vật/sản phẩm từ ảnh 1 và ghép vào bối cảnh/phong cách từ ảnh 2 một cách hoàn hảo.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Python Multi-Image Combination Script</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code = `import requests, base64\n\nAPI_KEY = "sk-velox-yourkey"\nURL = "https://velox.nexoratech.com.vn/v1/images/edits"\n\ndef to_data_uri(path):\n    with open(path, "rb") as f:\n        b64 = base64.b64encode(f.read()).decode("utf-8")\n    ext = path.split(".")[-1].lower()\n    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"\n    return f"data:{mime};base64,{b64}"\n\nuri_character = to_data_uri("character_face.png")  # Ảnh 1: Khuôn mặt nhân vật\nuri_background = to_data_uri("cyber_city.png")     # Ảnh 2: Bối cảnh thành phố\n\npayload = {\n    "model": "midjourney-v6.1",\n    "prompt": "Hòa trộn mượt mà: Đặt nhân vật từ ảnh 1 vào bối cảnh thành phố tương lai của ảnh 2, ánh sáng cinematic",\n    "image": [uri_character, uri_background],\n    "size": "1024x1024"\n}\n\nres = requests.post(URL, headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}, json=payload).json()\nprint("Kết quả:", res["data"][0]["url"])`;
                    handleCopyCode('multi_ref_code', code);
                  }}
                >
                  {copiedMap['multi_ref_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['multi_ref_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
{`import requests, base64

API_KEY = "sk-velox-yourkey"
URL = "https://velox.nexoratech.com.vn/v1/images/edits"

def to_data_uri(path):
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    ext = path.split(".")[-1].lower()
    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
    return f"data:{mime};base64,{b64}"

# Chuẩn bị 2 ảnh tham chiếu
uri_character = to_data_uri("character_face.png")  # Ảnh 1: Nhân vật
uri_background = to_data_uri("cyber_city.png")     # Ảnh 2: Bối cảnh

payload = {
    "model": "midjourney-v6.1",
    "prompt": "Hòa trộn mượt mà: Đặt nhân vật từ ảnh 1 vào bối cảnh thành phố tương lai của ảnh 2, ánh sáng cinematic",
    "image": [uri_character, uri_background],
    "size": "1024x1024"
}

res = requests.post(URL, headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}, json=payload).json()
print("Kết quả ảnh ghép:", res["data"][0]["url"])`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 8: AI VIDEO GENERATIONS (/v1/videos)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-8"
            className={`${styles.docSection} ${activeSection === 'part-8' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineFilm className={styles.sectionIcon} />
                <h2>Phần 8: Tạo Video AI Chuẩn OpenAI Videos (/v1/videos)</h2>
              </div>
              <span className={styles.tagPill}>Runway Gen-3 · Luma · Kling AI</span>
            </div>

            <p className={styles.sectionDesc}>
              VeloX Gateway hiện thực hóa trọn vẹn quy chuẩn OpenAI Videos API: Tạo Video (<code>POST /v1/videos</code>), Kiểm tra tiến độ (<code>GET /v1/videos/&#123;id&#125;</code>), Tải file MP4 (<code>GET /v1/videos/&#123;id&#125;/content</code>) và Hủy job khi cần (<code>DELETE</code>).
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <div className={styles.codeLangPills}>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${videoSnippetTab === 'curl' ? styles.tabActive : ''}`}
                    onClick={() => setVideoSnippetTab('curl')}
                  >
                    cURL Tạo Video
                  </button>
                  <button
                    type="button"
                    className={`${styles.codeTabBtn} ${videoSnippetTab === 'python' ? styles.tabActive : ''}`}
                    onClick={() => setVideoSnippetTab('python')}
                  >
                    Python SDK (Create & Download)
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code =
                      videoSnippetTab === 'curl'
                        ? `curl -X POST "https://velox.nexoratech.com.vn/v1/videos" \\\n  -H "Authorization: Bearer sk-velox-yourkey" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "runway-gen3-alpha",\n    "prompt": "Cinematic drone shot flying through futuristic neon Tokyo at night, 4k ultra-detailed",\n    "seconds": 5,\n    "aspect_ratio": "16:9"\n  }'`
                        : `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="sk-velox-yourkey",\n    base_url="https://velox.nexoratech.com.vn/v1"\n)\n\n# 1. Tạo video và tự động chờ render hoàn tất\nvideo = client.videos.create_and_poll(\n    model="runway-gen3-alpha",\n    prompt="Cinematic drone shot of athlete running through neon rain stadium, 60fps",\n    seconds=5,\n    aspect_ratio="16:9"\n)\nprint("Video ID hoàn tất:", video.id)\n\n# 2. Tải và lưu tệp MP4 về máy\ncontent = client.videos.download_content(video.id)\ncontent.write_to_file("output_video.mp4")\nprint("Đã lưu video thành công vào output_video.mp4!")`;
                    handleCopyCode('video_gen_code', code);
                  }}
                >
                  {copiedMap['video_gen_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['video_gen_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
                {videoSnippetTab === 'curl' ? (
`curl -X POST "https://velox.nexoratech.com.vn/v1/videos" \\
  -H "Authorization: Bearer sk-velox-yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "runway-gen3-alpha",
    "prompt": "Cinematic drone shot flying through futuristic neon Tokyo at night, 4k ultra-detailed",
    "seconds": 5,
    "aspect_ratio": "16:9"
  }'`
                ) : (
`from openai import OpenAI

client = OpenAI(
    api_key="sk-velox-yourkey",
    base_url="https://velox.nexoratech.com.vn/v1"
)

# 1. Tạo video và tự động chờ render hoàn tất
video = client.videos.create_and_poll(
    model="runway-gen3-alpha",
    prompt="Cinematic drone shot of athlete running through neon rain stadium, 60fps",
    seconds=5,
    aspect_ratio="16:9"
)
print("Video ID hoàn tất:", video.id)

# 2. Tải và lưu tệp MP4 về máy
content = client.videos.download_content(video.id)
content.write_to_file("output_video.mp4")
print("Đã lưu video thành công vào output_video.mp4!")`
                )}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 9: TEXT-TO-SPEECH (TTS) & SPEECH-TO-TEXT (STT)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-9"
            className={`${styles.docSection} ${activeSection === 'part-9' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineMusicalNote className={styles.sectionIcon} />
                <h2>Phần 9: Giọng Nói AI (Text-to-Speech /v1/audio/speech & Whisper STT)</h2>
              </div>
              <span className={styles.tagPill}>ElevenLabs v3 · Whisper Large v3</span>
            </div>

            <p className={styles.sectionDesc}>
              Chuyển văn bản thành giọng đọc truyền cảm đa ngôn ngữ qua <code>POST /v1/audio/speech</code> hoặc bóc băng ghi âm cuộc họp sang văn bản chính xác qua <code>POST /v1/audio/transcriptions</code>.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Python TTS & STT (OpenAI Audio SDK)</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code = `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="sk-velox-yourkey",\n    base_url="https://velox.nexoratech.com.vn/v1"\n)\n\n# 1. Text-to-Speech: Sinh tệp âm thanh MP3 từ văn bản\nresponse = client.audio.speech.create(\n    model="tts-1-hd",\n    voice="alloy",\n    input="Chào mừng bạn đến với nền tảng VeloX AI Gateway thế hệ mới!"\n)\nresponse.stream_to_file("speech.mp3")\n\n# 2. Speech-to-Text: Bóc băng audio thành chữ\nwith open("speech.mp3", "rb") as audio_file:\n    transcript = client.audio.transcriptions.create(\n        model="whisper-1",\n        file=audio_file\n    )\nprint("Nội dung bóc băng:", transcript.text)`;
                    handleCopyCode('audio_code', code);
                  }}
                >
                  {copiedMap['audio_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['audio_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
{`from openai import OpenAI

client = OpenAI(
    api_key="sk-velox-yourkey",
    base_url="https://velox.nexoratech.com.vn/v1"
)

# 1. Text-to-Speech: Sinh tệp âm thanh MP3 từ văn bản (15 cr / 1.000 ký tự)
response = client.audio.speech.create(
    model="tts-1-hd",
    voice="alloy",
    input="Chào mừng bạn đến với nền tảng VeloX AI Gateway thế hệ mới!"
)
response.stream_to_file("speech.mp3")

# 2. Speech-to-Text: Bóc băng audio thành chữ với Whisper Large v3
with open("speech.mp3", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file
    )
print("Nội dung bóc băng:", transcript.text)`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 10: QUICK CONFIGURATION ON POPULAR AI CLIENTS
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-10"
            className={`${styles.docSection} ${activeSection === 'part-10' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineBolt className={styles.sectionIcon} />
                <h2>Phần 10: Cấu Hình Nhanh Trên Các Ứng Dụng AI Phổ Biến (No-Code)</h2>
              </div>
              <span className={styles.tagPill}>Cursor · NextChat · Cherry Studio · Chatbox</span>
            </div>

            <p className={styles.sectionDesc}>
              Khách hàng không cần viết code vẫn có thể sử dụng VeloX Gateway ngay lập tức trên các phần mềm giao diện đồ họa hàng đầu.
            </p>

            <div className={styles.clientsGrid}>
              <div className={styles.clientCard}>
                <div className={styles.clientTitleRow}>
                  <span>Cursor / VS Code (Cline & Continue)</span>
                </div>
                <div className={styles.paramList}>
                  <div><strong>Provider:</strong> <code>OpenAI Compatible</code></div>
                  <div><strong>Base URL:</strong> <code>https://velox.nexoratech.com.vn/v1</code></div>
                  <div><strong>API Key:</strong> Dán khóa API của bạn (<code>sk-velox-xxxx</code>)</div>
                  <div><strong>Model ID:</strong> <code>claude-3-5-sonnet-20241022</code> hoặc <code>gpt-4o</code></div>
                </div>
              </div>

              <div className={styles.clientCard}>
                <div className={styles.clientTitleRow}>
                  <span>NextChat (ChatGPT-Next-Web)</span>
                </div>
                <div className={styles.paramList}>
                  <div><strong>Model Provider:</strong> <code>OpenAI</code></div>
                  <div><strong>API URL:</strong> <code>https://velox.nexoratech.com.vn</code></div>
                  <div><strong>API Key:</strong> Dán khóa API của bạn</div>
                  <div><strong>Custom Models:</strong> <code>gpt-4o,claude-3-5-sonnet-20241022,deepseek-chat</code></div>
                </div>
              </div>

              <div className={styles.clientCard}>
                <div className={styles.clientTitleRow}>
                  <span>Cherry Studio</span>
                </div>
                <div className={styles.paramList}>
                  <div><strong>Provider:</strong> <code>Add Custom OpenAI Provider</code></div>
                  <div><strong>Base URL:</strong> <code>https://velox.nexoratech.com.vn/v1</code></div>
                  <div><strong>API Key:</strong> Khóa API VeloX của bạn</div>
                  <div><strong>Manage Models:</strong> Thêm các model muốn sử dụng</div>
                </div>
              </div>

              <div className={styles.clientCard}>
                <div className={styles.clientTitleRow}>
                  <span>Chatbox AI</span>
                </div>
                <div className={styles.paramList}>
                  <div><strong>Model Provider:</strong> <code>OpenAI API Compatible</code></div>
                  <div><strong>API Host:</strong> <code>https://velox.nexoratech.com.vn/v1</code></div>
                  <div><strong>API Key:</strong> Dán khóa API của bạn</div>
                  <div><strong>Model:</strong> Nhập mã model theo bảng giá Phần 2</div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 11: TECHNICAL BEST PRACTICES & PROMPT CACHING
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-11"
            className={`${styles.docSection} ${activeSection === 'part-11' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineShieldCheck className={styles.sectionIcon} />
                <h2>Phần 11: Lưu Ý Kỹ Thuật Quan Trọng (Streaming, Timeout & Cache)</h2>
              </div>
              <span className={styles.tagPill}>Best Practices</span>
            </div>

            <div className={`${styles.alertBox} ${styles.warning}`}>
              <HiOutlineBolt className={styles.alertIcon} />
              <div>
                <strong>1. Luôn BẬT Streaming ("stream": true) cho các Model Suy Luận (Reasoning):</strong>
                <br />
                Các mô hình suy luận sâu (như o1, o3-mini, DeepSeek R1) cần thời gian tư duy nội bộ 15 đến 45 giây trước khi tạo token đầu tiên.
                Nếu tắt streaming (<code>"stream": false</code>), phần lớn client sẽ bị timeout sau 30 giây gây lỗi ngắt kết nối HTTP 499 / 524. Khi bật streaming, Gateway sẽ gửi heartbeat liên tục giữ kết nối mượt mà.
              </div>
            </div>

            <div className={`${styles.alertBox} ${styles.success}`}>
              <HiOutlineSparkles className={styles.alertIcon} />
              <div>
                <strong>2. Cơ chế Prompt Caching tự động (Tiết kiệm tới 80% chi phí):</strong>
                <br />
                VeloX Gateway tự động nhận diện và cache các đoạn prompt ngữ cảnh dài được tái sử dụng (như system instructions, tài liệu RAG, mã nguồn dự án).
                Khi hit cache, giá Input Tokens được giảm tới 80% chỉ còn theo đơn vị Cache Read trong bảng giá!
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 12: BALANCE & QUOTA API (/v1/balance)
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-12"
            className={`${styles.docSection} ${activeSection === 'part-12' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineWallet className={styles.sectionIcon} />
                <h2>Phần 12: Tra Cứu Số Dư Ví Qua API (GET /v1/balance)</h2>
              </div>
              <span className={styles.tagPill}>Free Endpoint (No Charge)</span>
            </div>

            <p className={styles.sectionDesc}>
              Truy vấn số dư Credit khả dụng, hạn mức và lịch sử tiêu dùng theo thời gian thực mà không bị trừ bất kỳ chi phí nào.
            </p>

            <div className={styles.codeCard}>
              <div className={styles.codeTopBar}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>cURL Balance Query</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    const code = `curl -X GET "https://velox.nexoratech.com.vn/v1/balance" \\\n  -H "Authorization: Bearer sk-velox-yourkey"`;
                    handleCopyCode('balance_code', code);
                  }}
                >
                  {copiedMap['balance_code'] ? <HiOutlineCheck size={13} /> : <HiOutlineDocumentDuplicate size={13} />}
                  <span>{copiedMap['balance_code'] ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={styles.codeContent}>
{`curl -X GET "https://velox.nexoratech.com.vn/v1/balance" \\
  -H "Authorization: Bearer sk-velox-yourkey"

# Mẫu phản hồi JSON (200 OK):
{
  "object": "account.balance",
  "currency": "CREDITS",
  "credit_balance": 999998,
  "available_credits": 999998,
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "updated_at": "2026-10-28T06:00:00Z"
}`}
              </pre>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PART 13: FAQ
          ══════════════════════════════════════════════════════════════ */}
          <section
            id="part-13"
            className={`${styles.docSection} ${activeSection === 'part-13' ? styles.activeSection : styles.hiddenSection}`}
          >
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBox}>
                <HiOutlineQuestionMarkCircle className={styles.sectionIcon} />
                <h2>Phần 13: Các Câu Hỏi Thường Gặp (FAQ)</h2>
              </div>
              <span className={styles.tagPill}>24/7 Support</span>
            </div>

            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <h4 className={styles.faqQuestion}>Q: Tôi gặp lỗi 401 Unauthorized khi gọi API?</h4>
                <p className={styles.faqAnswer}>
                  Lỗi 401 xảy ra khi API Key chưa được truyền vào Header hoặc truyền sai định dạng. Hãy đảm bảo Header có: <code>Authorization: Bearer sk-velox-xxxx</code> và khóa API của bạn đang ở trạng thái kích hoạt trong mục <Link to="/developer" style={{ color: '#ff6b35' }}>Quản lý API Key</Link>.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h4 className={styles.faqQuestion}>Q: Làm thế nào để nạp thêm Credit khi số dư sắp hết?</h4>
                <p className={styles.faqAnswer}>
                  Bạn có thể nhấn vào nút <strong>Nạp Credit</strong> trên thanh Header hoặc truy cập trang <Link to="/subscription" style={{ color: '#ff6b35' }}>Bảng Giá & Nạp</Link> để quét mã VietQR tự động. Hệ thống ngân hàng VietQR sẽ cộng Credit tức thì vào tài khoản của bạn trong 10-30 giây, 24/7.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h4 className={styles.faqQuestion}>Q: Tôi có thể sử dụng VeloX API cho các tool tạo ảnh/video tự động số lượng lớn không?</h4>
                <p className={styles.faqAnswer}>
                  Hoàn toàn được! VeloX AI Gateway được thiết kế với hạ tầng Pool cân bằng tải tự động chịu tải hàng triệu requests mỗi ngày, hỗ trợ đa luồng và xử lý bất đồng bộ mượt mà cho các ứng dụng tự động hóa.
                </p>
              </div>
            </div>
          </section>

          {/* Section Navigation Footer */}
          <div className={styles.sectionNavFooter}>
            {prevSection ? (
              <button
                type="button"
                className={styles.prevSectionBtn}
                onClick={() => handleSectionChange(prevSection.id)}
              >
                <HiOutlineArrowLeft style={{ fontSize: '1.1rem', flexShrink: 0 }} />
                <div>
                  <span className={styles.navSubLabel}>{docLang === 'en' ? 'Previous Topic' : 'Mục trước'}</span>
                  <span className={styles.navMainLabel}>{prevSection.title}</span>
                </div>
              </button>
            ) : <div />}

            <div className={styles.navProgressBadge}>
              {currentIndex + 1} / {tocItems.length}
            </div>

            {nextSection ? (
              <button
                type="button"
                className={styles.nextSectionBtn}
                onClick={() => handleSectionChange(nextSection.id)}
              >
                <div>
                  <span className={styles.navSubLabel}>{docLang === 'en' ? 'Next Topic' : 'Mục tiếp theo'}</span>
                  <span className={styles.navMainLabel}>{nextSection.title}</span>
                </div>
                <HiOutlineArrowRight style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ApiDocsPage;
