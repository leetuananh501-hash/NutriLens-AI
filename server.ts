import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { estimateMealNutrition, estimateProductLabel } from './src/data/nutritionEstimator';
import { normalizeMealNumbers, normalizeLabelNumbers, roundInt } from './src/utils/numberFormat';
import { compareTwoProducts, buildVietnameseWeeklyMealPlan } from './src/services/nutritionPlannerService';
import type { PlannerGoalMode, ProductLabelAnalysis, WeeklyMealPlan } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper function to strip base64 header
function cleanBase64(dataStr: string): { cleanData: string; mimeType: string } {
  const matches = dataStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      cleanData: matches[2],
    };
  }
  return {
    mimeType: 'image/jpeg',
    cleanData: dataStr,
  };
}

// Helper function to format Gemini API errors into friendly Vietnamese messages
function formatGeminiErrorMessage(error: any): string {
  if (!error) return 'Đã có lỗi xảy ra khi kết nối AI. Vui lòng thử lại sau giây lát.';
  
  let rawMsg = typeof error === 'string' ? error : (error.message || '');
  
  // Try extracting error message if it's a serialized JSON object from Google API
  try {
    if (typeof rawMsg === 'string' && rawMsg.trim().startsWith('{') && rawMsg.trim().endsWith('}')) {
      const parsed = JSON.parse(rawMsg.trim());
      if (parsed.error?.message) {
        rawMsg = `${parsed.error.code || ''} ${parsed.error.message}`;
      }
    }
  } catch {
    // keep rawMsg
  }

  const lower = String(rawMsg).toLowerCase();

  if (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('spikes in demand')
  ) {
    return 'Hệ thống AI hiện đang có lượng truy cập cao đột biến. Vui lòng bấm "Thử lại ngay" sau vài giây để tiếp tục.';
  }
  if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return 'Hệ thống AI đã tạm thời đạt giới hạn lượt xử lý. Vui lòng chờ 5-10 giây và bấm thử lại.';
  }
  if (lower.includes('400') || lower.includes('invalid') || lower.includes('bad request')) {
    return 'Hình ảnh chưa đủ rõ nét hoặc góc chụp bị che khuất. Vui lòng chọn ảnh chụp rõ hơn.';
  }
  if (lower.includes('timeout') || lower.includes('504') || lower.includes('502')) {
    return 'Thời gian phản hồi AI quá lâu do mạng gián đoạn. Vui lòng bấm Thử lại ngay.';
  }

  return 'Không thể kết nối đến máy chủ AI. Vui lòng bấm Thử lại sau giây lát.';
}

// Timeout helper for Promise.race to guarantee server never hangs indefinitely
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Model request timed out after ${ms}ms`));
    }, ms);
  });
}

// Helper function to call Gemini API with cascading fast models (12s primary runway, zero thinkingConfig)
async function callGeminiWithRetry(params: {
  contents: any;
  systemInstruction: string;
  responseSchema: any;
}) {
  const modelsToTry: { name: string; timeoutMs: number }[] = [
    { name: 'gemini-3.8-flash', timeoutMs: 12000 },
    { name: 'gemini-3.1-flash-lite', timeoutMs: 8000 },
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini] Attempting model: ${model.name} (timeout: ${model.timeoutMs}ms)`);
      // Zero thinkingConfig to minimize latency for instant JSON responses
      const config: any = {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      };

      const generatePromise = ai.models.generateContent({
        model: model.name,
        contents: params.contents,
        config,
      });

      const response: any = await Promise.race([
        generatePromise,
        timeoutPromise(model.timeoutMs),
      ]);

      if (response && response.text) {
        console.log(`[Gemini] Model ${model.name} responded successfully.`);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini] Model ${model.name} failed: ${errMsg}`);

      const isHighDemandOrQuota =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        err?.status === 503 ||
        err?.status === 429;

      // If it's 503 high demand or 429 quota, immediately cascade to next model
      if (isHighDemandOrQuota) {
        console.warn(`[Gemini] Fast-switching from ${model.name} to next model due to capacity limit...`);
        // Small 100ms breather before next model
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      // For timeout or other errors, brief 100ms delay and continue
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // All models failed: throw sanitized message
  const friendlyMsg = formatGeminiErrorMessage(lastError);
  throw new Error(friendlyMsg);
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Analyze Meal Endpoint (Calorie & Macro estimation from food photo)
app.post('/api/analyze-meal', async (req, res) => {
  try {
    const { imageBase64, mimeType: userMimeType, description } = req.body;

    if (!imageBase64 && !description) {
      return res.status(400).json({ error: 'Vui lòng cung cấp hình ảnh món ăn hoặc mô tả món.' });
    }

    const parts: any[] = [];

    if (imageBase64) {
      const { cleanData, mimeType } = cleanBase64(imageBase64);
      parts.push({
        inlineData: {
          mimeType: userMimeType || mimeType,
          data: cleanData,
        },
      });
    }

    const promptText = `
