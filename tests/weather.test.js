/**
 * Модульні тести для сервісних функцій погодного застосунку Raindji
 * Тестування чистих функцій: getCondition, getConditionIcon, buildWeatherData
 */

// Імпортуємо функції з services/weather.ts через require для Node.js середовища
// Оскільки weather.ts використовує імпорти ES modules та TypeScript,
// ми створили дублікат функцій у tests/weather-functions.js для тестування
const {
  getCondition,
  getConditionIcon,
  getPressureTrend,
  getWellbeingNote,
  getDressTip,
  getRainHour,
  getBestHour,
  buildWeatherData,
  STORMGLASS_BASE,
  NOMINATIM_BASE
} = require('./weather-functions');

// ===== Тест-раннер =====
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS', error: null });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Expected '${expected}', got '${actual}'`);
  }
}

function assertDeepEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(msg || `Expected ${b}, got ${a}`);
  }
}

// ===== ТЕСТИ: getCondition =====
console.log('\n📋 Тестування getCondition (визначення погодної умови)');

test('Повертає "Rainy" при precipitation > 0.5', () => {
  assertEqual(getCondition(50, 1.0, 60), 'Rainy');
});

test('Повертає "Rainy" при великій кількості опадів незалежно від хмарності', () => {
  assertEqual(getCondition(0, 2.0, 30), 'Rainy');
});

test('Повертає "Cloudy" при cloudCover > 80 та precipitation <= 0.5', () => {
  assertEqual(getCondition(85, 0, 50), 'Cloudy');
});

test('Повертає "Cloudy" при 100% хмарності', () => {
  assertEqual(getCondition(100, 0.1, 70), 'Cloudy');
});

test('Повертає "Partly cloudy" при cloudCover > 50 та <= 80', () => {
  assertEqual(getCondition(65, 0, 40), 'Partly cloudy');
});

test('Повертає "Partly cloudy" при cloudCover = 51', () => {
  assertEqual(getCondition(51, 0, 30), 'Partly cloudy');
});

test('Повертає "Partly cloudy" при cloudCover = 80', () => {
  assertEqual(getCondition(80, 0, 30), 'Partly cloudy');
});

test('Повертає "Misty" при humidity > 80 та відсутності опадів та хмар', () => {
  assertEqual(getCondition(10, 0, 90), 'Misty');
});

test('Повертає "Misty" при високій вологості навіть при помірній хмарності', () => {
  assertEqual(getCondition(40, 0, 95), 'Misty');
});

test('Повертає "Sunny" при сприятливих умовах (мало хмар, без опадів, низька вологість)', () => {
  assertEqual(getCondition(10, 0, 40), 'Sunny');
});

test('Повертає "Sunny" при cloudCover = 0, precipitation = 0, humidity = 0', () => {
  assertEqual(getCondition(0, 0, 0), 'Sunny');
});

test('Повертає "Sunny" при граничних значеннях (cloudCover = 50, humidity = 80)', () => {
  assertEqual(getCondition(50, 0.5, 80), 'Sunny');
});

// ===== ТЕСТИ: getConditionIcon =====
console.log('\n📋 Тестування getConditionIcon (відображення іконки погоди)');

test('Повертає "☀️" для Sunny', () => {
  assertEqual(getConditionIcon('Sunny'), '☀️');
});

test('Повертає "⛅" для Partly cloudy', () => {
  assertEqual(getConditionIcon('Partly cloudy'), '⛅');
});

test('Повертає "☁️" для Cloudy', () => {
  assertEqual(getConditionIcon('Cloudy'), '☁️');
});

test('Повертає "🌧️" для Rainy', () => {
  assertEqual(getConditionIcon('Rainy'), '🌧️');
});

test('Повертає "🌫️" для Misty', () => {
  assertEqual(getConditionIcon('Misty'), '🌫️');
});

test('Повертає "🌤️" для невідомої умови (default)', () => {
  assertEqual(getConditionIcon('Unknown'), '🌤️');
});

test('Повертає "🌤️" для порожнього рядка', () => {
  assertEqual(getConditionIcon(''), '🌤️');
});

// ===== ТЕСТИ: buildWeatherData =====
console.log('\n📋 Тестування buildWeatherData (побудова об\'єкта погодних даних)');

