import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineCheck,
  HiOutlineCodeBracket,
  HiOutlineDocumentDuplicate,
  HiOutlineCommandLine,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';
import { RiOpenaiFill, RiSparklingFill, RiPlayFill } from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { billingService, type CreditPackageDto } from '@modules/billing/services/billingService';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from '@assets/scss/home/home.module.scss';

// Fallback dynamic packages if DB call is loading
const DEFAULT_PACKAGES: CreditPackageDto[] = [
  {
    id: 'ae0b9b9a-5479-4b8c-957a-3872e6667db3',
    name: 'Creator Standard',
    category: 'STARTER',
    price_vnd: 189000,
    credits_given: 2000,
    bonus_percentage: 0,
    is_popular: false,
    tag_badge: 'TIẾT KIỆM',
    is_active: true,
    features: [
      '2,000 Credits/tháng (~60 ảnh FLUX hoặc 800 câu chat)',
      'Mở khóa trọn bộ 156+ Model AI hàng đầu thế giới',
      'Tạo ảnh & video chuẩn HD với Kling, Luma & FLUX',
      'Ưu tiên xử lý nhanh, không lo nghẽn mạng',
      'Hỗ trợ kỹ thuật cộng đồng 24/7',
    ],
  },
  {
    id: 'e66c630f-b34f-4ad4-b682-147534c475ec',
    name: 'Pro Studio',
    category: 'PRO',
    price_vnd: 489000,
    credits_given: 5500,
    bonus_percentage: 10,
    is_popular: true,
    tag_badge: 'KHUYÊN DÙNG',
    is_active: true,
    features: [
      '5,500 Credits/tháng (~150 ảnh 4K hoặc 65 video Full HD)',
      'Mở khóa 156+ Model AI (Claude 3.5 Sonnet, Midjourney, Kling)',
      'Hàng đợi VIP ưu tiên, render 4K không chờ đợi',
      'API Key kết nối MCP, Cursor, IDEs & bên thứ 3',
      'Không giới hạn Workflows tự động hóa',
      'Hỗ trợ kỹ thuật 1-1 chuyên sâu',
    ],
  },
  {
    id: '76a1923c-52a1-4d3f-a1fc-244d881ecf63',
    name: 'Business & Agency',
    category: 'ENTERPRISE',
    price_vnd: 1290000,
    credits_given: 15000,
    bonus_percentage: 15,
    is_popular: false,
    tag_badge: 'DOANH NGHIỆP',
    is_active: true,
    features: [
      '15,000 Credits/tháng (~400 ảnh 4K hoặc 180 video AI)',
      'Khai thác 156+ Model cao cấp với độ trễ thấp nhất',
      'Workspace nhóm tối đa 10 nhân sự độc lập',
      'Băng thông riêng biệt, tốc độ xử lý ưu tiên hàng đầu',
      'Tùy biến Custom Domain Gateway cho doanh nghiệp',
      'Hỗ trợ kỹ thuật 1-1 chuyên sâu',
    ],
  },
  {
    id: 'afa28506-0de0-4930-a7a1-f287b4387602',
    name: 'Enterprise Scale',
    category: 'ENTERPRISE',
    price_vnd: 2890000,
    credits_given: 35000,
    bonus_percentage: 20,
    is_popular: false,
    tag_badge: 'ENTERPRISE VIP',
    is_active: true,
    features: [
      '35,000 Credits/tháng (~950 ảnh 4K hoặc 420 video AI)',
      'Tối ưu sản lượng lớn cho Agency & Studio quy mô',
      'Workspace không giới hạn số lượng nhân sự',
      'Cổng Gateway API riêng biệt chịu tải cực cao',
      'Tùy biến Prompt Engineering chuyên biệt',
      'Băng thông chuyên dụng độc quyền tốc độ cao nhất',
    ],
  },
  {
    id: 'cef6ab80-bb2b-4fc4-b94c-23cdc184217e',
    name: 'Gói Nạp Khởi Động',
    category: 'TOPUP',
    price_vnd: 100000,
    credits_given: 1000,
    bonus_percentage: 0,
    is_popular: false,
    tag_badge: 'KHỞI ĐỘNG',
    is_active: true,
    features: [
      '1,000 Credits sử dụng vĩnh viễn không hết hạn',
      'Tạo ~30 ảnh chất lượng cao hoặc 500 câu chat AI',
      'Truy cập đầy đủ 156+ mô hình AI đỉnh cao',
      'Kích hoạt tự động qua VietQR trong 3 giây',
    ],
  },
  {
    id: '7f0ccbc4-73c5-43c9-9c88-1ef309db1659',
    name: 'Gói Nạp Tiêu Chuẩn',
    category: 'TOPUP',
    price_vnd: 200000,
    credits_given: 2050,
    bonus_percentage: 2.5,
    is_popular: false,
    tag_badge: '+2.5% THƯỞNG',
    is_active: true,
    features: [
      '2,050 Credits (Đã gồm 50 credits thưởng thêm)',
      'Tạo ~60 ảnh FLUX / Midjourney 4K',
      'Tạo 26 video điện ảnh Kling / Runway',
      'Ưu tiên băng thông cao và tốc độ xử lý hàng chờ',
    ],
  },
  {
    id: '4f3aae1a-b5f3-4066-bbd0-3bdc265f47b8',
    name: 'Gói Nạp Bán Chạy',
    category: 'TOPUP',
    price_vnd: 500000,
    credits_given: 5300,
    bonus_percentage: 6,
    is_popular: true,
    tag_badge: 'BÁN CHẠY NHẤT',
    is_active: true,
    features: [
      '5,300 Credits (Đã gồm 300 credits thưởng thêm 6%)',
      'Tạo ~150 ảnh 4K hoặc 65 video Full HD',
      'Chat ~2,600 câu AI hoặc gọi API thoải mái',
      'Ưu tiên băng thông cao, không phải xếp hàng',
    ],
  },
  {
    id: '09188e61-af4a-4af6-8a02-8c1aa35562d3',
    name: 'Gói VIP Sáng Tạo',
    category: 'TOPUP',
    price_vnd: 1000000,
    credits_given: 11000,
    bonus_percentage: 10,
    is_popular: false,
    tag_badge: '+10% THƯỞNG',
    is_active: true,
    features: [
      '11,000 Credits (Đã gồm 1,000 credits thưởng thêm 10%)',
      'Tạo ~320 ảnh 4K hoặc 150 video AI thương mại',
      'Hạ tầng Dedicated Pool & Custom Rate Limit riêng biệt',
      'Kênh hỗ trợ VIP 1-1 với kỹ sư VeloX',
    ],
  },
  {
    id: '99afa89b-9df3-4243-8585-34193cce1050',
    name: 'Gói Super VIP Doanh Nghiệp',
    category: 'TOPUP',
    price_vnd: 2000000,
    credits_given: 23000,
    bonus_percentage: 15,
    is_popular: false,
    tag_badge: 'SUPER VIP +15%',
    is_active: true,
    features: [
      '23,000 Credits (Đã gồm 3,000 credits thưởng thêm 15%)',
      'Tạo ~680 ảnh 4K hoặc 300 video AI',
      'Băng thông riêng chuyên biệt, cam kết SLA 99.9%',
      'Hỗ trợ cấu hình tích hợp hệ thống riêng',
    ],
  },
];