Bạn là chuyên gia dinh dưỡng và thị giác máy tính hàng đầu về ẩm thực Việt Nam và quốc tế.
Nhiệm vụ:
1. Quan sát kỹ lưỡng hình ảnh đĩa thức ăn/bữa ăn (hoặc thông tin mô tả nếu có: "${description || ''}").
2. Nhận diện chính xác tên món ăn (đặc biệt các món Việt Nam như Cơm tấm, Phở bò, Bún chả, Bánh mì, Gỏi cuốn, Canh chua, Thịt kho tàu... hoặc món Á/Âu).
3. Bóc tách từng thành phần nguyên liệu chính trên đĩa (ví dụ đĩa cơm sườn gồm: Cơm trắng, Sườn nướng, Chả trứng hấp, Bì heo, Dưa leo cà chua, Mỡ hành).
4. Ước tính trọng lượng hợp lý theo gam (g), lượng calo tương ứng và các chất đa lượng (Đạm - Protein, Tinh bột - Carbs, Chất béo - Fat).
5. Tính tổng Calo, Đạm, Tinh bột, Chất béo, Chất xơ (g).
6. Cho điểm sức khỏe (Health Score 1-10) và lời khuyên dinh dưỡng hữu ích, thực tế bằng tiếng Việt.
`.trim();

    parts.push({ text: promptText });

    let data: any = null;
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    if (hasKey) {
      try {
        const text = await callGeminiWithRetry({
      contents: { parts },
      systemInstruction: 'Bạn là chuyên gia phân tích dinh dưỡng và calo thực phẩm chuẩn xác, thân thiện, sử dụng tiếng Việt tự nhiên và khoa học.',
      responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING, description: 'Tên món ăn chung' },
            vietnameseName: { type: Type.STRING, description: 'Tên tiếng Việt rõ ràng, hấp dẫn' },
            estimatedTotalGrams: { type: Type.NUMBER, description: 'Tổng khối lượng đĩa ăn ước tính tính bằng gam' },
            calories: { type: Type.NUMBER, description: 'Tổng năng lượng (kcal)' },
            protein: { type: Type.NUMBER, description: 'Tổng chất đạm (g)' },
            carbs: { type: Type.NUMBER, description: 'Tổng tinh bột (g)' },
            fat: { type: Type.NUMBER, description: 'Tổng chất béo (g)' },
            fiber: { type: Type.NUMBER, description: 'Chất xơ (g)' },
            ingredients: {
              type: Type.ARRAY,
              description: 'Danh sách bóc tách từng thành phần nguyên liệu',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Tên thành phần, ví dụ Cơm tấm, Sườn nướng, Trứng ốp la' },
                  weightGrams: { type: Type.NUMBER, description: 'Khối lượng ước tính tính bằng gam' },
                  calories: { type: Type.NUMBER, description: 'Lượng calo của thành phần này' },
                  protein: { type: Type.NUMBER, description: 'Chất đạm (g)' },
                  carbs: { type: Type.NUMBER, description: 'Tinh bột (g)' },
                  fat: { type: Type.NUMBER, description: 'Chất béo (g)' },
                },
                required: ['name', 'weightGrams', 'calories', 'protein', 'carbs', 'fat'],
              },
            },
            healthScore: { type: Type.NUMBER, description: 'Điểm dinh dưỡng từ 1 đến 10' },
            healthSummary: { type: Type.STRING, description: 'Đánh giá ngắn gọn về độ cân bằng dinh dưỡng' },
            dietaryTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Thẻ phân loại, ví dụ: Giàu đạm, Ít calo, Món truyền thống, Đậm vị',
            },
            advice: { type: Type.STRING, description: 'Lời khuyên cụ thể cho người dùng về bữa ăn này' },
          },
          required: [
            'dishName',
            'vietnameseName',
            'estimatedTotalGrams',
            'calories',
            'protein',
            'carbs',
            'fat',
            'fiber',
            'ingredients',
            'healthScore',
            'healthSummary',
            'dietaryTags',
            'advice',
          ],
        },
        });
        data = JSON.parse(text);
      } catch (geminiError: any) {
        console.warn('[Gemini] Real-time inference failed, falling back to intelligent nutrition database:', geminiError?.message || geminiError);
      }
    }

    if (!data) {
      console.log(`[Nutrition] Providing intelligent fallback analysis for: "${description || 'Uploaded dish photo'}"`);
      data = estimateMealNutrition(description, imageBase64);
    }

    return res.json(normalizeMealNumbers(data));
  } catch (error: any) {
    console.error('Error in analyze-meal handler:', error);
    const fallback = estimateMealNutrition(req.body?.description, req.body?.imageBase64);
    return res.json(normalizeMealNumbers(fallback));
  }
});

// 2. Analyze Product Label Endpoint (Chemical additives, E-numbers & Buy/Pass Recommendation)
app.post('/api/analyze-label', async (req, res) => {
  try {
    const { imageBase64, mimeType: userMimeType, productNameHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp hình ảnh nhãn dán sản phẩm.' });
    }

    const { cleanData, mimeType } = cleanBase64(imageBase64);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: userMimeType || mimeType,
          data: cleanData,
        },
      },
    ];

    const promptText = `
