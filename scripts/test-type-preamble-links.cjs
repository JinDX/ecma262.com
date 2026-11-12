'use strict';
const assert = require('node:assert/strict');
const { build } = require('ecmarkup');
const interval = 'an integer in the interval from 0 (inclusive) to MillisecondsPerDay (exclusive)';
const labels = {
  en: interval,
  zh: '大于等于 0 且小于 MillisecondsPerDay 的整数',
  ja: '0 以上 MillisecondsPerDay 未満の整数',
  ko: '0 이상 MillisecondsPerDay 미만인 정수',
};
const equation = '<emu-eqn id="eqn-MillisecondsPerDay" aoid="MillisecondsPerDay">MillisecondsPerDay = 86400000</emu-eqn>';
const constants = `<emu-clause id="sec-constants"><h1>Constants</h1>${equation}</emu-clause>`;
let checks = 0;
let fixtures = 0;
const failures = [];
function check(name, callback) {
  checks++;
  try { callback(); } catch (error) { failures.push(`${name}: ${error.message}`); }
}
function operation(type = interval, description = '') {
  return `<emu-clause id="sec-timewithinday" type="abstract operation">
    <h1>TimeWithinDay (
      _tv_: a Number,
    ): ${type}</h1>
    <dl class="header">${description ? `<dt>description</dt><dd>${description}</dd>` : ''}</dl>
    <emu-alg>1. Return _tv_ modulo MillisecondsPerDay.</emu-alg>
  </emu-clause>`;
}
async function fixture(lang, body) {
  fixtures++;
  const warnings = [];
  const spec = await build('/type-preamble-links.html', async path => {
    assert.equal(path, '/type-preamble-links.html');
    return `<!doctype html><html lang="${lang}"><head></head><body>${body}</body></html>`;
  }, { assets: 'none', copyright: false, toc: false, warn: warning => warnings.push(warning) });
  assert.deepEqual(warnings, [], `${lang}: fixture must build without warnings`);
  const clause = spec.doc.querySelector('#sec-timewithinday');
  const preamble = clause.querySelector(':scope > p');
  assert.ok(preamble, 'structured operation must generate a preamble');
  assert.ok(!preamble.textContent.includes('UNKNOWN'), 'structured header must parse');
  return { doc: spec.doc, preamble, algorithm: clause.querySelector('emu-alg') };
}
function assertConstantLinks(name, result, lang, href = '#eqn-MillisecondsPerDay') {
  check(`${name}: translated interval and bounds`, () => assert.ok(result.preamble.textContent.includes(labels[lang]), result.preamble.textContent));
  check(`${name}: exactly one constant link in preamble`, () => {
    const links = [...result.preamble.querySelectorAll('a')];
    assert.equal(links.length, 1);
    assert.equal(links[0].textContent, 'MillisecondsPerDay');
    assert.equal(links[0].getAttribute('href'), href);
  });
  check(`${name}: algorithm link retained`, () => {
    const links = [...result.algorithm.querySelectorAll('a')];
    assert.equal(links.length, 1);
    assert.equal(links[0].textContent, 'MillisecondsPerDay');
    assert.equal(links[0].getAttribute('href'), href);
  });
  check(`${name}: generated markers consumed`, () => assert.equal(result.preamble.querySelectorAll('emu-not-ref, [data-ecmarkup-cjk-term]').length, 0));
}
(async () => {
  for (const lang of Object.keys(labels)) {
    for (const later of [false, true]) {
      const result = await fixture(lang, later ? operation() + constants : constants + operation());
      assertConstantLinks(`${lang}/${later ? 'definition-after' : 'definition-before'}`, result, lang);
    }
    const missing = await fixture(lang, operation());
    check(`${lang}/missing: text retained`, () => assert.ok(missing.preamble.textContent.includes(labels[lang])));
    check(`${lang}/missing: no fabricated links`, () => assert.equal(missing.doc.querySelectorAll('#sec-timewithinday a').length, 0));

    // A child namespace inherits the root equation, but a sibling namespace's
    // identically spelled term must not leak into it.
    const sibling = '<emu-clause id="sec-sibling" namespace="sibling"><h1>Sibling</h1><p><dfn id="sibling-constant">MillisecondsPerDay</dfn></p></emu-clause>';
    const inherited = await fixture(lang, constants + sibling + `<emu-clause id="sec-child" namespace="child"><h1>Child</h1>${operation()}</emu-clause>`);
    assertConstantLinks(`${lang}/namespace-inherited`, inherited, lang);
    const local = await fixture(lang, constants + `<emu-clause id="sec-child" namespace="child"><h1>Child</h1>${operation()}<p><dfn id="local-constant">MillisecondsPerDay</dfn></p></emu-clause>`);
    // Standard ecmarkup lookup gives ops precedence over terms even across
    // namespaces. Preserve that behavior rather than inventing shadowing.
    assertConstantLinks(`${lang}/namespace-op-precedence`, local, lang);
    const termOnly = await fixture(lang, `<emu-clause id="sec-child" namespace="child"><h1>Child</h1>${operation()}<p><dfn id="local-constant">MillisecondsPerDay</dfn></p></emu-clause>`);
    check(`${lang}/namespace-term-only: no operation fabricated`, () => {
      const links = [...termOnly.preamble.querySelectorAll('a')];
      assert.equal(links.length, lang === 'en' ? 1 : 0);
      if (links.length) assert.equal(links[0].getAttribute('href'), '#local-constant');
      assert.ok(termOnly.preamble.textContent.includes(labels[lang]));
    });
    check(`${lang}/namespace-term-only: algorithm uses local term`, () => assert.equal(termOnly.algorithm.querySelector('a').getAttribute('href'), '#local-constant'));
    const siblingOnly = await fixture(lang, sibling + `<emu-clause id="sec-child" namespace="child"><h1>Child</h1>${operation()}</emu-clause>`);
    check(`${lang}/namespace-sibling-only: no inaccessible links`, () => assert.equal(siblingOnly.doc.querySelectorAll('#sec-timewithinday a').length, 0));
    if (lang !== 'en') {
      const words = { zh: '整数', ja: '整数', ko: '정수' };
      const distractions = `<emu-clause id="sec-words"><h1>Words</h1><p><dfn id="word-integer">integer</dfn> <dfn id="word-local-integer">${words[lang]}</dfn></p></emu-clause>`;
      const protectedWords = await fixture(lang, constants + distractions + operation());
      assertConstantLinks(`${lang}/protect-surrounding-words`, protectedWords, lang);
      const unrelatedOp = '<emu-clause id="sec-unrelated"><h1>Unrelated operation</h1><emu-eqn id="eqn-finite-time-value" aoid="finite time value">finite time value = 1</emu-eqn></emu-clause>';
      const unrelated = await fixture(lang, constants + unrelatedOp + operation('a finite time value'));
      check(`${lang}/unrelated-type: term-only filtering retained`, () => assert.equal(unrelated.preamble.querySelectorAll('a').length, 0));
    }

    for (const type of [
      'an integer in the interval from 0 (exclusive) to MillisecondsPerDay (inclusive)',
      'an integer in the inclusive interval from _lower_ to _upper_',
      'an integer in the interval from _lower_ (inclusive) to MillisecondsPerDay (exclusive)',
      'an integer in the interval from 0 (inclusive) to MillisecondsPerDayExtra (exclusive)',
    ]) {
      const result = await fixture(lang, constants + operation(type));
      check(`${lang}/nonmatching ${type}: untranslated bounds`, () => assert.ok(result.preamble.textContent.includes(type.replace(/_([^_]+)_/g, '$1')), result.preamble.textContent));
      check(`${lang}/nonmatching ${type}: no whole-sentence link`, () => {
        for (const link of result.preamble.querySelectorAll('a')) assert.equal(link.textContent, 'MillisecondsPerDay');
        assert.equal(result.preamble.querySelectorAll('a').length, type.includes('MillisecondsPerDay (') ? 1 : 0);
      });
    }
    const authored = '<emu-not-ref id="authored-term" data-ecmarkup-cjk-term="author-key">MillisecondsPerDay</emu-not-ref> <code id="authored-code">MillisecondsPerDay</code> <span id="authored-literal">*"MillisecondsPerDay"*</span> <emu-xref id="authored-xref" aoid="MillisecondsPerDay">Author label</emu-xref>';
    const protectedResult = await fixture(lang, constants + operation(interval, authored));
    check(`${lang}/authored: not-ref unchanged`, () => {
      const node = protectedResult.doc.querySelector('#authored-term');
      assert.equal(node.outerHTML, '<emu-not-ref id="authored-term" data-ecmarkup-cjk-term="author-key">MillisecondsPerDay</emu-not-ref>');
    });
    check(`${lang}/authored: code and literal unlinked`, () => {
      for (const id of ['authored-code', 'authored-literal']) {
        const node = protectedResult.doc.getElementById(id);
        assert.equal(node.querySelectorAll('a, emu-xref').length, 0);
        assert.ok(node.textContent.includes('MillisecondsPerDay'));
      }
    });
    check(`${lang}/authored: explicit xref label preserved`, () => {
      const link = protectedResult.doc.querySelector('#authored-xref a');
      assert.equal(link.textContent, 'Author label');
      assert.equal(link.getAttribute('href'), '#eqn-MillisecondsPerDay');
    });
  }
  console.log(JSON.stringify({ fixtures, checks, passed: checks - failures.length, failed: failures.length }));
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
