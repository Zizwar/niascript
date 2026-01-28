// src/core/nia-local-extended.js - المحرك المحلي الموسع
// قدرات محلية إضافية بدون API!

/**
 * LocalEngineExtended - محرك محلي موسع
 *
 * القدرات الجديدة:
 * - التواريخ والوقت
 * - تحويل الوحدات
 * - المقارنات والشروط
 * - النصوص والتحويلات
 * - القوائم والتجميع
 * - الإحصائيات الأساسية
 */

export class LocalEngineExtended {
  constructor() {
    this.setupProcessors();
  }

  setupProcessors() {
    // معالجات مرتبة حسب الأولوية
    this.processors = [
      // التواريخ
      { name: 'date_diff', pattern: /(?:كم|how many)\s*(?:يوم|أيام|days?)\s*(?:بين|من|between|from)\s*(.+?)\s*(?:و|إلى|to|and)\s*(.+)/i, handler: this.dateDiff.bind(this) },
      { name: 'date_add', pattern: /(?:أضف|add)\s*(\d+)\s*(يوم|أيام|days?|شهر|أشهر|months?|سنة|سنوات?|years?)\s*(?:إلى|to|على)\s*(.+)/i, handler: this.dateAdd.bind(this) },
      { name: 'date_now', pattern: /(?:ما هو|what is|اليوم|today|الآن|now|التاريخ|date)/i, handler: this.dateNow.bind(this) },
      { name: 'age', pattern: /(?:عمر|age|كم عمر)\s*(?:من|of|لـ?)?\s*(?:مولود|born)?\s*(?:في|on|at)?\s*(.+)/i, handler: this.calculateAge.bind(this) },

      // تحويل الوحدات
      { name: 'length', pattern: /(\d+(?:\.\d+)?)\s*(كم|km|كيلومتر|متر|m|meter|ميل|mile|mi|قدم|ft|feet|بوصة|inch|in|سم|cm)\s*(?:إلى|to|=|للـ?|ل)\s*(كم|km|كيلومتر|متر|m|meter|ميل|mile|mi|قدم|ft|feet|بوصة|inch|in|سم|cm)/i, handler: this.convertLength.bind(this) },
      { name: 'weight', pattern: /(\d+(?:\.\d+)?)\s*(كجم|kg|كيلو|جرام|g|gram|رطل|lb|pound|أونصة|oz|ounce)\s*(?:إلى|to|=|للـ?|ل)\s*(كجم|kg|كيلو|جرام|g|gram|رطل|lb|pound|أونصة|oz|ounce)/i, handler: this.convertWeight.bind(this) },
      { name: 'temperature', pattern: /(\d+(?:\.\d+)?)\s*°?\s*(c|f|celsius|fahrenheit|مئوية?|فهرنهايت)\s*(?:إلى|to|=|للـ?|ل)\s*°?\s*(c|f|celsius|fahrenheit|مئوية?|فهرنهايت)/i, handler: this.convertTemperature.bind(this) },
      { name: 'data', pattern: /(\d+(?:\.\d+)?)\s*(byte|bytes|kb|mb|gb|tb|بايت|كيلوبايت|ميجا|جيجا|تيرا)\s*(?:إلى|to|=|للـ?|ل)\s*(byte|bytes|kb|mb|gb|tb|بايت|كيلوبايت|ميجا|جيجا|تيرا)/i, handler: this.convertData.bind(this) },

      // الإحصائيات
      { name: 'average', pattern: /(?:متوسط|average|avg|mean)\s*(?:لـ?|of)?\s*\[?\s*([\d,.\s]+)\s*\]?/i, handler: this.calculateAverage.bind(this) },
      { name: 'sum', pattern: /(?:مجموع|sum|total|إجمالي)\s*(?:لـ?|of)?\s*\[?\s*([\d,.\s]+)\s*\]?/i, handler: this.calculateSum.bind(this) },
      { name: 'min_max', pattern: /(?:أكبر|أصغر|max|min|maximum|minimum)\s*(?:في|من|of|in)?\s*\[?\s*([\d,.\s]+)\s*\]?/i, handler: this.findMinMax.bind(this) },
      { name: 'count', pattern: /(?:عدد|count|كم عدد)\s*(?:العناصر|items|elements)?\s*(?:في|of|in)?\s*\[?\s*(.+)\s*\]?/i, handler: this.countItems.bind(this) },

      // النصوص
      { name: 'text_length', pattern: /(?:طول|length|عدد حروف|chars)\s*(?:النص|text|لـ)?\s*["'](.+)["']/i, handler: this.textLength.bind(this) },
      { name: 'text_reverse', pattern: /(?:اعكس|reverse)\s*["'](.+)["']/i, handler: this.textReverse.bind(this) },
      { name: 'text_upper', pattern: /(?:كبّر|uppercase|upper|UPPER)\s*["'](.+)["']/i, handler: this.textUpper.bind(this) },
      { name: 'text_lower', pattern: /(?:صغّر|lowercase|lower|LOWER)\s*["'](.+)["']/i, handler: this.textLower.bind(this) },

      // المقارنات
      { name: 'compare', pattern: /(?:هل|is|قارن|compare)\s*(\d+(?:\.\d+)?)\s*(>|<|>=|<=|==|!=|أكبر من|أصغر من|يساوي|لا يساوي)\s*(\d+(?:\.\d+)?)/i, handler: this.compare.bind(this) },
      { name: 'between', pattern: /(?:هل|is)\s*(\d+(?:\.\d+)?)\s*(?:بين|between)\s*(\d+(?:\.\d+)?)\s*(?:و|and)\s*(\d+(?:\.\d+)?)/i, handler: this.isBetween.bind(this) },

      // الأرقام المتقدمة
      { name: 'factorial', pattern: /(?:مضروب|factorial)\s*(\d+)!?/i, handler: this.factorial.bind(this) },
      { name: 'sqrt', pattern: /(?:جذر|sqrt|square root)\s*(\d+(?:\.\d+)?)/i, handler: this.sqrt.bind(this) },
      { name: 'power', pattern: /(\d+(?:\.\d+)?)\s*(?:أس|power|\^|مرفوع لـ)\s*(\d+(?:\.\d+)?)/i, handler: this.power.bind(this) },
      { name: 'random', pattern: /(?:عشوائي|random)\s*(?:بين|between)?\s*(\d+)?\s*(?:و|and|-)?\s*(\d+)?/i, handler: this.random.bind(this) },
      { name: 'round', pattern: /(?:قرّب|round)\s*(\d+(?:\.\d+)?)\s*(?:إلى|to)?\s*(\d+)?\s*(?:خانات?|decimals?)?/i, handler: this.round.bind(this) },

      // البرمجة
      { name: 'base_convert', pattern: /(?:حوّل|convert)\s*(\w+)\s*(?:من|from)\s*(binary|hex|decimal|ثنائي|ست عشري|عشري)\s*(?:إلى|to)\s*(binary|hex|decimal|ثنائي|ست عشري|عشري)/i, handler: this.baseConvert.bind(this) },
      { name: 'is_prime', pattern: /(?:هل|is)\s*(\d+)\s*(?:أولي|prime)/i, handler: this.isPrime.bind(this) },
      { name: 'is_even_odd', pattern: /(?:هل|is)\s*(\d+)\s*(?:زوجي|فردي|even|odd)/i, handler: this.isEvenOdd.bind(this) },

      // الوقت
      { name: 'time_convert', pattern: /(\d+(?:\.\d+)?)\s*(ثانية|ثواني|seconds?|s|دقيقة|دقائق|minutes?|min|ساعة|ساعات|hours?|h)\s*(?:إلى|to|=|للـ?|ل|كم)\s*(ثانية|ثواني|seconds?|s|دقيقة|دقائق|minutes?|min|ساعة|ساعات|hours?|h)/i, handler: this.convertTime.bind(this) },
    ];
  }

  /**
   * محاولة معالجة النية محلياً
   */
  tryProcess(intent) {
    const normalized = this.normalize(intent);

    for (const processor of this.processors) {
      const match = normalized.match(processor.pattern);
      if (match) {
        try {
          const result = processor.handler(match);
          if (result) {
            return {
              success: true,
              type: processor.name,
              ...result,
              source: 'local-extended',
              cost: 0
            };
          }
        } catch (e) {
          // continue to next processor
        }
      }
    }

    return null;
  }

  normalize(text) {
    return text
      .replace(/،/g, ',')
      .replace(/٪/g, '%')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .trim();
  }

  // ========================================
  // معالجات التواريخ
  // ========================================

  parseDate(str) {
    const cleaned = str.trim().toLowerCase();

    // اليوم
    if (/today|اليوم|الآن|now/.test(cleaned)) {
      return new Date();
    }

    // الأمس
    if (/yesterday|أمس|البارحة/.test(cleaned)) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }

    // غداً
    if (/tomorrow|غدا|غداً/.test(cleaned)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }

    // محاولة التحليل المباشر
    const parsed = new Date(str);
    if (!isNaN(parsed)) return parsed;

    // تنسيقات عربية
    const arabicDate = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (arabicDate) {
      const [, day, month, year] = arabicDate;
      return new Date(year.length === 2 ? `20${year}` : year, month - 1, day);
    }

    return null;
  }

  dateDiff(match) {
    const date1 = this.parseDate(match[1]);
    const date2 = this.parseDate(match[2]);

    if (!date1 || !date2) return null;

    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      result: `${diffDays} يوم`,
      raw: diffDays,
      details: {
        from: date1.toLocaleDateString('ar'),
        to: date2.toLocaleDateString('ar'),
        weeks: Math.floor(diffDays / 7),
        months: Math.floor(diffDays / 30)
      }
    };
  }

  dateAdd(match) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const date = this.parseDate(match[3]) || new Date();

    const result = new Date(date);

    if (/day|يوم/.test(unit)) {
      result.setDate(result.getDate() + amount);
    } else if (/month|شهر/.test(unit)) {
      result.setMonth(result.getMonth() + amount);
    } else if (/year|سنة/.test(unit)) {
      result.setFullYear(result.getFullYear() + amount);
    }

    return {
      result: result.toLocaleDateString('ar'),
      raw: result.toISOString(),
      details: {
        original: date.toLocaleDateString('ar'),
        added: `${amount} ${unit}`
      }
    };
  }

  dateNow() {
    const now = new Date();
    return {
      result: now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      raw: now.toISOString(),
      details: {
        time: now.toLocaleTimeString('ar'),
        timestamp: now.getTime()
      }
    };
  }

  calculateAge(match) {
    const birthDate = this.parseDate(match[1]);
    if (!birthDate) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return {
      result: `${age} سنة`,
      raw: age,
      details: {
        birthDate: birthDate.toLocaleDateString('ar'),
        days: Math.floor((today - birthDate) / (1000 * 60 * 60 * 24))
      }
    };
  }

  // ========================================
  // تحويل الوحدات
  // ========================================

  convertLength(match) {
    const value = parseFloat(match[1]);
    const from = this.normalizeUnit(match[2], 'length');
    const to = this.normalizeUnit(match[3], 'length');

    // التحويل إلى المتر أولاً
    const toMeter = {
      km: 1000, m: 1, cm: 0.01, mm: 0.001,
      mi: 1609.34, ft: 0.3048, in: 0.0254
    };

    const fromMeter = {
      km: 0.001, m: 1, cm: 100, mm: 1000,
      mi: 0.000621371, ft: 3.28084, in: 39.3701
    };

    const meters = value * toMeter[from];
    const result = meters * fromMeter[to];

    return {
      result: `${this.formatNumber(result)} ${to}`,
      raw: result,
      details: { from: `${value} ${from}`, conversion: `${from} → ${to}` }
    };
  }

  convertWeight(match) {
    const value = parseFloat(match[1]);
    const from = this.normalizeUnit(match[2], 'weight');
    const to = this.normalizeUnit(match[3], 'weight');

    // التحويل إلى الجرام
    const toGram = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
    const fromGram = { kg: 0.001, g: 1, lb: 0.00220462, oz: 0.035274 };

    const grams = value * toGram[from];
    const result = grams * fromGram[to];

    return {
      result: `${this.formatNumber(result)} ${to}`,
      raw: result,
      details: { from: `${value} ${from}` }
    };
  }

  convertTemperature(match) {
    const value = parseFloat(match[1]);
    const from = this.normalizeUnit(match[2], 'temp');
    const to = this.normalizeUnit(match[3], 'temp');

    let result;
    if (from === 'c' && to === 'f') {
      result = (value * 9/5) + 32;
    } else if (from === 'f' && to === 'c') {
      result = (value - 32) * 5/9;
    } else {
      result = value;
    }

    return {
      result: `${this.formatNumber(result)}°${to.toUpperCase()}`,
      raw: result,
      details: { from: `${value}°${from.toUpperCase()}` }
    };
  }

  convertData(match) {
    const value = parseFloat(match[1]);
    const from = this.normalizeUnit(match[2], 'data');
    const to = this.normalizeUnit(match[3], 'data');

    const toBytes = { byte: 1, kb: 1024, mb: 1024**2, gb: 1024**3, tb: 1024**4 };
    const fromBytes = { byte: 1, kb: 1/1024, mb: 1/1024**2, gb: 1/1024**3, tb: 1/1024**4 };

    const bytes = value * toBytes[from];
    const result = bytes * fromBytes[to];

    return {
      result: `${this.formatNumber(result)} ${to.toUpperCase()}`,
      raw: result,
      details: { from: `${value} ${from.toUpperCase()}` }
    };
  }

  convertTime(match) {
    const value = parseFloat(match[1]);
    const from = this.normalizeUnit(match[2], 'time');
    const to = this.normalizeUnit(match[3], 'time');

    const toSeconds = { s: 1, min: 60, h: 3600 };
    const fromSeconds = { s: 1, min: 1/60, h: 1/3600 };

    const seconds = value * toSeconds[from];
    const result = seconds * fromSeconds[to];

    return {
      result: `${this.formatNumber(result)} ${this.getTimeLabel(to)}`,
      raw: result,
      details: { from: `${value} ${this.getTimeLabel(from)}` }
    };
  }

  normalizeUnit(unit, type) {
    unit = unit.toLowerCase();

    const maps = {
      length: {
        'كم': 'km', 'كيلومتر': 'km', 'kilometer': 'km',
        'متر': 'm', 'meter': 'm',
        'سم': 'cm', 'سنتيمتر': 'cm',
        'ميل': 'mi', 'mile': 'mi',
        'قدم': 'ft', 'feet': 'ft', 'foot': 'ft',
        'بوصة': 'in', 'inch': 'in'
      },
      weight: {
        'كجم': 'kg', 'كيلو': 'kg', 'كيلوجرام': 'kg',
        'جرام': 'g', 'gram': 'g',
        'رطل': 'lb', 'pound': 'lb',
        'أونصة': 'oz', 'ounce': 'oz'
      },
      temp: {
        'مئوية': 'c', 'مئوي': 'c', 'celsius': 'c',
        'فهرنهايت': 'f', 'fahrenheit': 'f'
      },
      data: {
        'بايت': 'byte', 'bytes': 'byte',
        'كيلوبايت': 'kb',
        'ميجا': 'mb', 'ميجابايت': 'mb',
        'جيجا': 'gb', 'جيجابايت': 'gb',
        'تيرا': 'tb', 'تيرابايت': 'tb'
      },
      time: {
        'ثانية': 's', 'ثواني': 's', 'second': 's', 'seconds': 's',
        'دقيقة': 'min', 'دقائق': 'min', 'minute': 'min', 'minutes': 'min',
        'ساعة': 'h', 'ساعات': 'h', 'hour': 'h', 'hours': 'h'
      }
    };

    return maps[type]?.[unit] || unit;
  }

  getTimeLabel(unit) {
    const labels = { s: 'ثانية', min: 'دقيقة', h: 'ساعة' };
    return labels[unit] || unit;
  }

  // ========================================
  // الإحصائيات
  // ========================================

  parseNumbers(str) {
    return str.match(/[\d.]+/g)?.map(Number) || [];
  }

  calculateAverage(match) {
    const numbers = this.parseNumbers(match[1]);
    if (numbers.length === 0) return null;

    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;

    return {
      result: this.formatNumber(avg),
      raw: avg,
      details: { count: numbers.length, sum }
    };
  }

  calculateSum(match) {
    const numbers = this.parseNumbers(match[1]);
    if (numbers.length === 0) return null;

    const sum = numbers.reduce((a, b) => a + b, 0);

    return {
      result: this.formatNumber(sum),
      raw: sum,
      details: { count: numbers.length, numbers }
    };
  }

  findMinMax(match) {
    const numbers = this.parseNumbers(match[1]);
    if (numbers.length === 0) return null;

    const isMax = /أكبر|max|maximum/.test(match[0]);
    const value = isMax ? Math.max(...numbers) : Math.min(...numbers);

    return {
      result: this.formatNumber(value),
      raw: value,
      details: {
        type: isMax ? 'maximum' : 'minimum',
        numbers,
        all: { min: Math.min(...numbers), max: Math.max(...numbers) }
      }
    };
  }

  countItems(match) {
    const content = match[1];
    // عد العناصر المفصولة بفاصلة أو مسافة
    const items = content.split(/[,،\s]+/).filter(i => i.trim());

    return {
      result: `${items.length} عنصر`,
      raw: items.length,
      details: { items }
    };
  }

  // ========================================
  // النصوص
  // ========================================

  textLength(match) {
    const text = match[1];
    return {
      result: `${text.length} حرف`,
      raw: text.length,
      details: { words: text.split(/\s+/).length }
    };
  }

  textReverse(match) {
    const text = match[1];
    const reversed = text.split('').reverse().join('');
    return { result: reversed, raw: reversed };
  }

  textUpper(match) {
    const text = match[1];
    return { result: text.toUpperCase(), raw: text.toUpperCase() };
  }

  textLower(match) {
    const text = match[1];
    return { result: text.toLowerCase(), raw: text.toLowerCase() };
  }

  // ========================================
  // المقارنات
  // ========================================

  compare(match) {
    const a = parseFloat(match[1]);
    const op = this.normalizeOperator(match[2]);
    const b = parseFloat(match[3]);

    const ops = {
      '>': a > b,
      '<': a < b,
      '>=': a >= b,
      '<=': a <= b,
      '==': a === b,
      '!=': a !== b
    };

    const result = ops[op];
    return {
      result: result ? 'نعم ✓' : 'لا ✗',
      raw: result,
      details: { comparison: `${a} ${op} ${b}` }
    };
  }

  normalizeOperator(op) {
    const map = {
      'أكبر من': '>', 'أصغر من': '<',
      'يساوي': '==', 'لا يساوي': '!='
    };
    return map[op] || op;
  }

  isBetween(match) {
    const value = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const max = parseFloat(match[3]);

    const result = value >= min && value <= max;
    return {
      result: result ? 'نعم ✓' : 'لا ✗',
      raw: result,
      details: { value, range: `[${min}, ${max}]` }
    };
  }

  // ========================================
  // الأرقام المتقدمة
  // ========================================

  factorial(match) {
    const n = parseInt(match[1]);
    if (n > 170) return { result: 'الرقم كبير جداً!', raw: Infinity };

    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;

    return {
      result: this.formatNumber(result),
      raw: result,
      details: { formula: `${n}!` }
    };
  }

  sqrt(match) {
    const n = parseFloat(match[1]);
    const result = Math.sqrt(n);

    return {
      result: this.formatNumber(result),
      raw: result,
      details: { formula: `√${n}` }
    };
  }

  power(match) {
    const base = parseFloat(match[1]);
    const exp = parseFloat(match[2]);
    const result = Math.pow(base, exp);

    return {
      result: this.formatNumber(result),
      raw: result,
      details: { formula: `${base}^${exp}` }
    };
  }

  random(match) {
    const min = parseInt(match[1]) || 1;
    const max = parseInt(match[2]) || 100;

    const result = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      result: result.toString(),
      raw: result,
      details: { range: `[${min}, ${max}]` }
    };
  }

  round(match) {
    const num = parseFloat(match[1]);
    const decimals = parseInt(match[2]) || 0;

    const result = Number(num.toFixed(decimals));

    return {
      result: result.toString(),
      raw: result,
      details: { decimals }
    };
  }

  // ========================================
  // البرمجة
  // ========================================

  baseConvert(match) {
    const value = match[1];
    const from = this.normalizeBase(match[2]);
    const to = this.normalizeBase(match[3]);

    const decimal = parseInt(value, from);
    const result = decimal.toString(to);

    return {
      result: to === 16 ? `0x${result.toUpperCase()}` : to === 2 ? `0b${result}` : result,
      raw: result,
      details: { decimal, from: `base-${from}`, to: `base-${to}` }
    };
  }

  normalizeBase(base) {
    const map = {
      'binary': 2, 'ثنائي': 2,
      'decimal': 10, 'عشري': 10,
      'hex': 16, 'ست عشري': 16
    };
    return map[base.toLowerCase()] || 10;
  }

  isPrime(match) {
    const n = parseInt(match[1]);
    if (n < 2) return { result: 'لا ✗', raw: false };

    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return { result: 'لا ✗', raw: false, details: { divisor: i } };
    }

    return { result: 'نعم ✓', raw: true };
  }

  isEvenOdd(match) {
    const n = parseInt(match[1]);
    const askingEven = /زوجي|even/.test(match[0]);
    const isEven = n % 2 === 0;

    const result = askingEven ? isEven : !isEven;

    return {
      result: result ? 'نعم ✓' : 'لا ✗',
      raw: result,
      details: { number: n, type: isEven ? 'زوجي' : 'فردي' }
    };
  }

  formatNumber(num) {
    if (!Number.isFinite(num)) return num.toString();
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  }
}

// Export
export default LocalEngineExtended;