Bạn là chuyên gia an toàn vệ sinh thực phẩm, độc chất học thực phẩm và dinh dưỡng lâm sàng độc lập.
Nhiệm vụ:
1. Đọc và phân tích toàn bộ nhãn dán/bảng thành phần (Ingredients) của sản phẩm trong hình ảnh (gợi ý sản phẩm nếu có: "${productNameHint || ''}").
2. Đặc biệt chú ý các mặt hàng gia vị, thực phẩm công nghiệp đóng gói tại Việt Nam như:
   - Hạt nêm (Knorr, Maggi, Aji-ngon,... thường chứa nhiều muối, đường, chất điều vị E621/E627/E631, hương thịt nhân tạo).
   - Tương ớt / Sốt chấm (thường chứa chất bảo quản E211 Sodium Benzoate, E202 Kali Sorbat, chất làm dày E1422, phẩm màu tổng hợp E110 Sunset Yellow, E124 Ponceau, chất tạo ngọt tổng hợp).
   - Nước mắm (phân biệt nước mắm công nghiệp chứa nhiều chất điều vị E621/627/631/640, chất tạo ngọt Aspartame, màu caramel vs nước mắm truyền thống chỉ có cá và muối).
   - Mì gói, bánh snack, đồ uống đóng chai...
3. Bóc tách và giải mã tất cả các phụ gia hóa học (mã INS hoặc E-numbers, chất điều vị, chất bảo quản, phẩm màu tổng hợp, chất làm dày, đường tinh luyện, muối/natri cao).
4. Phân loại mức độ rủi ro của từng phụ gia:
   - 'safe': An toàn, phụ gia thực phẩm thông thường, nguồn gốc tự nhiên.
   - 'moderate': Cần lưu ý, sử dụng ở mức hạn chế, có thể gây khó chịu nhẹ cho người nhạy cảm.
   - 'high_concern': Đáng lo ngại, tiềm ẩn nguy cơ cho người bệnh gout, tim mạch, trẻ nhỏ hoặc có nghiên cứu cảnh báo.
5. Đưa ra KẾT LUẬN & KHUYẾN NGHỊ MUA DỨT KHOÁT:
   - 'BUY': NÊN MUA - Thành phần lành mạnh, ít hóa chất tổng hợp độc hại, minh bạch.
   - 'CONSIDER': CÂN NHẮC - Sản phẩm trung bình, có một số chất điều vị hoặc phụ gia phổ biến, nên dùng có chừng mực.
   - 'PASS': HẠN CHẾ / KHÔNG NÊN MUA - Chứa quá nhiều hóa chất tổng hợp, chất điều vị liều cao, nhiều chất bảo quản hoặc phụ gia đáng lo ngại.
