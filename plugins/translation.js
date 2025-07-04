// plugins/translation-plugin.js - مثال ثالث
export class TranslationPlugin extends BasePlugin {
  constructor() {
    super('translation');
    this.capabilities = ['translate'];
  }

  async execute(intent, context) {
    const { target, parameters } = intent.entities;
    const { to = 'arabic' } = parameters || {};
    
    const prompt = `Translate "${target}" to ${to}. Respond with just the translation.`;
    
    try {
      const response = await context.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      });

      const cost = context.costTracker.calculateOpenAICost(response);
      context.costTracker.addCost(cost);

      return {
        success: true,
        data: response.choices[0].message.content.trim(),
        source: 'translation-plugin',
        cost: cost
      };

    } catch (error) {
      return {
        success: false,
        message: `Translation failed: ${error.message}`
      };
    }
  }
}