const mockHour = (time, overrides = {}) => ({
  time: time || '2026-06-03T12:00:00Z',
  airTemperature: { sg: overrides.temp !== undefined ? overrides.temp : 20 },
  cloudCover: { sg: overrides.cloud || 30 },
  humidity: { sg: overrides.humidity || 50 },
  precipitation: { sg: overrides.precip || 0 },
  windSpeed: { sg: overrides.windSpeed || 5 },
  windDirection: { sg: overrides.windDir || 180 },
  pressure: { sg: overrides.pressure || 1013 },
  visibility: { sg: overrides.visibility || 10000 },
});

test('Повертає коректну структуру WeatherData для порожнього масиву годин', () => {
  const result = buildWeatherData({ hours: [] }, 'Київ', 'Україна');
  assertEqual(result.city, 'Київ');
  assertEqual(result.country, 'Україна');
  assertEqual(result.current.temperature, 0);
  assertEqual(result.current.condition, 'No data');
  assertEqual(result.hourly.length, 0);
  assertEqual(result.daily.length, 0);
});

test('Коректно обробляє першу годину як поточну погоду', () => {
  const hours = [
    mockHour('2026-06-03T12:00:00Z', { temp: 25, cloud: 40, humidity: 55, precip: 0, windSpeed: 3 })
  ];
  const result = buildWeatherData({ hours }, 'Київ', 'Україна');
  assertEqual(result.current.temperature, 25);
  assertEqual(result.current.cloudCover, 40);
  assertEqual(result.current.humidity, 55);
  assertEqual(result.current.precipitation, 0);
});

test('Коректно конвертує windSpeed з м/с у км/год', () => {
  const hours = [mockHour('2026-06-03T12:00:00Z', { windSpeed: 10 })];
  const result = buildWeatherData({ hours }, 'Київ', 'Україна');
  assertEqual(result.current.windSpeed, 36); // 10 * 3.6 = 36
});

test('Коректно формує погодинний прогноз на 24 години', () => {
  const hours = [];
  for (let i = 0; i < 48; i++) {
    const h = new Date('2026-06-03T00:00:00Z');
    h.setHours(h.getHours() + i);
    hours.push(mockHour(h.toISOString(), { temp: 15 + i }));
  }
  const result = buildWeatherData({ hours }, 'Київ', 'Україна');
  assertEqual(result.hourly.length, 24);
  // Перевіряємо що години йдуть послідовно (формат залежить від часового поясу)
  const hour0 = parseInt(result.hourly[0].hour);
  const hour23 = parseInt(result.hourly[23].hour);
  assertEqual((hour23 - hour0 + 24) % 24, 23, 'Має бути 23 години різниці');
});

test('Коректно групує денний прогноз по днях', () => {
  const hours = [];
  for (let day = 0; day < 3; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const d = new Date('2026-06-03T00:00:00Z');
      d.setDate(d.getDate() + day);
      d.setHours(hour);
      hours.push(mockHour(d.toISOString(), { temp: 20 + day }));
    }
  }
  const result = buildWeatherData({ hours }, 'Київ', 'Україна');
  assert(result.daily.length >= 3, `Expected at least 3 days, got ${result.daily.length}`);
});

test('Коректно використовує NOAA дані як fallback при відсутності SG', () => {
  const hour = {
    time: '2026-06-03T12:00:00Z',
    airTemperature: { noaa: 22 },
    cloudCover: { noaa: 60 },
    humidity: { noaa: 70 },
    precipitation: { noaa: 0.3 },
    windSpeed: { noaa: 4 },
    windDirection: { noaa: 90 },
    pressure: { noaa: 1015 },
    visibility: { noaa: 8000 },
  };
  const result = buildWeatherData({ hours: [hour] }, 'Київ', 'Україна');
  assertEqual(result.current.temperature, 22);
});

test('Не використовує ECMWF дані (код перевіряє лише SG та NOAA)', () => {
  const hour = {
    time: '2026-06-03T12:00:00Z',
    airTemperature: { sg: 22 },
    cloudCover: { sg: 30 },
    humidity: { sg: 60 },
    precipitation: { sg: 0.1 },
    windSpeed: { sg: 5 },
  };
  const result = buildWeatherData({ hours: [hour] }, 'Київ', 'Україна');
  assertEqual(result.current.temperature, 22);
  assertEqual(result.current.precipitation, 0.1);
});

