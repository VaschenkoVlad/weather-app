/**
 * Автоматизований запускник модульних тестів (Test Runner)
 * для мобільного застосунку Raindji
 * 
 * Запускає всі тестові файли з директорії tests/ та виводить результати
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     АВТОМАТИЗОВАНИЙ ЗАПУСКНИК МОДУЛЬНИХ ТЕСТІВ         ║');
console.log('║           Мобільний застосунок Raindji                   ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log('Дата запуску:', new Date().toLocaleString('uk-UA'));
console.log('Середовище: Node.js ' + process.version);
console.log('Платформа:', process.platform);
console.log('');
console.log('🔍 Пошук тестових файлів...');

// Знаходимо всі test.js файли в tests/ директорії
const testDir = __dirname;
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js') && f !== 'run-tests.js');

console.log('   Знайдено файлів:', testFiles.length);
testFiles.forEach(f => console.log('   - ' + f));
console.log('');

let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;
const allResults = [];

// Запускаємо кожен тестовий файл
testFiles.forEach((file, idx) => {
  console.log(`📄 [${idx + 1}/${testFiles.length}] Виконання: ${file}`);
  console.log('─'.repeat(50));
  
  try {
    const testModule = require(path.join(testDir, file));
    totalPassed += testModule.passed || 0;
    totalFailed += testModule.failed || 0;
    totalTests += (testModule.passed || 0) + (testModule.failed || 0);
    
    if (testModule.results) {
      allResults.push(...testModule.results);
    }
  } catch (err) {
    console.error(`❌ Помилка завантаження тестового файлу ${file}:`);
    console.error('  ', err.message);
    totalFailed++;
  }
  
  console.log('');
});

// Фінальний звіт
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                    ФІНАЛЬНИЙ ЗВІТ                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log('📊 Статистика:');
console.log(`   Всього тестів: ${totalTests}`);
console.log(`   Пройдено:      ${totalPassed}`);
console.log(`   Провалено:     ${totalFailed}`);
console.log(`   Успішність:    ${totalTests > 0 ? Math.round(totalPassed / totalTests * 100) : 0}%`);
console.log('');

if (totalFailed === 0) {
  console.log('   ✅ ВСІ ТЕСТИ ПРОЙДЕНО УСПІШНО!');
} else {
  console.log(`   ❌ ${totalFailed} ТЕСТ(ІВ) ПРОВАЛЕНО!`);
}

console.log('');
console.log('📋 Детальні результати:');
console.log('');

// Групуємо результати
const categories = {};
allResults.forEach(r => {
  const cat = r.name.split(' ')[0] || 'Загальні';
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push(r);
});

Object.entries(categories).forEach(([cat, tests]) => {
  console.log(`  ${cat}:`);
  tests.forEach(t => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log(`    ${icon} [${t.status}] ${t.name}`);
    if (t.error) {
      console.log(`           ${t.error}`);
    }
  });
  console.log('');
});

// Зберігаємо результати у файл
const outputPath = path.join(testDir, 'test-output.txt');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportLines = [
  '='.repeat(70),
  'ЗВІТ ПРО ТЕСТУВАННЯ - Мобільний застосунок Raindji',
  '='.repeat(70),
  `Дата: ${new Date().toLocaleString('uk-UA')}`,
  `Node.js: ${process.version}`,
  `Платформа: ${process.platform}`,
  '',
  'РЕЗУЛЬТАТИ:',
  `  Всього тестів: ${totalTests}`,
  `  Пройдено: ${totalPassed}`,
  `  Провалено: ${totalFailed}`,
  `  Успішність: ${totalTests > 0 ? Math.round(totalPassed / totalTests * 100) : 0}%`,
  '',
  'ДЕТАЛЬНІ РЕЗУЛЬТАТИ:',
  '',
];

allResults.forEach(r => {
  reportLines.push(`  [${r.status}] ${r.name}`);
  if (r.error) reportLines.push(`    Error: ${r.error}`);
});

reportLines.push('');
reportLines.push('='.repeat(70));
reportLines.push('КІНЕЦЬ ЗВІТУ');
reportLines.push('='.repeat(70));

fs.writeFileSync(outputPath, reportLines.join('\n'), 'utf-8');
console.log(`📁 Результати збережено у: ${outputPath}`);
console.log('');

// Також зберігаємо JSON для подальшої обробки
const jsonPath = path.join(testDir, 'test-results.json');
fs.writeFileSync(jsonPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  total: totalTests,
  passed: totalPassed,
  failed: totalFailed,
  successRate: totalTests > 0 ? Math.round(totalPassed / totalTests * 100) : 0,
  results: allResults,
}, null, 2), 'utf-8');
console.log(`📁 JSON результати збережено у: ${jsonPath}`);
