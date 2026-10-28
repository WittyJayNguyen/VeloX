import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineArrowsPointingOut,
  HiOutlinePlay,
  HiOutlineArrowUp,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineBookOpen,
  HiOutlineChevronDown,
  HiOutlineMusicalNote,
  HiOutlineCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { RiSparklingFill } from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { modelService, type PublicModelItem, type ModelConfig } from '@modules/models/services/modelService';
import apiClient from '@modules/core/lib/apiClient';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './StudioPage.module.scss';

export interface GenerationJob {
  id: string;
  type: 'chat' | 'image' | 'video' | 'audio';
  prompt: string;
  model: string;
  progress: number;
  statusText: string;
  aspectRatio: string;
  refImage?: string | null;
}

export interface StudioChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  createdAt: string;
}

export interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  quality?: string;
  createdAt: string;
}

export interface GeneratedVideoItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  poster: string;
  videoUrl?: string;
  duration?: string;
  quality?: string;
  aspectRatio?: string;
  createdAt: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  voice: string;
  duration?: string;
  createdAt: string;
}

export const getFallbackModelConfig = (category: string): ModelConfig => {
  const cat = (category || '').toUpperCase();
  if (cat === 'VIDEO') {
    return {
      durations: ['5s', '10s'],
      resolutions: ['720p', '1080p', '4K'],
      aspectRatios: ['Tự động', '16:9', '9:16', '1:1'],
      defaultDuration: '5s',
      defaultResolution: '1080p',
      defaultAspectRatio: 'Tự động',
    };
  }
  if (cat === 'IMAGE') {
    return {
      resolutions: ['1K', '2K', '4K'],
      aspectRatios: ['Tự động', '1:1', '16:9', '9:16', '4:3', '21:9'],
      qualities: ['Tiêu chuẩn', 'Cao', 'Ultra'],
      defaultResolution: '1K',
      defaultAspectRatio: 'Tự động',
      defaultQuality: 'Cao',
    };
  }
  if (cat === 'AUDIO') {
    return {
      voices: ['English · American', 'English · British', 'Tiếng Việt · Hà Nội', 'Tiếng Việt · Sài Gòn'],
      defaultVoice: 'English · American',
    };
  }
  return {
    tones: ['creative', 'balanced', 'precise'],
    defaultTone: 'balanced',
  };
};

// Preset Prompt Groups per category matching user request mockup exactly
export interface PromptPresetItem {
  title: string;
  prompt: string;
  ratio?: string;
  duration?: string;
}

export interface PromptPresetGroup {
  groupName: string;
  items: PromptPresetItem[];
}

export const PROMPT_PRESET_GROUPS: Record<string, PromptPresetGroup[]> = {
  chat: [
    {
      groupName: 'LẬP TRÌNH & CÔNG NGHỆ',
      items: [
        {
          title: 'Viết code và giải thuật tối ưu',
          prompt: 'Hãy giúp tôi xây dựng hàm tối ưu hóa thuật toán và phân tích độ phức tạp thời gian/không gian chi tiết.',
        },
        {
          title: 'Thiết kế kiến trúc hệ thống phân tán',
          prompt: 'Đề xuất kiến trúc Microservices có khả năng mở rộng cao, chịu tải 100k RPS và cơ chế caching đa tầng.',
        },
        {
          title: 'Debug và rà soát bảo mật mã nguồn',
          prompt: 'Hãy phân tích đoạn mã sau, tìm các lỗ hổng tiềm ẩn (memory leak, injection, race condition) và hướng dẫn cách khắc phục.',
        },
      ],
    },
    {
      groupName: 'SÁNG TẠO & MARKETING',
      items: [
        {
          title: 'Kịch bản video ngắn triệu view',
          prompt: 'Viết kịch bản video ngắn 45 giây cho TikTok/Reels giới thiệu công cụ AI với câu hook thu hút trong 3 giây đầu.',
        },
        {
          title: 'Chiến lược Marketing Go-To-Market',
          prompt: 'Lập kế hoạch chiến dịch ra mắt sản phẩm công nghệ 30 ngày, bao gồm kênh truyền thông, thông điệp chính và KPI.',
        },
        {
          title: 'Soạn email thuyết phục đối tác B2B',
          prompt: 'Soạn thảo email đề xuất hợp tác kinh doanh B2B chuyên nghiệp, lịch sự, nêu bật giá trị cốt lõi và kêu gọi hành động rõ ràng.',
        },
      ],
    },
  ],
  image: [
    {
      groupName: 'TẠO ẢNH',
      items: [
        {
          title: 'Chân dung studio với ánh sáng điện ảnh',
          prompt: 'Masterpiece studio portrait photography, Rembrandt dramatic lighting, 85mm f/1.4 lens, natural skin texture, masterpiece, 8k resolution, photorealistic',
          ratio: '1:1',
        },
        {
          title: 'Phong cảnh siêu thực',
          prompt: 'Surreal dreamlike ethereal landscape with floating islands, glowing bioluminescent crystal waterfalls, aurora borealis night sky, wide angle, 8k render',
          ratio: '16:9',
        },
        {
          title: 'Sản phẩm trên bề mặt được tạo kiểu',
          prompt: 'Commercial luxury product photography on a styled minimalist podium, gentle water ripple reflections, studio softbox diffused rim light, award-winning advertising',
          ratio: '1:1',
        },
        {
          title: 'Nhân vật 3D có cá tính',
          prompt: 'Expressive 3D stylized character design, cute cybernetic companion, vibrant Pixar animation style, rich subsurface scattering, octane 3d render',
          ratio: '1:1',
        },
      ],
    },
    {
      groupName: 'NÂNG CAO & KHÔI PHỤC ẢNH',
      items: [
        {
          title: 'Làm sắc nét và sửa mờ',
          prompt: 'Ultra-sharp high-definition image enhancement, crisp edge details, clear focus recovery, noise reduction, studio pristine clarity 8k',
          ratio: '1:1',
        },
        {
          title: 'Phóng to lên 4K',
          prompt: 'Super-resolution 4K upscaled fidelity, hyper-detailed micro textures, pristine sharpness, photographic clarity',
          ratio: '16:9',
        },
        {
          title: 'Khôi phục ảnh cổ điển',
          prompt: 'Vintage archival photograph full restoration, vivid natural realistic colorization, scratch repair, balanced dynamic range',
          ratio: '1:1',
        },
      ],
    },
  ],
  video: [
    {
      groupName: 'TẠO VIDEO TỪ VĂN BẢN',
      items: [
        {
          title: 'Chuyển động máy quay điện ảnh Slow-motion',
          prompt: 'Cinematic slow-motion 120fps camera orbit around an athlete in a moody modern gym, volumetric neon light, floating chalk dust, 4k ultra-realistic',
          duration: '5s',
          ratio: '16:9',
        },
        {
          title: 'Flycam bay lướt qua phong cảnh thiên nhiên',
          prompt: 'Breathtaking FPV drone flyover across majestic misty mountain peaks, golden sunrise light, cinematic smooth aerial photography',
          duration: '5s',
          ratio: '16:9',
        },
        {
          title: 'Diễn hoạt nhân vật chuyển động tự nhiên',
          prompt: 'Natural fluid character animation, walking through bustling futuristic cyberpunk city street, neon rain reflections, photorealistic 60fps',
          duration: '6s',
          ratio: '16:9',
        },
        {
          title: 'Hiệu ứng kỹ xảo biến đổi hạt điện quang',
          prompt: 'Explosive kinetic visual effects, particle simulation dissolving into glowing golden energy sparks, dramatic cinematic trailer sequence',
          duration: '5s',
          ratio: '16:9',
        },
      ],
    },
    {
      groupName: 'VIDEO SẢN PHẨM & QUẢNG CÁO',
      items: [
        {
          title: 'Giới thiệu sản phẩm 3D xoay 360 độ',
          prompt: 'High-end commercial 3D product turntable showcase, luxury smartwatch rotating gracefully on dark reflective marble, dramatic studio lighting',
          duration: '5s',
          ratio: '1:1',
        },
        {
          title: 'Video thể thao hành động tốc độ cao',
          prompt: 'High-speed athletic sports commercial, sprinter exploding off starting blocks, muscle tension, water splash slow-motion, dynamic low-angle shot',
          duration: '6s',
          ratio: '16:9',
        },
        {
          title: 'Video cinematic teaser âm hưởng tương lai',
          prompt: 'Cinematic movie teaser opening shot, spacecraft descending over a mysterious alien metropolis, volumetric clouds, epic anamorphic widescreen',
          duration: '10s',
          ratio: '16:9',
        },
      ],
    },
  ],
  audio: [
    {
      groupName: 'GIỌNG ĐỌC KỂ CHUYỆN & SÁCH NÓI',
      items: [
        {
          title: 'Giọng trầm ấm truyền cảm kể chuyện đêm khuya',
          prompt: 'Đêm đã về khuya, không gian lắng đọng và bình yên. Hãy thả lỏng tâm trí, hít một hơi thật sâu và cùng lắng nghe những câu chuyện nhẹ nhàng của tâm hồn...',
        },
        {
          title: 'Giọng truyền cảm hứng, động lực phát triển bản thân',
          prompt: 'Mỗi buổi sáng thức dậy là một cơ hội mới để bạn chạm tới phiên bản vĩ đại nhất của chính mình. Đừng bao giờ từ bỏ ước mơ, kiên trì bứt phá mọi giới hạn!',
        },
        {
          title: 'Đọc thơ và podcast thư giãn nhẹ nhàng',
          prompt: 'Gió nhẹ vương qua từng tán lá, những thanh âm êm đềm của buổi sớm mai như xua tan mọi mỏi mệt trong cuộc sống xô bồ...',
        },
      ],
    },
    {
      groupName: 'LỒNG TIẾNG & DOANH NGHIỆP',
      items: [
        {
          title: 'Giọng lồng tiếng TVC quảng cáo chuyên nghiệp',
          prompt: 'VeloX AI Gateway — Đỉnh cao công nghệ trí tuệ nhân tạo, giải pháp bứt phá hiệu suất toàn diện cho doanh nghiệp thế hệ mới.',
        },
        {
          title: 'Lời chào tổng đài và giới thiệu thương hiệu',
          prompt: 'Kính chào quý khách đã gọi đến trung tâm chăm sóc khách hàng VeloX. Vui lòng nhấn phím 1 để gặp bộ phận kỹ thuật, hoặc phím 2 để được tư vấn dịch vụ.',
        },
        {
          title: 'Bản tin công nghệ và tài chính nhịp điệu nhanh',
          prompt: 'Bản tin công nghệ hôm nay: Trí tuệ nhân tạo VeloX chính thức nâng cấp hạ tầng xử lý thời gian thực với độ trễ siêu thấp dưới 300 mili-giây.',
        },
      ],
    },
  ],
};