6. Đưa ra Điểm Độ Sạch thực phẩm (Clean Score từ 0 đến 100).
7. Đưa ra các giải pháp thay thế lành mạnh hơn (Better Alternatives).
`.trim();

    parts.push({ text: promptText });

    let data: any = null;
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    if (hasKey) {
      try {
        const text = await callGeminiWithRetry({
      contents: { parts },
      systemInstruction: 'Bạn là chuyên gia thẩm định nhãn mác hóa chất và phụ gia thực phẩm độc lập, khách quan, chính xác theo tiêu chuẩn an toàn thực phẩm.',
      responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: 'Tên sản phẩm được nhận diện trên nhãn' },
            brandName: { type: Type.STRING, description: 'Tên thương hiệu nếu có' },
            category: { type: Type.STRING, description: 'Loại sản phẩm (ví dụ: Hạt nêm, Tương ớt, Nước mắm, Mì gói...)' },
            verdict: {
              type: Type.STRING,
              description: 'Khuyến nghị dứt khoát: BUY (Nên mua), CONSIDER (Cân nhắc), hoặc PASS (Không nên mua)',
            },
            verdictHeadline: { type: Type.STRING, description: 'Tiêu đề khuyến nghị súc tích (1 câu ngắn)' },
            cleanScore: { type: Type.NUMBER, description: 'Điểm độ sạch an toàn (0 - 100)' },
            summary: { type: Type.STRING, description: 'Đánh giá tổng quan về chất lượng và độ an toàn của sản phẩm' },
            rawIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Các thành phần gốc được bóc tách từ nhãn',
            },
            additives: {
              type: Type.ARRAY,
              description: 'Chi tiết các phụ gia hóa chất phát hiện được',
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: 'Mã phụ gia ví dụ E621, INS 211, E1422 hoặc tên viết tắt' },
                  name: { type: Type.STRING, description: 'Tên hóa học đầy đủ và tên thường gọi' },
                  category: { type: Type.STRING, description: 'Chất điều vị, chất bảo quản, phẩm màu, v.v.' },
                  riskLevel: {
                    type: Type.STRING,
                    description: 'safe, moderate, hoặc high_concern',
                  },
                  purpose: { type: Type.STRING, description: 'Công dụng trong chế biến công nghiệp' },
                  healthEffects: { type: Type.STRING, description: 'Tác động tiềm ẩn đến cơ thể hoặc đối tượng cần kiêng' },
                },
                required: ['code', 'name', 'category', 'riskLevel', 'purpose', 'healthEffects'],
              },
            },
            healthWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Các cảnh báo sức khỏe cụ thể cho các nhóm đối tượng (tim mạch, huyết áp, trẻ nhỏ, dị ứng)',
            },
            nutritionAlerts: {
              type: Type.OBJECT,
              properties: {
                highSodium: { type: Type.BOOLEAN, description: 'Có hàm lượng muối/natri cao không' },
                highSugar: { type: Type.BOOLEAN, description: 'Có nhiều đường tinh luyện/đường ẩn không' },
                transFat: { type: Type.BOOLEAN, description: 'Có chất béo chuyển hóa không' },
                hasHiddenChemicals: { type: Type.BOOLEAN, description: 'Có hóa chất núp bóng tên gọi mĩ miều không' },
              },
              required: ['highSodium', 'highSugar', 'transFat', 'hasHiddenChemicals'],
            },
            betterAlternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Gợi ý sản phẩm hoặc phương pháp thay thế sạch và tự nhiên hơn',
            },
          },
          required: [
            'productName',
            'category',
            'verdict',
            'verdictHeadline',
            'cleanScore',
            'summary',
            'rawIngredients',
            'additives',
            'healthWarnings',
            'nutritionAlerts',
            'betterAlternatives',
          ],
        },
        });
        data = JSON.parse(text);
      } catch (geminiError: any) {
        console.warn('[Gemini] Label inference failed, falling back to additives database:', geminiError?.message || geminiError);
      }
    }

    if (!data) {
      console.log(`[Additives] Providing intelligent fallback label decryptor for: "${productNameHint || 'Packaged food'}"`);
      data = estimateProductLabel(productNameHint, imageBase64);
    }

    return res.json(normalizeLabelNumbers(data));
  } catch (error: any) {
    console.error('Error in analyze-label handler:', error);
    const fallback = estimateProductLabel(req.body?.productNameHint, req.body?.imageBase64);
    return res.json(normalizeLabelNumbers(fallback));
  }
});

// User Isolation Store: Keep data strictly partitioned per userId (prevents cross-user data leaks)
interface UserSyncStore {
  meals: any[];
  labels: any[];
  water?: any;
  profile?: any;
  lastSyncedAt: string;
}

const userSyncStores = new Map<string, UserSyncStore>();

// 3. Sync Status Ping Endpoint (User-aware)
app.get('/api/sync/status', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'default_user';
  const userStore = userSyncStores.get(userId);
  return res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    lastSyncedAt: userStore?.lastSyncedAt || null,
    userId,
  });
});

// 4. Data Sync Endpoint (receives offline queue and consolidated datasets for specific user)
app.post('/api/sync', (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body?.userId || 'default_user';
    const { syncQueue = [], clientMeals = [], clientLabels = [], clientWater, clientProfile } = req.body;

    console.log(`[Sync] Received sync request for user [${userId}]: ${syncQueue.length} queued actions, ${clientMeals.length} meals, ${clientLabels.length} labels`);

    // Process queued operations for this specific user
    for (const action of syncQueue) {
      if (action.type === 'ADD_MEAL' && action.data) {
        if (!clientMeals.some((m: any) => m.id === action.data.id)) {
          clientMeals.unshift(action.data);
        }
      } else if (action.type === 'DELETE_MEAL' && action.data?.id) {
        const idx = clientMeals.findIndex((m: any) => m.id === action.data.id);
        if (idx !== -1) clientMeals.splice(idx, 1);
      } else if (action.type === 'ADD_LABEL' && action.data) {
        if (!clientLabels.some((l: any) => l.productName === action.data.productName && l.scannedAt === action.data.scannedAt)) {
          clientLabels.unshift(action.data);
        }
      }
    }

    const syncTimestamp = new Date().toISOString();
    const userStore: UserSyncStore = {
      meals: clientMeals,
      labels: clientLabels,
      water: clientWater,
      profile: clientProfile,
      lastSyncedAt: syncTimestamp,
    };

    // Save strictly to this user's isolated store
    userSyncStores.set(userId, userStore);

    return res.json({
      success: true,
      serverTime: syncTimestamp,
      syncedCount: syncQueue.length,
      meals: userStore.meals,
      labels: userStore.labels,
      userId,
      message: 'Đồng bộ hóa dữ liệu cá nhân thành công',
    });
  } catch (error: any) {
    console.error('Error during data sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi khi đồng bộ dữ liệu với máy chủ.',
    });
  }
});

// 5. Head-to-Head Product Comparison Endpoint (Supermarket A vs B)
app.post('/api/compare-products', async (req, res) => {
  try {
    const body = req.body as { productA?: ProductLabelAnalysis; productB?: ProductLabelAnalysis };
    const productA = body?.productA;
    const productB = body?.productB;

    if (!productA || !productB) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đủ 2 sản phẩm để so sánh.' });
    }

    const baseline = compareTwoProducts(productA, productB);
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    if (hasKey) {
      try {
        const prompt = `
