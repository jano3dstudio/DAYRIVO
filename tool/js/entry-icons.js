'use strict';
const entryIcons = [
  ['briefcase','Arbeit','<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12c5 4 13 4 18 0M12 12v4"/>'],
  ['school','Schule','<path d="m2 8 10-5 10 5-10 5L2 8Zm4 3v6c4 3 8 3 12 0v-6M22 8v8"/>'],
  ['bike','Fahrrad','<circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-9 5 9H5m5-9h7l2 9M8 5h4m5-3h3l-3 6"/>'],
  ['coffee','Kaffee / Pause','<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8ZM16 9h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3M2 22h18"/>'],
  ['home','Zuhause','<path d="m3 10 9-7 9 7v11H3V10Zm6 11v-7h6v7"/>'],
  ['heart','Herz','<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 2 11 8 15 6-4 13-10 8-15Z"/>'],
  ['game','Game','<path d="M7 7h10c3 0 4 4 5 10 0 3-3 4-5 1l-1-2H8l-1 2c-2 3-5 2-5-1 1-6 2-10 5-10ZM7 10v4m-2-2h4m7-1h.01m3 2h.01"/>'],
  ['monitor','Computer','<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8m-4-5v5"/>'],
  ['code','Code','<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 20"/>'],
  ['spark','Idee / AI','<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>'],
  ['weights','Training','<path d="m5 3-2 2 16 16 2-2M2 8l6-6m-6 10L12 2m0 20L22 12m-6 10 6-6"/>'],
  ['people','Meeting','<circle cx="9" cy="7" r="4"/><path d="M2 22v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8m2 4c2 1 3 3 3 5v2"/>'],
  ['phone','Telefon','<path d="m4 3 4-1 3 6-3 2c1 3 3 5 6 6l2-3 6 3-1 4c-1 5-10 0-14-4S-1 4 4 3Z"/>'],
  ['pencil','Gestalten','<path d="m3 16 13-13 5 5L8 21H3v-5Zm10-10 5 5M3 16l5 5"/>'],
  ['list','Organisation','<path d="m3 5 1 1 2-3m4 2h11M3 12h3m4 0h11M3 19h3m4 0h11"/>'],
  ['clock','Zeit / Puffer','<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>']
];
let entryIconValue = 'auto';
function resolvedEntryIcon(item) {
  if (item.icon === 'none') return 'none';
  if (entryIcons.some(([id])=>id === item.icon)) return item.icon;
  const defaults = {Kunde:'briefcase','AI / Firma':'spark',Spiel:'game',Familie:'home',Sport:'bike',Pause:'coffee',Routine:'coffee',Schule:'school',Admin:'list',Puffer:'clock'};
  return defaults[item.cat] || ({work:'briefcase',sport:'weights',private:'home',break:'coffee',other:'clock'}[P.timeGroup(item.cat,data.masterData)]);
}
function entryIconSVG(id) {
  const drawing = entryIcons.find(([key])=>key === id)?.[2] || '';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
}
function renderEntryIconPicker() {
  const resolved = resolvedEntryIcon({cat:$('itemCategory').value,icon:entryIconValue});
  $('entryIconPreview').innerHTML = entryIconSVG(resolved === 'none' ? 'clock' : resolved);
  $('entryIconPreview').classList.toggle('icon-none',resolved === 'none');
  $('entryIconSummary').title = t(entryIconValue === 'auto' ? 'Automatisch nach Kategorie' : entryIconValue === 'none' ? 'Ohne Icon' : entryIcons.find(([id])=>id === entryIconValue)?.[1] || 'Automatisch nach Kategorie');
  $('entryIconChoices').replaceChildren();
  for (const [id,label] of [['auto','Automatisch'],['none','Ohne Icon'],...entryIcons]) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.icon = id;
    button.setAttribute('aria-label',t(label)); button.setAttribute('aria-pressed',String(entryIconValue === id));
    button.title = t(label); button.className = ['auto','none'].includes(id) ? 'icon-mode' : 'icon-choice';
    if (!['auto','none'].includes(id)) button.innerHTML = entryIconSVG(id);
    const name = document.createElement('span'); name.textContent = t(label); button.append(name);
    button.onclick = () => {entryIconValue = id; renderEntryIconPicker(); $('entryIconPicker').open = false; $('entryIconSummary').focus();};
    $('entryIconChoices').append(button);
  }
}
function openEntryIconPicker(item) {
  openItem(item); $('entryIconPicker').open = true;
  $('entryIconChoices').querySelector('[aria-pressed=true]')?.focus();
}
document.addEventListener('click',event => {if (!$('entryIconPicker').contains(event.target)) $('entryIconPicker').open = false;});
document.addEventListener('keydown',event => {
  if (event.key === 'Escape' && $('entryIconPicker').open) {
    event.preventDefault(); event.stopPropagation(); $('entryIconPicker').open = false; $('entryIconSummary').focus();
  }
});
