// plugins/weather-plugin.js - مثال بسيط آخر
export class WeatherPlugin extends BasePlugin {
  constructor() {
    super('weather');
    this.capabilities = ['get_info', 'forecast'];
  }

  async execute(intent, context) {
    const location = intent.entities.target || 'current location';
    
    // للمثال - رد ثابت
    return {
      success: true,
      data: `Weather service for ${location} is under development. Please check weather apps for current conditions.`,
      source: 'weather-plugin'
    };
  }
}
