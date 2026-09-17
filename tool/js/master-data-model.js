/* Local master data with stable IDs. No transport, credentials or network calls. */
(function(root) {
  'use strict';
  const kinds = ['categories','customers','projects','services'];
  function allItems(data) {
    const lists = [data.template,...Object.values(data.presets || {}).map(p=>p.items),...(data.dayPresets || []).map(p=>p.items)];
    for (const week of Object.values(data.weeks || {})) lists.push(week.items,week.sourcePreset?.items,week.planSnapshot?.items,week.planSnapshot?.preset?.items);
    return lists.filter(Array.isArray).flat();
  }
  function ensure(data,defaults,uid,groupFor) {
    if (data.masterData !== undefined) return data.masterData;
    const items = allItems(data), catalog = {version:1,categories:[],customers:[],projects:[],services:[]};
    catalog.categories = [...new Set([...defaults,...items.map(i=>i.cat)])].map(id=>({id,name:id,group:groupFor(id),active:true}));
    const add = (kind,name,customerId) => {
      name = (name || '').trim(); if (!name) return null;
      let record = catalog[kind].find(r=>r.name.toLowerCase() === name.toLowerCase() && (kind !== 'projects' || r.customerId === customerId));
      if (!record) { record = {id:uid(),name,active:true}; if (kind === 'projects') record.customerId = customerId; catalog[kind].push(record); }
      return record.id;
    };
    for (const item of items) {
      const customerId = add('customers',item.customer);
      if (customerId) add('projects',item.project,customerId);
      add('services',item.service);
    }
    data.masterData = catalog; return catalog;
  }
  function validate(catalog,items = []) {
    const fail = () => { throw new Error('Ungültige Stammdaten.'); };
    if (!catalog || catalog.version !== 1) fail();
    const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
    for (const kind of kinds) {
      const records = catalog[kind], ids = new Set(), names = new Set(), external = new Set();
      if (!Array.isArray(records) || records.length > 2000) fail();
      for (const record of records) {
        if (!record || !text(record.id) || ids.has(record.id) || !text(record.name) || typeof record.active !== 'boolean') fail();
        ids.add(record.id);
        const nameKey = JSON.stringify([record.name.trim().toLowerCase(),kind === 'projects' ? record.customerId : null]);
        if (names.has(nameKey)) throw new Error('Dieser Name ist schon vergeben.');
        names.add(nameKey);
        if (kind === 'categories' && !['work','sport','private','break','other'].includes(record.group)) fail();
        if (kind === 'projects' && !catalog.customers.some(r=>r.id === record.customerId)) fail();
        if (record.externalIds !== undefined) {
          if (!record.externalIds || typeof record.externalIds !== 'object' || Array.isArray(record.externalIds) || Object.keys(record.externalIds).some(key=>key !== 'clockodo')) fail();
          const id = record.externalIds.clockodo;
          if (id !== undefined && (typeof id !== 'string' || !/^[1-9]\d*$/.test(id) || id.length > 30 || external.has(id))) fail();
          if (id) external.add(id);
        }
      }
    }
    if (!catalog.categories.some(r=>r.active)) throw new Error('Mindestens eine Kategorie muss aktiv bleiben.');
    for (const item of items) {
      for (const [field,kind] of [['customerId','customers'],['projectId','projects'],['serviceId','services']]) {
        if (item[field] != null && (typeof item[field] !== 'string' || !catalog[kind].some(r=>r.id === item[field]))) fail();
      }
      if (item.projectId && catalog.projects.find(r=>r.id === item.projectId).customerId !== item.customerId) fail();
    }
    return catalog;
  }
  function save(catalog,kind,record) {
    if (!kinds.includes(kind)) throw new Error('Ungültige Stammdaten.');
    const next = JSON.parse(JSON.stringify(catalog)), index = next[kind].findIndex(r=>r.id === record.id);
    record = {...record,name:record.name.trim()};
    if (index < 0) next[kind].push(record); else next[kind][index] = record;
    return validate(next);
  }
  const api = {kinds,allItems,ensure,validate,save};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MasterData = api;
})(globalThis);
