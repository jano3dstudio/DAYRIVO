'use strict';

// Local read-only probe. Never loaded by index.html; credentials arrive via stdin.
const ORIGIN = 'https://my.clockodo.com';
class ProbeError extends Error {}
const fail = message => { throw new ProbeError(message); };
const positive = value => Number.isSafeInteger(value) && value > 0;

function requestUrl(kind, page = 1, customerId) {
  if (!positive(page) || page > 10000) fail('Ungueltige Seite.');
  if (!['customers', 'projects'].includes(kind)) fail('Nur Kunden und Kundenprojekte sind freigegeben.');
  if (kind === 'projects' && !positive(customerId)) fail('Bitte zuerst einen Kunden auswaehlen.');
  const url = new URL(kind === 'customers' ? '/api/v3/customers' : '/api/v4/projects', ORIGIN);
  url.searchParams.set('items_per_page', '100');
  url.searchParams.set('page', String(page));
  if (kind === 'projects') url.searchParams.set('filter[customers_id]', String(customerId));
  return url;
}

function readPage(body, kind, page, customerId) {
  const p = body?.paging;
  if (!Array.isArray(body?.data) || body.data.length > 100 || !p ||
      p.current_page !== page || !Number.isSafeInteger(p.count_pages) || p.count_pages < 0 ||
      !Number.isSafeInteger(p.count_items) || p.count_items < 0 ||
      (p.count_pages > 0 && p.count_pages < page)) fail('Unerwartetes Clockodo-Antwortformat.');
  const rows = body.data.map(row => {
    if (!positive(row?.id) || typeof row.name !== 'string' || typeof row.active !== 'boolean' ||
        (kind === 'projects' && row.customers_id !== customerId)) fail('Unerwartete Kundenzuordnung oder Antwortdaten.');
    // Display only required fields, strip terminal control characters.
    return {id: row.id, name: row.name.replace(/[\x00-\x1f\x7f-\x9f]/g, '').slice(0, 200), active: row.active};
  });
  return {rows, page, pages: p.count_pages, total: p.count_items};
}

async function probe(input, fetcher = fetch) {
  const {email, key, kind, page = 1, customerId} = input || {};
  if (typeof email !== 'string' || !/^[^\s;@]+@[^\s;@]+\.[^\s;@]+$/.test(email) || email.length > 254 ||
      typeof key !== 'string' || !/^[\x21-\x7e]{1,512}$/.test(key)) fail('E-Mail oder API-Key fehlen oder sind ungueltig.');
  const url = requestUrl(kind, page, customerId);
  let response;
  try {
    response = await fetcher(url, {method:'GET', redirect:'error', signal:AbortSignal.timeout(20000), headers:{
      Accept:'application/json', 'Accept-Language':'de',
      'X-ClockodoApiUser':email, 'X-ClockodoApiKey':key,
      'X-Clockodo-External-Application':`DAYRIVO local test;${email}`
    }});
  } catch { fail('Verbindung fehlgeschlagen (Netzwerk, Zeitlimit oder Weiterleitung).'); }
  if (!response.ok) {
    const messages = {401:'E-Mail oder API-Key wurden abgelehnt.',403:'Keine Leseberechtigung fuer diese Daten.',429:'Anfragelimit erreicht. Bitte spaeter erneut testen.'};
    fail(messages[response.status] || `Clockodo antwortet mit HTTP ${response.status}.`);
  }
  let body;
  try { body = await response.json(); } catch { fail('Clockodo liefert keine gueltige JSON-Antwort.'); }
  return readPage(body, kind, page, customerId);
}

if (require.main === module) {
  (async () => {
    let raw = '';
    try {
      for await (const chunk of process.stdin) {
        raw += chunk;
        if (raw.length > 4096) fail('Eingabe ist zu lang.');
      }
      const input = JSON.parse(raw.replace(/^\uFEFF/, ''));
      raw = '';
      const result = await probe(input);
      input.key = '';
      process.stdout.write(JSON.stringify({ok:true, ...result}));
    } catch (error) {
      // Never echo network exceptions, input, response bodies or authentication headers.
      process.stdout.write(JSON.stringify({ok:false, error:error instanceof ProbeError ? error.message : 'Lokaler Test konnte nicht ausgefuehrt werden.'}));
      process.exitCode = 1;
    }
  })();
}
module.exports = {requestUrl, readPage, probe};
