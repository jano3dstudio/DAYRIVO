/* Shared, dependency-free planning model. Also loadable by Node for regression checks. */
(function (root) {
  'use strict';
  const M = typeof module !== 'undefined' && module.exports ? require('./master-data-model.js') : root.MasterData;
  const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  const categories = ['Kunde', 'AI / Firma', 'Spiel', 'Familie', 'Sport', 'Pause', 'Routine', 'Schule', 'Admin', 'Puffer'];
  const subtitles = ['Kundenprojekte', 'AI-Workflows / Firma', 'Kundenprojekte', 'THE GRAVITY COMPLEX', 'Spiel / Kunde – flexibel'];
  const colors = ['#ce7373', '#739ee6', '#ce7373', '#a58ade', '#e6a361'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const dateISO = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  function mondayISO(value = new Date()) {
    const d = typeof value === 'string' ? new Date(value + 'T12:00:00') : new Date(value);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dateISO(d);
  }
  function addDays(iso, amount) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + amount); return dateISO(d); }
  function weekNumber(iso) {
    const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return Math.ceil((((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7);
  }
  const validTime = t => typeof t === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
  const minutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const time = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const duration = item => minutes(item.end) - minutes(item.start);
  const durationLabel = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')} h`;
  const PLAN_STEP = 15;
  const snapMinute = minute => Math.round(minute / PLAN_STEP) * PLAN_STEP;
  function defaultSettings() { return Object.fromEntries(days.map((d, i) => [d, {color:colors[i], subtitle:subtitles[i]}])); }
  function defaultItems() {
    const items = [];
    const push = (day, start, end, cat, title) => items.push({id:uid(), day, start, end, cat, title, description:'', done:false});
    days.forEach(d => {
      push(d, '07:30', '08:20', 'Schule', 'Kinder zur Schule'); push(d, '08:20', '08:50', 'Sport', '30 Min. Fahrrad');
      push(d, '08:50', '09:15', 'Routine', 'Dusche / Kaffee'); push(d, '12:00', '12:30', 'Pause', 'Essen + Spaziergang');
    });
    push('Montag','09:15','12:00','Kunde','Kundenprojekte'); push('Montag','12:30','19:00','Kunde','Kundenprojekte');
    push('Dienstag','09:15','12:00','AI / Firma','AI-Workflows / Research'); push('Dienstag','12:30','14:30','AI / Firma','AI-Workflows / Research'); push('Dienstag','14:30','15:00','Familie','Kinder abholen');
    push('Mittwoch','09:15','12:00','Kunde','Kundenprojekte'); push('Mittwoch','12:30','17:00','Kunde','Kundenprojekte');
    push('Donnerstag','09:15','12:00','Spiel','THE GRAVITY COMPLEX'); push('Donnerstag','12:30','14:30','Spiel','THE GRAVITY COMPLEX'); push('Donnerstag','14:30','15:00','Familie','Kinder abholen');
    push('Freitag','09:15','12:00','Spiel','Spiel / Kunde – Wochenentscheidung'); push('Freitag','12:30','14:30','Spiel','Spiel / Kunde – Wochenentscheidung'); push('Freitag','14:30','15:00','Familie','Kinder abholen?');
    return items;
  }
  const freshItems = items => items.map(item => { const fresh = {...clone(item),id:uid(),done:false,actual:''}; delete fresh.actualMinutes; return fresh; });
  function ensurePresets(data) {
    if (data.presets === undefined) {
      data.presets = {basis:{id:'basis',name:'Standardwoche',items:freshItems(data.template)}};
      data.defaultPresetId = 'basis';
    }
    return data;
  }
  function defaultLook() { return {accent:'#3cff91',frame:'dashed',days:Object.fromEntries(days.map((day,i) => [day,colors[i]]))}; }
  function validateLook(value) {
    const color = hex => typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex);
    if (!value || !color(value.accent) || !['dashed','solid','none'].includes(value.frame) || !value.days || days.some(day => !color(value.days[day]))) throw new Error('Ungültiger Look: Akzent, Tagesfarben oder Rahmen fehlen.');
    return {accent:value.accent.toLowerCase(),frame:value.frame,days:Object.fromEntries(days.map(day => [day,value.days[day].toLowerCase()]))};
  }
  function validateLookPresets(presets) {
    if (!Array.isArray(presets) || presets.length > 100) throw new Error('Maximal 100 Looks sind möglich.');
    const ids = new Set();
    return presets.map(preset => {
      if (!preset || typeof preset.id !== 'string' || !/^[a-z0-9-]+$/i.test(preset.id) || ids.has(preset.id) || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 80) throw new Error('Ungültiger Look-Name oder doppelte ID.');
      ids.add(preset.id);
      return {id:preset.id,name:preset.name.trim(),...validateLook(preset)};
    });
  }
  function ensureLooks(data) {
    if (data.settings.appearance === undefined) data.settings.appearance = {accent:'#3cff91',frame:'dashed'};
    if (data.settings.savedColors === undefined) data.settings.savedColors = [];
    if (!Array.isArray(data.settings.savedColors) || data.settings.savedColors.length > 16 || data.settings.savedColors.some(color => typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) throw new Error('Ungültige gespeicherte Farben.');
    if (data.looks === undefined) data.looks = [{id:'jano',name:'JANO Studio',...defaultLook()}];
    return data;
  }
  function currentLook(data) { return validateLook({...data.settings.appearance,days:Object.fromEntries(days.map(day => [day,data.settings.days[day].color]))}); }
  function parseLooks(raw) {
    if (raw?.app !== 'JS OFFICE WEEK LOOKS' || raw.version !== 1) throw new Error('Das ist keine JS OFFICE WEEK Looks-Datei.');
    const presets = validateLookPresets(raw.presets);
    if (!presets.length) throw new Error('Die Datei enthält keine Looks.');
    return presets;
  }
  function ensureDayPresets(data) {
    if (data.dayPresets === undefined) {
      const source = data.presets[data.defaultPresetId];
      data.dayPresets = days.map((day,i) => ({id:'day-'+i,name:(source.name.slice(0,55)+' · '+day),items:freshItems(source.items.filter(item => item.day === day))}));
    }
    return data;
  }
  function validateDayPresets(presets) {
    if (!Array.isArray(presets) || presets.length > 100) throw new Error('Maximal 100 Tagespresets sind möglich.');
    const ids = new Set();
    for (const preset of presets) {
      if (!preset || typeof preset.id !== 'string' || !/^[a-z0-9-]+$/i.test(preset.id) || ids.has(preset.id) || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 80) throw new Error('Ungültiges Tagespreset.');
      validateItems(preset.items);
      if (new Set(preset.items.map(item => item.day)).size > 1) throw new Error('Ein Tagespreset darf nur einen Tag enthalten.');
      ids.add(preset.id);
    }
  }
  function createDayPreset(data,name,items) {
    name = name.trim();
    if (!name || name.length > 80) throw new Error('Bitte einen Namen mit maximal 80 Zeichen eingeben.');
    if (data.dayPresets.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Dieser Preset-Name ist schon vergeben.');
    const preset = {id:uid(),name,items:freshItems(items)};
    validateDayPresets([...data.dayPresets,preset]);
    data.dayPresets.push(preset); return preset;
  }
  function applyDayPreset(data,id,target,day) {
    const preset = data.dayPresets.find(p => p.id === id);
    if (!preset || !days.includes(day)) throw new Error('Tagespreset oder Zieltag nicht gefunden.');
    const items = [...target.items.filter(item => item.day !== day),...freshItems(preset.items).map(item => ({...item,day}))];
    validateItems(items);
    target.items = items; return target;
  }
  function createData() {
    const data = ensureLooks(ensureDayPresets(ensurePresets({version:1, selectedWeek:mondayISO(), settings:{days:defaultSettings()}, template:defaultItems(), weeks:{}})));
    M.ensure(data,categories,uid,timeGroup); return data;
  }
  function ensureWeek(data, iso) {
    ensurePresets(data);
    if (!data.weeks[iso]) {
      const preset = data.presets[data.defaultPresetId];
      data.weeks[iso] = {weekStart:iso,items:freshItems(preset.items),sourcePreset:clone(preset)};
    }
    data.selectedWeek = iso;
    return data.weeks[iso];
  }
  function validateItems(items) {
    if (!Array.isArray(items) || items.length > 10000) throw new Error('Ungültige Eintragsliste.');
    const ids = new Set();
    for (const item of items) {
      if (!item || !days.includes(item.day) || !validTime(item.start) || !validTime(item.end) || duration(item) <= 0 || typeof item.title !== 'string' || typeof item.cat !== 'string' || typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('Ein Backup-Eintrag enthält ungültige Zeiten, Tage oder IDs.');
      for (const key of ['description','customer','project','service','actual']) if (item[key] !== undefined && typeof item[key] !== 'string') throw new Error('Ungültiges Textfeld im Backup.');
      if (item.done !== undefined && typeof item.done !== 'boolean') throw new Error('Ungültiger Erledigt-Status.');
      if (item.icon !== undefined && (typeof item.icon !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(item.icon))) throw new Error('Ungültiges Eintrags-Icon.');
      if (item.hourlyRateCents != null && !validRate(item.hourlyRateCents)) throw new Error('Ungültiger Stundensatz im Backup.');
      if (item.actualMinutes != null && !validActualMinutes(item.actualMinutes)) throw new Error('Ungültige erfasste Arbeitszeit im Backup.');
      ids.add(item.id);
    }
  }
  function validWeek(iso) { return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(new Date(iso + 'T12:00:00')) && dateISO(new Date(iso + 'T12:00:00')) === iso && mondayISO(iso) === iso; }
  function validateReminders(reminders) {
    if (reminders === undefined) return;
    if (!Array.isArray(reminders) || reminders.length > 200) throw new Error('Maximal 200 Quick-To-dos pro Woche sind möglich.');
    const ids = new Set();
    for (const item of reminders) {
      if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id) || !days.includes(item.day) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 160 || typeof item.done !== 'boolean') throw new Error('Ungültiges Quick-To-do im Backup.');
      ids.add(item.id);
    }
  }
  function validateData(data) {
    if (!data || data.version !== 1 || !validWeek(data.selectedWeek) || !data.weeks || Array.isArray(data.weeks) || typeof data.weeks !== 'object' || !data.settings?.days) throw new Error('Das ist kein gültiges JS OFFICE WEEK Backup.');
    validateItems(data.template);
    if (data.settings.language !== undefined && (typeof data.settings.language !== 'string' || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(data.settings.language) || data.settings.language.length > 35)) throw new Error('Ungültige Spracheinstellung.');
    ensurePresets(data);
    if (!data.presets || typeof data.presets !== 'object' || Array.isArray(data.presets) || !Object.hasOwn(data.presets,data.defaultPresetId)) throw new Error('Ungültige Wochenpresets.');
    for (const [id,preset] of Object.entries(data.presets)) {
      if (!/^[a-z0-9-]+$/i.test(id) || preset?.id !== id || typeof preset.name !== 'string' || !preset.name.trim() || preset.name.length > 80) throw new Error('Ungültiges Wochenpreset.');
      validateItems(preset.items);
    }
    for (const [iso, week] of Object.entries(data.weeks)) {
      if (!validWeek(iso) || week?.weekStart !== iso) throw new Error('Ungültige Kalenderwoche im Backup.');
      validateItems(week.items);
      validateReminders(week.reminders);
      if (week.sourcePreset !== undefined) validatePresetReference(week.sourcePreset);
      if (week.planSnapshot !== undefined) {
        if (!week.planSnapshot || typeof week.planSnapshot.capturedAt !== 'string' || !Number.isFinite(Date.parse(week.planSnapshot.capturedAt))) throw new Error('Ungültiger Ausgangsplan.');
        validateItems(week.planSnapshot.items);
        if (week.planSnapshot.preset !== null) validatePresetReference(week.planSnapshot.preset);
      }
    }
    if (!data.weeks[data.selectedWeek]) throw new Error('Die ausgewählte Woche fehlt im Backup.');
    for (const day of days) {
      const setting = data.settings.days[day];
      if (!setting || !/^#[0-9a-f]{6}$/i.test(setting.color) || typeof setting.subtitle !== 'string') throw new Error('Ungültige Tageseinstellungen.');
    }
    ensureLooks(data);
    currentLook(data);
    data.looks = validateLookPresets(data.looks);
    ensureDayPresets(data);
    validateDayPresets(data.dayPresets);
    M.validate(M.ensure(data,categories,uid,timeGroup),M.allItems(data));
    if(api.validateDayform)api.validateDayform(data);
    return data;
  }
  function migrateLegacy(current, archive = []) {
    const data = createData();
    delete data.masterData; // Import legacy free text only after all weeks are present.
    if (!Array.isArray(archive)) throw new Error('Ungültiges V3-Archiv.');
    for (const week of [...archive, ...(current ? [current] : [])]) {
      if (!validWeek(week?.weekStart)) throw new Error('Ungültige V3-Woche.');
      validateItems(week.items); data.weeks[week.weekStart] = clone(week);
    }
    data.selectedWeek = current?.weekStart || data.selectedWeek;
    ensureWeek(data, data.selectedWeek);
    return validateData(data);
  }
  function parseBackup(raw) {
    if (raw?.app === 'JS OFFICE WEEK') return validateData(clone(raw.data));
    if (raw?.version === 1) return validateData(clone(raw));
    if (raw?.current) return migrateLegacy(raw.current, raw.archive || []);
    throw new Error('Unbekanntes Backup-Format.');
  }
  function createPreset(data,name,items = []) {
    name = name.trim();
    if (!name || name.length > 80) throw new Error('Bitte einen Namen mit maximal 80 Zeichen eingeben.');
    if (Object.values(data.presets).some(preset => preset.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Ein Preset mit diesem Namen existiert bereits.');
    validateItems(items);
    const preset = {id:uid(),name,items:freshItems(items)}; data.presets[preset.id] = preset; return preset;
  }
  function applyPreset(data,id,iso) {
    const preset = data.presets[id];
    if (!preset || !validWeek(iso)) throw new Error('Preset oder Woche nicht gefunden.');
    const reminders = data.weeks[iso]?.reminders;
    data.weeks[iso] = {weekStart:iso,items:freshItems(preset.items),sourcePreset:clone(preset),...(reminders ? {reminders:clone(reminders)} : {})};
    return data.weeks[iso];
  }
  function validatePresetReference(preset) {
    if (!preset || typeof preset.id !== 'string' || typeof preset.name !== 'string') throw new Error('Ungültiger Preset-Vergleich.');
    validateItems(preset.items);
  }
  function capturePlan(week,preset = week.sourcePreset || null) {
    if (week.planSnapshot) throw new Error('Für diese Woche ist der Ausgangsplan bereits festgehalten.');
    week.planSnapshot = {capturedAt:new Date().toISOString(),items:clone(week.items),preset:preset ? clone(preset) : null};
    return week.planSnapshot;
  }
  function weekMetrics(week) {
    const items = week.items, plan = week.planSnapshot, current = new Map(items.map(item=>[item.id,item]));
    const sum = entries => entries.reduce((total,item)=>total+duration(item),0);
    const baseline = plan?.items || [], originalIds = new Set(baseline.map(item=>item.id));
    const achieved = baseline.filter(item=>current.get(item.id)?.done);
    const extra = plan ? items.filter(item=>!originalIds.has(item.id)) : [];
    const removed = baseline.filter(item=>!current.has(item.id));
    const changed = baseline.filter(item=>{
      const live = current.get(item.id);
      return live && ['day','start','end','title','cat'].some(key=>live[key]!==item[key]);
    });
    const planned = sum(baseline), credited = sum(achieved);
    const cats = [...new Set([...categories,...items.map(i=>i.cat),...baseline.map(i=>i.cat),...(plan?.preset?.items || []).map(i=>i.cat)])];
    return {hasPlan:!!plan,planned,credited,percent:plan && planned>0 ? Math.round(credited/planned*100) : null,
      currentMinutes:sum(items),doneMinutes:sum(items.filter(i=>i.done)),doneCount:items.filter(i=>i.done).length,count:items.length,
      openMinutes:planned-credited,extraMinutes:sum(extra),extraDoneMinutes:sum(extra.filter(i=>i.done)),extraCount:extra.length,removedCount:removed.length,changedCount:changed.length,
      categories:cats.map(cat=>({cat,preset:plan?.preset ? sum(plan.preset.items.filter(i=>i.cat===cat)) : null,planned:sum(baseline.filter(i=>i.cat===cat)),credited:sum(achieved.filter(i=>i.cat===cat)),current:sum(items.filter(i=>i.cat===cat))})).filter(row=>row.planned || row.current || row.preset)
    };
  }
  const timeGroups = [
    {id:'work',label:'Arbeit',categories:['Kunde','AI / Firma','Spiel','Admin']},
    {id:'sport',label:'Sport',categories:['Sport']},
    {id:'private',label:'Privat',categories:['Familie','Schule','Routine']},
    {id:'break',label:'Pausen / Puffer',categories:['Pause','Puffer']},
    {id:'other',label:'Sonstiges',categories:[]}
  ];
  function timeGroup(category,catalog) { return catalog?.categories.find(record=>record.id === category)?.group || timeGroups.find(group => group.categories.includes(category))?.id || 'other'; }
  function validRate(cents) { return Number.isSafeInteger(cents) && cents >= 0 && cents <= 100000000; }
  function validActualMinutes(value) { return Number.isInteger(value) && value >= 0 && value <= 1440; }
  function parseActualTime(value) {
    const text = String(value).trim(); if (!text) return null;
    const match = /^(\d{1,2}):([0-5]\d)$/.exec(text);
    const minutes = match ? Number(match[1])*60+Number(match[2]) : NaN;
    if (!validActualMinutes(minutes)) throw new Error('Arbeitszeit als Stunden:Minuten eingeben, z. B. 1:30 (maximal 24:00).');
    return minutes;
  }
  function recordedWorkMetrics(items,catalog) {
    const result = {minutes:0,recordedCount:0,missingTimeCount:0,missingRateCount:0,missingRateMinutes:0,valuedMinutes:0,earnedCents:0};
    for (const item of items) {
      if (!item.done || timeGroup(item.cat,catalog) !== 'work') continue;
      if (!validActualMinutes(item.actualMinutes)) { result.missingTimeCount++; continue; }
      result.minutes += item.actualMinutes; result.recordedCount++;
      if (!validRate(item.hourlyRateCents)) {result.missingRateCount++;result.missingRateMinutes+=item.actualMinutes;continue;}
      result.valuedMinutes+=item.actualMinutes;
      result.earnedCents+=Math.round(item.actualMinutes*item.hourlyRateCents/60);
    }
    return result;
  }
  function parseRate(value) {
    const text = String(value).trim();
    if (!text) return null;
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) throw new Error('Bitte einen Stundensatz zwischen 0 und 1.000.000 € mit maximal zwei Nachkommastellen eingeben.');
    const cents = Math.round(Number(text.replace(',','.'))*100);
    if (!validRate(cents)) throw new Error('Bitte einen Stundensatz zwischen 0 und 1.000.000 € mit maximal zwei Nachkommastellen eingeben.');
    return cents;
  }
  function financialMetrics(items,catalog) {
    const result = {plannedCents:0,doneCents:0,openCents:0,ratedCount:0,unratedCount:0,unratedMinutes:0};
    for (const item of items) {
      if (timeGroup(item.cat,catalog) !== 'work') continue;
      if (item.hourlyRateCents == null || !validRate(item.hourlyRateCents)) {
        result.unratedCount++; result.unratedMinutes += duration(item); continue;
      }
      // Round each entry to cents before summing; explicit zero differs from missing.
      const cents = Math.round(duration(item)*item.hourlyRateCents/60);
      result.ratedCount++; result.plannedCents += cents;
      if (item.done) result.doneCents += cents; else result.openCents += cents;
    }
    return result;
  }
  function groupedTime(items,catalog) {
    return timeGroups.map(group => {
      const entries = items.filter(item => timeGroup(item.cat,catalog) === group.id);
      return {...group,planned:entries.reduce((sum,item) => sum+duration(item),0),done:entries.filter(item => item.done).reduce((sum,item) => sum+duration(item),0),count:entries.length};
    });
  }
  function monthMetrics(data,month) {
    const first = new Date(month+'-01T12:00:00'), year = first.getFullYear(), index = first.getMonth();
    const last = new Date(year,index+1,0,12).getDate(), dates = [];
    for (let day=1;day<=last;day++) {
      const iso = dateISO(new Date(year,index,day,12)), weekStart = mondayISO(iso), week = data.weeks[weekStart];
      const dayIndex = (new Date(iso+'T12:00:00').getDay()+6)%7;
      const items = week && dayIndex<5 ? week.items.filter(item=>item.day===days[dayIndex]) : [];
      dates.push({iso,weekStart,dayIndex,recorded:!!week && dayIndex<5,items,groups:groupedTime(items,data.masterData),planned:items.reduce((sum,item)=>sum+duration(item),0),done:items.filter(i=>i.done).reduce((sum,item)=>sum+duration(item),0)});
    }
    return {dates,groups:groupedTime(dates.flatMap(day=>day.items),data.masterData),planned:dates.reduce((sum,day)=>sum+day.planned,0),done:dates.reduce((sum,day)=>sum+day.done,0),recordedDays:dates.filter(day=>day.recorded).length,count:dates.reduce((sum,day)=>sum+day.items.length,0)};
  }
  // Each overlapping group gets independent lanes; touching intervals share a lane.
  function layout(items) {
    const sorted = [...items].sort((a,b) => minutes(a.start) - minutes(b.start) || minutes(b.end) - minutes(a.end));
    const result = []; let group = [], groupEnd = -1;
    function flush() {
      const ends = [];
      for (const item of group) {
        let lane = ends.findIndex(end => end <= minutes(item.start));
        if (lane < 0) lane = ends.length;
        ends[lane] = minutes(item.end); result.push({item, lane, group});
      }
      for (const row of result) if (row.group === group) { row.lanes = ends.length; delete row.group; }
      group = [];
    }
    for (const item of sorted) {
      if (group.length && minutes(item.start) >= groupEnd) { flush(); groupEnd = -1; }
      group.push(item); groupEnd = Math.max(groupEnd, minutes(item.end));
    }
    flush(); return result;
  }
  function resizeEnd(item, deltaMinutes) {
    const minimum = (Math.floor(minutes(item.start) / PLAN_STEP) + 1) * PLAN_STEP;
    const maximum = Math.floor(1439 / PLAN_STEP) * PLAN_STEP;
    if (minimum > maximum) return item.end; // Preserve imported late-night exceptions.
    return time(Math.min(maximum, Math.max(minimum, snapMinute(minutes(item.end) + deltaMinutes))));
  }
  function resizeStart(item, deltaMinutes) {
    const maximum = (Math.ceil(minutes(item.end) / PLAN_STEP) - 1) * PLAN_STEP;
    return time(Math.max(0,Math.min(maximum,snapMinute(minutes(item.start) + deltaMinutes))));
  }
  function moveItem(item, day, deltaMinutes) {
    // A horizontal move preserves exact legacy times; vertical moves snap the start.
    const length = duration(item);
    const latest = Math.floor((1439 - length) / PLAN_STEP) * PLAN_STEP;
    const start = Math.abs(deltaMinutes) < PLAN_STEP / 2 ? minutes(item.start) : Math.max(0,Math.min(latest,snapMinute(minutes(item.start) + deltaMinutes)));
    return {...item,day,start:time(start),end:time(start + length)};
  }
  const api = {days,categories,clone,uid,dateISO,mondayISO,addDays,weekNumber,validTime,minutes,time,duration,durationLabel,PLAN_STEP,snapMinute,defaultItems,createData,ensureWeek,validateData,migrateLegacy,parseBackup,layout,resizeEnd,moveItem,ensurePresets,createPreset,applyPreset,capturePlan,weekMetrics,monthMetrics};
  Object.assign(api,{resizeStart,defaultLook,validateLook,validateLookPresets,ensureLooks,currentLook,parseLooks});
  Object.assign(api,{ensureDayPresets,validateDayPresets,createDayPreset,applyDayPreset});
  Object.assign(api,{timeGroups,timeGroup,groupedTime,validRate,parseRate,financialMetrics});
  Object.assign(api,{validateReminders,validateItems});
  Object.assign(api,{validActualMinutes,parseActualTime,recordedWorkMetrics});
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Planner = api;
})(globalThis);
