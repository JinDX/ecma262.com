const fs=require('fs'),emd=require('ecmarkdown'),{JSDOM}=require('jsdom');
const old=/\b(?:return|throw)\b|[\s(]\?\s/i,macro=/\bIfAbrupt(?:CloseIterators?|CloseAsyncIterator|RejectPromise)\(/,note=/^(?:NOTE|Assert): /;
const own=n=>[...n.childNodes].filter(x=>x.nodeName!=='OL'&&x.nodeName!=='UL').map(x=>x.textContent).join('');
function read(f){let src=fs.readFileSync(f,'utf8');let algs=[...src.matchAll(/<emu-alg\b[^>]*>([\s\S]*?)<\/emu-alg>/g)].map(x=>emd.emit(emd.parseAlgorithm(x[1])));let dom=new JSDOM(algs.map(x=>'<emu-alg>'+x+'</emu-alg>').join('\n'));let ret=[...dom.window.document.querySelectorAll('emu-alg')].map(a=>[...a.querySelectorAll('li')].map(n=>({text:own(n),ol:n.querySelector(':scope > ol')!==null})));dom.window.close();return ret;}

const assert=require('node:assert/strict'),vm=require('node:vm');
const implementation=fs.readFileSync(require.resolve('ecmarkup/lib/Algorithm'),'utf8');
function regex(name){const line=implementation.split('\n').find(x=>x.trim().startsWith('const '+name+' = /'));assert.ok(line,name);return vm.runInNewContext(line.trim().slice(('const '+name+' = ').length,-1));}
const localizedExit=regex('localizedExit'),localizedNote=regex('localizedNote'),localizedClosure=regex('localizedClosure');
const en=read('spec.html');let checks=0;
for(const l of 'cjk'){
 const loc=read('spec.'+l+'.html');assert.equal(loc.length,en.length);let exits=0,closures=0;
 for(let i=0;i<en.length;i++){assert.equal(loc[i].length,en[i].length);
  for(let j=0;j<en[i].length;j++){
   const e=en[i][j].text,t=loc[i][j].text;
   const expectedExit=(old.test(e)||macro.test(e))&&!note.test(e);
   const actualExit=(old.test(t)||macro.test(t)||localizedExit.test(t))&&!note.test(t)&&!localizedNote.test(t);
   assert.equal(actualExit,expectedExit,`${l} algorithm ${i} step ${j}: ${t}`);
   const expectedClosure=/ performs the following steps (atomically )?when called:$/.test(e);
   const actualClosure=localizedClosure.test(t);
   assert.equal(actualClosure,expectedClosure,`${l} closure ${i}/${j}: ${t}`);
   exits+=actualExit;closures+=actualClosure;checks+=2;
  }
 }
 console.log(JSON.stringify({language:l,algorithms:loc.length,exits,closures}));
}
for(const text of ['注：返回 x。','断言：? Foo()。','注記: x を返す。','表明: ? Foo()。','단언: x를 반환합니다.'])assert.ok(localizedNote.test(text));
for(const text of ['繰り返す。','由 x 返回的值。','x가 반환한 값'])assert.equal(localizedExit.test(text),false);
console.log(JSON.stringify({annotationParityChecks:checks,passed:true}));
