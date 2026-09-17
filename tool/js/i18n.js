'use strict';
const I18N = (() => {
  const languages = [{id:'de',name:'Deutsch',locale:'de-DE'},{id:'en',name:'English',locale:'en-GB'}];
  let language = 'de';
  const bindings = [];
  function text(source,values = []) {
    const key = source.trim(), translation = globalThis.OfficeLocales?.[language]?.[key];
    const result = translation === undefined ? source : source.slice(0,source.indexOf(key)) + translation + source.slice(source.indexOf(key)+key.length);
    return result.replace(/\{(\d+)\}/g,(match,index) => values[index] === undefined ? match : String(values[index]));
  }
  function bindStatic(root) {
    // Called once before rendering user data. Never scan or translate user content.
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, source = node.nodeValue;
      if (Object.hasOwn(OfficeLocales.en,source.trim())) bindings.push({node,source});
    }
    root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(node => {
      for (const attr of ['aria-label','title','placeholder']) {
        const source = node.getAttribute(attr);
        if (source && Object.hasOwn(OfficeLocales.en,source.trim())) bindings.push({node,attr,source});
      }
    });
  }
  function setLanguage(id) {
    language = languages.some(item => item.id === id) ? id : 'de';
    document.documentElement.lang = language;
    for (const {node,attr,source} of bindings) if (node.isConnected) {
      if (attr) node.setAttribute(attr,text(source)); else node.nodeValue = text(source);
    }
  }
  return {languages,text,bindStatic,setLanguage,get language(){return language;},get locale(){return languages.find(item => item.id === language).locale;}};
})();
const t = (source,values) => I18N.text(source,values);
function tr(strings,...values) { return t(strings.map((part,i) => part+(i<values.length?'{'+i+'}':'')).join(''),values); }
function dayLabel(day) { return t(day); }
function shortDay(day) { return t(day.slice(0,2)); }
function categoryLabel(category) {
  const name = data.masterData?.categories.find(record=>record.id === category)?.name || category;
  return name === category && Planner.categories.includes(category) ? t(category) : name;
}
function refreshLanguageUI() {
  I18N.setLanguage(data.settings.language || 'de');
  $('languageSelect').value = I18N.language;
  syncLanguagePicker();
  for (const option of $('itemDay').options) option.textContent = dayLabel(option.value);
  refreshCategoryOptions();
  Planner.days.forEach((day,i) => {
    const input = $('lookDay'+i);
    if (input) { input.parentElement.firstChild.nodeValue = shortDay(day); input.setAttribute('aria-label',tr`Farbe ${dayLabel(day)}`); }
  });
  for (const id of ['itemStart','itemEnd']) {
    const list = $(id+'List'); if (list) list.setAttribute('aria-label',t(id === 'itemStart' ? 'Von: Uhrzeit' : 'Bis: Uhrzeit'));
  }
}
I18N.bindStatic(document.body);