// Preset Prompts for "Inspire Me" categorized by mode
export const INSPIRATION_PROMPTS_BY_TAB: Record<'chat' | 'image' | 'video' | 'audio', string[]> = {
  chat: [
    'Giải thích nguyên lý hoạt động của Mạng nơ-ron Transformer một cách trực quan và dễ hiểu nhất',
    'Viết kịch bản video ngắn 60 giây giới thiệu giải pháp AI sáng tạo hình ảnh & video thế hệ mới',
    'Tối ưu hóa đoạn mã SQL query phức tạp để cải thiện hiệu năng cơ sở dữ liệu lớn',
    'Lập kế hoạch chiến lược Content Marketing 30 ngày cho startup công nghệ B2B',
    'Viết bài luận phân tích tác động của Trí tuệ nhân tạo đối với thị trường lao động toàn cầu',
    'Thiết kế kiến trúc hệ thống Microservices xử lý 100.000 requests/giây bằng Go và Redis',
  ],
  image: [
    'Chân dung studio điện ảnh 8K, ánh sáng Rembrandt mềm mại, ống kính 85mm f/1.4',
    'Phong cảnh viễn tưởng huyền ảo với những hòn đảo bay lơ lửng và thác nước pha lê phát quang',
    'Hình chụp macro hoa sen pha lê phát sáng lung linh trong sương sớm, chi tiết 8K cực nét',
    'Chiến binh Bắc Âu dũng mãnh với hình xăm cổ ngữ rực sáng trong bão tuyết bí ẩn',
    'Sản phẩm công nghệ tương lai tối giản trên bục đá cẩm thạch đen phản chiếu gợn nước',
    'Tạo hình nhân vật 3D phong cách hoạt hình Pixar đáng yêu, hiệu ứng ánh sáng Octane Render',
  ],
  video: [
    'Máy quay điện ảnh 120fps quay slow-motion lướt quanh vận động viên thể thao trong phòng tập neon hiện đại',
    'Flycam FPV bay lượn ngoạn mục qua những đỉnh núi mù sương đón ánh bình minh vàng rực rỡ',
    'Nhân vật bước đi tự nhiên qua con phố cyberpunk tương lai dưới ánh đèn neon phản chiếu mặt đường ướt mưa',
    'Mô hình sản phẩm 3D xoay 360 độ siêu nét trên mặt bàn bóng bẩy, ánh sáng studio sang trọng',
    'Hiệu ứng kỹ xảo biến đổi hạt năng lượng vàng tan biến vào không gian đầy kịch tính',
    'Xe thể thao phong cách Synthwave thập niên 80 lao vút trên xa lộ laser hướng về phía hoàng hôn',
  ],
  audio: [
    'Giọng đọc nam trầm ấm truyền cảm, phong cách kể chuyện podcast thư giãn đêm khuya',
    'Giọng nữ truyền cảm hứng, năng lượng tích cực lan tỏa động lực bứt phá giới hạn bản thân',
    'Lời chào tổng đài chuyên nghiệp: Chào mừng quý khách đến với dịch vụ trí tuệ nhân tạo VeloX',
    'Bản tin công nghệ nhịp điệu nhanh, rõ ràng, phát âm chuẩn xác từng thuật ngữ',
    'Giọng đọc lồng tiếng TVC quảng cáo thương mại cao cấp, sang trọng và đầy thuyết phục',
    'Đọc thơ nhẹ nhàng, êm đềm với ngữ điệu sâu lắng chạm vào cảm xúc người nghe',
  ],
};

export const generateSimulatedChatResponse = (userQuery: string, modelName: string): string => {
  const queryLower = userQuery.toLowerCase();
  if (queryLower.includes('code') || queryLower.includes('lập trình') || queryLower.includes('sql') || queryLower.includes('python') || queryLower.includes('react')) {
    return `Tuyệt vời! Dưới đây là giải pháp kỹ thuật tối ưu do **${modelName}** đề xuất:

\`\`\`typescript
// Solution generated with ${modelName}
export async function optimizeWorkflow(payload: Record<string, any>) {
  try {
    const startTime = performance.now();
    // Cache layer & async execution
    const result = await processPipeline(payload);
    console.log(\`Execution time: \${(performance.now() - startTime).toFixed(2)}ms\`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Workflow error:', error);
    throw error;
  }
}
\`\`\`

**Điểm nổi bật của phương án này:**
1. **Hiệu năng cao:** Tối ưu hóa bộ nhớ đệm, giảm tới 65% thời gian phản hồi.
2. **Khả năng mở rộng:** Thiết kế dạng module độc lập, dễ dàng tích hợp vào hệ thống hiện tại.
3. **Bảo mật & Ổn định:** Bổ sung cơ chế xử lý ngoại lệ và logging chi tiết.

Bạn có muốn tôi phát triển thêm chức năng nào khác cho module này không?`;
  }

  if (queryLower.includes('kịch bản') || queryLower.includes('marketing') || queryLower.includes('tiktok') || queryLower.includes('viết bài')) {
    return `Chào bạn! Dưới đây là dàn ý kịch bản sáng tạo được thiết kế bởi **${modelName}**:

🎬 **KỊCH BẢN NỘI DUNG VIRAL:**

**1. Hook (0s - 3s):**
> *"Bạn có biết 90% nhà sáng tạo nội dung đang lãng phí hàng giờ mỗi ngày vào việc này không?"*

**2. Đặt vấn đề & Khơi gợi tò mò (3s - 15s):**
> Phân cảnh thể hiện sự bế tắc khi phải ngồi suy nghĩ ý tưởng hàng giờ mà sản phẩm vẫn không đạt như kỳ vọng.

**3. Giới thiệu giải pháp đột phá (15s - 45s):**
> Giới thiệu công cụ AI VeloX với khả năng sinh nội dung, hình ảnh và video chỉ sau vài giây chỉ bằng 1 câu lệnh ngắn gọn.

**4. Kêu gọi hành động - Call to Action (45s - 60s):**
> *"Trải nghiệm ngay hôm nay để đón đầu xu hướng sáng tạo tương lai!"*

Bạn muốn điều chỉnh phong cách dí dỏm, năng động hay mang tính chuyên gia học thuật?`;
  }

  return `Chào bạn! Cảm ơn bạn đã đặt câu hỏi. Dưới đây là phản hồi chi tiết từ **${modelName}**:

1. **Phân tích tổng quan:**
Yêu cầu của bạn đã được tiếp nhận và phân tích toàn diện. Vấn đề này có thể tiếp cận theo hướng tối ưu hóa quy trình kết hợp công nghệ hiện đại nhằm đạt kết quả cao nhất.

2. **Các bước thực thi cụ thể:**
- **Bước 1:** Xác định mục tiêu trọng tâm và tiêu chí đánh giá thành công.
- **Bước 2:** Chuẩn bị dữ liệu đầu vào và các ràng buộc kỹ thuật.
- **Bước 3:** Tiến hành thử nghiệm quy mô nhỏ, đo lường chỉ số phản hồi và tinh chỉnh.
- **Bước 4:** Triển khai diện rộng với hệ thống giám sát tự động.

3. **Khuyến nghị từ chuyên gia:**
Luôn duy trì tính linh hoạt và kiểm tra định kỳ để hệ thống thích ứng tốt nhất với sự thay đổi của môi trường.

Nếu bạn cần phân tích sâu hơn ở khía cạnh cụ thể nào, hãy cho tôi biết nhé!`;
};

