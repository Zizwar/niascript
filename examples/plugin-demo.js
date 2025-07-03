#!/usr/bin/env node

/**
 * NiaScript Plugin System Demo
 * 
 * هذا المثال يوضح كيفية استخدام نظام الإضافات الجديد في NiaScript
 * This example demonstrates how to use the new plugin system in NiaScript
 */

import { nia, niaInstance } from '../src/index.js';
import { AIPluginGenerator } from '../src/core/ai-plugin-generator.js';
import { MCPBridge } from '../src/core/mcp-bridge.js';

console.log('🚀 NiaScript Plugin System Demo');
console.log('================================\n');

async function runDemo() {
  try {
    // 1. عرض الإضافات المثبتة
    console.log('📦 الإضافات المثبتة:');
    const plugins = nia.listPlugins();
    plugins.forEach(plugin => {
      console.log(`   ✓ ${plugin.name} v${plugin.version} - ${plugin.description}`);
    });
    console.log('');

    // 2. تجربة إضافة الترجمة
    console.log('🌍 تجربة إضافة الترجمة:');
    console.log('   الإدخال: "ترجم للانجليزية: أهلاً بالعالم"');
    
    try {
      const translationResult = await nia`ترجم للانجليزية: أهلاً بالعالم`;
      console.log(`   النتيجة: ${translationResult}`);
    } catch (error) {
      console.log(`   خطأ: ${error.message}`);
    }
    console.log('');

    // 3. تجربة إضافة الإيميل
    console.log('📧 تجربة إضافة الإيميل:');
    console.log('   الإدخال: "ارسل لبريدي test النص: مرحبا من NiaScript"');
    
    try {
      const emailResult = await nia`ارسل لبريدي test النص: مرحبا من NiaScript`;
      console.log(`   النتيجة: ${emailResult}`);
    } catch (error) {
      console.log(`   خطأ: ${error.message}`);
    }
    console.log('');

    // 4. إنشاء إضافة جديدة باستخدام AI
    console.log('🧠 إنشاء إضافة جديدة بالذكاء الاصطناعي:');
    
    const generator = new AIPluginGenerator(null, niaInstance.pluginManager);
    
    try {
      const weatherPlugin = await generator.generatePlugin(
        "الحصول على معلومات الطقس لأي مدينة",
        { type: 'api_service', language: 'العربية والانجليزية' }
      );
      
      console.log(`   تم إنشاء إضافة: ${weatherPlugin.name}`);
      console.log(`   الوصف: ${weatherPlugin.description}`);
      console.log(`   المحفزات: ${weatherPlugin.triggers.map(t => t.toString()).join(', ')}`);
      
      // تثبيت الإضافة الجديدة
      await nia.installPlugin(weatherPlugin);
      console.log(`   ✅ تم تثبيت الإضافة بنجاح`);
      
    } catch (error) {
      console.log(`   خطأ في إنشاء الإضافة: ${error.message}`);
    }
    console.log('');

    // 5. تجربة MCP Bridge
    console.log('🔗 تجربة MCP Bridge:');
    
    try {
      const mcpBridge = new MCPBridge(niaInstance);
      await mcpBridge.initialize();
      
      const mcpClients = mcpBridge.getMCPClients();
      console.log(`   تم الاتصال بـ ${mcpClients.length} عميل MCP:`);
      mcpClients.forEach(client => {
        console.log(`     - ${client.name}: ${client.tools.length} أداة`);
      });
      
      // تجربة استخدام أداة MCP
      console.log('   تجربة قراءة ملف باستخدام MCP:');
      const fileReadResult = await nia`read file package.json`;
      console.log(`   النتيجة: ${fileReadResult.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`   خطأ في MCP Bridge: ${error.message}`);
    }
    console.log('');

    // 6. إحصائيات النظام
    console.log('📊 إحصائيات النظام:');
    const stats = niaInstance.recipeEngine.getRecipeStats();
    console.log(`   القوالب الأساسية: ${stats.standardTemplates}`);
    console.log(`   قوالب الإضافات: ${stats.pluginTemplates}`);
    console.log(`   إجمالي القوالب: ${stats.totalTemplates}`);
    
    const allPlugins = nia.listPlugins();
    console.log(`   الإضافات المثبتة: ${allPlugins.length}`);
    
    const operations = niaInstance.safeExecutor.getAvailableOperations();
    console.log(`   العمليات المتاحة: ${operations.length}`);
    console.log('');

    // 7. تجربة الاستعلامات المختلطة
    console.log('🔄 تجربة الاستعلامات المختلطة:');
    
    const queries = [
      'ترجم للانجليزية: السلام عليكم',
      'ارسل ايميل لبريدي admin موضوع: تقرير يومي النص: تم إنجاز المهام',
      'weather in Riyadh today',
      'list directory /tmp',
      'search web for artificial intelligence news'
    ];
    
    for (const query of queries) {
      console.log(`   📝 "${query}"`);
      try {
        const result = await nia.ask(query);
        console.log(`   ✅ ${result.substring(0, 80)}${result.length > 80 ? '...' : ''}`);
      } catch (error) {
        console.log(`   ❌ ${error.message}`);
      }
      console.log('');
    }

    // 8. تصدير تكوين الإضافات
    console.log('💾 تصدير تكوين الإضافات:');
    
    const pluginConfigs = allPlugins.map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      hasProviders: plugin.hasProviders,
      hasRecipes: plugin.hasRecipes,
      hasCustomActions: plugin.hasCustomActions
    }));
    
    console.log('   تكوين الإضافات:');
    console.log(JSON.stringify(pluginConfigs, null, 2));

  } catch (error) {
    console.error('❌ خطأ في التشغيل:', error);
  }
}

// إضافة إضافة مخصصة للتوضيح
const customCalculatorPlugin = {
  name: "advanced_calculator",
  version: "1.0.0",
  description: "آلة حاسبة متقدمة للعمليات الرياضية المعقدة",
  author: "Demo Team",
  
  triggers: [
    /calculate|احسب|حاسبة/i,
    /math|رياضيات/i,
    /solve|حل/i
  ],
  
  recipes: {
    advanced_calculation: {
      confidence: 0.9,
      steps: [
        {
          action: "parse_math_expression",
          expression: "${query}",
          assign_to: "parsed_expression"
        },
        {
          action: "evaluate_expression",
          expression: "${parsed_expression}",
          assign_to: "result"
        },
        {
          action: "format_response",
          template: "النتيجة: ${result}",
          return: true
        }
      ]
    }
  },
  
  customActions: {
    parse_math_expression: async (params) => {
      const expression = params.expression;
      // استخراج التعبير الرياضي من النص
      const mathPattern = /([0-9+\-*/().\s]+)/;
      const match = expression.match(mathPattern);
      return match ? match[1].trim() : expression;
    },
    
    evaluate_expression: async (params) => {
      try {
        const expression = params.expression;
        // تقييم آمن للتعبير الرياضي
        const allowedChars = /^[0-9+\-*/().\s]+$/;
        
        if (!allowedChars.test(expression)) {
          throw new Error('تعبير رياضي غير صحيح');
        }
        
        // استخدام Function constructor بدلاً من eval للأمان
        const result = new Function('return ' + expression)();
        return typeof result === 'number' ? result : 'خطأ في الحساب';
        
      } catch (error) {
        return `خطأ: ${error.message}`;
      }
    }
  }
};

async function installCustomPlugin() {
  try {
    console.log('🔧 تثبيت إضافة مخصصة للتوضيح...');
    await nia.installPlugin(customCalculatorPlugin);
    console.log('✅ تم تثبيت آلة حاسبة متقدمة\n');
    
    // تجربة الإضافة المخصصة
    console.log('🧮 تجربة آلة الحاسبة المتقدمة:');
    const calcResult = await nia`احسب 15 + 25 * 2`;
    console.log(`النتيجة: ${calcResult}\n`);
    
  } catch (error) {
    console.log(`خطأ في تثبيت الإضافة المخصصة: ${error.message}\n`);
  }
}

// تشغيل التوضيح
async function main() {
  await installCustomPlugin();
  await runDemo();
  
  console.log('🎉 انتهت التوضيحات بنجاح!');
  console.log('🔗 لمزيد من المعلومات، راجع الوثائق في claude.md');
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { customCalculatorPlugin };