const getPackageFeatures = (pkg: CreditPackageDto): string[] => {
  if (Array.isArray(pkg.features) && pkg.features.length > 0) {
    return pkg.features;
  }
  if (typeof pkg.features === 'string') {
    try {
      const parsed = JSON.parse(pkg.features);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  if (pkg.category === 'STARTER') {
    return [
      `${pkg.credits_given.toLocaleString()} Credits/tháng (~60 ảnh FLUX hoặc 800 câu chat)`,
      'Mở khóa trọn bộ 156+ Model AI hàng đầu thế giới',
      'Tạo ảnh & video chuẩn HD với Kling, Luma & FLUX',
      'Ưu tiên xử lý nhanh, không lo nghẽn mạng',
      'Hỗ trợ kỹ thuật cộng đồng 24/7',
    ];
  }
  if (pkg.category === 'PRO') {
    return [
      `${pkg.credits_given.toLocaleString()} Credits/tháng (~150 ảnh 4K hoặc 65 video Full HD)`,
      'Mở khóa 156+ Model AI (Claude 3.5 Sonnet, Midjourney, Kling)',
      'Hàng đợi VIP ưu tiên, render 4K không chờ đợi',
      'API Key kết nối MCP, Cursor, IDEs & bên thứ 3',
      'Không giới hạn Workflows tự động hóa',
      'Hỗ trợ kỹ thuật 1-1 chuyên sâu',
    ];
  }
  if (pkg.category === 'ENTERPRISE') {
    return [
      `${pkg.credits_given.toLocaleString()} Credits/tháng (~400 ảnh 4K hoặc 180 video AI)`,
      'Khai thác 156+ Model cao cấp với độ trễ thấp nhất',
      'Băng thông riêng biệt, tốc độ xử lý ưu tiên hàng đầu',
      'Cổng Gateway API riêng biệt chịu tải cực cao',
      'Hỗ trợ kỹ thuật 1-1 chuyên sâu 24/7',
    ];
  }
  return [
    `${pkg.credits_given.toLocaleString()} Credits sử dụng vĩnh viễn không hết hạn`,
    'Tạo ảnh chất lượng cao hoặc chat AI tốc độ cao',
    'Truy cập đầy đủ 156+ mô hình AI đỉnh cao',
    'Kích hoạt tự động qua VietQR trong 3 giây',
  ];
};

// Curated Models for Showcase Section
interface ShowcaseModel {
  id: string;
  name: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO';
  badge?: string;
  provider: string;
  desc: string;
  creditPrice: string;
}

const showcaseModels: ShowcaseModel[] = [
  {
    id: 'flux-1-dev',
    name: 'FLUX.1 [dev]',
    category: 'IMAGE',
    badge: 'HOT',
    provider: 'Black Forest Labs',
    desc: 'Mô hình tạo ảnh siêu chi tiết thế hệ mới, tái hiện cấu trúc da, ánh sáng và chi tiết ngón tay chuẩn xác.',
    creditPrice: '4 cr / ảnh',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    category: 'CHAT',
    badge: 'PRO',
    provider: 'Anthropic',
    desc: 'Đỉnh cao tư duy lập trình và suy luận logic. Hỗ trợ ngữ cảnh 200.000 tokens và xử lý tài liệu phức tạp.',
    creditPrice: '3.0 cr / 1M in',
  },
  {
    id: 'midjourney-v6.1',
    name: 'Midjourney v6.1',
    category: 'IMAGE',
    badge: 'CREATIVE',
    provider: 'Midjourney',
    desc: 'Tuyệt tác nghệ thuật hội họa và điện ảnh. Khả năng hiểu ngôn ngữ trừu tượng và bố cục nhiếp ảnh xuất chúng.',
    creditPrice: '6 cr / ảnh',
  },
  {
    id: 'runway-gen3',
    name: 'Runway Gen-3 Alpha',
    category: 'VIDEO',
    badge: 'CINEMATIC',
    provider: 'RunwayML',
    desc: 'Sản xuất video AI độ phân giải cao 60FPS với khả năng điều khiển chuyển động camera vật lý chân thực.',
    creditPrice: '45 cr / 5s',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    category: 'CHAT',
    badge: 'FLAGSHIP',
    provider: 'OpenAI',
    desc: 'Mô hình đa thể thức toàn diện nhất thế giới: Phân tích ảnh, đọc bảng biểu, trò chuyện tự nhiên và giải toán.',
    creditPrice: '2.5 cr / 1M in',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 / R1',
    category: 'CHAT',
    badge: 'BEST VALUE',
    provider: 'DeepSeek',
    desc: 'Hiệu năng tương đương GPT-4o với chi phí siêu rẻ. Đột phá về khả năng tự suy luận và giải thích từng bước.',
    creditPrice: '0.55 cr / 1M in',
  },
];

// Interactive Widget State Demos with Real Generated Media
interface DemoChip {
  text: string;
  img: string;
  prompt: string;
}

interface DemoItem {
  model: string;
  category: 'IMAGE' | 'CHAT' | 'VIDEO';
  previewImg: string;
  creditCost: string;
  resolution: string;
  defaultPrompt: string;
  chips: DemoChip[];
  isVideo?: boolean;
}

const interactiveDemos: Record<'image' | 'chat' | 'video', DemoItem> = {
  image: {
    model: 'gpt-image-2',
    category: 'IMAGE',
    previewImg: '/api/v1/studio/media/image_e40a67e8_63ce65ec8e36.jpg',
    creditCost: '35.0 Credits',
    resolution: '1024 × 1024 • 8K Portrait',
    defaultPrompt: 'Tạo ảnh cô gái Việt Nam bận áo dài hoa sen bên hồ sen ngát hương, vẻ đẹp thuần khiết thanh tao 8K',
    chips: [
      {
        text: 'Áo dài hoa sen bên hồ sen (Bản 1)',
        img: '/api/v1/studio/media/image_e40a67e8_63ce65ec8e36.jpg',
        prompt: 'Tạo ảnh cô gái Việt Nam bận áo dài hoa sen bên hồ sen ngát hương, vẻ đẹp thuần khiết thanh tao 8K',
      },
      {
        text: 'Áo dài hoa sen truyền thống (Bản 2)',
        img: '/api/v1/studio/media/image_ac8928c1_8d8e2e02b6f3.jpg',
        prompt: 'Tạo ảnh cô gái Việt Nam bận áo dài hoa sen, nón lá truyền thống, nụ cười rạng rỡ phong cách chân dung 8K',
      },
    ],
  },
  chat: {
    model: 'Claude 3.5 Sonnet',
    category: 'CHAT',
    previewImg: '/api/v1/studio/media/image_705030ff_0e01f1d89e70.jpg',
    creditCost: '0.015 Credits',
    resolution: '200K Context • Smart Vision',
    defaultPrompt: 'Thiết kế prompt chi tiết để vẽ chân dung cô gái Việt Nam mặc áo dài hoa sen đạt độ nét 8K',
    chips: [
      {
        text: 'Prompt tạo ảnh chân dung 8K',
        img: '/api/v1/studio/media/image_705030ff_0e01f1d89e70.jpg',
        prompt: 'Thiết kế prompt chi tiết để vẽ chân dung cô gái Việt Nam mặc áo dài hoa sen đạt độ nét 8K',
      },
      {
        text: 'Thiết lập ánh sáng Studio thảm đỏ',
        img: '/api/v1/studio/media/image_8d111e06_fa285bbfbb3b.jpg',
        prompt: 'Tối ưu thông số chiếu sáng studio, rim light và camera tracking cho nhân vật thảm đỏ sự kiện',
      },
    ],
  },
  video: {
    model: 'imagine-animate',
    category: 'VIDEO',
    previewImg: '/api/v1/studio/media/image_8d111e06_fa285bbfbb3b.jpg',
    creditCost: '35.0 Credits',
    resolution: '1080p HD • 60 FPS • Motion 6.0',
    defaultPrompt: 'Cô gái Tây Ninh đi trên thảm đỏ sự kiện quốc tế, sải bước thanh lịch, camera tracking 60fps cinematic',
    isVideo: true,
    chips: [
      {
        text: 'Cô gái Tây Ninh thảm đỏ (Animate 60FPS)',
        img: '/api/v1/studio/media/image_8d111e06_fa285bbfbb3b.jpg',
        prompt: 'Cô gái Tây Ninh đi trên thảm đỏ sự kiện quốc tế, sải bước thanh lịch, camera tracking 60fps cinematic',
      },
      {
        text: 'Khoảnh khắc thảm đỏ rạng ngời (Flash 1:1)',
        img: '/api/v1/studio/media/image_705030ff_0e01f1d89e70.jpg',
        prompt: 'Cô gái Tây Ninh đi trên thảm đỏ với tà áo dài trắng thướt tha, phóng viên săn đón rạng rỡ',
      },
    ],
  },
};

// Continuous Marquee Models with Detailed Descriptions
interface RunningModel {
  name: string;
  provider: string;
  badge: string;
  badgeColor: string;
  desc: string;
}

const runningModels: RunningModel[] = [
  {
    name: 'OpenAI GPT-4o',
    provider: 'OpenAI',
    badge: 'Đa Thể Thức',
    badgeColor: '#10a37f',
    desc: 'Đỉnh cao thị giác AI, đọc hiểu hình ảnh, tài liệu và phản hồi giọng nói tự nhiên',
  },
  {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'Vua Lập Trình',
    badgeColor: '#c084fc',
    desc: 'Khả năng viết code, suy luận logic vượt trội cùng bộ nhớ ngữ cảnh 200.000 tokens',
  },
  {
    name: 'DeepSeek V3 / R1',
    provider: 'DeepSeek',
    badge: 'Chi Phí Tối Ưu',
    badgeColor: '#ff6b35',
    desc: 'Siêu trí tuệ tự suy luận toán học và logic từng bước với giá thành siêu rẻ',
  },
  {
    name: 'Google Gemini 1.5 Pro',
    provider: 'Google AI',
    badge: 'Ngữ Cảnh 1M',
    badgeColor: '#38bdf8',
    desc: 'Xử lý video dài hàng giờ, đọc toàn bộ kho sách và tài liệu triệu tokens mượt mà',
  },
  {
    name: 'FLUX.1 [dev]',
    provider: 'Black Forest',
    badge: 'Ảnh Siêu Thực',
    badgeColor: '#f59e0b',
    desc: 'Tái tạo ánh sáng điện ảnh, cấu trúc da và ngón tay chuẩn xác từng milimet',
  },
  {
    name: 'Midjourney v6.1',
    provider: 'Midjourney',
    badge: 'Nghệ Thuật 8K',
    badgeColor: '#ec4899',
    desc: 'Tuyệt tác đồ họa thẩm mỹ và hội họa điện ảnh đỉnh cao cho Designer & Creator',
  },
  {
    name: 'Runway Gen-3 Alpha',
    provider: 'RunwayML',
    badge: 'Video 60FPS',
    badgeColor: '#a855f7',
    desc: 'Sản xuất video AI chất lượng điện ảnh Hollywood với góc quay camera vật lý chân thực',
  },
  {
    name: 'Kling AI 1.5',
    provider: 'Kuaishou',
    badge: 'Mô Phỏng Vật Lý',
    badgeColor: '#06b6d4',
    desc: 'Chuyển động nhân vật tự nhiên, biểu cảm chân thực và tính tương tác vật lý cao cấp',
  },
  {
    name: 'Imagine Flash & Animate',
    provider: 'VeloX Studio',
    badge: 'Tốc Độ Cao',
    badgeColor: '#10b981',
    desc: 'Khởi tạo ảnh tức thì và biến ảnh tĩnh thành video cử động sống động trong chớp mắt',
  },
  {
    name: 'Luma Dream Machine',
    provider: 'Luma AI',
    badge: 'Video 3D',
    badgeColor: '#eab308',
    desc: 'Dựng phối cảnh 3D không gian thực tế với tốc độ sinh video đột phá',
  },
];

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [packages, setPackages] = useState<CreditPackageDto[]>(DEFAULT_PACKAGES);
  const [pricingTab, setPricingTab] = useState<'SUBSCRIPTION' | 'TOPUP'>('SUBSCRIPTION');
  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();
  const [landingSections, setLandingSections] = useState<LandingSection[]>([]);

  useEffect(() => {
    let isMounted = true;
    billingService
      .getPublicPackages()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const paid = data.filter((p) => p.price_vnd > 0);
          if (paid.length > 0) {
            setPackages(paid);
          }
        }
      })
      .catch(() => {});

    landingService
      .getPublicLandingSections()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setLandingSections(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPackage = (pkg: CreditPackageDto) => {
    if (isAuthenticated) {
      setSelectedPackageId(pkg.id);
      setTopupOpen(true);
    } else {
      navigate(`/login?redirect=${encodeURIComponent('/#pricing')}`);
    }
  };

  // Interactive Hero Widget State with Real Media
  const [activeMode, setActiveMode] = useState<'image' | 'chat' | 'video'>('image');
  const currentDemo = interactiveDemos[activeMode];
  const [currentPrompt, setCurrentPrompt] = useState<string>(currentDemo.defaultPrompt);
  const [currentImg, setCurrentImg] = useState<string>(currentDemo.previewImg);

  // Model Showcase Category Tab
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CHAT' | 'IMAGE' | 'VIDEO'>('ALL');

  // Code snippet tab state
  const [codeSnippetTab, setCodeSnippetTab] = useState<'python' | 'curl' | 'node'>('python');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleModeChange = (mode: 'image' | 'chat' | 'video') => {
    setActiveMode(mode);
    setCurrentPrompt(interactiveDemos[mode].defaultPrompt);
    setCurrentImg(interactiveDemos[mode].previewImg);
  };

  const handleSelectChip = (chip: DemoChip) => {
    setCurrentPrompt(chip.prompt);
    setCurrentImg(chip.img);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredModels =
    activeCategory === 'ALL'
      ? showcaseModels
      : showcaseModels.filter((m) => m.category === activeCategory);

  const snippetCode =
    codeSnippetTab === 'python'
      ? `from openai import OpenAI

client = OpenAI(
    api_key="sk-velox-yourkey",
    base_url="https://velox.nexoratech.com.vn/v1"
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{"role": "user", "content": "Xin chào VeloX AI Gateway!"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`
      : codeSnippetTab === 'curl'
      ? `curl -X POST "https://velox.nexoratech.com.vn/v1/chat/completions" \\
  -H "Authorization: Bearer sk-velox-yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello VeloX Gateway"}],
    "stream": true
  }'`
      : `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-velox-yourkey",
  baseURL: "https://velox.nexoratech.com.vn/v1",
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Viết hàm debounce trong TypeScript" }],
});
console.log(response.choices[0].message.content);`;

  // ── Dynamic Sections Content Resolution ──
  const getSection = (key: string) => landingSections.find((s) => s.section_key === key);
  const getSectionOrder = (key: string, defaultOrder: number) => {
    const sec = getSection(key);
    return sec ? sec.order : defaultOrder;
  };
  const isSectionActive = (key: string) => {
    const sec = getSection(key);
    return sec ? sec.is_active : true;
  };

  const heroContent = getSection('hero')?.content;
  const partnersContent = getSection('partners')?.content;
  const featuresContent = getSection('features')?.content;
  const modelsContent = getSection('models')?.content;
  const devContent = getSection('developer')?.content;
  const pricingContent = getSection('pricing')?.content;
  const testimonialsContent = getSection('testimonials')?.content;
  const ctaContent = getSection('cta_banner')?.content;

  return (
    <div className={styles.homePage}>
      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION (RICH SAAS GLOW & DYNAMIC EFFECTS)
      ══════════════════════════════════════════════════════════════ */}
      <section
        className={styles.heroSection}
        style={{
          order: getSectionOrder('hero', 10),
          display: isSectionActive('hero') ? undefined : 'none',
        }}
      >
        {/* Ambient Glows, Aurora Waves & Cyber Grid Background */}
        <div className={styles.heroBgWrapper}>
          <div className={styles.auroraGlow} />
          <div className={styles.ambientGlow1} />
          <div className={styles.ambientGlow2} />
          <div className={styles.cyberGrid} />
          <div className={styles.heroOrbitTrack}>
            <div className={styles.orbitRing1} />
            <div className={styles.orbitComet1} />
            <div className={styles.orbitRing2} />
            <div className={styles.orbitComet2} />
          </div>
          <div className={styles.particleSpark1} />
          <div className={styles.particleSpark2} />
        </div>

        <div className={styles.heroContainer}>
          {/* Left Column: Headline & Value Proposition */}
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.badgePulseDot} />
              <RiSparklingFill size={15} color="#ff6b35" className={styles.badgeSparkle} />
              <span className={styles.badgeText}>
                {heroContent?.badge_text || t('hero.badge', 'Nền Tảng AI Gateway & Studio Thế Hệ Mới')}
              </span>
              <span className={styles.badgeArrow}>✨</span>
            </div>

            <h1 className={styles.heroHeadline}>
              <span>{heroContent?.headline_prefix || t('hero.title_1', 'Cổng Điều Phối AI')}</span>
              <br />
              <span className={styles.highlightOrange}>
                {heroContent?.headline_highlight || t('hero.title_highlight', 'Đa Nền Tảng VeloX')}
              </span>
              {heroContent?.headline_suffix && (
                <>
                  <br />
                  <span style={{ fontSize: '0.85em', color: '#f1f5f9' }}>{heroContent.headline_suffix}</span>
                </>
              )}
            </h1>

            <p className={styles.heroSubtitle}>
              {heroContent?.description || (
                <>
                  Kết nối hơn <strong style={{ color: '#ffffff', fontWeight: 700 }}>156+ mô hình AI</strong> từ OpenAI, Claude, Gemini, Midjourney, Runway với chi phí tối ưu nhất. <span style={{ color: '#38bdf8', fontWeight: 600 }}>Một API Key duy nhất cho tất cả</span>.
                </>
              )}
            </p>

            <div className={styles.heroCtas}>
              <Link to={heroContent?.primary_cta_link || '/studio'} className={styles.btnPrimary}>
                <RiOpenaiFill size={19} />
                <span>{heroContent?.primary_cta_text || 'Khám Phá Studio Sáng Tạo'}</span>
                <HiOutlineArrowRight size={16} />
              </Link>
              <Link to={heroContent?.secondary_cta_link || '/docs'} className={styles.btnSecondary}>
                <HiOutlineCodeBracket size={18} />
                <span>{heroContent?.secondary_cta_text || t('hero.cta_docs', 'Xem Tài Liệu API')}</span>
              </Link>
            </div>

            {/* Key Trust Stats (Rich Glassmorphism Cards) */}
            <div className={styles.heroStats}>
              {(Array.isArray(heroContent?.stats) && heroContent.stats.length > 0 ? heroContent.stats : [
                { label: t('stats.models', 'Mô Hình AI'), value: '156+' },
                { label: t('stats.uptime', 'Uptime Sẵn Sàng'), value: '99.9%' },
                { label: 'Tiết Kiệm Cache', value: '80%' },
                { label: 'Độ Trễ Phản Hồi', value: '< 180ms' },
              ]).map((st: any, idx: number) => (
                <div key={idx} className={styles.statCard}>
                  <div className={styles.statCardHeader}>
                    {idx === 0 && <HiOutlineCpuChip size={18} color="#38bdf8" />}
                    {idx === 1 && <HiOutlineShieldCheck size={18} color="#10b981" />}
                    {idx === 2 && <HiOutlineBolt size={18} color="#f59e0b" />}
                    {idx >= 3 && <RiSparklingFill size={17} color="#c084fc" />}
                    <div className={styles.statNumber}>{st.value}</div>
                  </div>
                  <div className={styles.statLabel}>{st.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Studio & Gateway Simulator Widget */}
          <div className={styles.heroWidgetCol}>
            <div className={styles.interactiveCardGlowWrapper}>
              <div className={styles.interactiveCard}>
                <div className={styles.widgetHeaderRow}>
                  <div className={styles.widgetBrandMark}>
                    <div className={styles.widgetDotLive} />
                    <span>VELOX LIVE STUDIO</span>
                    <span className={styles.liveTagPill}>LIVE</span>
                  </div>
                  <div className={styles.widgetCreditBadge}>
                    <RiSparklingFill size={13} />
                    <span>Trừ {currentDemo.creditCost}</span>
                  </div>
                </div>

                {/* Segmented Switcher Tabs */}
                <div className={styles.widgetTabs}>
                  <button
                    type="button"
                    className={`${styles.widgetTabBtn} ${activeMode === 'image' ? styles.active : ''}`}
                    onClick={() => handleModeChange('image')}
                  >
                    <HiOutlinePhoto size={16} />
                    <span>Tạo Ảnh</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.widgetTabBtn} ${activeMode === 'chat' ? styles.active : ''}`}
                    onClick={() => handleModeChange('chat')}
                  >
                    <HiOutlineChatBubbleLeftRight size={16} />
                    <span>Chat AI</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.widgetTabBtn} ${activeMode === 'video' ? styles.active : ''}`}
                    onClick={() => handleModeChange('video')}
                  >
                    <HiOutlineFilm size={16} />
                    <span>Video AI</span>
                  </button>
                </div>

                {/* Interactive Prompt Box */}
                <div className={styles.promptBoxWrapper}>
                  <div className={styles.promptLabelRow}>
                    <span className={styles.promptPillTag}>PROMPT TRỰC QUAN</span>
                    <span className={styles.promptModelTag}>{currentDemo.model}</span>
                  </div>
                  <div className={styles.promptInputMock}>"{currentPrompt}"</div>
                  <div className={styles.promptSuggestions}>
                    {currentDemo.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.promptChip} ${currentPrompt === chip.prompt ? styles.activeChip : ''}`}
                        onClick={() => handleSelectChip(chip)}
                        title="Bấm để xem mẫu này"
                      >
                        {chip.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Preview Frame with Real Media */}
                <div className={styles.previewFrame}>
                  {/* Ambient Blurred Backdrop */}
                  <div
                    className={styles.previewBackdrop}
                    style={{ backgroundImage: `url(${currentImg})` }}
                  />

                  {/* Top Floating Glass Badges */}
                  <div className={styles.floatingPreviewTagLeft}>
                    <span className={styles.greenDotPulse} />
                    <span>AI RENDERED</span>
                  </div>
                  <div className={styles.floatingPreviewTagRight}>
                    <span>⚡ 2.1s • 4K ULTRA HD</span>
                  </div>

                  <img
                    key={currentImg}
                    src={currentImg}
                    alt={currentDemo.model}
                    className={styles.previewImageAnim}
                  />

                  {currentDemo.isVideo && (
                    <div className={styles.videoPlayOverlay}>
                      <div className={styles.videoPlayBtnPulse}>
                        <RiPlayFill size={26} color="#ffffff" />
                      </div>
                    </div>
                  )}

                  <div className={styles.previewOverlay}>
                    <div className={styles.modelBadgeTag}>
                      <RiSparklingFill size={13} color="#2dd4bf" />
                      <span>{currentDemo.model}</span>
                    </div>
                    <div className={styles.resolutionPill}>{currentDemo.resolution}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.widgetActionRow}>
                  <Link
                    to={`/studio?category=${activeMode}`}
                    className={styles.btnWidgetTry}
                  >
                    <RiOpenaiFill size={17} />
                    <span>Thử Ngay Trên Studio</span>
                    <HiOutlineArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. PROVIDERS & FOUNDATIONAL MODELS RIBBON (1 ROW INFINITE MARQUEE)
      ══════════════════════════════════════════════════════════════ */}
      <section
        className={styles.providersSection}
        style={{
          order: getSectionOrder('partners', 20),
          display: isSectionActive('partners') ? undefined : 'none',
        }}
      >
        <div className={styles.providersContainer}>
          <div className={styles.providersHeaderRow}>
            <div className={styles.providersLabel}>
              <span className={styles.livePulseDot} />
              {partnersContent?.caption || t('hero.providers_label', 'Hỗ Trợ Hơn 100+ Mô Hình AI Từ Các Nền Tảng Hàng Đầu')}
            </div>
            <span className={styles.tickerHint}>Cuộn tự động • Rê chuột để tạm dừng</span>
          </div>

          <div className={styles.marqueeTrackWrapper}>
            <div className={styles.marqueeTrack}>
              {[...runningModels, ...runningModels].map((model, idx) => (
                <div key={idx} className={styles.marqueeModelCard}>
                  <div className={styles.marqueeCardTop}>
                    <span className={styles.modelNameText}>{model.name}</span>
                    <span
                      className={styles.modelBadgePill}
                      style={{
                        color: model.badgeColor,
                        borderColor: `${model.badgeColor}55`,
                        background: `${model.badgeColor}18`,
                      }}
                    >
                      {model.badge}
                    </span>
                  </div>
                  <div className={styles.modelDescText}>{model.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. CORE CAPABILITIES (4 PILLARS)
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        className={styles.featuresSection}
        style={{
          order: getSectionOrder('features', 30),
          display: isSectionActive('features') ? undefined : 'none',
        }}
      >
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagBadge}>
            <HiOutlineSparkles size={14} />
            <span>{featuresContent?.badge || 'NĂNG LỰC TOÀN DIỆN'}</span>
          </span>
          <h2 className={styles.sectionHeading}>
            {featuresContent?.title || t('features.title', 'Tại Sao Chọn VeloX AI Gateway?')}
          </h2>
          <p className={styles.sectionSubDesc}>
            {featuresContent?.subtitle ||
              'Hạ tầng Gateway trung gian thông minh kết hợp với Creative Studio đa thể thức, giúp cá nhân và doanh nghiệp tối đa hóa năng suất với chi phí thấp nhất.'}
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles.iconWrapOrange}`}>
              <HiOutlineChatBubbleLeftRight />
            </div>
            <h3 className={styles.featureTitle}>Trò Chuyện & Lập Trình Chuyên Sâu</h3>
            <p className={styles.featureDesc}>
              Truy cập tức thì Claude 3.5 Sonnet, GPT-4o, DeepSeek R1. Hỗ trợ truyền dữ liệu dạng dòng (Streaming SSE), phân tích ngữ cảnh lớn tới 200.000 tokens và thực thi code.
            </p>
            <div className={styles.featureTagsList}>
              <span className={styles.featureTagItem}>Streaming SSE</span>
              <span className={styles.featureTagItem}>Function Calling</span>
              <span className={styles.featureTagItem}>Deep Reasoning</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles.iconWrapMagenta}`}>
              <HiOutlinePhoto />
            </div>
            <h3 className={styles.featureTitle}>Sinh & Biến Đổi Hình Ảnh 4K</h3>
            <p className={styles.featureDesc}>
              Khởi tạo hình ảnh chân thực với FLUX.1 Dev, Midjourney v6.1, DALL-E 3. Hỗ trợ chỉnh sửa ảnh Image-to-Image và ghép nhiều ảnh tham chiếu giữ đồng nhất nhân vật.
            </p>
            <div className={styles.featureTagsList}>
              <span className={styles.featureTagItem}>FLUX.1 Schnell/Dev</span>
              <span className={styles.featureTagItem}>Midjourney v6.1</span>
              <span className={styles.featureTagItem}>Multi-Ref Consistency</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles.iconWrapCyan}`}>
              <HiOutlineFilm />
            </div>
            <h3 className={styles.featureTitle}>Sản Xuất Video Điện Ảnh AI</h3>
            <p className={styles.featureDesc}>
              Biến ý tưởng văn bản và hình ảnh tĩnh thành video điện ảnh chuyển động 60FPS mượt mà qua Runway Gen-3 Alpha, Kling AI và Luma Dream Machine chỉ trong vài phút.
            </p>
            <div className={styles.featureTagsList}>
              <span className={styles.featureTagItem}>Runway Gen-3</span>
              <span className={styles.featureTagItem}>Kling AI Motion</span>
              <span className={styles.featureTagItem}>Text-to-Video</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className={styles.featureCard}>
            <div className={`${styles.featureIconWrap} ${styles.iconWrapEmerald}`}>
              <HiOutlineShieldCheck />
            </div>
            <h3 className={styles.featureTitle}>Smart Pool Gateway & Prompt Cache</h3>
            <p className={styles.featureDesc}>
              Hệ thống tự động xoay vòng API Key dự phòng khi NCC gặp sự cố, tự giải mã Cloudflare Captcha và kích hoạt bộ nhớ đệm Context Caching giúp tiết kiệm tới 80% chi phí.
            </p>
            <div className={styles.featureTagsList}>
              <span className={styles.featureTagItem}>Zero Downtime Failover</span>
              <span className={styles.featureTagItem}>Giảm 80% Phí Cache</span>
              <span className={styles.featureTagItem}>Bảo Mật Chuẩn Doanh Nghiệp</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. CURATED TOP MODELS SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="models"
        className={styles.modelsSection}
        style={{
          order: getSectionOrder('models', 40),
          display: isSectionActive('models') ? undefined : 'none',
        }}
      >
        <div className={styles.modelsContainer}>
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.tagBadge}>
              <HiOutlineCpuChip size={14} />
              <span>{modelsContent?.badge || 'DANH MỤC TIÊU BIỂU'}</span>
            </span>
            <h2 className={styles.sectionHeading}>{modelsContent?.title || 'Khám Phá Các Mô Hình Hàng Đầu'}</h2>
            <p className={styles.sectionSubDesc}>
              {modelsContent?.subtitle ||
                'Bảng giá niêm yết minh bạch theo số lượng Credit thực tế bị trừ. Không phí phát sinh hay duy trì ẩn.'}
            </p>
          </div>

          {/* Filter Category Tabs */}
          <div className={styles.filterTabsRow}>
            {(['ALL', 'CHAT', 'IMAGE', 'VIDEO'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterTabBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'ALL' && 'Tất Cả'}
                {cat === 'CHAT' && 'Trò Chuyện & Code'}
                {cat === 'IMAGE' && 'Tạo Ảnh'}
                {cat === 'VIDEO' && 'Video AI'}
              </button>
            ))}
          </div>

          {/* Models Grid */}
          <div className={styles.modelsGrid}>
            {filteredModels.map((m) => (
              <div key={m.id} className={styles.modelCard}>
                <div>
                  <div className={styles.modelTopRow}>
                    <div className={styles.modelIdentity}>
                      <div className={styles.modelProviderIcon}>
                        {m.category === 'CHAT' && <RiOpenaiFill color="#10a37f" />}
                        {m.category === 'IMAGE' && <HiOutlinePhoto color="#38bdf8" />}
                        {m.category === 'VIDEO' && <HiOutlineFilm color="#c084fc" />}
                      </div>
                      <div className={styles.modelNameWrap}>
                        <span className={styles.modelDisplayName}>{m.name}</span>
                        <span className={styles.modelIdSlug}>{m.id}</span>
                      </div>
                    </div>
                    {m.badge && <span className={styles.modelBadgeHot}>{m.badge}</span>}
                  </div>
                  <p className={styles.modelDesc}>{m.desc}</p>
                </div>

                <div className={styles.modelFooterRow}>
                  <div className={styles.modelPriceBadge}>{m.creditPrice}</div>
                  <Link
                    to={`/studio?model=${m.id}&category=${m.category.toLowerCase()}`}
                    className={styles.btnTryModel}
                  >
                    <span>Mở Studio</span>
                    <HiOutlineArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.viewAllModelsWrap}>
            <Link to={modelsContent?.view_all_link || '/models'} className={styles.btnSecondary}>
              <HiOutlineCommandLine size={17} />
              <span>{modelsContent?.view_all_text || 'Xem Toàn Bộ 100+ Model Trên VeloX'}</span>
              <HiOutlineArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. DEVELOPER INTEGRATION QUICK-START
      ══════════════════════════════════════════════════════════════ */}
      <section
        className={styles.devSection}
        style={{
          order: getSectionOrder('developer', 50),
          display: isSectionActive('developer') ? undefined : 'none',
        }}
      >
        <div className={styles.devGrid}>
          {/* Left: Explanations */}
          <div className={styles.devInfoCol}>
            <span className={styles.tagBadge}>
              <HiOutlineCodeBracket size={14} />
              <span>{devContent?.badge || 'DÀNH CHO LẬP TRÌNH VIÊN'}</span>
            </span>
            <h2 className={styles.sectionHeading}>
              {devContent?.title || 'Tích Hợp Trong 30 Giây Với Chuẩn OpenAI'}
            </h2>
            <p className={styles.sectionSubDesc} style={{ margin: '1rem 0 0 0' }}>
              {devContent?.subtitle || (
                <>
                  Chỉ cần thay đổi <code>baseURL</code> và truyền <code>API Key</code> của VeloX, bạn có thể gọi toàn bộ mô hình Claude, DeepSeek, Gemini, Midjourney mà không phải sửa logic xử lý kết quả.
                </>
              )}
            </p>

            <ul className={styles.devCheckList}>
              <li className={styles.devCheckItem}>
                <HiOutlineCheck size={18} className={styles.checkIcon} />
                <span>Base URL chuẩn quốc tế: <code>https://velox.nexoratech.com.vn/v1</code></span>
              </li>
              <li className={styles.devCheckItem}>
                <HiOutlineCheck size={18} className={styles.checkIcon} />
                <span>Hỗ trợ cả 2 header: <code>Authorization: Bearer</code> và <code>x-api-key</code></span>
              </li>
              <li className={styles.devCheckItem}>
                <HiOutlineCheck size={18} className={styles.checkIcon} />
                <span>Cấu hình 1-click cho các ứng dụng client phổ biến:</span>
              </li>
            </ul>

            <div className={styles.clientBadgesList}>
              <span className={styles.clientBadge}>Cursor IDE</span>
              <span className={styles.clientBadge}>Cline (VS Code)</span>
              <span className={styles.clientBadge}>NextChat</span>
              <span className={styles.clientBadge}>Cherry Studio</span>
              <span className={styles.clientBadge}>LibreChat</span>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Link to="/docs" className={styles.btnPrimary}>
                <HiOutlineCommandLine size={18} />
                <span>Xem Tài Liệu Tích Hợp Kỹ Thuật</span>
              </Link>
            </div>
          </div>

          {/* Right: Code Window */}
          <div className={styles.codeWindowCard}>
            <div className={styles.codeTopBar}>
              <div className={styles.codeWindowDots}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.codeSnippetTabs}>
                <button
                  type="button"
                  className={`${styles.snippetTab} ${codeSnippetTab === 'python' ? styles.active : ''}`}
                  onClick={() => setCodeSnippetTab('python')}
                >
                  Python SDK
                </button>
                <button
                  type="button"
                  className={`${styles.snippetTab} ${codeSnippetTab === 'curl' ? styles.active : ''}`}
                  onClick={() => setCodeSnippetTab('curl')}
                >
                  cURL
                </button>
                <button
                  type="button"
                  className={`${styles.snippetTab} ${codeSnippetTab === 'node' ? styles.active : ''}`}
                  onClick={() => setCodeSnippetTab('node')}
                >
                  Node.js
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(snippetCode)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copiedCode ? '#22c55e' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                }}
              >
                {copiedCode ? <HiOutlineCheck size={14} /> : <HiOutlineDocumentDuplicate size={14} />}
                <span>{copiedCode ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>

            <pre className={styles.codePreBlock}>
              <code>{snippetCode}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. TRANSPARENT PRICING CARDS (DYNAMIC FROM DATABASE)
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="pricing"
        className={styles.pricingSection}
        style={{
          order: getSectionOrder('pricing', 60),
          display: isSectionActive('pricing') ? undefined : 'none',
        }}
      >
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagBadge}>
            <HiOutlineSparkles size={14} />
            <span>{pricingContent?.badge || t('landing.pricing_tag', 'BẢNG GIÁ & HỘI VIÊN')}</span>
          </span>
          <h2 className={styles.sectionHeading}>
            {pricingContent?.title || (pricingTab === 'SUBSCRIPTION'
              ? 'Gói Hội Viên Tháng Tiết Kiệm'
              : 'Nạp Bao Nhiêu, Dùng Bấy Nhiêu')}
          </h2>
          <p className={styles.sectionSubDesc}>
            {pricingContent?.subtitle || (pricingTab === 'SUBSCRIPTION'
              ? t(
                  'landing.sub_heading_sub',
                  'Đầy đủ đặc quyền hội viên, mở khóa 156+ mô hình AI đỉnh cao thế giới và băng thông ưu tiên cao nhất.'
                )
              : t(
                  'landing.sub_heading_topup',
                  'Không bị bó buộc hợp đồng cố định. Tín dụng sử dụng vĩnh viễn không hết hạn, nạp tự động qua VietQR trong 3 giây.'
                ))}
          </p>
        </div>

        {/* Category Tabs Switcher */}
        <div className={styles.pricingTabsWrapper}>
          <div className={styles.pricingCategoryTabs}>
            <button
              type="button"
              className={`${styles.pricingCatTab} ${
                pricingTab === 'SUBSCRIPTION' ? styles.pricingCatTabActive : ''
              }`}
              onClick={() => setPricingTab('SUBSCRIPTION')}
            >
              <HiOutlineSparkles size={16} />
              <span>{t('landing.tab_subscription', 'Gói Hội Viên Tháng (30 Ngày)')}</span>
            </button>
            <button
              type="button"
              className={`${styles.pricingCatTab} ${
                pricingTab === 'TOPUP' ? styles.pricingCatTabActive : ''
              }`}
              onClick={() => setPricingTab('TOPUP')}
            >
              <HiOutlineBolt size={16} />
              <span>{t('landing.tab_topup', 'Nạp Thêm Credit (Pay-as-you-go)')}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div
          className={`${styles.pricingGrid} ${
            pricingTab === 'SUBSCRIPTION' ? styles.gridSubscription : styles.gridTopup
          }`}
        >
          {packages
            .filter((p) =>
              pricingTab === 'SUBSCRIPTION' ? p.category !== 'TOPUP' : p.category === 'TOPUP'
            )
            .sort((a, b) => a.price_vnd - b.price_vnd)
            .map((pkg) => {
              const features = getPackageFeatures(pkg);
              const isSub = pkg.category !== 'TOPUP';

              return (
                <div
                  key={pkg.id}
                  className={`${styles.pricingCard} ${pkg.is_popular ? styles.popular : ''}`}
                >
                  {pkg.is_popular && (
                    <div className={styles.popularBadge}>
                      {pkg.tag_badge || (isSub ? 'KHUYÊN DÙNG' : 'BÁN CHẠY NHẤT')}
                    </div>
                  )}

                  <div>
                    <div className={styles.cardHeaderRow}>
                      <span
                        className={`${styles.tierPill} ${
                          pkg.category === 'ENTERPRISE'
                            ? styles.tierEnterprise
                            : pkg.category === 'PRO'
                            ? styles.tierPro
                            : pkg.category === 'STARTER'
                            ? styles.tierStarter
                            : styles.tierTopup
                        }`}
                      >
                        {pkg.category === 'STARTER'
                          ? 'Starter'
                          : pkg.category === 'PRO'
                          ? 'Pro Studio'
                          : pkg.category === 'ENTERPRISE'
                          ? 'Enterprise'
                          : 'Topup'}
                      </span>
                      <span className={styles.durationPill}>
                        {isSub ? '⏱️ 30 Ngày' : '♾️ Vĩnh Viễn'}
                      </span>
                    </div>

                    <h3 className={styles.planName}>{pkg.name}</h3>
                    <p className={styles.planDesc}>
                      {pkg.description ||
                        (isSub
                          ? 'Mở khóa đặc quyền thành viên và khai thác toàn bộ 156+ AI Models.'
                          : 'Nạp bao nhiêu dùng bấy nhiêu, bảo lưu vĩnh viễn không thời hạn.')}
                    </p>

                    <div className={styles.priceRow}>
                      <span className={styles.priceNumber}>
                        {pkg.price_vnd.toLocaleString('vi-VN')}đ
                      </span>
                      <span className={styles.pricePeriod}>{isSub ? '/ tháng' : '/ lần nạp'}</span>
                      {pkg.bonus_percentage > 0 && (
                        <span className={styles.bonusBadge}>+{pkg.bonus_percentage}% Thưởng</span>
                      )}
                    </div>

                    <div className={styles.planCreditsHighlight}>
                      <RiSparklingFill size={14} />
                      <span>
                        {pkg.credits_given.toLocaleString('vi-VN')} Credits
                        {pkg.bonus_percentage > 0 &&
                          ` (+${Math.round(
                            (pkg.credits_given * pkg.bonus_percentage) / 100
                          ).toLocaleString('vi-VN')} tặng)`}
                      </span>
                    </div>

                    <ul className={styles.planFeaturesList}>
                      {features.map((feat, idx) => (
                        <li key={idx} className={styles.planFeatureItem}>
                          <HiOutlineCheck size={16} className={styles.checkIcon} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={`${styles.btnPlanSelect} ${pkg.is_popular ? styles.popularBtn : ''}`}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    <span>
                      {isSub
                        ? t('landing.subscribe_now', 'Đăng Ký Gói Ngay')
                        : t('landing.topup_now_btn', 'Nạp Ngay Qua VietQR')}
                    </span>
                    <HiOutlineArrowRight size={15} />
                  </button>
                </div>
              );
            })}
        </div>

        {/* Quota & Feature Comparison Link */}
        <div className={styles.comparePlansBanner}>
          <Link to="/subscription" className={styles.compareLink}>
            <HiOutlineSparkles size={16} />
            <span>
              {t(
                'landing.view_comparison',
                'Xem chi tiết so sánh tính năng & hạn ngạch toàn diện tại Trang Quản Lý Gói'
              )}
            </span>
            <HiOutlineArrowRight size={15} />
          </Link>
        </div>

        {/* FAQ List from Admin */}
        {Array.isArray(pricingContent?.faq) && pricingContent.faq.length > 0 && (
          <div style={{ marginTop: '3.5rem', maxWidth: '800px', margin: '3.5rem auto 0' }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.4rem', color: '#f8fafc', marginBottom: '1.5rem' }}>
              Câu Hỏi Thường Gặp (FAQ)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pricingContent.faq.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '0.75rem',
                    padding: '1.1rem 1.35rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                    ❓ {item.q}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. CUSTOMER TESTIMONIALS & REVIEWS
      ══════════════════════════════════════════════════════════════ */}
      <section
        id="testimonials"
        className={styles.testimonialsSection}
        style={{
          order: getSectionOrder('testimonials', 70),
          display: isSectionActive('testimonials') ? undefined : 'none',
        }}
      >
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagBadge}>
            <HiOutlineSparkles size={14} />
            <span>{testimonialsContent?.badge || 'ĐÁNH GIÁ KHÁCH HÀNG'}</span>
          </span>
          <h2 className={styles.sectionHeading}>
            {testimonialsContent?.title || 'Được Tin Dùng Bởi Các Chuyên Gia & Doanh Nghiệp'}
          </h2>
          <p className={styles.sectionSubDesc}>
            {testimonialsContent?.subtitle ||
              'Xem cảm nhận chân thực từ các lập trình viên, designer và doanh nghiệp đang tăng tốc sản phẩm cùng VeloX.'}
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          {(Array.isArray(testimonialsContent?.reviews) && testimonialsContent.reviews.length > 0
            ? testimonialsContent.reviews
            : [
                {
                  name: 'Trần Minh Hoàng',
                  role: 'CTO @ AI Flow Studio',
                  avatar:
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                  quote:
                    'Chuyển sang VeloX AI Gateway giúp chúng tôi cắt giảm 70% chi phí server AI, tốc độ phản hồi cực nhanh và không bao giờ bị nghẽn API.',
                  rating: 5,
                },
                {
                  name: 'Lê Thuỳ Dung',
                  role: 'Lead Visual Designer @ K-Agency',
                  avatar:
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
                  quote:
                    'Creative Studio trên VeloX tập hợp toàn bộ FLUX, Kling và Midjourney trong một nơi. Thao tác siêu mượt và xuất video 4K cực kỳ ấn tượng!',
                  rating: 5,
                },
                {
                  name: 'Đặng Tuấn Anh',
                  role: 'Fullstack AI Engineer @ NextGen',
                  avatar:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                  quote:
                    '100% tương thích OpenAI SDK. Chỉ mất 1 dòng đổi baseURL là xong toàn bộ pipeline cho Cursor và Cline, quá tuyệt vời!',
                  rating: 5,
                },
              ]
          ).map((rev: any, idx: number) => (
            <div key={idx} className={styles.testimonialCard}>
              <div className={styles.testimonialQuote}>"{rev.quote}"</div>
              <div className={styles.testimonialAuthorRow}>
                <img src={rev.avatar} alt={rev.name} className={styles.authorAvatar} />
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{rev.name}</span>
                  <span className={styles.authorRole}>{rev.role}</span>
                </div>
                <div className={styles.authorRating}>{'★'.repeat(rev.rating || 5)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. FINAL ACTION CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section
        className={styles.ctaBannerSection}
        style={{
          order: getSectionOrder('cta_banner', 80),
          display: isSectionActive('cta_banner') ? undefined : 'none',
        }}
      >
        <div className={styles.ctaBannerCard}>
          <div className={styles.tagBadge} style={{ margin: '0 auto 1.5rem' }}>
            <HiOutlineSparkles size={14} />
            <span>{ctaContent?.badge || 'TRẢI NGHIỆM MIỄN PHÍ HÔM NAY'}</span>
          </div>
          <h2 className={styles.ctaTitle}>
            {ctaContent?.title || 'Sẵn Sàng Tăng Tốc Cùng VeloX AI Gateway?'}
          </h2>
          <p className={styles.ctaSubtitle}>
            {ctaContent?.subtitle ||
              'Tạo tài khoản ngay bây giờ để nhận tín dụng trải nghiệm toàn bộ các mô hình AI đỉnh cao thế giới trong một giao diện duy nhất.'}
          </p>
          <div className={styles.ctaButtonsRow}>
            <Link to={ctaContent?.primary_cta_link || '/studio'} className={styles.btnPrimary}>
              <RiOpenaiFill size={18} />
              <span>{ctaContent?.primary_cta_text || 'Bắt Đầu Sáng Tạo Ngay'}</span>
              <HiOutlineArrowRight size={16} />
            </Link>
            <Link to={ctaContent?.secondary_cta_link || '/register'} className={styles.btnSecondary}>
              <span>{ctaContent?.secondary_cta_text || 'Đăng Ký Tài Khoản Mới'}</span>
            </Link>
          </div>
          {ctaContent?.guarantee_text && (
            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              {ctaContent.guarantee_text}
            </div>
          )}
        </div>
      </section>

      {/* Custom Sections from Admin */}
      {landingSections
        .filter((s) => s.section_key.startsWith('custom') && s.is_active)
        .map((sec) => (
          <section
            key={sec.id}
            className={styles.customSection}
            style={{ order: sec.order }}
          >
            <div className={styles.customCard}>
              <h2 className={styles.sectionHeading}>{sec.title}</h2>
              <p className={styles.sectionSubDesc} style={{ margin: '1rem auto' }}>
                {sec.content?.body || sec.content?.headline || ''}
              </p>
            </div>
          </section>
        ))}

      {/* Topup Modal Directly on HomePage */}
      <TopupModal
        isOpen={topupOpen}
        onClose={() => setTopupOpen(false)}
        initialPackageId={selectedPackageId}
      />
    </div>
  );
};

export default HomePage;
