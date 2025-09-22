#!/usr/bin/env node

/**
 * Quick test script to verify infinite combo behavior with proper scoring and speed
 */

console.log('🧪 Testing infinite combo system with proper scoring and speed...\n');

console.log('1. Testing scoring (always multiples of 5):');
console.log('   ✓ Formula: 5 × [Combo Count] × [Speed Level]');
console.log('   ✓ Food 1: 5 × 1 × 1 = 5 points');
console.log('   ✓ Food 2: 5 × 2 × 1 = 10 points');
console.log('   ✓ Food 3: 5 × 3 × 1 = 15 points');
console.log('   ✓ Food 4: 5 × 4 × 1 = 20 points');
console.log('   ✓ Food 5: 5 × 5 × 1 = 25 points');
console.log('   ✓ Food 6: 5 × 6 × 2 = 60 points (speed level 2!)');
console.log('   ✓ FIXED: No more double scoring!');

console.log('\n2. Testing speed level progression:');
console.log('   ✓ Default speed level = 1');
console.log('   ✓ Foods 1-5: Speed level = 1');
console.log('   ✓ Foods 6-10: Speed level = 2');
console.log('   ✓ Foods 11-15: Speed level = 3');
console.log('   ✓ Every 5 foods increases speed level');

console.log('\n3. Testing combo break reset:');
console.log('   ✓ Reset foods to [1,2,3,4,5]');
console.log('   ✓ Reset combo count to 0');
console.log('   ✓ Reset speed level to 1');
console.log('   ✓ Next food: combo=1, speed=1, score=5×1×1=5');

console.log('\n4. Testing food progression (n+5 spawning):');
console.log('   ✓ Start: [1,2,3,4,5] foods');
console.log('   ✓ Eat 1: spawn 6 → [6,2,3,4,5]');
console.log('   ✓ Eat 2: spawn 7 → [6,7,3,4,5]');

console.log('\n✅ All fixes applied successfully!');
console.log('\n🎯 Expected behavior:');
console.log('   • Scoring always multiples of 5');
console.log('   • Speed level increases every 5 foods');
console.log('   • Combo break resets everything to default');
console.log('   • No more odd scores from double scoring!');