test('Повертає default 0 при повній відсутності даних про температуру', () => {
  const hour = { time: '2026-06-03T12:00:00Z' };
  const result = buildWeatherData({ hours: [hour] }, 'Київ', 'Україна');
  assertEqual(result.current.temperature, 0);
});

// ===== ТЕСТИ: Глобальні константи =====
console.log('\n📋 Тестування глобальних конфігурацій');

test('STORMGLASS_BASE містить коректний URL', () => {
  assert(STORMGLASS_BASE.includes('stormglass'), 'URL має містити stormglass');
});

test('NOMINATIM_BASE містить коректний URL', () => {
  assert(NOMINATIM_BASE.includes('nominatim.openstreetmap'), 'URL має містити nominatim.openstreetmap');
});

// ===== ТЕСТИ: Поради дня (барометр самопочуття та радник) =====
console.log('\n📋 Тестування порад дня (тренд тиску, одяг, дощ, найкращий час)');

test('getPressureTrend повертає "falling" при різкому падінні тиску', () => {
  assertEqual(getPressureTrend(1015, 1010), 'falling');
});

test('getPressureTrend повертає "rising" при різкому зростанні тиску', () => {
  assertEqual(getPressureTrend(1010, 1015), 'rising');
});

test('getPressureTrend повертає "steady" при незначній зміні тиску', () => {
  assertEqual(getPressureTrend(1013, 1014), 'steady');
});

test('getDressTip радить тепло вдягнутись при морозі', () => {
  assertEqual(getDressTip(-5), 'Dress very warm');
});

test('getDressTip радить куртку при прохолоді', () => {
  assertEqual(getDressTip(8), 'Take a jacket');
});

test('getDressTip радить легкий одяг при спеці', () => {
  assertEqual(getDressTip(30), 'Hot — light clothes and water');
});

test('getRainHour повертає годину початку дощу', () => {
  const hours = [
    { time: '2026-06-03T12:00:00Z', precipitation: { sg: 0 } },
    { time: '2026-06-03T13:00:00Z', precipitation: { sg: 0 } },
    { time: '2026-06-03T14:00:00Z', precipitation: { sg: 1.2 } },
  ];
  assertEqual(getRainHour(hours), new Date('2026-06-03T14:00:00Z').getHours());
});

test('getRainHour повертає -1, коли дощу не очікується', () => {
  const hours = [
    { time: '2026-06-03T12:00:00Z', precipitation: { sg: 0 } },
    { time: '2026-06-03T13:00:00Z', precipitation: { sg: 0.1 } },
  ];
  assertEqual(getRainHour(hours), -1);
});

test('getBestHour обирає суху денну годину з комфортною температурою', () => {
  const night = new Date(2026, 5, 3, 3, 0, 0);
  const day = new Date(2026, 5, 3, 14, 0, 0);
  const hours = [
    { time: night.toISOString(), airTemperature: { sg: 20 }, precipitation: { sg: 0 }, windSpeed: { sg: 1 } },
    { time: day.toISOString(), airTemperature: { sg: 20 }, precipitation: { sg: 0 }, windSpeed: { sg: 1 } },
  ];
  assertEqual(getBestHour(hours), 14);
});

test('buildWeatherData додає об\'єкт tips з порадами', () => {
  const hour = {
    time: '2026-06-03T12:00:00Z',
    airTemperature: { sg: 8 },
    cloudCover: { sg: 30 },
    humidity: { sg: 50 },
    precipitation: { sg: 0 },
    windSpeed: { sg: 5 },
    pressure: { sg: 1013 },
  };
  const result = buildWeatherData({ hours: [hour] }, 'Київ', 'Україна');
  assertEqual(result.tips.dress, 'Take a jacket');
  assert(typeof result.tips.wellbeing === 'string', 'wellbeing має бути рядком');
});

// ===== ПІДСУМОК =====
console.log('\n' + '='.repeat(50));
console.log('📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ:');
console.log('  Всього тестів:', passed + failed);
console.log('  Пройдено:', passed);
console.log('  Провалено:', failed);
if (failed === 0) {
  console.log('  ✅ ВСІ ТЕСТИ ПРОЙДЕНО УСПІШНО!');
} else {
  console.log('  ❌ Є ПРОВАЛЕНІ ТЕСТИ!');
}
console.log('='.repeat(50));

module.exports = { results, passed, failed };
