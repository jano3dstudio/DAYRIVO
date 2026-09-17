'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {requestUrl, readPage, probe} = require('../clockodo/client.cjs');
const auth = {email:'tester@example.com', key:'test-only-never-real', kind:'customers'};
const body = {data:[{id:7,name:'Test customer',active:true,note:'not exposed'}],paging:{current_page:1,count_pages:2,count_items:101}};

test('only modern customer routes; projects require an explicit customer', () => {
  assert.equal(requestUrl('customers').pathname, '/api/v3/customers');
  const url = requestUrl('projects',2,7);
  assert.equal(url.origin, 'https://my.clockodo.com');
  assert.equal(url.pathname, '/api/v4/projects');
  assert.equal(url.searchParams.get('filter[customers_id]'),'7');
  assert.equal(url.searchParams.get('page'),'2');
  assert.equal(requestUrl('services').pathname, '/api/v4/services');
  for (const kind of ['entries','users','https://evil.example']) assert.throws(()=>requestUrl(kind));
  for (const id of [undefined,0,-1,'7']) assert.throws(()=>requestUrl('projects',1,id));
});
test('requests use GET, reject redirects and expose only required response fields', async () => {
  const result = await probe(auth, async (url, options) => {
    assert.equal(options.method,'GET');
    assert.equal(options.redirect,'error');
    assert.equal(options.headers['X-ClockodoApiKey'],auth.key);
    assert.equal(options.headers['X-ClockodoApiUser'],auth.email);
    assert.equal(url.searchParams.get('items_per_page'),'100');
    assert.ok(options.signal);
    return {ok:true,json:async()=>body};
  });
  assert.deepEqual(result,{rows:[{id:7,name:'Test customer',active:true}],page:1,pages:2,total:101});
});
test('fails closed on wrong customer, malformed pagination and terminal control characters', () => {
  assert.throws(()=>readPage({...body,data:[{...body.data[0],customers_id:8}]},'projects',1,7));
  assert.throws(()=>readPage({...body,paging:{...body.paging,current_page:2}},'customers',1));
  assert.throws(()=>readPage({customers:[],paging:body.paging},'customers',1));
  const result=readPage({...body,data:[{...body.data[0],name:'A\x1b\nB'}]},'customers',1);
  assert.equal(result.rows[0].name,'AB');
});
test('errors never repeat credentials, raw server bodies or network exceptions', async () => {
  for (const status of [401,403,429,500,302]) {
    await assert.rejects(probe(auth,async()=>({ok:false,status,json:async()=>{throw Error(auth.key);}})), error=>!error.message.includes(auth.key));
  }
  await assert.rejects(probe(auth,async()=>{throw Error(auth.key);}),/Verbindung fehlgeschlagen/);
  await assert.rejects(probe({...auth,key:'bad\r\nheader'},async()=>assert.fail()),/ungueltig/);
});
