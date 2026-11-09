import { AnalyzedMeal, ProductLabelAnalysis, UserNutritionProfile, MealLogEntry } from '../types';

export const DEFAULT_PROFILE: UserNutritionProfile = {
  targetCalories: 2000,
  targetProtein: 130, // grams
  targetCarbs: 220,   // grams
  targetFat: 60,      // grams
  targetWaterMl: 2500, // ml
  currentWeight: 68,  // kg
  goalWeight: 65,     // kg
  gender: 'male',
  activityLevel: 'moderate',
  dietGoal: 'lose_weight',
};

export interface SampleMealItem {
  id: string;
  name: string;
  thumbnail: string;
  data: AnalyzedMeal;
}

export const SAMPLE_MEALS: SampleMealItem[] = [
  {
    id: 'com-tam',
    name: 'Cơm tấm sườn bì chả trứng',
    thumbnail: '/src/assets/images/vietnamese_broken_rice_1793979514544.jpg',
    data: {
      dishName: 'Broken rice with grilled pork chop, egg meatloaf, and shredded pork skin',
      vietnameseName: 'Cơm tấm sườn nướng, chả trứng & bì heo',
      estimatedTotalGrams: 480,
      calories: 785,
      protein: 42,
      carbs: 88,
      fat: 29,
      fiber: 4.5,
      healthScore: 6.8,
      healthSummary: 'Bữa ăn đậm đà năng lượng, lượng protein dồi dào từ sườn và chả trứng, tuy nhiên lượng calo và chất béo khá cao từ mỡ hành và bì.',
      dietaryTags: ['Món truyền thống', 'Giàu đạm', 'Calo cao', 'Món Việt kinh điển'],
      advice: 'Nên yêu cầu ít mỡ hành, ăn kèm nhiều dưa leo và cà chua để bổ sung chất xơ và kiểm soát calo nếu bạn đang thâm hụt giảm cân.',
      ingredients: [
        { name: 'Cơm tấm trắng', weightGrams: 200, calories: 260, protein: 5.4, carbs: 57, fat: 0.6 },
        { name: 'Sườn cốt lết nướng mật ong', weightGrams: 140, calories: 310, protein: 26, carbs: 6, fat: 20 },
        { name: 'Chả trứng hấp thịt', weightGrams: 60, calories: 125, protein: 7.5, carbs: 3, fat: 9 },
        { name: 'Bì heo trộn thính gạo', weightGrams: 30, calories: 55, protein: 2.8, carbs: 4, fat: 3.2 },
        { name: 'Mỡ hành & nước mắm chua ngọt', weightGrams: 20, calories: 30, protein: 0.3, carbs: 3, fat: 2 },
        { name: 'Dưa leo, cà chua, đồ chua', weightGrams: 30, calories: 5, protein: 0.3, carbs: 1, fat: 0 },
      ],
    },
  },
  {
    id: 'pho-bo',
    name: 'Phở bò tái nạm Hà Nội',
    thumbnail: '/src/assets/images/hanoi_pho_bo_1793979515118.jpg',
    data: {
      dishName: 'Hanoi beef noodle soup (Pho bo tai nam)',
      vietnameseName: 'Phở bò tái nạm thảo mộc',
      estimatedTotalGrams: 650,
      calories: 520,
      protein: 36,
      carbs: 64,
      fat: 14,
      fiber: 3.2,
      healthScore: 8.5,
      healthSummary: 'Món ăn cân bằng tuyệt vời giữa nước hầm xương giàu collagen, thảo mộc kháng viêm (quế, hồi, thảo quả) và thịt bò nạc giàu sắt & kẽm.',
      dietaryTags: ['Cân bằng dinh dưỡng', 'Giàu đạm', 'Ít dầu mỡ', 'Món nước dễ tiêu'],
      advice: 'Để tối ưu cho tim mạch và huyết áp, hạn chế húp cạn nước dùng vì chứa hàm lượng muối và natri đáng kể.',
      ingredients: [
        { name: 'Bánh phở tươi', weightGrams: 180, calories: 200, protein: 3.8, carbs: 45, fat: 0.5 },
        { name: 'Thịt bò tái & nạm bò luộc', weightGrams: 130, calories: 215, protein: 28, carbs: 0, fat: 11 },
        { name: 'Nước dùng hầm xương thảo mộc', weightGrams: 300, calories: 85, protein: 4, carbs: 3, fat: 6 },
        { name: 'Hành hoa, rau mùi, húng quế, giá', weightGrams: 40, calories: 20, protein: 0.8, carbs: 3, fat: 0.2 },
      ],
    },
  },
  {
    id: 'salad-uc-ga',
    name: 'Salad ức gà áp chảo sốt mè rang bơ',
    thumbnail: '/src/assets/images/healthy_chicken_salad_1793979515622.jpg',
    data: {
      dishName: 'Grilled chicken breast salad with avocado & roasted sesame dressing',
      vietnameseName: 'Salad ức gà áp chảo bơ tươi sốt mè',
      estimatedTotalGrams: 380,
      calories: 430,
      protein: 38,
      carbs: 18,
      fat: 24,
      fiber: 8.2,
      healthScore: 9.4,
      healthSummary: 'Đĩa ăn chuẩn Eat Clean lý tưởng! Rất giàu đạm tinh khiết giúp phục hồi cơ bắp, chất béo không bão hòa đơn tốt cho tim từ quả bơ và dồi dào chất xơ.',
      dietaryTags: ['Eat Clean', 'Low Carb', 'Giàu Protein', 'Tốt cho tim mạch'],
      advice: 'Kiểm soát lượng sốt mè rang vì sốt này thường có đường và dầu. Dùng khoảng 1.5 thìa canh là hoàn hảo.',
      ingredients: [
        { name: 'Ức gà áp chảo không da', weightGrams: 150, calories: 195, protein: 34, carbs: 0, fat: 4.5 },
        { name: 'Quả bơ sáp cắt lát', weightGrams: 60, calories: 96, protein: 1.2, carbs: 5, fat: 9 },
        { name: 'Xà lách Romaine, cà chua bi, dưa leo', weightGrams: 120, calories: 28, protein: 1.8, carbs: 5, fat: 0.3 },
        { name: 'Sốt mè rang Nhật Bản', weightGrams: 30, calories: 95, protein: 1, carbs: 6, fat: 8 },
        { name: 'Trứng gà luộc lòng đào', weightGrams: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
      ],
    },
  },
  {
    id: 'banh-mi-thit',
    name: 'Bánh mì thịt nướng pate Sài Gòn',
    thumbnail: '/src/assets/images/banh_mi_vietnam_1793979516012.jpg',
    data: {
      dishName: 'Vietnamese sandwich with grilled lemongrass pork and pate',
      vietnameseName: 'Bánh mì sả ớt thịt nướng giòn rụm',
      estimatedTotalGrams: 240,
      calories: 490,
      protein: 24,
      carbs: 58,
      fat: 19,
      fiber: 3.8,
      healthScore: 7.2,
      healthSummary: 'Bữa sáng nhanh gọn, hương vị bùng nổ. Có tỷ lệ đạm từ thịt nướng và pate khá tốt kết hợp rau dưa giòn giúp chống ngấy.',
      dietaryTags: ['Bữa sáng nhanh', 'Tiện lợi', 'Món đường phố'],
      advice: 'Nếu đang trong chu kỳ siết cân, bạn có thể xin bớt bơ/mayonnaise và yêu cầu thêm nhiều dưa leo ngò rí.',
      ingredients: [
        { name: 'Ổ bánh mì giòn', weightGrams: 85, calories: 230, protein: 7.5, carbs: 46, fat: 1.5 },
        { name: 'Thịt heo nướng sả ướp ngũ vị', weightGrams: 80, calories: 170, protein: 14, carbs: 3, fat: 11 },
        { name: 'Pate gan heo mịn', weightGrams: 25, calories: 65, protein: 3, carbs: 1, fat: 5.5 },
        { name: 'Bơ thực vật & sốt chan', weightGrams: 15, calories: 45, protein: 0.2, carbs: 2, fat: 4 },
        { name: 'Đồ chua củ cải cà rốt, ngò, ớt', weightGrams: 35, calories: 12, protein: 0.5, carbs: 2.5, fat: 0.1 },
      ],
    },
  },
];

export interface SampleLabelItem {
  id: string;
  name: string;
  brand: string;
  thumbnail: string;
  data: ProductLabelAnalysis;
}

export const SAMPLE_LABELS: SampleLabelItem[] = [
  {
    id: 'hat-nem-cong-nghiep',
    name: 'Hạt nêm Xương hầm Công nghiệp',
    brand: 'Knorr / Aji-ngon',
    thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
    data: {
      productName: 'Hạt nêm từ Thịt Thăn, Xương Ống & Tủy',
      brandName: 'Dòng gia vị công nghiệp phổ thông',
      category: 'Gia vị hạt nêm',
      verdict: 'CONSIDER',
      verdictHeadline: 'CÂN NHẮC DÙNG CÓ KIỂM SOÁT - Bột ngọt và muối chiếm hơn 70%, xương thịt thực tế dưới 2%',
      cleanScore: 42,
      summary: 'Mặc dù quảng bá chiết xuất từ xương ống và thịt thăn, thực tế thành phần chính đứng đầu danh sách là Muối, Đường tinh luyện và Bột ngọt cùng Siêu bột ngọt (E621, E627, E631). Bột chiết xuất thịt chỉ chiếm hàm lượng rất khiêm tốn (khoảng 1.8% - 2%).',
      rawIngredients: [
        'Muối I-ốt',
        'Chất điều vị (Mononatri glutamat E621)',
        'Đường tinh luyện',
        'Bột sắn',
        'Bột thịt và bột chiết xuất xương ống & tủy (1.8%)',
        'Mỡ thịt heo',
        'Hương thịt tổng hợp',
        'Chất điều vị (Dinatri 5\'-ribonucleotid E635 gồm E627 + E631)',
        'Phẩm màu tự nhiên (Beta-caroten E160a)',
      ],
      additives: [
        {
          code: 'E621 (INS 621)',
          name: 'Monosodium Glutamate (Bột ngọt/Mì chính)',
          category: 'Chất điều vị Umami',
          riskLevel: 'moderate',
          purpose: 'Tạo vị ngọt đậm đà giả lập nước hầm thịt lâu năm.',
          healthEffects: 'Người nhạy cảm có thể bị nóng gáy, tê môi, tim đập nhanh. Tăng gánh nặng natri lên thận.',
        },
        {
          code: 'E627 + E631 (INS 635)',
          name: 'Dinatri Inosinate & Dinatri Guanylate (Siêu bột ngọt)',
          category: 'Chất điều vị tăng cường gấp 10-15 lần MSG',
          riskLevel: 'high_concern',
          purpose: 'Cộng hưởng với E621 tạo cảm giác nước dùng đặc sánh như hầm tủy cả ngày.',
          healthEffects: 'Chuyển hóa thành Purine trong cơ thể, trực tiếp làm tăng Acid Uric máu, nguy cơ gây bùng phát cơn Gout cấp.',
        },
        {
          code: 'Flavor Synthetics',
          name: 'Hương thịt và tủy heo tổng hợp',
          category: 'Hương liệu nhân tạo',
          riskLevel: 'moderate',
          purpose: 'Bù đắp mùi thơm thịt do tỷ lệ thịt thật quá thấp.',
          healthEffects: 'Không có giá trị dinh dưỡng, có thể kích ứng hệ tiêu hóa nhạy cảm của trẻ nhỏ.',
        },
      ],
      healthWarnings: [
        'Người bị bệnh Gout hoặc Acid Uric cao tuyệt đối nên tránh dùng các loại hạt nêm chứa E627, E631.',
        'Hàm lượng Natri (Muối) ẩn cực cao: 1 muỗng hạt nêm có thể chứa tới 40% lượng muối khuyến nghị tối đa mỗi ngày.',
        'Không dùng cho trẻ em dưới 3 tuổi vì vị giác của bé còn non nớt, dễ bị nghiện vị ngọt hóa chất.',
      ],
      nutritionAlerts: {
        highSodium: true,
        highSugar: true,
        transFat: false,
        hasHiddenChemicals: true,
      },
      betterAlternatives: [
        'Tự nấu nước dùng rau củ tự nhiên từ củ cải, bắp ngọt, hành tây và cà rốt.',
        'Sử dụng Bột nêm nấm hương hữu cơ hoặc Bột nêm rong biển Kombu không bổ sung MSG.',
        'Dùng nước hầm xương thật ninh chậm tại nhà rồi chia nhỏ đông lạnh thành viên đá dùng dần.',
      ],
    },
  },
  {
    id: 'tuong-ot-pho-bien',
    name: 'Tương ớt Đỏ Đậm Phổ Biến',
    brand: 'Chinsu / Cholimex',
    thumbnail: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&auto=format&fit=crop&q=80',
    data: {
      productName: 'Tương ớt cay nồng đậm vị đóng chai',
      brandName: 'Thương hiệu phổ thông siêu thị',
      category: 'Gia vị tương ớt',
      verdict: 'PASS',
      verdictHeadline: 'NÊN HẠN CHẾ / TRÁNH DÙNG - Chứa phẩm màu tổng hợp E110/E124, chất bảo quản kép và đường tinh luyện cao',
      cleanScore: 28,
      summary: 'Sản phẩm sử dụng ớt tươi nhưng kết hợp nhiều phụ gia hóa học nhằm kéo dài hạn sử dụng và tạo màu sắc rực rỡ bắt mắt: chất bảo quản Natri Benzoat (E211), Kali Sorbat (E202), phẩm màu nhân tạo Sunset Yellow (E110), Ponceau 4R (E124), chất làm dày tinh bột biến tính E1422 và chất tạo ngọt nhân tạo Acesulfame K (E950).',
      rawIngredients: [
        'Nước',
        'Đường tinh luyện (vị trí thứ 2 trong bảng thành phần)',
        'Ớt tươi (21%)',
        'Muối ăn',
        'Chất làm dày (Tinh bột biến tính E1422, Xanthan gum E415)',
        'Chất điều vị (E621, E627, E631)',
        'Chất điều chỉnh độ acid (E260, E330)',
        'Chất bảo quản (Natri benzoat E211, Kali sorbat E202)',
        'Chất tạo ngọt tổng hợp (Acesulfam kali E950, Aspartam E951)',
        'Chất tạo màu tổng hợp (Sunset yellow FCF E110, Ponceau 4R E124)',
      ],
      additives: [
        {
          code: 'E110 & E124',
          name: 'Sunset Yellow FCF & Ponceau 4R (Phẩm màu Azo)',
          category: 'Phẩm màu tổng hợp hóa dầu',
          riskLevel: 'high_concern',
          purpose: 'Giữ màu đỏ cam tươi sáng không bị phai màu theo thời gian.',
          healthEffects: 'Đã bị cấm hoặc bắt buộc dán nhãn cảnh báo tại Liên minh Châu Âu (EU) vì liên quan đến chứng tăng động (ADHD) ở trẻ em và dị ứng da.',
        },
        {
          code: 'E211 (INS 211)',
          name: 'Sodium Benzoate (Natri Benzoat)',
          category: 'Chất bảo quản chống nấm mốc',
          riskLevel: 'moderate',
          purpose: 'Ngăn chặn nấm men và vi khuẩn phát triển, cho phép để ngoài nhiệt độ phòng cả năm.',
          healthEffects: 'Khi kết hợp với Vitamin C (Axit Ascorbic) có thể phản ứng tạo ra một lượng nhỏ Benzene (chất gây ung thư nhóm 1).',
        },
        {
          code: 'E950 & E951',
          name: 'Acesulfame K & Aspartame',
          category: 'Chất tạo ngọt nhân tạo năng lượng thấp',
          riskLevel: 'moderate',
          purpose: 'Tăng vị ngọt gắt mà giảm chi phí đường thật.',
          healthEffects: 'Có thể làm mất cân bằng hệ vi sinh đường ruột và kích thích cảm giác thèm ăn đồ ngọt.',
        },
      ],
      healthWarnings: [
        'Trẻ nhỏ và người có tiền sử dị ứng, hen suyễn không nên dùng sản phẩm chứa phẩm màu E110 và E124.',
        'Hàm lượng đường ẩn cao: vị ngọt đậm át vị cay tự nhiên, không phù hợp cho người tiểu đường hoặc đang ăn kiêng.',
      ],
      nutritionAlerts: {
        highSodium: true,
        highSugar: true,
        transFat: false,
        hasHiddenChemicals: true,
      },
      betterAlternatives: [
        'Chọn các loại Tương ớt lên men thủ công (Sriracha hữu cơ, tương ớt Mường Khương, tương ớt lên men vi sinh) chỉ gồm: ớt, tỏi, giấm, đường phèn, muối.',
        'Tự làm sa tế hoặc ớt băm ngâm giấm tỏi tươi tại nhà - vừa thơm ngon vừa tuyệt đối an toàn.',
      ],
    },
  },
  {
    id: 'nuoc-mam-cong-nghiep',
    name: 'Nước mắm Hương Cá hồi Công nghiệp',
    brand: 'Nam Ngư / Đệ Nhị',
    thumbnail: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80',
    data: {
      productName: 'Nước chấm Nam Ngư Đệ Nhị hương cá hồi',
      brandName: 'Dòng nước mắm pha chế công nghiệp',
      category: 'Gia vị nước mắm/nước chấm',
      verdict: 'PASS',
      verdictHeadline: 'NÊN TRÁNH DÙNG THƯỜNG XUYÊN - Đây là nước chấm pha loãng với hơn 15 chất phụ gia điều vị, không phải nước mắm nguyên chất',
      cleanScore: 35,
      summary: 'Theo tiêu chuẩn, sản phẩm này thực chất là "Nước chấm" pha chế chứ không phải nước mắm truyền thống. Tỷ lệ cốt cá rất loãng (độ đạm chỉ khoảng 10-12°N), màu sắc và vị mặn ngọt được tạo nên từ muối, đường, chất điều vị E621, E627, E631, E640, chất tạo ngọt tổng hợp, phẩm màu caramel và hương cá hồi tổng hợp.',
      rawIngredients: [
        'Nước',
        'Muối ăn',
        'Đạm đậu nành thủy phân',
        'Tinh cốt cá cơm (hàm lượng thấp)',
        'Đường tinh luyện',
        'Chất điều vị (Mononatri glutamat E621, Dinatri inosinat E631, Dinatri guanylat E627, Glycin E640)',
        'Chất điều chỉnh độ acid (E330)',
        'Hương cá hồi tổng hợp',
        'Chất bảo quản (Kali sorbat E202, Natri benzoat E211)',
        'Chất làm dày (E415)',
        'Phẩm màu tổng hợp (Caramel nhóm III E150c, màu vàng carmine)',
        'Chất tạo ngọt tổng hợp (Aspartam E951)',
      ],
      additives: [
        {
          code: 'E640 (INS 640)',
          name: 'Glycine (Chất điều vị và đệm)',
          category: 'Chất điều vị công nghiệp',
          riskLevel: 'moderate',
          purpose: 'Giảm bớt vị mặn chát của muối pha loãng và giả vị ngọt thịt tự nhiên.',
          healthEffects: 'Dùng quá mức có thể gây xáo trộn cân bằng axit amin trong khẩu phần.',
        },
        {
          code: 'E150c',
          name: 'Caramel loại III (Ammonia Caramel)',
          category: 'Phẩm màu nâu cánh gián',
          riskLevel: 'moderate',
          purpose: 'Tạo màu nâu hổ phách đẹp như nước mắm nhỉ thật mà không cần ủ chượp cá cả năm.',
          healthEffects: 'Quy trình sản xuất có thể tạo ra hợp chất 4-MEI (4-methylimidazole), cần kiểm soát liều lượng.',
        },
        {
          code: 'Synthetic Salmon Flavor',
          name: 'Hương cá hồi tổng hợp',
          category: 'Hương liệu tạo mùi',
          riskLevel: 'safe',
          purpose: 'Tạo mùi thơm giả lập của cá đắt tiền.',
          healthEffects: 'Hóa chất tạo mùi, đánh lừa khứu giác người tiêu dùng.',
        },
      ],
      healthWarnings: [
        'Độ đạm sinh học thấp, đạm chủ yếu là đạm phân hủy từ đậu nành và chất điều vị chứ không phải axit amin từ cá biển.',
        'Chứa chất tạo ngọt Aspartame - người mắc bệnh Phenylketonuria (PKU) không được sử dụng.',
      ],
      nutritionAlerts: {
        highSodium: true,
        highSugar: true,
        transFat: false,
        hasHiddenChemicals: true,
      },
      betterAlternatives: [
        'Chuyển sang Nước mắm truyền thống sạch (Khải Hoàn Phú Quốc, Ba Làng Thanh Hóa, Cà Ná, Phan Thiết) chỉ có đúng 2 thành phần: Cá cơm tươi và Muối biển.',
        'Nước mắm truyền thống có độ đạm tự nhiên 30-40°N giàu vitamin B12, sắt và axit amin thiết yếu mà không cần bất kỳ chất bảo quản nào.',
      ],
    },
  },
  {
    id: 'nuoc-mam-truyen-thong',
    name: 'Nước mắm Cốt Nhĩ Truyền Thống Phú Quốc',
    brand: 'Khải Hoàn / Ông Kỳ',
    thumbnail: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&auto=format&fit=crop&q=80',
    data: {
      productName: 'Nước mắm Cốt Cá Cơm Than 40°N Đậm Đặc',
      brandName: 'Nước mắm truyền thống chỉ dẫn địa lý',
      category: 'Gia vị nước mắm sạch',
      verdict: 'BUY',
      verdictHeadline: 'RẤT NÊN MUA (CLEAN FOOD) - 100% tự nhiên, chỉ có Cá cơm và Muối biển ủ thùng gỗ 12 tháng',
      cleanScore: 98,
      summary: 'Sản phẩm vàng của ẩm thực sạch Việt Nam! Được ủ chượp tự nhiên từ Cá cơm than tươi rói đánh bắt ngoài khơi và muối hạt tinh khiết trong thùng gỗ bời lời từ 12-15 tháng. Hoàn toàn không có chất bảo quản, không chất điều vị, không phẩm màu và không đường hóa học. Nước mắm tự bảo quản bằng chính độ mặn bão hòa của muối biển.',
      rawIngredients: [
        'Cá cơm than Phú Quốc tươi (75%)',
        'Muối biển tinh khiết Bà Rịa (25%)',
      ],
      additives: [],
      healthWarnings: [
        'Vì là nước mắm cốt nguyên chất không pha loãng nên có độ mặn đậm đà tự nhiên. Người cao huyết áp nên chấm nhẹ vừa phải.',
      ],
      nutritionAlerts: {
        highSodium: true,
        highSugar: false,
        transFat: false,
        hasHiddenChemicals: false,
      },
      betterAlternatives: [
        'Đây đã là sản phẩm hảo hạng và sạch nhất trên thị trường! Bạn có thể an tâm sử dụng hàng ngày.',
      ],
    },
  },
];

export const INITIAL_MEAL_LOGS: MealLogEntry[] = [
  {
    id: 'log-1',
    mealType: 'breakfast',
    loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    ...SAMPLE_MEALS[1].data,
    imageUrl: SAMPLE_MEALS[1].thumbnail,
  },
  {
    id: 'log-2',
    mealType: 'lunch',
    loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    ...SAMPLE_MEALS[2].data,
    imageUrl: SAMPLE_MEALS[2].thumbnail,
  },
];
