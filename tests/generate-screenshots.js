/**
 * Генератор скріншотів коду та результатів тестування
 * Використовує Puppeteer для створення зображень з HTML
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Styled code screenshot generator
function generateCodeHTML(title, code, language = 'javascript') {
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Consolas', 'Courier New', monospace;
    background: #1e1e2e;
    padding: 40px;
  }
  .window {
    background: #282a36;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    overflow: hidden;
  }
  .titlebar {
    background: #1e1e2e;
    padding: 12px 20px;
    border-bottom: 1px solid #363a4f;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dot {
    width: 12px; height: 12px; border-radius: 50%;
    display: inline-block;
  }
  .dot.red { background: #ff5f57; }
  .dot.yellow { background: #ffbd2e; }
  .dot.green { background: #28c840; }
  .title-text {
    color: #a5adcb;
    font-size: 18px;
    margin-left: 10px;
    font-family: -apple-system, 'Segoe UI', sans-serif;
  }
  .code-content {
    padding: 24px;
    overflow-x: auto;
  }
  .line-numbers {
    float: left;
    text-align: right;
    padding-right: 16px;
    color: #6b7089;
    user-select: none;
    line-height: 1.8;
    font-size: 18px;
  }
  .code-lines {
    margin-left: 0;
    line-height: 1.8;
    font-size: 18px;
    color: #f8f8f2;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .header {
    margin-bottom: 20px;
    padding: 16px;
    background: #313244;
    border-radius: 6px;
    border-left: 4px solid #89b4fa;
  }
  .header h2 {
    color: #cdd6f4;
    font-family: -apple-system, 'Segoe UI', sans-serif;
    font-size: 22px;
    margin-bottom: 4px;
  }
  .header p {
    color: #a6adc8;
    font-family: -apple-system, 'Segoe UI', sans-serif;
    font-size: 16px;
  }
  .keyword { color: #cba6f7; }
  .string { color: #a6e3a1; }
  .number { color: #fab387; }
  .comment { color: #6c7086; font-style: italic; }
  .function { color: #89b4fa; }
  .builtin { color: #f38ba8; }
  .type { color: #f9e2af; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <span class="dot red"></span>
    <span class="dot yellow"></span>
    <span class="dot green"></span>
    <span class="title-text">${title}</span>
  </div>
  <div class="code-content">
    <div class="code-lines">${escapedCode}</div>
  </div>
</div>
</body>
</html>`;
}

function generateTerminalHTML(title, text) {
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Consolas', 'Courier New', monospace;
    background: #0d1117;
    padding: 40px;
  }
  .terminal {
    background: #161b22;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    overflow: hidden;
    border: 1px solid #30363d;
  }
  .titlebar {
    background: #21262d;
    padding: 10px 16px;
    border-bottom: 1px solid #30363d;
    display: flex;
    align-items: center;
  }
  .title-text {
    color: #8b949e;
    font-size: 12px;
    font-family: -apple-system, 'Segoe UI', sans-serif;
  }
  .terminal-content {
    padding: 24px;
    color: #c9d1d9;
    font-size: 18px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .green-text { color: #3fb950; }
  .red-text { color: #f85149; }
  .yellow-text { color: #d29922; }
  .cyan-text { color: #58a6ff; }
  .dim-text { color: #484f58; }
  .separator { color: #30363d; }
  .header-line {
    color: #58a6ff;
    font-weight: bold;
    font-size: 18px;
  }
</style>
</head>
<body>
<div class="terminal">
  <div class="titlebar">
    <span class="title-text">${title}</span>
  </div>
  <div class="terminal-content">${escapedText}</div>
</div>
</body>
</html>`;
}

async function generateScreenshot(html, outputPath, width = 900, height = undefined) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width, height: height || 800 });
    
    // Wait for fonts to render
    await page.evaluate(() => document.fonts.ready);
    
    // Get the actual content height
    const bodyHandle = await page.$('body');
    const box = await bodyHandle.boundingBox();
    
    if (box) {
      await page.setViewport({ width, height: Math.ceil(box.height) + 60 });
    }
    
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'png',
    });
    
    console.log(`  ✅ Screenshot saved: ${outputPath} (${Math.ceil(box?.height || 0)}px)`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('📸 Генерація скріншотів тестування...\n');
  
  // 1. Screenshot of the test code
  console.log('1/4 Створення скріншоту тестового коду...');
  const testCode = fs.readFileSync(path.join(__dirname, 'weather.test.js'), 'utf-8');
  // Take first 200 lines
  const testCodePreview = testCode.split('\n').slice(0, 120).join('\n');
  const codeHtml = generateCodeHTML('weather.test.js — Модульні тести', testCodePreview);
  await generateScreenshot(codeHtml, path.join(SCREENSHOTS_DIR, 'test-code.png'), 1400);
  
  // 2. Screenshot of the weather functions code
  console.log('2/4 Створення скріншоту тестованих функцій...');
  const funcCode = fs.readFileSync(path.join(__dirname, 'weather-functions.js'), 'utf-8');
  const funcPreview = funcCode.split('\n').slice(0, 120).join('\n');
  const funcHtml = generateCodeHTML('weather-functions.js — Тестовані функції', funcPreview);
  await generateScreenshot(funcHtml, path.join(SCREENSHOTS_DIR, 'tested-functions.png'), 1400);
  
  // 3. Screenshot of the test results (terminal output)
  console.log('3/4 Створення скріншоту результатів тестування...');
  const results = fs.readFileSync(path.join(__dirname, 'test-output.txt'), 'utf-8');
  const resultsHtml = generateTerminalHTML('test-output.txt — Результати тестування', results);
  await generateScreenshot(resultsHtml, path.join(SCREENSHOTS_DIR, 'test-results.png'), 1200);
  
  // 4. Screenshot of the test runner
  console.log('4/4 Створення скріншоту запускника тестів...');
  const runnerCode = fs.readFileSync(path.join(__dirname, 'run-tests.js'), 'utf-8');
  const runnerPreview = runnerCode.split('\n').slice(0, 90).join('\n');
  const runnerHtml = generateCodeHTML('run-tests.js — Запускник тестів', runnerPreview);
  await generateScreenshot(runnerHtml, path.join(SCREENSHOTS_DIR, 'test-runner.png'), 1400);
  
  console.log('\n✅ Всі скріншоти створено!');
  console.log(`📁 Директорія: ${SCREENSHOTS_DIR}`);
}

main().catch(err => {
  console.error('❌ Помилка:', err);
  process.exit(1);
});