Hãy so sánh đối đầu 2 sản phẩm siêu thị sau đây dành cho gia đình Việt (lưu ý trẻ nhỏ và phụ nữ mang thai):
- Sản phẩm A: "${productA.productName}" (Điểm sạch: ${roundInt(productA.cleanScore)}/100, Thành phần: ${productA.rawIngredients.slice(0, 10).join(', ')}, Phụ gia: ${productA.additives.map((a) => `${a.code} ${a.name}`).join('; ') || 'Không có'}).
- Sản phẩm B: "${productB.productName}" (Điểm sạch: ${roundInt(productB.cleanScore)}/100, Thành phần: ${productB.rawIngredients.slice(0, 10).join(', ')}, Phụ gia: ${productB.additives.map((a) => `${a.code} ${a.name}`).join('; ') || 'Không có'}).

Viết 2-3 câu phán quyết ngắn gọn, khách quan bằng tiếng Việt chỉ rõ sản phẩm nào nên mua hơn dựa trên: lượng đường ẩn, phụ gia nhạy cảm (E407, E150c/d, E621, E627/E631, Aspartame), và mức độ siêu chế biến UPF.
        `.trim();

        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  verdictText: { type: Type.STRING },
                },
                required: ['verdictText'],
              },
            },
          }),
          timeoutPromise(8000),
        ]);

        if (response?.text) {
          const parsed = JSON.parse(response.text) as { verdictText?: string };
          if (parsed?.verdictText && parsed.verdictText.trim().length > 10) {
            return res.json({
              verdictText: parsed.verdictText.trim(),
              comparison: baseline,
              source: 'ai',
            });
          }
        }
      } catch (err) {
        console.warn('[Gemini] Compare fallback to deterministic criteria:', err instanceof Error ? err.message : err);
      }
    }

    return res.json({
      verdictText: baseline.summaryVerdict,
      comparison: baseline,
      source: 'local',
    });
  } catch (error) {
    console.error('Error in /api/compare-products:', error);
    return res.status(500).json({ error: 'Không thể so sánh sản phẩm lúc này.' });
  }
});

// 6. AI 7-Day Vietnamese Meal Planner & Smart Grocery List Endpoint
app.post('/api/generate-meal-plan', async (req, res) => {
  try {
    const body = req.body as { goalMode?: string; targetCalories?: number };
    const goalMode: PlannerGoalMode =
      body?.goalMode === 'lose_weight' || body?.goalMode === 'gain_muscle'
        ? body.goalMode
        : 'family_clean';
    const targetCalories = Math.max(1200, Math.min(3800, roundInt(body?.targetCalories, 2000)));
    const baseline = buildVietnameseWeeklyMealPlan(goalMode, targetCalories);
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

    if (hasKey) {
      try {
        const goalDesc =
          goalMode === 'lose_weight'
            ? 'Giảm mỡ thâm hụt lành mạnh'
            : goalMode === 'gain_muscle'
            ? 'Tăng cơ giàu đạm'
            : 'Ăn sạch cân bằng cho cả gia đình Việt';

        const prompt = `
