/**
 * AI 智能解析服务
 * 支持自然语言文本解析为结构化记账数据
 * 优先使用规则引擎，可选对接大模型
 */

interface ParseResult {
  amount: number;
  category: string;
  description: string;
  type: 'expense' | 'income';
  date?: string;
  confidence: number;
}

// 类别关键词映射
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '餐饮': ['吃', '饭', '餐', '午餐', '晚餐', '早餐', '外卖', '火锅', '烧烤', '奶茶', '咖啡', '零食', '水果', '菜', '食', '喝', '饮', '小吃', '面', '粉', '汤', '茶', '酒', '点心', '蛋糕', '面包', '快餐', '食堂', '下午茶', '夜宵', '聚餐', '请客', '饮料', '超市买菜'],
  '交通': ['打车', '出租', '地铁', '公交', '滴滴', '高铁', '火车', '飞机', '机票', '车票', '加油', '停车', '过路费', '通勤', 'uber', '骑车', '单车', '共享'],
  '购物': ['买', '购', '淘宝', '京东', '拼多多', '网购', '超市', '商场', '日用', '生活用品', '采购'],
  '娱乐': ['电影', '游戏', 'KTV', '唱歌', '旅游', '门票', '演出', '音乐', '健身', '运动', '充值', '会员', '订阅'],
  '医疗': ['医院', '看病', '药', '体检', '挂号', '牙', '眼', '保健', '医疗'],
  '教育': ['书', '课', '学习', '培训', '教育', '考试', '学费', '文具'],
  '居住': ['房租', '水电', '物业', '维修', '装修', '家具', '家电', '租金'],
  '通讯': ['话费', '流量', '宽带', '网费', '手机', '充值'],
  '服饰': ['衣服', '鞋', '包', '帽', '裤', '裙', '外套', '内衣', '配饰', '首饰'],
  '工资': ['工资', '薪水', '月薪', '发工资'],
  '奖金': ['奖金', '年终奖', '绩效', '提成', '红包'],
  '投资': ['投资', '理财', '股票', '基金', '分红', '利息', '收益'],
  '其他收入': ['退款', '报销', '转账收入', '收到'],
};

const INCOME_CATEGORIES = ['工资', '奖金', '投资', '其他收入'];

// 金额提取正则
const AMOUNT_PATTERNS = [
  /(\d+(?:\.\d{1,2})?)\s*(?:元|块|¥|￥|rmb|RMB)/,
  /(?:花了|花费|消费|支出|收入|赚了|入账|到账)\s*(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)\s*(?:花|块钱|元钱)/,
  /(?:¥|￥)\s*(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)/,  // 兜底：匹配任何数字
];

// 日期提取
const DATE_PATTERNS: Array<{ regex: RegExp; handler: (match: RegExpMatchArray) => string }> = [
  {
    regex: /(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/,
    handler: (m) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
  },
  {
    regex: /(\d{1,2})[月.](\d{1,2})[日号]?/,
    handler: (m) => {
      const year = new Date().getFullYear();
      return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    },
  },
  {
    regex: /今天/,
    handler: () => new Date().toISOString().split('T')[0],
  },
  {
    regex: /昨天/,
    handler: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    },
  },
  {
    regex: /前天/,
    handler: () => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d.toISOString().split('T')[0];
    },
  },
];

/**
 * 使用规则引擎解析自然语言文本
 */
export function parseExpenseText(text: string): ParseResult {
  const cleanText = text.trim();

  // 1. 提取金额
  let amount = 0;
  for (const pattern of AMOUNT_PATTERNS) {
    const match = cleanText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      break;
    }
  }

  // 2. 识别类别
  let category = '其他';
  let maxScore = 0;
  let type: 'expense' | 'income' = 'expense';

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (cleanText.includes(kw)) {
        score += kw.length; // 更长的关键词权重更高
      }
    }
    if (score > maxScore) {
      maxScore = score;
      category = cat;
      type = INCOME_CATEGORIES.includes(cat) ? 'income' : 'expense';
    }
  }

  // 3. 提取日期
  let date: string | undefined;
  for (const { regex, handler } of DATE_PATTERNS) {
    const match = cleanText.match(regex);
    if (match) {
      date = handler(match);
      break;
    }
  }

  // 4. 生成描述（去掉金额和日期部分）
  let description = cleanText
    .replace(/\d+(?:\.\d{1,2})?\s*(?:元|块|¥|￥|rmb|RMB|块钱|元钱)?/g, '')
    .replace(/(?:花了|花费|消费|支出|收入|赚了|入账|到账)/g, '')
    .replace(/(?:今天|昨天|前天)/g, '')
    .replace(/\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2}/g, '')
    .replace(/\d{1,2}[月.]\d{1,2}[日号]?/g, '')
    .trim();

  if (!description) {
    description = category;
  }

  // 5. 计算置信度
  let confidence = 0.5;
  if (amount > 0) confidence += 0.2;
  if (maxScore > 0) confidence += 0.2;
  if (date) confidence += 0.1;

  return {
    amount,
    category,
    description,
    type,
    date,
    confidence: Math.min(confidence, 1.0),
  };
}

/**
 * 使用 OpenAI 兼容 API 解析（可选增强）
 */
export async function parseWithAI(text: string): Promise<ParseResult> {
  // 先用规则引擎解析
  const ruleResult = parseExpenseText(text);

  // 如果规则引擎置信度足够高，直接返回
  if (ruleResult.confidence >= 0.8) {
    return ruleResult;
  }

  // 尝试使用 AI 增强
  try {
    const { OpenAI } = await import('openai');
    const client = new OpenAI();

    const response = await client.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `你是一个智能记账助手。用户会输入一句话描述一笔消费或收入，你需要从中提取以下信息并以 JSON 格式返回：
- amount: 金额（数字）
- category: 类别（从以下选择：餐饮、交通、购物、娱乐、医疗、教育、居住、通讯、服饰、其他、工资、奖金、投资、其他收入）
- description: 简短描述
- type: "expense" 或 "income"
- date: 日期（YYYY-MM-DD 格式，如果没提到日期则不填）

只返回 JSON，不要其他文字。`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        amount: parsed.amount || ruleResult.amount,
        category: parsed.category || ruleResult.category,
        description: parsed.description || ruleResult.description,
        type: parsed.type || ruleResult.type,
        date: parsed.date || ruleResult.date,
        confidence: 0.95,
      };
    }
  } catch (error) {
    console.log('AI parsing fallback to rule engine:', error);
  }

  return ruleResult;
}
