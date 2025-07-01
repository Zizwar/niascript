import { nia } from '../src/index.js';

async function runDemo() {
  console.log('🚀 NiaScript Demo Starting...\n');
  
  try {
    // Test 1: Simple financial query
    console.log('📊 Test 1: Simple Financial Query');
    console.log('Query: "Bitcoin price"');
    const btcPrice = await nia`Bitcoin price`;
    console.log('Result:', btcPrice);
    console.log('');
    
    // Test 2: Complex calculation
    console.log('🔢 Test 2: Complex Calculation');
    console.log('Query: "If I invest $1000 at 8% annual return, what will I have after 5 years?"');
    const investment = await nia`If I invest $1000 at 8% annual return, what will I have after 5 years?`;
    console.log('Result:', investment);
    console.log('');
    
    // Test 3: Different crypto query
    console.log('💰 Test 3: Different Crypto Query');
    console.log('Query: "Ethereum price"');
    const ethPrice = await nia`Ethereum price`;
    console.log('Result:', ethPrice);
    console.log('');
    
    // Test 4: Price with specific formatting
    console.log('📈 Test 4: Price with Context');
    console.log('Query: "Get me the current BTC price"');
    const btcPriceFormatted = await nia`Get me the current BTC price`;
    console.log('Result:', btcPriceFormatted);
    console.log('');
    
    console.log('✅ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test individual components
async function testComponents() {
  console.log('🔧 Testing Individual Components...\n');
  
  try {
    // Test intent parser
    const { IntentParser } = await import('../src/core/intent-parser.js');
    const parser = new IntentParser();
    
    console.log('Testing Intent Parser:');
    const intent = await parser.parseIntent('Bitcoin price');
    console.log('Intent:', JSON.stringify(intent, null, 2));
    console.log('');
    
    // Test recipe engine
    const { RecipeEngine } = await import('../src/core/recipe-engine.js');
    const recipeEngine = new RecipeEngine();
    
    console.log('Testing Recipe Engine:');
    const recipe = await recipeEngine.generateRecipe(intent);
    console.log('Recipe:', JSON.stringify(recipe, null, 2));
    console.log('');
    
    console.log('✅ Component tests completed!');
    
  } catch (error) {
    console.error('❌ Component test failed:', error.message);
  }
}

// Run the demo
if (process.argv.includes('--components')) {
  testComponents();
} else {
  runDemo();
}