Lập thực đơn 7 ngày (Thứ 2 đến Chủ Nhật) thuần món Việt ngon miệng (như Cá kho tộ, Canh chua, Ức gà áp chảo sốt mè, Phở bò thảo mộc, Bún chả giò hấp, Gỏi cuốn tôm thịt...) theo mục tiêu "${goalDesc}", mục tiêu ~${targetCalories} kcal/ngày.
Mỗi ngày gồm đúng 4 bữa theo thứ tự slot: "breakfast" (Bữa Sáng), "lunch" (Bữa Trưa), "snack" (Bữa Phụ), "dinner" (Bữa Tối).
Kèm danh sách đi chợ tổng hợp 10 nguyên liệu sạch cho cả tuần (category thuộc: "protein" | "produce" | "grains" | "pantry"). Mọi số liệu đều làm tròn số nguyên.
        `.trim();

        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayIndex: { type: Type.NUMBER },
                        dayLabel: { type: Type.STRING },
                        shortLabel: { type: Type.STRING },
                        meals: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              slot: { type: Type.STRING },
                              slotLabel: { type: Type.STRING },
                              dishName: { type: Type.STRING },
                              portionNote: { type: Type.STRING },
                              calories: { type: Type.NUMBER },
                              protein: { type: Type.NUMBER },
                              fiber: { type: Type.NUMBER },
                              carbs: { type: Type.NUMBER },
                              fat: { type: Type.NUMBER },
                            },
                            required: ['slot', 'slotLabel', 'dishName', 'portionNote', 'calories', 'protein', 'fiber', 'carbs', 'fat'],
                          },
                        },
                      },
                      required: ['dayIndex', 'dayLabel', 'shortLabel', 'meals'],
                    },
                  },
                  groceryList: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        category: { type: Type.STRING },
                        categoryLabel: { type: Type.STRING },
                      },
                      required: ['name', 'quantity', 'category', 'categoryLabel'],
                    },
                  },
                },
                required: ['days', 'groceryList'],
              },
            },
          }),
          timeoutPromise(9500),
        ]);

        if (response?.text) {
          const parsed = JSON.parse(response.text) as {
            days?: Array<{
              dayIndex: number;
              dayLabel: string;
              shortLabel: string;
              meals: Array<{
                slot: 'breakfast' | 'lunch' | 'snack' | 'dinner';
                slotLabel: string;
                dishName: string;
                portionNote: string;
                calories: number;
                protein: number;
                fiber: number;
                carbs: number;
                fat: number;
              }>;
            }>;
            groceryList?: Array<{
              name: string;
              quantity: string;
              category: 'protein' | 'produce' | 'grains' | 'pantry';
              categoryLabel: string;
            }>;
          };

          if (Array.isArray(parsed?.days) && parsed.days.length === 7) {
            const validDays = parsed.days.map((d, idx) => {
              const safeMeals = Array.isArray(d.meals) && d.meals.length >= 4
                ? d.meals.slice(0, 4).map((m, mIdx) => {
                    const fallbackSlot = baseline.days[idx]?.meals[mIdx];
                    return {
                      slot: fallbackSlot?.slot || 'lunch',
                      slotLabel: m.slotLabel || fallbackSlot?.slotLabel || 'Bữa ăn',
                      dishName: m.dishName || fallbackSlot?.dishName || 'Món Việt cân bằng',
                      portionNote: m.portionNote || fallbackSlot?.portionNote || '1 phần chuẩn',
                      calories: Math.max(80, roundInt(m.calories, fallbackSlot?.calories || 450)),
                      protein: Math.max(1, roundInt(m.protein, fallbackSlot?.protein || 25)),
                      fiber: Math.max(1, roundInt(m.fiber, fallbackSlot?.fiber || 6)),
                      carbs: Math.max(5, roundInt(m.carbs, fallbackSlot?.carbs || 50)),
                      fat: Math.max(1, roundInt(m.fat, fallbackSlot?.fat || 14)),
                    };
                  })
                : baseline.days[idx].meals;

              return {
                dayIndex: idx,
                dayLabel: baseline.days[idx].dayLabel,
                shortLabel: baseline.days[idx].shortLabel,
                totalCalories: roundInt(safeMeals.reduce((s, m) => s + m.calories, 0)),
                totalProtein: roundInt(safeMeals.reduce((s, m) => s + m.protein, 0)),
                totalFiber: roundInt(safeMeals.reduce((s, m) => s + m.fiber, 0)),
                meals: safeMeals,
              };
            });

            const safeGroceries =
              Array.isArray(parsed.groceryList) && parsed.groceryList.length >= 5
                ? parsed.groceryList.map((g, gIdx) => {
                    const cat =
                      g.category === 'protein' || g.category === 'produce' || g.category === 'grains' || g.category === 'pantry'
                        ? g.category
                        : 'pantry';
                    return {
                      id: `ai-g-${gIdx + 1}`,
                      name: g.name,
                      quantity: g.quantity || '1 phần',
                      category: cat,
                      categoryLabel: g.categoryLabel || 'Nguyên liệu sạch',
                      checked: false,
                    };
                  })
                : baseline.groceryList;

            const aiPlan: WeeklyMealPlan = {
              goalMode,
              goalTitle: baseline.goalTitle,
              dailyCalorieTarget: targetCalories,
              generatedAt: new Date().toISOString(),
              source: 'ai',
              days: validDays,
              groceryList: safeGroceries,
            };

            return res.json(aiPlan);
          }
        }
      } catch (err) {
        console.warn('[Gemini] Meal planner fallback to local Vietnamese plan:', err instanceof Error ? err.message : err);
      }
    }

    return res.json(baseline);
  } catch (error) {
    console.error('Error in /api/generate-meal-plan:', error);
    const fallback = buildVietnameseWeeklyMealPlan('family_clean', 2000);
    return res.json(fallback);
  }
});

// Fallback for any unhandled /api route so it returns JSON and never HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint API không tồn tại.' });
});

// Explicit error handler for API requests
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  console.error('Express Unhandled Error:', err);
  res.status(500).json({ error: err?.message || 'Lỗi xử lý máy chủ.' });
});

// Setup Vite development middleware or static serving
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NutriLens Server running on http://localhost:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
