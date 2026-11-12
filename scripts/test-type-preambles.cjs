'use strict';
const assert = require('node:assert/strict');
const { displayType } = require('ecmarkup/lib/type-display');
const spec = lang => ({ doc: { documentElement: { lang } } });
let checks = 0;
const examples = [
  ['a time value', '时间值', '時刻値', '시간 값'],
  ['a finite time value', '有限时间值', '有限時刻値', '유한 시간 값'],
  ['an integer in the interval from 0 (inclusive) to MillisecondsPerDay (exclusive)', '大于等于 0 且小于 MillisecondsPerDay 的整数', '0 以上 MillisecondsPerDay 未満の整数', '0 이상 MillisecondsPerDay 미만인 정수'],
];
for (const [lower, upper] of [[0,11],[0,23],[0,365],[0,59],[0,6],[0,999],[1,12],[1,31],[2,36]]) {
  examples.push([`an integer in the inclusive interval from ${lower} to ${upper}`, `${lower} 到 ${upper} 的闭区间内的整数`, `${lower} 以上 ${upper} 以下の整数`, `${lower} 이상 ${upper} 이하인 정수`]);
}
for (const [input, ...expected] of examples) {
  assert.equal(displayType(spec('en'), input), input); checks++;
  for (const [i, lang] of ['zh','ja','ko'].entries()) {
    assert.equal(displayType(spec(lang), input), expected[i]); checks++;
    let seen;
    assert.equal(displayType(spec(lang), input, (original, translated) => { seen = original; return translated; }), expected[i]);
    assert.equal(seen, input); checks += 2;
  }
}
for (const input of [
  'an integer in the interval from 0 (exclusive) to MillisecondsPerDay (inclusive)',
  'an integer in the inclusive interval from _lower_ to _upper_',
  'a time value that is finite or infinite',
  '<emu-xref href="#sec-time-values-and-time-range">a time value</emu-xref>',
  '*"a finite time value"*',
]) {
  for (const lang of ['en','zh','ja','ko']) { assert.equal(displayType(spec(lang), input), input); checks++; }
}
assert.equal(displayType(spec('zh'), 'either a finite time value or ~NaN~'), '(有限时间值 或 ~NaN~)'); checks++;
console.log(JSON.stringify({ passed: checks }));
