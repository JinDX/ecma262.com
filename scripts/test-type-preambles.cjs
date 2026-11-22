'use strict';
const assert = require('node:assert/strict');
const { displayType } = require('ecmarkup/lib/type-display');
const spec = lang => ({ doc: { documentElement: { lang } } });
let checks = 0;
const examples = [
  ['an Object that conforms to the IteratorResult interface', '符合 IteratorResult 接口的 Object', 'IteratorResult インターフェースに適合する Object', 'IteratorResult 인터페이스를 준수하는 Object'],
  ['a sequence of Unicode code points', 'Unicode 码点序列', 'Unicode コードポイントの列', '유니코드 코드 포인트 시퀀스'],
  ['a nonterminal in one of the ECMAScript grammars', '某个 ECMAScript 文法中的非终结符', 'いずれかの ECMAScript 文法の非終端記号', 'ECMAScript 문법 중 하나의 비단말 기호'],
  ['any value except a Completion Record', '除 Completion Record 之外的任意值', 'Completion Record を除く任意の値', 'Completion Record를 제외한 임의의 값'],
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
  assert.equal(displayType(spec('en'), input), input); checks++;
  const localized = input === '*"a finite time value"*'
    ? '<emu-val>"a finite time value"</emu-val>'
    : input;
  for (const lang of ['zh','ja','ko']) { assert.equal(displayType(spec(lang), input), localized); checks++; }
}
assert.equal(displayType(spec('zh'), 'either a finite time value or ~NaN~'), '(有限时间值 或 <emu-const>NaN</emu-const>)'); checks++;
assert.equal(displayType(spec('ko'), 'an integer within the closed interval from 2 to 36'), '2 이상 36 이하인 정수'); checks++;
assert.equal(displayType(spec('ja'), 'an abrupt completion'), '中断完了'); checks++;
assert.equal(displayType(spec('zh'), 'an abrupt completion'), '突然完成'); checks++;
assert.equal(displayType(spec('ko'), 'an abrupt completion'), '비정상 완료'); checks++;
assert.equal(displayType(spec('zh'), 'a Completion Record'), 'Completion Record'); checks++;
assert.equal(displayType(spec('zh'), 'a String or a sequence of Unicode code points'), '(String 或 Unicode 码点序列)'); checks++;
assert.equal(displayType(spec('zh'), 'a Parse Node or a non-empty List of *SyntaxError* objects'), '(解析节点 或 由 <emu-val>SyntaxError</emu-val> 对象组成的非空 List)'); checks++;
console.log(JSON.stringify({ passed: checks }));