// Clean redundant provider prefixes from model display names
export const cleanModelDisplayName = (name: string): string => {
  if (!name) return '';
  return name.replace(/^OpenAI\s+/i, '').replace(/^Google\s+/i, '').trim();
};

// 4-Bar Sound Wave Icon (1:1 with Krea/Audio mockup)
export const SoundWaveIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="1.5" y="5" width="2" height="6" rx="1" />
    <rect x="5.5" y="2" width="2" height="12" rx="1" />
    <rect x="9.5" y="4" width="2" height="8" rx="1" />
    <rect x="13.5" y="6" width="2" height="4" rx="1" />
  </svg>
);

const normalizeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const matchModelCode = (rawCode: string, list: PublicModelItem[]): PublicModelItem | null => {
  if (!rawCode || list.length === 0) return null;
  // 1. Exact match
  const exact = list.find((m) => m.model_code.toLowerCase() === rawCode.toLowerCase());
  if (exact) return exact;

  // 2. Normalized match (e.g. runwaygen3 vs runwaygen3alpha)
  const normTarget = normalizeKey(rawCode);
  const normMatch = list.find((m) => {
    const normM = normalizeKey(m.model_code);
    return normM.includes(normTarget) || normTarget.includes(normM);
  });
  if (normMatch) return normMatch;

  // 3. Name match (e.g. Runway Gen-3)
  const nameMatch = list.find((m) => {
    const normName = normalizeKey(m.name);
    return normName.includes(normTarget) || normTarget.includes(normName);
  });
  if (nameMatch) return nameMatch;

  return null;
};

export const translateParamOption = (val: string, tFn: any) => {
  if (!val) return '';
  if (val === 'Tự động' || val === 'Auto') return tFn('studio.auto', 'Tự động');
  if (val === 'Tiêu chuẩn' || val === 'Standard') return tFn('studio.standard', 'Tiêu chuẩn');
  if (val === 'Cao' || val === 'High') return tFn('studio.high', 'Cao');
  if (val === 'Ultra') return tFn('studio.ultra', 'Ultra');
  return val;
};

export const StudioPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, syncProfile, updateUser, addCredits } = useAuthStore();

  // Enforce authentication: Must be logged in to enter VeloX Studio
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    } else {
      syncProfile().catch(() => {});
    }
  }, [isAuthenticated, navigate, location.pathname, location.search, syncProfile]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const urlCategory = searchParams.get('category') as 'chat' | 'image' | 'video' | 'audio' | null;

  // Studio Mode: 'chat' | 'image' | 'video' | 'audio'
  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video' | 'audio'>(urlCategory || 'image');
  const [dbModels, setDbModels] = useState<PublicModelItem[]>([]);
  const [selectedModelCode, setSelectedModelCode] = useState<string>(
    urlCategory === 'chat' ? 'gpt-4o' : 'gpt-image-2.5-sunburst'
  );
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI thông minh trên VeloX Studio. Bạn cần hỗ trợ viết bài, phân tích tài liệu, lập trình, giải quyết vấn đề toán học hay lên ý tưởng sáng tạo hôm nay?',
      model: 'GPT-4o (Omni)',
      createdAt: 'Vừa xong',
    },
  ]);
  const [chatTone, setChatTone] = useState<'creative' | 'balanced' | 'precise'>('balanced');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Popover Menus
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const [isParamsMenuOpen, setIsParamsMenuOpen] = useState<boolean>(false);
  const [isPresetsMenuOpen, setIsPresetsMenuOpen] = useState<boolean>(false);
  const [isInspireMenuOpen, setIsInspireMenuOpen] = useState<boolean>(false);
  const [isSpeechRecording, setIsSpeechRecording] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Media Slots for Image / Video
  const [refImage, setRefImage] = useState<string | null>(null);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [audioTrack, setAudioTrack] = useState<string | null>(null);

  // Advanced Generation Settings
  const [resolution, setResolution] = useState<string>('1K');
  const [videoResolution, setVideoResolution] = useState<string>('1080p');
  const [videoDuration, setVideoDuration] = useState<string>('5s');
  const [aspectRatio, setAspectRatio] = useState<string>('Tự động');
  const [quality, setQuality] = useState<string>('Cao');
  const [audioVoice, setAudioVoice] = useState<string>('English · American');

  // Active generating jobs
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);

  // Modal preview
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video' | 'audio';
    url: string;
    videoUrl?: string;
    poster?: string;
    title: string;
    prompt: string;
    model: string;
  } | null>(null);

  // Results state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      prompt: 'A powerful athlete training in modern dark neon gym, cinematic lighting, 8k resolution',
      model: 'Midjourney v6.1',
      aspectRatio: '1:1',
      quality: 'Ultra 4K',
      createdAt: 'Vừa xong',
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      prompt: 'Futuristic AI fitness laboratory with holograms and dynamic pulse tracking',
      model: 'FLUX.1 [dev/pro]',
      aspectRatio: '16:9',
      quality: 'HD 2K',
      createdAt: '5 phút trước',
    },
    {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
      prompt: 'Hyper-detailed cyber trainer with glowing kinetic energy aura in high-tech studio',
      model: 'DALL-E 3 Ultra',
      aspectRatio: '9:16',
      quality: 'Standard',
      createdAt: '12 phút trước',
    },
    {
      id: 'img-4',
      url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
      prompt: 'Elite crossfit workout session under dramatic moody stadium floodlights',
      model: 'Midjourney v6.1',
      aspectRatio: '1:1',
      quality: 'Ultra 4K',
      createdAt: '25 phút trước',
    },
  ]);

  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([
    {
      id: 'vid-1',
      title: 'Cinematic Gym Motivation 4K',
      prompt: 'Hyper-realistic video of athlete running through neon rain city, smooth slow-motion camera orbit',
      model: 'Runway Gen-3 Alpha',
      poster: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-41315-large.mp4',
      duration: '5s',
      quality: '1080p FHD',
      aspectRatio: '16:9',
      createdAt: 'Hôm nay',
    },
    {
      id: 'vid-2',
      title: 'Dynamic Fitness Motion Slowmo',
      prompt: 'Explosive battle rope training with particles of chalk floating in golden hour light',
      model: 'Minimax Video-01',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-warm-up-exercises-on-a-yoga-mat-41314-large.mp4',
      duration: '6s',
      quality: '720p HD',
      aspectRatio: '16:9',
      createdAt: 'Hôm qua',
    },
  ]);

  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudioItem[]>([
    {
      id: 'aud-1',
      title: 'Giọng trầm ấm truyền cảm kể chuyện đêm khuya',
      prompt: 'Đêm đã về khuya, không gian lắng đọng và bình yên. Hãy thả lỏng tâm trí, hít một hơi thật sâu...',
      model: 'Eleven v3',
      voice: 'Tiếng Việt · Hà Nội',
      duration: '0:24',
      createdAt: '10 phút trước',
    },
    {
      id: 'aud-2',
      title: 'Giọng truyền cảm hứng, động lực phát triển bản thân',
      prompt: 'Mỗi buổi sáng thức dậy là một cơ hội mới để bạn chạm tới phiên bản vĩ đại nhất của chính mình...',
      model: 'OpenAI TTS HD',
      voice: 'Tiếng Việt · Sài Gòn',
      duration: '0:18',
      createdAt: '1 giờ trước',
    },
  ]);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [textareaShake, setTextareaShake] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load models dynamically from Admin Database via API
  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      try {
        const data = await modelService.getPublicModels();
        if (isMounted && data && data.length > 0) {
          setDbModels(data);
        }
      } catch (err) {
        console.error('Failed to load database models for studio:', err);
      }
    };
    fetchModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and merge models for current active tab (Both DB models and standard creative models)
  const availableModels = useMemo(() => {
    if (activeTab === 'chat') {
      const dbChatModels = dbModels.filter((m) => m.category?.toUpperCase() === 'CHAT' || m.category?.toUpperCase() === 'TEXT');
      const standardChatModels: PublicModelItem[] = [
        { id: 'chat-std-1', name: 'GPT-4o (Omni)', model_code: 'gpt-4o', provider: 'OpenAI', selling_credit_price: 15, category: 'CHAT', is_available: true, input_credit_price: 15, output_credit_price: 15, cache_read_credit_price: 5 },
        { id: 'chat-std-2', name: 'Claude 3.5 Sonnet', model_code: 'claude-3-5-sonnet', provider: 'Anthropic', selling_credit_price: 18, category: 'CHAT', is_available: true, input_credit_price: 18, output_credit_price: 18, cache_read_credit_price: 6 },
        { id: 'chat-std-3', name: 'Gemini 1.5 Pro', model_code: 'gemini-1-5-pro', provider: 'Google DeepMind', selling_credit_price: 12, category: 'CHAT', is_available: true, input_credit_price: 12, output_credit_price: 12, cache_read_credit_price: 4 },
        { id: 'chat-std-4', name: 'DeepSeek-R1', model_code: 'deepseek-r1', provider: 'DeepSeek', selling_credit_price: 10, category: 'CHAT', is_available: true, input_credit_price: 10, output_credit_price: 10, cache_read_credit_price: 3 },
        { id: 'chat-std-5', name: 'Llama 3.3 (70B)', model_code: 'llama-3-3-70b', provider: 'Meta AI', selling_credit_price: 6, category: 'CHAT', is_available: true, input_credit_price: 6, output_credit_price: 6, cache_read_credit_price: 2 },
      ];
      const map = new Map<string, PublicModelItem>();
      standardChatModels.forEach((m) => map.set(m.model_code, m));
      dbChatModels.forEach((m) => {
        if (!map.has(m.model_code)) {
          map.set(m.model_code, m);
        }
      });
      return Array.from(map.values());
    }

    if (activeTab === 'image') {
      const dbImageModels = dbModels.filter((m) => m.category?.toUpperCase() === 'IMAGE');
      const standardImageModels: PublicModelItem[] = [
        { id: 'img-std-1', name: 'GPT Image 2.5 Sunburst', model_code: 'gpt-image-2.5-sunburst', provider: 'OpenAI', selling_credit_price: 35, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-2', name: 'FLUX.1 [dev/pro]', model_code: 'flux-1-dev', provider: 'Black Forest Labs', selling_credit_price: 25, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-3', name: 'Midjourney v6.1 Ultra', model_code: 'midjourney-v6.1', provider: 'Midjourney', selling_credit_price: 45, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-3b', name: 'Midjourney v6.1', model_code: 'midjourney-v6', provider: 'Midjourney', selling_credit_price: 35, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-4', name: 'DALL-E 3 Ultra', model_code: 'dall-e-3', provider: 'OpenAI', selling_credit_price: 30, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-5', name: 'Stable Diffusion 3.5 Large', model_code: 'sd-3-5-large', provider: 'Stability AI', selling_credit_price: 20, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      ];
      const map = new Map<string, PublicModelItem>();
      standardImageModels.forEach((m) => map.set(m.model_code, m));
      dbImageModels.forEach((m) => map.set(m.model_code, m));
      return Array.from(map.values());
    }

    if (activeTab === 'video') {
      const dbVideoModels = dbModels.filter((m) => m.category?.toUpperCase() === 'VIDEO');
      const standardVideoModels: PublicModelItem[] = [
        { id: 'vid-std-1', name: 'Seedance 2.5', model_code: 'seedance-2.5', provider: 'ByteDance', selling_credit_price: 80, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-2', name: 'Runway Gen-3 Alpha', model_code: 'runway-gen3', provider: 'Runway', selling_credit_price: 80, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-2b', name: 'Runway Gen-3 Alpha', model_code: 'runway-gen3-alpha', provider: 'Runway', selling_credit_price: 80, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-3', name: 'Minimax Video-01', model_code: 'minimax-video-01', provider: 'MiniMax', selling_credit_price: 65, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-4', name: 'Kling AI v1.5 Pro', model_code: 'kling-ai-1-5', provider: 'Kuaishou', selling_credit_price: 75, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-4b', name: 'Kling AI v1.5 Pro', model_code: 'kling-v1.5-pro', provider: 'Kuaishou', selling_credit_price: 75, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-6', name: 'Luma Dream Machine 1.5', model_code: 'luma-dream-machine', provider: 'Luma AI', selling_credit_price: 70, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-5', name: 'Grok Imagine Video 1.5', model_code: 'grok-imagine-video-1.5', provider: 'OpenAI', selling_credit_price: 18, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      ];
      const map = new Map<string, PublicModelItem>();
      standardVideoModels.forEach((m) => map.set(m.model_code, m));
      dbVideoModels.forEach((m) => {
        if (!map.has(m.model_code)) {
          map.set(m.model_code, m);
        }
      });
      return Array.from(map.values());
    }

    // Audio Mode: strictly audio models
    const dbAudioModels = dbModels.filter((m) => m.category?.toUpperCase() === 'AUDIO');
    const standardAudioModels: PublicModelItem[] = [
      { id: 'aud-std-1', name: 'Eleven v3', model_code: 'eleven-multilingual-v3', provider: 'ElevenLabs', selling_credit_price: 15, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      { id: 'aud-std-2', name: 'OpenAI TTS HD', model_code: 'tts-1-hd', provider: 'OpenAI', selling_credit_price: 20, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      { id: 'aud-std-3', name: 'Chatterbox Turbo', model_code: 'chatterbox-turbo', provider: 'Meta', selling_credit_price: 10, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
    ];
    const map = new Map<string, PublicModelItem>();
    standardAudioModels.forEach((m) => map.set(m.model_code, m));
    dbAudioModels.forEach((m) => map.set(m.model_code, m));
    return Array.from(map.values());
  }, [activeTab, dbModels]);

  // Unified sync from URL searchParams (handles menu clicks with instant mapping)
  useEffect(() => {
    const paramCategory = searchParams.get('category');
    const paramModel = searchParams.get('model');

    if (paramCategory && (paramCategory === 'chat' || paramCategory === 'image' || paramCategory === 'video' || paramCategory === 'audio')) {
      setActiveTab((prev) => (prev !== paramCategory ? paramCategory : prev));
    }

    if (paramModel && availableModels.length > 0) {
      const matched = matchModelCode(paramModel, availableModels);
      if (matched) {
        setSelectedModelCode(matched.model_code);
      }
    }
  }, [searchParams]);

  // Ensure selectedModelCode is always valid for the active available models list
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.some((m) => m.model_code === selectedModelCode)) {
      setSelectedModelCode(availableModels[0].model_code);
    }
  }, [availableModels, selectedModelCode]);

  // Tab switch handler that automatically picks the right primary model and updates URL
  const handleTabChange = (newTab: 'chat' | 'image' | 'video' | 'audio') => {
    setActiveTab(newTab);
    setIsModelMenuOpen(false);
    setIsParamsMenuOpen(false);
    setIsInspireMenuOpen(false);

    // Sync URL search params cleanly without reload
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('category', newTab);
      next.delete('model');
      return next;
    }, { replace: true });

    if (newTab === 'chat') {
      setSelectedModelCode('gpt-4o');
    } else if (newTab === 'image') {
      setSelectedModelCode('gpt-image-2.5-sunburst');
    } else if (newTab === 'video') {
      setSelectedModelCode('seedance-2.5');
    } else if (newTab === 'audio') {
      setSelectedModelCode('eleven-multilingual-v3');
    }
  };

  const currentModel = useMemo(() => {
    return availableModels.find((m) => m.model_code === selectedModelCode) || availableModels[0];
  }, [availableModels, selectedModelCode]);

  // Model-specific capabilities & configs dynamically loaded from Admin DB
  const activeModelConfig = useMemo<ModelConfig>(() => {
    const dbConfig = currentModel?.config;
    const fallback = getFallbackModelConfig(currentModel?.category || activeTab);
    if (dbConfig && typeof dbConfig === 'object' && Object.keys(dbConfig).length > 0) {
      return {
        durations: Array.isArray(dbConfig.durations) && dbConfig.durations.length > 0 ? dbConfig.durations : fallback.durations,
        resolutions: Array.isArray(dbConfig.resolutions) && dbConfig.resolutions.length > 0 ? dbConfig.resolutions : fallback.resolutions,
        aspectRatios: Array.isArray(dbConfig.aspectRatios) && dbConfig.aspectRatios.length > 0 ? dbConfig.aspectRatios : fallback.aspectRatios,
        qualities: Array.isArray(dbConfig.qualities) && dbConfig.qualities.length > 0 ? dbConfig.qualities : fallback.qualities,
        voices: Array.isArray(dbConfig.voices) && dbConfig.voices.length > 0 ? dbConfig.voices : fallback.voices,
        tones: Array.isArray(dbConfig.tones) && dbConfig.tones.length > 0 ? dbConfig.tones : fallback.tones,
        defaultDuration: dbConfig.defaultDuration || fallback.defaultDuration,
        defaultResolution: dbConfig.defaultResolution || fallback.defaultResolution,
        defaultAspectRatio: dbConfig.defaultAspectRatio || fallback.defaultAspectRatio,
        defaultQuality: dbConfig.defaultQuality || fallback.defaultQuality,
        defaultVoice: dbConfig.defaultVoice || fallback.defaultVoice,
        defaultTone: dbConfig.defaultTone || fallback.defaultTone,
      };
    }
    return fallback;
  }, [currentModel, activeTab]);

  // Auto-map parameters whenever selected model or active tab changes
  useEffect(() => {
    if (activeTab === 'video') {
      const allowedDurations = activeModelConfig.durations || ['5s', '10s'];
      if (!allowedDurations.includes(videoDuration)) {
        setVideoDuration(activeModelConfig.defaultDuration || allowedDurations[0]);
      }
      const allowedResolutions = activeModelConfig.resolutions || ['720p', '1080p'];
      if (!allowedResolutions.includes(videoResolution)) {
        setVideoResolution(activeModelConfig.defaultResolution || allowedResolutions[0]);
      }
      const allowedRatios = activeModelConfig.aspectRatios || ['Tự động', '16:9', '9:16'];
      if (!allowedRatios.includes(aspectRatio)) {
        setAspectRatio(activeModelConfig.defaultAspectRatio || '16:9');
      }
    } else if (activeTab === 'image') {
      const allowedResolutions = activeModelConfig.resolutions || ['1K', '2K'];
      if (!allowedResolutions.includes(resolution)) {
        setResolution(activeModelConfig.defaultResolution || allowedResolutions[0]);
      }
      const allowedQualities = activeModelConfig.qualities || ['Tiêu chuẩn', 'Cao'];
      if (quality && !allowedQualities.includes(quality)) {
        setQuality(activeModelConfig.defaultQuality || allowedQualities[0]);
      }
    }
  }, [selectedModelCode, activeTab, activeModelConfig]);

  // Compute Credits Needed & User Credit Sufficiency
  const totalCreditsNeeded = currentModel?.selling_credit_price || (activeTab === 'chat' ? 15 : activeTab === 'image' ? 35 : activeTab === 'video' ? 80 : 15);
  const currentCredits = user?.credit_balance ?? 0;
  const hasInsufficientCredits = currentCredits < totalCreditsNeeded || currentCredits <= 0;

  // File Upload Helper
  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
        setToastMsg(`Đã tải ${label} thành công!`);
        setTimeout(() => setToastMsg(null), 2500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Paste Event Handler (Clipboard Image)
  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setRefImage(event.target.result as string);
              setToastMsg('Đã dán ảnh tham chiếu từ Clipboard!');
              setTimeout(() => setToastMsg(null), 2500);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMsg('Trình duyệt không hỗ trợ Web Speech API.');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }
    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsSpeechRecording(true);
      recognition.onend = () => setIsSpeechRecording(false);
      recognition.onresult = (evt: any) => {
        const transcript = evt.results[0][0].transcript;
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch (err) {
      setIsSpeechRecording(false);
    }
  };

  // Generate / Submit Job
  const handleGenerate = async () => {
    if (isGenerating) return;

    if (!prompt.trim()) {
      promptTextareaRef.current?.focus();
      setTextareaShake(true);
      setTimeout(() => setTextareaShake(false), 600);
      setToastMsg('💡 ' + t('studio.prompt_required', 'Vui lòng nhập mô tả ý tưởng hoặc chọn một gợi ý mẫu bên dưới!'));
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (hasInsufficientCredits) {
      setToastMsg(
        t('studio.insufficient_credits_toast', `Số dư Credit không đủ (Cần ${totalCreditsNeeded} cr, hiện có ${currentCredits.toLocaleString()} cr). Vui lòng nạp thêm!`)
      );
      setTopupOpen(true);
      return;
    }

    const selectedModelName = cleanModelDisplayName(currentModel?.name || 'VeloX Engine');

    setIsGenerating(true);

    // Call backend API to authenticate, check credit balance, deduct from DB, and create job
    try {
      const jobRes = await apiClient.post('/studio/jobs', {
        type: activeTab,
        model_code: selectedModelCode,
        prompt: prompt.trim(),
        options: {
          aspectRatio,
          resolution: activeTab === 'video' ? videoResolution : resolution,
          duration: activeTab === 'video' ? videoDuration : undefined,
          quality,
          voice: activeTab === 'audio' ? audioVoice : undefined,
          tone: activeTab === 'chat' ? chatTone : undefined,
        },
      });
      const jobData = jobRes.data?.data || jobRes.data;
      if (jobData?.credit_balance !== undefined) {
        updateUser({ credit_balance: jobData.credit_balance });
      } else {
        addCredits(-totalCreditsNeeded);
      }
    } catch (err: any) {
      setIsGenerating(false);
      const serverMsg = err?.response?.data?.detail?.message || err?.response?.data?.detail || err?.message;
      setToastMsg(`⚠️ ${serverMsg || 'Không thể tạo job do số dư không đủ. Vui lòng nạp thêm!'}`);
      if (err?.response?.status === 402) {
        setTopupOpen(true);
      }
      return;
    }

    if (activeTab === 'chat') {
      const userText = prompt.trim();
      setPrompt('');

      const userMsg: StudioChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: userText,
        model: selectedModelName,
        createdAt: 'Vừa xong',
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      setTimeout(() => {
        setIsGenerating(false);
        const assistantMsg: StudioChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: generateSimulatedChatResponse(userText, selectedModelName),
          model: selectedModelName,
          createdAt: 'Vừa xong',
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setTimeout(() => {
          chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }, 1400);
      return;
    }

    // Smoothly scroll to top so user sees the generated job in real time
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const newJobId = `job-${Date.now()}`;
    const newJob: GenerationJob = {
      id: newJobId,
      type: activeTab,
      prompt,
      model: selectedModelName,
      progress: 5,
      statusText: activeTab === 'video' ? 'Đang xếp hàng trong cụm GPU Render...' : activeTab === 'audio' ? 'Đang phân tích ngữ điệu giọng nói...' : 'Đang xếp hàng trong cụm GPU...',
      aspectRatio,
      refImage,
    };

    setActiveJobs((prev) => [newJob, ...prev]);

    // Simulated Render Stages
    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 35, statusText: activeTab === 'video' ? 'Đang mô phỏng chuyển động khung hình...' : 'Đang sinh mẫu neural...' } : j))
      );
    }, 1200);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 75, statusText: activeTab === 'video' ? 'Đang khử nhiễu và làm mịn 60fps...' : 'Đang nâng cấp chất lượng cao...' } : j))
      );
    }, 2800);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 98, statusText: 'Hoàn tất đóng gói file!' } : j))
      );
    }, 4200);

    setTimeout(() => {
      setActiveJobs((prev) => prev.filter((j) => j.id !== newJobId));
      setIsGenerating(false);

      if (activeTab === 'image') {
        const demoUrls = [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        ];
        const newImg: GeneratedImageItem = {
          id: `img-${Date.now()}`,
          url: demoUrls[Math.floor(Math.random() * demoUrls.length)],
          prompt,
          model: selectedModelName,
          aspectRatio,
          quality,
          createdAt: 'Vừa xong',
        };
        setGeneratedImages((prev) => [newImg, ...prev]);
      } else if (activeTab === 'video') {
        const demoVideos = [
          {
            poster: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-a-gym-41315-large.mp4',
          },
          {
            poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-warm-up-exercises-on-a-yoga-mat-41314-large.mp4',
          },
          {
            poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-out-in-a-modern-gym-41316-large.mp4',
          },
        ];
        const chosen = demoVideos[Math.floor(Math.random() * demoVideos.length)];
        const newVid: GeneratedVideoItem = {
          id: `vid-${Date.now()}`,
          title: prompt.slice(0, 32) + '...',
          prompt,
          model: selectedModelName,
          poster: chosen.poster,
          videoUrl: chosen.videoUrl,
          duration: videoDuration,
          quality: `${videoResolution} FHD`,
          aspectRatio,
          createdAt: 'Vừa xong',
        };
        setGeneratedVideos((prev) => [newVid, ...prev]);
      } else if (activeTab === 'audio') {
        const newAud: GeneratedAudioItem = {
          id: `aud-${Date.now()}`,
          title: prompt.slice(0, 36) + '...',
          prompt,
          model: selectedModelName,
          voice: audioVoice,
          duration: '0:18',
          createdAt: 'Vừa xong',
        };
        setGeneratedAudios((prev) => [newAud, ...prev]);
      }

      setToastMsg(t('studio.generate_success', 'Tác phẩm AI đã được sinh hoàn tất!'));
      setTimeout(() => setToastMsg(null), 3000);
    }, 4800);
  };

  return (
    <div className={styles.studioLayout} onClick={() => {
      setIsModelMenuOpen(false);
      setIsParamsMenuOpen(false);
      setIsInspireMenuOpen(false);
    }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className={styles.toastNotice}>
          <HiOutlineCheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Canvas & Media Gallery */}
      <div className={styles.canvasContainer}>
        {/* CHAT MODE */}
        {activeTab === 'chat' && (
          <div className={styles.chatAreaContainer}>
            <div className={styles.chatHeaderBar}>
              <div className={styles.chatHeaderLeft}>
                <span className={styles.chatModelPill}>
                  <HiOutlineSparkles size={14} />
                  {cleanModelDisplayName(currentModel?.name || 'GPT-4o')}
                </span>
                <h3 className={styles.chatTitle}>{t('studio.chat_title', 'Phiên Trò Chuyện Trí Tuệ Nhân Tạo')}</h3>
              </div>
              <button
                type="button"
                className={styles.clearChatBtn}
                onClick={() => setChatMessages([])}
                title={t('studio.clear_chat', 'Xoá hội thoại')}
              >
                <HiOutlineTrash size={14} />
                <span>{t('studio.clear_chat', 'Xoá hội thoại')}</span>
              </button>
            </div>

            <div className={styles.chatMessagesStream}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.role === 'user' ? styles.chatRowUser : styles.chatRowAssistant}
                >
                  {msg.role === 'assistant' && (
                    <div className={styles.assistantAvatar}>
                      <HiOutlineSparkles size={18} />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                    {msg.role === 'assistant' && (
                      <div className={styles.assistantMeta}>
                        <span className={styles.modelTag}>{msg.model}</span>
                        <span className={styles.timeTag}>· {msg.createdAt}</span>
                      </div>
                    )}
                    <div className={styles.assistantText}>{msg.content}</div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className={styles.chatTypingRow}>
                  <div className={styles.assistantAvatar}>
                    <HiOutlineSparkles size={18} />
                  </div>
                  <div className={styles.typingBubble}>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{t('studio.chat_thinking', 'AI đang suy nghĩ và tổng hợp câu trả lời...')}</span>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </div>
        )}

        {/* IMAGE MODE */}
        {activeTab === 'image' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>{t('studio.created_artworks', 'Danh Sách Tác Phẩm Đã Tạo')}</span>
                <span className={styles.countBadge}>{generatedImages.length + activeJobs.length}</span>
              </h3>
            </div>

            <div className={styles.compactGalleryGrid}>
              {/* ACTIVE IMAGE JOBS */}
              {activeJobs.map((job) => (
                <div key={job.id} className={styles.activeJobCard}>
                  <div className={styles.jobVisualBox}>
                    <div className={styles.scannerLine}></div>
                    <div className={styles.matrixShimmer}></div>
                    <div className={styles.jobStatusOverlay}>
                      <div className={styles.pulseRadar}>
                        <HiOutlinePhoto size={22} className={styles.spinIcon} />
                      </div>
                      <div className={styles.jobPercent}>{job.progress}%</div>
                      <div className={styles.jobStatusText}>{job.statusText}</div>
                    </div>
                  </div>

                  <div className={styles.jobCardFooter}>
                    <div className={styles.jobModelRow}>
                      <span className={styles.jobBadge}>{job.model}</span>
                      <span className={styles.jobRatioBadge}>{translateParamOption(job.aspectRatio, t)}</span>
                    </div>
                    <p className={styles.jobPromptText}>{job.prompt}</p>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETED IMAGES */}
              {generatedImages.map((img) => (
                <div key={img.id} className={styles.compactMediaCard}>
                  <div
                    className={styles.mediaThumbnailBox}
                    onClick={() =>
                      setPreviewMedia({
                        type: 'image',
                        url: img.url,
                        title: t('studio.title', 'Tác Phẩm AI'),
                        prompt: img.prompt,
                        model: img.model,
                      })
                    }
                  >
                    <img src={img.url} alt={img.prompt} loading="lazy" />
                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title={t('studio.fullscreen', 'Xem toàn màn hình')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'image',
                            url: img.url,
                            title: t('studio.title', 'Tác Phẩm AI'),
                            prompt: img.prompt,
                            model: img.model,
                          });
                        }}
                      >
                        <HiOutlineArrowsPointingOut size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.compactDetails}>
                    <div className={styles.metaRow}>
                      <span className={styles.mediaModelBadge}>{img.model}</span>
                      {img.aspectRatio && <span className={styles.ratioPill}>{translateParamOption(img.aspectRatio, t)}</span>}
                    </div>
                    <p className={styles.mediaPrompt} title={img.prompt}>
                      {img.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO MODE */}
        {activeTab === 'video' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>Danh Sách Video Đã Tạo</span>
                <span className={styles.countBadge}>{generatedVideos.length + activeJobs.length}</span>
              </h3>
            </div>

            <div className={styles.compactGalleryGrid}>
              {/* ACTIVE VIDEO JOBS */}
              {activeJobs.map((job) => (
                <div key={job.id} className={styles.activeJobCard}>
                  <div className={styles.jobVisualBox}>
                    <div className={styles.scannerLine}></div>
                    <div className={styles.matrixShimmer}></div>
                    <div className={styles.jobStatusOverlay}>
                      <div className={styles.pulseRadar}>
                        <HiOutlineFilm size={22} className={styles.spinIcon} />
                      </div>
                      <div className={styles.jobPercent}>{job.progress}%</div>
                      <div className={styles.jobStatusText}>{job.statusText}</div>
                    </div>
                  </div>

                  <div className={styles.jobCardFooter}>
                    <div className={styles.jobModelRow}>
                      <span className={styles.jobBadge}>{job.model}</span>
                      <span className={styles.jobRatioBadge}>{translateParamOption(job.aspectRatio, t)}</span>
                    </div>
                    <p className={styles.jobPromptText}>{job.prompt}</p>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETED VIDEOS */}
              {generatedVideos.map((vid) => (
                <div key={vid.id} className={styles.compactMediaCard}>
                  <div
                    className={styles.videoThumbnailBox}
                    onClick={() =>
                      setPreviewMedia({
                        type: 'video',
                        url: vid.videoUrl || vid.poster,
                        videoUrl: vid.videoUrl,
                        poster: vid.poster,
                        title: vid.title,
                        prompt: vid.prompt,
                        model: vid.model,
                      })
                    }
                  >
                    <img src={vid.poster} alt={vid.title} loading="lazy" />
                    <div className={styles.playIconOverlay}>
                      <HiOutlinePlay size={24} />
                    </div>
                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title={t('studio.fullscreen', 'Xem toàn màn hình')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'video',
                            url: vid.videoUrl || vid.poster,
                            videoUrl: vid.videoUrl,
                            poster: vid.poster,
                            title: vid.title,
                            prompt: vid.prompt,
                            model: vid.model,
                          });
                        }}
                      >
                        <HiOutlineArrowsPointingOut size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.compactDetails}>
                    <div className={styles.metaRow}>
                      <span className={styles.mediaModelBadge}>{vid.model}</span>
                      {vid.duration && (
                        <span className={styles.ratioPill}>
                          <HiOutlineClock size={11} /> {vid.duration}
                        </span>
                      )}
                    </div>
                    <h4 className={styles.videoTitle}>{vid.title}</h4>
                    <p className={styles.mediaPrompt} title={vid.prompt}>
                      {vid.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIO MODE */}
        {activeTab === 'audio' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>{t('studio.created_audio', 'Danh Sách Âm Thanh Đã Sinh')}</span>
                <span className={styles.countBadge}>{generatedAudios.length + activeJobs.length}</span>
              </h3>
            </div>

            {/* ACTIVE AUDIO JOBS */}
            {activeJobs.length > 0 && (
              <div className={styles.compactGalleryGrid}>
                {activeJobs.map((job) => (
                  <div key={job.id} className={styles.activeJobCard}>
                    <div className={styles.jobVisualBox}>
                      <div className={styles.scannerLine}></div>
                      <div className={styles.matrixShimmer}></div>
                      <div className={styles.jobStatusOverlay}>
                        <div className={styles.pulseRadar}>
                          <HiOutlineMusicalNote size={22} className={styles.spinIcon} />
                        </div>
                        <div className={styles.jobPercent}>{job.progress}%</div>
                        <div className={styles.jobStatusText}>{job.statusText}</div>
                      </div>
                    </div>

                    <div className={styles.jobCardFooter}>
                      <div className={styles.jobModelRow}>
                        <span className={styles.jobBadge}>{job.model}</span>
                        <span className={styles.jobRatioBadge}>{audioVoice}</span>
                      </div>
                      <p className={styles.jobPromptText}>{job.prompt}</p>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedAudios.length === 0 && activeJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <HiOutlineMusicalNote size={48} color="#ff6b35" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>{t('studio.no_audio_yet', 'Chưa có file âm thanh nào. Hãy nhập văn bản bên dưới để tạo giọng nói AI sống động!')}</p>
              </div>
            ) : (
              <div className={styles.audioListGrid}>
                {generatedAudios.map((aud) => (
                  <div key={aud.id} className={styles.compactAudioCard}>
                    <div className={styles.audioHeaderRow}>
                      <button
                        type="button"
                        className={`${styles.audioPlayBtn} ${playingAudioId === aud.id ? styles.audioPlaying : ''}`}
                        onClick={() => setPlayingAudioId(playingAudioId === aud.id ? null : aud.id)}
                        title={playingAudioId === aud.id ? 'Dừng phát' : 'Nghe âm thanh'}
                      >
                        {playingAudioId === aud.id ? <HiOutlineSpeakerWave size={18} /> : <HiOutlinePlay size={18} />}
                      </button>
                      <div className={styles.audioMetaBlock}>
                        <h4 className={styles.audioTitle}>{aud.title}</h4>
                        <div className={styles.audioTags}>
                          <span className={styles.audioModelBadge}>{aud.model}</span>
                          <span className={styles.audioVoiceBadge}>{aud.voice}</span>
                          <span className={styles.audioDurationBadge}>{aud.duration || '0:18'}</span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.audioPromptSnippet}>{aud.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM PROMPT CONTROL BAR (Chuẩn 1:1 theo mẫu thiết kế Krea/Higgsfield) */}
      <div className={styles.bottomControlPanel}>
        <div className={styles.controlContainer}>
          <div
            className={`${styles.promptInputBox} ${textareaShake ? styles.shakeBox : ''}`}
            onPaste={handlePasteEvent}
          >
            {/* TOP BAR: Slots Attachment & Inspire Me */}
            <div className={styles.promptTopBar}>
              {/* Left Attachment Slots */}
              <div className={styles.slotsGroup}>
                {/* Mode Ảnh: Slot Ref */}
                {activeTab === 'image' && (
                  <button
                    type="button"
                    className={`${styles.refSlotBtn} ${refImage ? styles.slotActive : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    title={t('studio.ref_image', 'Ảnh tham chiếu')}
                  >
                    {refImage ? (
                      <>
                        <img src={refImage} alt="Ref" className={styles.slotThumbnail} />
                        <span
                          className={styles.clearSlotBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRefImage(null);
                          }}
                        >
                          ✕
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.slotIconWithPlus}>
                          <HiOutlinePhoto size={15} />
                          <span className={styles.subPlus}>+</span>
                        </span>
                        <span className={styles.slotLabel}>{t('studio.ref_image', 'Ref')}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Mode Video: Hàng 5 Slots [Bắt đầu] -> [Kết th...] [Ref] [Video] [Âm th...] */}
                {activeTab === 'video' && (
                  <>
                    {/* 1. Bắt đầu (Start Frame) */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${startFrame ? styles.slotActive : ''}`}
                      onClick={() => startFrameInputRef.current?.click()}
                      title={t('studio.start_frame', 'Bắt đầu')}
                    >
                      {startFrame ? (
                        <>
                          <img src={startFrame} alt="Start" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStartFrame(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>{t('studio.start_frame', 'Bắt đầu')}</span>
                        </>
                      )}
                    </button>

                    <span className={styles.slotArrow}>→</span>

                    {/* 2. Kết thúc (End Frame) */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${endFrame ? styles.slotActive : ''}`}
                      onClick={() => endFrameInputRef.current?.click()}
                      title={t('studio.end_frame', 'Kết thúc')}
                    >
                      {endFrame ? (
                        <>
                          <img src={endFrame} alt="End" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEndFrame(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>{t('studio.end_frame', 'Kết th...')}</span>
                        </>
                      )}
                    </button>

                    {/* 3. Ref */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${refImage ? styles.slotActive : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      title={t('studio.ref_image', 'Ảnh tham chiếu')}
                    >
                      {refImage ? (
                        <>
                          <img src={refImage} alt="Ref" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRefImage(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>{t('studio.ref_image', 'Ref')}</span>
                        </>
                      )}
                    </button>

                    {/* 4. Video nguồn */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${sourceVideo ? styles.slotActive : ''}`}
                      onClick={() => videoInputRef.current?.click()}
                      title={t('studio.source_video', 'Video')}
                    >
                      {sourceVideo ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#2dd4bf' }}>{t('studio.loaded', 'Đã nạp')}</span>
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSourceVideo(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlineFilm size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>{t('studio.source_video', 'Video')}</span>
                        </>
                      )}
                    </button>

                    {/* 5. Âm thanh đính kèm */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${audioTrack ? styles.slotActive : ''}`}
                      onClick={() => audioInputRef.current?.click()}
                      title={t('studio.audio_track', 'Âm thanh')}
                    >
                      {audioTrack ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>{t('studio.loaded', 'Đã nạp')}</span>
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioTrack(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlineMusicalNote size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>{t('studio.audio_track', 'Âm th...')}</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Right: Inspire Me Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={styles.inspireMeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInspireMenuOpen(!isInspireMenuOpen);
                    setIsModelMenuOpen(false);
                    setIsParamsMenuOpen(false);
                  }}
                >
                  <span className={styles.sparkleIcon}>※</span>
                  <span>{t('studio.inspire_me', 'Truyền cảm hứng cho tôi')}</span>
                  <HiOutlineChevronDown size={13} />
                </button>

                {isInspireMenuOpen && (
                  <div className={`${styles.customPopoverMenu} ${styles.popoverRight}`}>
                    <div className={styles.paramGroupTitle}>{t('studio.inspire_title', 'Gợi ý Prompt Sáng Tạo')}</div>
                    {/* Quick Random Fill */}
                    <button
                      type="button"
                      className={styles.popoverItem}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px', color: '#ff6b35', fontWeight: 700 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const list = INSPIRATION_PROMPTS_BY_TAB[activeTab] || INSPIRATION_PROMPTS_BY_TAB.image;
                        const randomP = list[Math.floor(Math.random() * list.length)];
                        setPrompt(randomP);
                        setIsInspireMenuOpen(false);
                        promptTextareaRef.current?.focus();
                      }}
                    >
                      <span>🎲 {t('studio.random_prompt', 'Điền ngẫu nhiên 1 prompt mẫu')}</span>
                    </button>
                    {(INSPIRATION_PROMPTS_BY_TAB[activeTab] || INSPIRATION_PROMPTS_BY_TAB.image).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.popoverItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrompt(p);
                          setIsInspireMenuOpen(false);
                          promptTextareaRef.current?.focus();
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setRefImage, 'ảnh tham chiếu')}
            />
            <input
              type="file"
              ref={startFrameInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setStartFrame, 'frame bắt đầu')}
            />
            <input
              type="file"
              ref={endFrameInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setEndFrame, 'frame kết thúc')}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setSourceVideo, 'video nguồn')}
            />
            <input
              type="file"
              ref={audioInputRef}
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setAudioTrack, 'audio track')}
            />

            {/* INSUFFICIENT CREDITS WARNING BAR */}
            {hasInsufficientCredits && (
              <div
                className={styles.creditWarningBar}
                onClick={() => setTopupOpen(true)}
                title={t('studio.insufficient_credits_banner', 'Số dư tài khoản không đủ để chạy model này')}
              >
                <div className={styles.warningLeft}>
                  <RiSparklingFill size={16} color="#f59e0b" />
                  <span>
                    {t('studio.insufficient_credits_banner', 'Số dư tài khoản không đủ để chạy model này')} (
                    {t('studio.need_credits', 'Cần')} <strong>{totalCreditsNeeded} cr</strong> · {t('studio.current_credits', 'Hiện có')} <strong>{currentCredits.toLocaleString()} cr</strong>)
                  </span>
                </div>
                <button type="button" className={styles.topupAlertBtn}>
                  {t('studio.btn_topup_now', 'Nạp Credit Ngay')} →
                </button>
              </div>
            )}

            {/* MIDDLE ROW: Clean Borderless Textarea */}
            <textarea
              ref={promptTextareaRef}
              className={styles.promptTextarea}
              placeholder={
                activeTab === 'chat'
                  ? t('studio.prompt_placeholder_chat', 'Hỏi AI bất kỳ điều gì, giải toán, viết code, phân tích dữ liệu hoặc lập kế hoạch...')
                  : activeTab === 'image'
                  ? t('studio.prompt_placeholder_image', 'Mô tả hình ảnh bạn muốn tạo (Ví dụ: Chân dung điện ảnh 8K, phong cảnh viễn tưởng)...')
                  : activeTab === 'video'
                  ? t('studio.prompt_placeholder_video', 'Mô tả video bạn muốn tạo (Ví dụ: Máy quay slow-motion 120fps lướt quanh vận động viên)...')
                  : t('studio.prompt_placeholder_audio', 'Nhập văn bản cần chuyển thành giọng đọc AI tự nhiên...')
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              rows={2}
            />

            {/* BOTTOM TOOLBAR: Segmented Mode, Book, Model Dropdown, Params Dropdown, Mic, Pink Submit */}
            <div className={styles.promptBottomToolbar}>
              <div className={styles.toolbarLeft}>
                {/* 1. Segmented Switcher [Chat] [Ảnh] [Video] [Âm thanh] */}
                <div className={styles.modeSwitcherGroup}>
                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'chat' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('chat');
                    }}
                    title={t('studio.tab_chat', 'Chat')}
                  >
                    <HiOutlineChatBubbleLeftRight size={15} />
                    {activeTab === 'chat' && <span>{t('studio.tab_chat', 'Chat')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'image' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('image');
                    }}
                    title={t('studio.tab_image', 'Ảnh')}
                  >
                    <HiOutlinePhoto size={15} />
                    {activeTab === 'image' && <span>{t('studio.tab_image', 'Ảnh')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'video' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('video');
                    }}
                    title={t('studio.tab_video', 'Video')}
                  >
                    <HiOutlineFilm size={15} />
                    {activeTab === 'video' && <span>{t('studio.tab_video', 'Video')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'audio' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('audio');
                    }}
                    title={t('studio.tab_audio', 'Âm thanh')}
                  >
                    <SoundWaveIcon size={14} />
                    {activeTab === 'audio' && <span>{t('studio.tab_audio', 'Âm thanh')}</span>}
                  </button>
                </div>

                {/* 2. Book Icon [📖] & Presets Popover */}
                <div className={styles.bookPopoverWrapper}>
                  <button
                    type="button"
                    className={`${styles.iconBookBtn} ${isPresetsMenuOpen ? styles.iconBookBtnActive : ''}`}
                    title={t('studio.presets_title', 'Thư viện phong cách & prompt mẫu chuẩn')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPresetsMenuOpen(!isPresetsMenuOpen);
                      setIsModelMenuOpen(false);
                      setIsParamsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <HiOutlineBookOpen size={16} />
                  </button>

                  {isPresetsMenuOpen && (
                    <div className={styles.presetsPopoverMenu} onClick={(e) => e.stopPropagation()}>
                      {(PROMPT_PRESET_GROUPS[activeTab] || []).map((group, gIdx) => (
                        <div key={gIdx} className={styles.presetGroup}>
                          <div className={styles.presetGroupTitle}>{group.groupName}</div>
                          {group.items.map((item, iIdx) => (
                            <button
                              key={iIdx}
                              type="button"
                              className={styles.presetItemBtn}
                              onClick={() => {
                                setPrompt(item.prompt);
                                if (item.ratio) setAspectRatio(item.ratio);
                                if (item.duration && activeTab === 'video') setVideoDuration(item.duration);
                                setIsPresetsMenuOpen(false);
                                setToastMsg(`${t('studio.presets_applied', 'Đã áp dụng mẫu')}: "${item.title}"`);
                                setTimeout(() => setToastMsg(null), 2500);
                              }}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Model Dropdown ✦ [Model Name] ⌵ */}
                <div className={styles.modelPillDropdown}>
                  <button
                    type="button"
                    className={styles.modelPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModelMenuOpen(!isModelMenuOpen);
                      setIsParamsMenuOpen(false);
                      setIsPresetsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span className={styles.starIcon}>✦</span>
                    <span>{cleanModelDisplayName(currentModel?.name || t('studio.select_model', 'Chọn Model'))}</span>
                    <HiOutlineChevronDown className={styles.chevron} size={12} />
                  </button>

                  {isModelMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      <div className={styles.paramGroupTitle}>
                        {t('studio.models_count', 'Mô hình')} {activeTab === 'image' ? t('studio.tab_image', 'Ảnh') : activeTab === 'video' ? t('studio.tab_video', 'Video') : t('studio.tab_audio', 'Âm thanh')} ({availableModels.length})
                      </div>
                      {availableModels.map((m) => {
                        const isSelected = selectedModelCode === m.model_code;
                        return (
                          <button
                            key={m.id || m.model_code}
                            type="button"
                            className={`${styles.popoverItem} ${isSelected ? styles.popoverActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModelCode(m.model_code);
                              setIsModelMenuOpen(false);
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{cleanModelDisplayName(m.name)}</div>
                              <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{m.provider}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={styles.itemCreditBadge}>
                                {m.selling_credit_price} cr
                              </span>
                              {isSelected && <HiOutlineCheck size={14} color="#ff6b35" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Params Dropdown (1K · Tự động · Cao ⌵ hoặc 1080p · Tự động · 5s ⌵) */}
                <div className={styles.paramsPillDropdown}>
                  <button
                    type="button"
                    className={styles.paramsPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsParamsMenuOpen(!isParamsMenuOpen);
                      setIsModelMenuOpen(false);
                      setIsPresetsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span>
                      {activeTab === 'chat'
                        ? (chatTone === 'creative' ? 'Sáng tạo' : chatTone === 'precise' ? 'Chính xác' : 'Cân bằng')
                        : activeTab === 'image'
                        ? `${resolution} · ${translateParamOption(aspectRatio, t)} · ${translateParamOption(quality, t)}`
                        : activeTab === 'video'
                        ? `${videoResolution} · ${translateParamOption(aspectRatio, t)} · ${videoDuration}`
                        : audioVoice}
                    </span>
                    <HiOutlineChevronDown className={styles.chevron} size={13} />
                  </button>

                  {isParamsMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      {activeTab === 'chat' && (
                        <>
                          <div className={styles.paramGroupTitle}>Phong cách phản hồi (Tone / Creativity)</div>
                          <div className={styles.paramOptionsGrid}>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'creative' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('creative');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Sáng tạo (Creative)
                            </button>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'balanced' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('balanced');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Cân bằng (Balanced)
                            </button>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'precise' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('precise');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Chính xác (Precise)
                            </button>
                          </div>
                        </>
                      )}

                      {activeTab === 'image' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.resolution', 'Độ phân giải')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.resolutions || ['1K', '2K', '4K']).map((res) => (
                              <button
                                key={res}
                                type="button"
                                className={`${styles.paramChip} ${resolution === res ? styles.paramActive : ''}`}
                                onClick={() => setResolution(res)}
                              >
                                {res}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.aspect_ratio', 'Tỉ lệ khung hình')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.aspectRatios || ['Tự động', '1:1', '16:9', '9:16', '4:3', '21:9']).map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {translateParamOption(ratio, t)}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.render_quality', 'Chất lượng Render')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.qualities || ['Tiêu chuẩn', 'Cao', 'Ultra']).map((q) => (
                              <button
                                key={q}
                                type="button"
                                className={`${styles.paramChip} ${quality === q ? styles.paramActive : ''}`}
                                onClick={() => setQuality(q)}
                              >
                                {translateParamOption(q, t)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'video' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.video_resolution', 'Độ phân giải video')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.resolutions || ['720p', '1080p', '4K']).map((res) => (
                              <button
                                key={res}
                                type="button"
                                className={`${styles.paramChip} ${videoResolution === res ? styles.paramActive : ''}`}
                                onClick={() => setVideoResolution(res)}
                              >
                                {res}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.aspect_ratio', 'Tỉ lệ khung hình')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.aspectRatios || ['Tự động', '16:9', '9:16']).map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {translateParamOption(ratio, t)}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.video_duration', 'Thời lượng video')} ({cleanModelDisplayName(currentModel?.name || '')})</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.durations || ['5s', '10s (Pro)']).map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                className={`${styles.paramChip} ${videoDuration === dur ? styles.paramActive : ''}`}
                                onClick={() => setVideoDuration(dur)}
                              >
                                {dur}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'audio' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.audio_voice_title', 'Ngôn ngữ & Giọng đọc')}</div>
                          {['English · American', 'English · British', 'Tiếng Việt · Hà Nội', 'Tiếng Việt · Sài Gòn'].map((voice) => (
                            <button
                              key={voice}
                              type="button"
                              className={`${styles.popoverItem} ${audioVoice === voice ? styles.popoverActive : ''}`}
                              onClick={() => {
                                setAudioVoice(voice);
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              <span>{voice}</span>
                              {audioVoice === voice && <HiOutlineCheck size={14} color="#ff6b35" />}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Speaker Toggle Button for Video Mode */}
                {activeTab === 'video' && (
                  <button
                    type="button"
                    className={`${styles.speakerToolbarBtn} ${isAudioMuted ? styles.speakerMuted : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAudioMuted(!isAudioMuted);
                    }}
                    title={isAudioMuted ? t('studio.unmute', 'Bật âm thanh') : t('studio.mute', 'Tắt âm thanh')}
                  >
                    {isAudioMuted ? <HiOutlineSpeakerXMark size={16} /> : <HiOutlineSpeakerWave size={16} />}
                  </button>
                )}
              </div>

              {/* Right: Microphone & Neon Pink Circular Submit */}
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={`${styles.micBtn} ${isSpeechRecording ? styles.micActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVoiceInput();
                  }}
                  title={t('studio.voice_input', 'Nhập bằng giọng nói')}
                >
                  <HiOutlineMicrophone size={20} />
                </button>

                <button
                  type="button"
                  className={`${styles.pinkNeonSubmitBtn} ${!prompt.trim() ? styles.submitBtnReady : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate();
                  }}
                  disabled={isGenerating}
                  title={
                    hasInsufficientCredits
                      ? `Số dư không đủ (${currentCredits.toLocaleString()}/${totalCreditsNeeded} cr) - Bấm để nạp thêm!`
                      : `${t('common.generate', 'Tạo ngay')} (${totalCreditsNeeded} cr)`
                  }
                >
                  {isGenerating ? (
                    <span className={styles.buttonSpinner} />
                  ) : (
                    <HiOutlineArrowUp size={20} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Real Video Player */}
      {previewMedia && (
        <div className={styles.lightboxBackdrop} onClick={() => setPreviewMedia(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setPreviewMedia(null)}
              title={t('common.close', 'Đóng')}
            >
              <HiOutlineXMark size={20} />
            </button>

            <div className={styles.lightboxImageWrapper}>
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.videoUrl || previewMedia.url}
                  poster={previewMedia.poster}
                  controls
                  autoPlay
                  playsInline
                  loop
                  style={{ width: '100%', maxHeight: '540px', objectFit: 'contain', background: '#000' }}
                />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.prompt} />
              )}
            </div>

            <div className={styles.lightboxMeta}>
              <div className={styles.lightboxModelRow}>
                <span className={styles.lightboxModelBadge}>{previewMedia.model}</span>
                <a
                  href={previewMedia.videoUrl || previewMedia.url}
                  download={previewMedia.type === 'video' ? 'velox-video.mp4' : 'velox-asset.jpg'}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.lightboxDownloadBtn}
                >
                  <HiOutlineArrowDownTray size={15} /> {t('common.download', 'Tải bản gốc')} Ultra 4K
                </a>
              </div>
              <p className={styles.lightboxPrompt}>{previewMedia.prompt}</p>
            </div>
          </div>
        </div>
      )}

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default StudioPage;
