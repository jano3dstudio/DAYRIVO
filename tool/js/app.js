'use strict';
const P = Planner;
const STORAGE_KEY = 'jsOfficeWeek_v1';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pixelsPerMinute = 1;
let data, loadError, editingId = null, editingDay, pendingRestore, directoryHandle = null, toastTimer;
let activeDay = P.days[Math.min(4, (new Date().getDay() + 6) % 7)];
let rangeStart = 420, rangeEnd = 1200;
let editingPresetId = null;
let activeSection = 'week', monthCursor = null;

function notify(message, error = false) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.toggle('error', error); $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, error ? 14000 : 6000);
}
function persist() {
  if (loadError) { notify(t("Vorhandene Daten konnten nicht gelesen werden. Bitte zuerst ein gültiges Backup wiederherstellen."), true); return false; }
  try {
    data.template = P.clone(data.presets[data.defaultPresetId].items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    $('saveStatus').textContent = editingPresetId ? t("Preset gespeichert") : t("Lokal gespeichert"); $('saveStatus').classList.remove('error'); return true;
  } catch (error) {
    $('saveStatus').textContent = t("Nicht gespeichert"); $('saveStatus').classList.add('error');
    notify(t("Browser-Speicher nicht verfügbar. Änderungen sind nur in dieser Sitzung vorhanden. Bitte Backup speichern."), true); return false;
  }
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return P.ensureDayform(P.validateData(JSON.parse(raw)));
    const current = JSON.parse(localStorage.getItem('jonaWeek_v3') || 'null');
    const archive = JSON.parse(localStorage.getItem('jonaWeek_archive_v3') || '[]');
    const migrated = P.migrateLegacy(current, archive);
    if (current || archive.length) migrated.legacyV3 = {current, archive};
    return current || archive.length ? P.ensureDayform(migrated) : P.createDayformData();
  } catch (error) {
    loadError = error;
    const empty = P.createDayformData(); P.ensureWeek(empty, empty.selectedWeek);
    return empty;
  }
}
function currentWeek() { return editingPresetId ? data.presets[editingPresetId] : data.weeks[data.selectedWeek]; }
function changeWeek(iso) {
  editingPresetId = null;
  P.ensureWeek(data, iso); persist(); render();
}
function calendarHeadHeight() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--day-head')); }
function renderSummary() { renderGroupedSummary();
}
function render() {
  applyLookVisual();
  const scroller = document.querySelector('.calendar');
  const previousScrollTime = rangeStart + scroller.scrollTop / pixelsPerMinute;
  const current = currentWeek();
  const monday = new Date(data.selectedWeek + 'T12:00:00');
  document.body.classList.toggle('preset-mode',!!editingPresetId);
  $('presetBanner').hidden = !editingPresetId;
  for (const id of ['previousWeek','followingWeek','todayButton','nextWeekButton']) $(id).hidden = !!editingPresetId;
  $('weekLabel').textContent = editingPresetId ? current.name : monday.toLocaleDateString(I18N.locale, {month:'long',year:'numeric'});
  $('weekNumber').textContent = editingPresetId ? t("/ Preset") : t("/ KW ") + P.weekNumber(data.selectedWeek);
  $('weekLabel').title = monday.toLocaleDateString(I18N.locale) + ' – ' + new Date(P.addDays(data.selectedWeek,4) + 'T12:00:00').toLocaleDateString(I18N.locale);
  renderSummary();
  renderOverview();
  renderHeaderContext();
  if (activeSection !== 'week') { syncDayFooters(); return; }
  $('mobileTabs').innerHTML = '';
  P.days.forEach(day => {
    const button = document.createElement('button'); button.textContent = shortDay(day); button.className = activeDay === day ? 'active' : '';
    button.setAttribute('aria-pressed', activeDay === day); button.onclick = () => { activeDay = day; render(); }; $('mobileTabs').append(button);
  });
  const visibleItems = window.innerWidth <= 760 ? current.items.filter(item => item.day === activeDay) : current.items;
  rangeStart = Math.floor(Math.min(P.minutes(data.settings.planningHours.start), ...visibleItems.map(item => P.minutes(item.start))) / 60) * 60;
  rangeEnd = Math.min(1440, Math.ceil(Math.max(P.minutes(data.settings.planningHours.end), ...visibleItems.map(item => P.minutes(item.end))) / 60) * 60);
  const headHeight = calendarHeadHeight();
  const available = Math.max(100,scroller.clientHeight - headHeight - 44);
  // Keep the icon and two text rows readable without changing the shared time axis.
  const shortest = Math.max(15,Math.min(30,...visibleItems.map(P.duration)));
  const minimumScale = Math.max(.8,40 / shortest);
  pixelsPerMinute = Math.max(minimumScale,Math.min(1.4,available / (rangeEnd - rangeStart)));
  document.documentElement.style.setProperty('--hour',pixelsPerMinute * 60 + 'px');
  const height = (rangeEnd - rangeStart) * pixelsPerMinute + 42;
  const week = $('week'); week.innerHTML = `<div class="axis-head">${t("ZEIT")}</div>`;
  const axis = document.createElement('div'); axis.className = 'time-axis'; axis.style.height = height + 'px';
  for (let minute = rangeStart; minute <= rangeEnd; minute += 60) {
    const label = document.createElement('span'); label.className = 'hour-label'; label.textContent = P.time(minute); label.style.top = (minute - rangeStart) * pixelsPerMinute + 'px'; axis.append(label);
  }
  week.append(axis);
  P.days.forEach((day, index) => {
    const setting = {...data.settings.days[day],color:displayLook().days[day]}, date = P.addDays(data.selectedWeek,index), items = current.items.filter(item => item.day === day);
    const isToday = !editingPresetId && date === P.dateISO(new Date());
    const head = document.createElement('div');
    head.className = 'day-head' + (day === activeDay ? ' mobile-show' : '') + (isToday ? ' today' : '');
    if (isToday) head.setAttribute('aria-current','date');
    head.style.gridColumn = index + 2; head.style.setProperty('--day-color',setting.color);
    head.dataset.reminderDay = day;
    const meta = document.createElement('button'); meta.className = 'day-meta';
    meta.setAttribute('aria-label',dayLabel(day) + t(": Farbe und Subline bearbeiten")); meta.title = t("Tagespreset, Farbe und Subline bearbeiten");
    meta.innerHTML = `<span class="day-name-row"><span class="day-name">${dayLabel(day)}</span><span class="day-date">${new Date(date+'T12:00:00').toLocaleDateString(I18N.locale,{day:'2-digit',month:'2-digit'})}</span></span><span class="day-subtitle">${esc(setting.subtitle)}</span>`;
    meta.onclick = () => openDay(day); head.append(meta);
    if (!editingPresetId) { head.append(createReminderHead(day)); appendDayLock(head,day); }
    week.append(head);
    const track = document.createElement('div'); track.className = 'day-track' + (day === activeDay ? ' mobile-show' : '') + (isToday ? ' today' : ''); track.dataset.day = day;
    track.style.gridColumn = index + 2; track.style.height = height + 'px'; track.style.setProperty('--day-color',setting.color);
    for (const row of P.layout(items)) track.append(createCard(row));
    const end = Math.max(rangeStart, ...items.map(item => P.minutes(item.end)));
    const plus = document.createElement('button'); plus.className = 'day-add'; plus.style.top = (end - rangeStart) * pixelsPerMinute + 7 + 'px';
    plus.innerHTML = `＋ <span>${t("Eintrag")}</span>`; plus.setAttribute('aria-label', tr`Eintrag für ${dayLabel(day)} erstellen`);
    plus.onclick = () => openItem(null, day, Math.min(1410, Math.ceil(end / P.PLAN_STEP) * P.PLAN_STEP)); track.append(plus);
    track.ondblclick = event => {
      if (event.target !== track) return;
      const minute = P.snapMinute(rangeStart + (event.clientY - track.getBoundingClientRect().top) / pixelsPerMinute);
      openItem(null, day, Math.max(0,Math.min(1410,minute)));
    };
    week.append(track);
  });
  scroller.scrollTop = Math.max(0,(previousScrollTime - rangeStart) * pixelsPerMinute);
  syncDayFooters();
}
function cardSize(card, item) {
  const h = P.duration(item) * pixelsPerMinute;
  card.style.height = Math.max(4,h - 2) + 'px'; card.classList.toggle('compact',h < 96); card.classList.toggle('tiny',h < 48);
}
function createCard({item, lane, lanes}) {
  const card = document.createElement('article'); card.className = 'item' + (item.done ? ' done' : ''); card.dataset.id = item.id;
  card.style.top = (P.minutes(item.start) - rangeStart) * pixelsPerMinute + 'px';
  card.style.left = `calc(${lane / lanes * 100}% + 6px)`; card.style.width = `calc(${100 / lanes}% - 12px)`; cardSize(card,item);
  const customerLine = P.timeGroup(item.cat,data.masterData) === 'work' ? [masterName('customers',item.customerId,item.customer),masterName('projects',item.projectId,item.project),masterName('services',item.serviceId,item.service)].filter(Boolean).join(' · ') : '';
  card.innerHTML = `<input class="item-check" type="checkbox" aria-label="${esc(tr`${item.title} erledigt`)}" ${item.done ? 'checked' : ''}><button class="item-main" aria-label="${esc(tr`${item.title}, ${item.start} bis ${item.end}, bearbeiten`)}"><span class="item-heading"><span class="item-time">${item.start} – ${item.end} · ${P.durationLabel(P.duration(item))}</span><span class="item-category" title="${esc(categoryLabel(item.cat))}">${esc(categoryLabel(item.cat))}</span></span><span class="item-title">${esc(item.title)}</span>${customerLine ? `<span class="item-description">${esc(customerLine)}</span>` : ''}${item.description ? `<span class="item-description">${esc(item.description)}</span>` : ''}</button><button class="resize-handle" aria-label="${esc(tr`Endzeit von ${item.title} ändern`)}" title="${t("Ziehen: Endzeit ändern · Pfeiltasten: ±15 Minuten")}"></button>`;
  if(!editingPresetId&&Object.values(currentWeek().highlights||{}).some(h=>h.itemId===item.id))card.classList.add('is-highlight');
  const main = card.querySelector('.item-main');
  const icon = resolvedEntryIcon(item), iconButton = document.createElement('button');
  iconButton.className = 'item-icon' + (icon === 'none' ? ' is-empty' : '');
  iconButton.type = 'button'; iconButton.setAttribute('aria-label',tr`Icon für ${item.title} ändern`); iconButton.title = t('Icon ändern');
  iconButton.innerHTML = entryIconSVG(icon === 'none' ? 'clock' : icon); iconButton.onclick = event => {event.stopPropagation(); openEntryIconPicker(item);}; card.append(iconButton);
  main.title = `${item.title}\n${item.start} – ${item.end} · ${P.durationLabel(P.duration(item))}${item.description ? '\n'+item.description : ''}`;
  main.onclick = () => openItem(item);
  main.onpointerdown = event => beginMove(event,card,main,item);
  const check = card.querySelector('.item-check'), trophy = document.createElement('label');
  trophy.className = 'item-completion'; trophy.title = t('Erledigt'); check.before(trophy); trophy.append(check); trophy.insertAdjacentHTML('beforeend',completionSVG);
  trophy.hidden = !!editingPresetId;
  let completionOrigin;
  trophy.onpointerdown=event=>{completionOrigin={x:event.clientX,y:event.clientY};};
  check.onkeydown=()=>{completionOrigin=undefined;};
  check.onchange = event => {
    const previousPercent = P.dayMetrics(data.weeks[data.selectedWeek],item.day,data.masterData)?.percent??null, wasDone = item.done;
    item.done = event.target.checked;
    if (!persist()) { item.done = wasDone; check.checked = wasDone; return; }
    card.classList.toggle('done',item.done); activeDay=item.day; renderOverview(); renderHeaderContext(); renderSummary();
    if (item.done && !wasDone) celebrateCompletion(card,previousPercent,completionOrigin);
    completionOrigin=undefined;
  };
  const startHandle = document.createElement('button'); startHandle.className = 'resize-start-handle';
  startHandle.setAttribute('aria-label',tr`Startzeit von ${item.title} ändern`);
  startHandle.title = t('Ziehen: Startzeit ändern · Pfeiltasten: ±15 Minuten'); card.append(startHandle);
  for (const edge of ['start','end']) {
    const selector = edge === 'start' ? '.resize-start-handle' : '.resize-handle', handle = card.querySelector(selector);
    handle.onpointerdown = event => beginResize(event,card,handle,item,edge);
    handle.onkeydown = event => {
      if (!['ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault(); item[edge] = (edge === 'start' ? P.resizeStart : P.resizeEnd)(item,event.key === 'ArrowDown' ? P.PLAN_STEP : -P.PLAN_STEP); persist(); render();
      [...document.querySelectorAll('.item')].find(el => el.dataset.id === item.id)?.querySelector(selector).focus();
    };
  }
  return card;
}
function beginMove(event, card, main, item) {
  if (event.button !== 0 || !event.isPrimary) return;
  const scroller = document.querySelector('.calendar'), original = {...item};
  const startX = event.clientX, startY = event.clientY, startScroll = scroller.scrollTop;
  let clientX = startX, clientY = startY, dragging = false, previewCard, timeHint, target, proposed, frame, finished = false;
  main.setPointerCapture(event.pointerId);
  function preview() {
    const bounds = scroller.getBoundingClientRect();
    const inside = clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top + calendarHeadHeight() && clientY <= bounds.bottom;
    target = inside ? [...document.querySelectorAll('.day-track')].find(track => {
      const rect = track.getBoundingClientRect(); return rect.width > 0 && clientX >= rect.left && clientX < rect.right;
    }) : null;
    document.querySelectorAll('.drop-target').forEach(track => track.classList.remove('drop-target'));
    previewCard.hidden = !target;
    timeHint.hidden = !target;
    if (!target) return;
    target.classList.add('drop-target'); target.append(previewCard);
    proposed = P.moveItem(original,target.dataset.day,(clientY - startY + scroller.scrollTop - startScroll) / pixelsPerMinute);
    const shift = P.minutes(proposed.start) - P.minutes(original.start);
    timeHint.firstElementChild.textContent = (proposed.day !== original.day ? shortDay(proposed.day)+' · ' : '') + proposed.start;
    timeHint.lastElementChild.textContent = (shift > 0 ? '+' : shift < 0 ? '−' : '±') + Math.abs(shift) + ' ' + t('Min.');
    const hintBox = timeHint.getBoundingClientRect();
    const hintX = clientX + 16 + hintBox.width <= innerWidth - 8 ? clientX + 16 : clientX - hintBox.width - 16;
    const hintY = clientY + 20 + hintBox.height <= innerHeight - 8 ? clientY + 20 : clientY - hintBox.height - 16;
    timeHint.style.left = Math.max(8,Math.min(innerWidth - hintBox.width - 8,hintX)) + 'px';
    timeHint.style.top = Math.max(8,Math.min(innerHeight - hintBox.height - 8,hintY)) + 'px';
    previewCard.style.top = (P.minutes(proposed.start) - rangeStart) * pixelsPerMinute + 'px';
    previewCard.style.setProperty('--day-color',data.settings.days[proposed.day].color);
    previewCard.querySelector('.item-time').textContent = `${proposed.start} – ${proposed.end} · ${P.durationLabel(P.duration(proposed))}`;
    const needed = (P.minutes(proposed.end) - rangeStart) * pixelsPerMinute + 80;
    document.querySelectorAll('.day-track,.time-axis').forEach(el => { if (parseFloat(el.style.height) < needed) el.style.height = needed + 'px'; });
  }
  function tick() {
    const bounds = scroller.getBoundingClientRect();
    if (clientY > bounds.bottom - 38 && clientY <= bounds.bottom) scroller.scrollTop += 9;
    else if (clientY < bounds.top + calendarHeadHeight() + 34 && clientY >= bounds.top + calendarHeadHeight()) scroller.scrollTop -= 9;
    if (clientX < bounds.left + 32 && clientX >= bounds.left) scroller.scrollLeft -= 9;
    else if (clientX > bounds.right - 32 && clientX <= bounds.right) scroller.scrollLeft += 9;
    preview(); frame = requestAnimationFrame(tick);
  }
  function move(e) {
    clientX = e.clientX; clientY = e.clientY;
    if (!dragging && Math.hypot(clientX - startX,clientY - startY) < 6) return;
    if (!dragging) {
      dragging = true; closeMenu();
      previewCard = card.cloneNode(true); previewCard.removeAttribute('data-id'); previewCard.classList.add('drag-preview');
      previewCard.classList.remove('done'); previewCard.setAttribute('aria-hidden','true');
      previewCard.querySelectorAll('button,input').forEach(el => { el.tabIndex = -1; el.disabled = true; });
      timeHint = document.createElement('div'); timeHint.className = 'drag-time-hint'; timeHint.setAttribute('aria-hidden','true');
      timeHint.append(document.createElement('strong'),document.createElement('span')); document.body.append(timeHint);
      card.classList.add('drag-origin'); document.body.classList.add('moving');
      frame = requestAnimationFrame(tick);
    }
    e.preventDefault(); preview();
  }
  function finish(cancelled) {
    if (finished) return; finished = true;
    cancelAnimationFrame(frame); main.removeEventListener('pointermove',move); main.removeEventListener('pointerup',up);
    main.removeEventListener('pointercancel',cancel); main.removeEventListener('lostpointercapture',cancel); document.removeEventListener('keydown',key);
    if (!dragging) return; // Ordinary clicks still open the editor.
    const swallowClick = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    document.addEventListener('click',swallowClick,true);
    setTimeout(() => document.removeEventListener('click',swallowClick,true),0);
    if (!cancelled && target && proposed) { Object.assign(item,proposed); activeDay = item.day; persist(); }
    document.body.classList.remove('moving'); previewCard.remove(); timeHint.remove(); render();
  }
  const up = () => finish(false), cancel = () => finish(true), key = e => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
  main.addEventListener('pointermove',move); main.addEventListener('pointerup',up); main.addEventListener('pointercancel',cancel);
  main.addEventListener('lostpointercapture',cancel); document.addEventListener('keydown',key);
}
function beginResize(event, card, handle, item, edge = 'end') {
  if (event.button !== 0 || !event.isPrimary) return;
  event.preventDefault(); event.stopPropagation();
  const original = {...item}, startY = event.clientY, scroller = document.querySelector('.calendar');
  // Reserve earlier hours without moving the visible entries. This lets the top
  // edge scroll all the way to midnight, even when the fitted day starts at 07:00.
  if (edge === 'start' && rangeStart > 0) {
    const offset = rangeStart * pixelsPerMinute, scrollTop = scroller.scrollTop;
    document.querySelectorAll('.day-track,.time-axis').forEach(el => {
      el.style.height = parseFloat(el.style.height) + offset + 'px';
      [...el.children].forEach(child => { child.style.top = parseFloat(child.style.top) + offset + 'px'; });
    });
    const axis = document.querySelector('.time-axis');
    for (let minute = 0; minute < rangeStart; minute += 60) {
      const label = document.createElement('span'); label.className = 'hour-label'; label.textContent = P.time(minute); label.style.top = minute * pixelsPerMinute + 'px'; axis.append(label);
    }
    rangeStart = 0; scroller.scrollTop = scrollTop + offset;
  }
  const startScroll = scroller.scrollTop;
  let clientY = startY, proposedTime = item[edge], animationFrame, finished = false, dragging = false;
  handle.setPointerCapture(event.pointerId); card.classList.add('resizing'); document.body.classList.add('resizing');
  function preview() {
    const delta = (clientY - startY + scroller.scrollTop - startScroll) / pixelsPerMinute;
    proposedTime = Math.abs(delta) < 1 ? original[edge] : (edge === 'start' ? P.resizeStart : P.resizeEnd)(original,delta);
    const previewItem = {...original,[edge]:proposedTime}; cardSize(card,previewItem);
    card.style.top = (P.minutes(previewItem.start) - rangeStart) * pixelsPerMinute + 'px';
    card.querySelector('.item-time').textContent = `${previewItem.start} – ${previewItem.end} · ${P.durationLabel(P.duration(previewItem))}`;
    // Grow the scroll area while extending beyond the visible schedule.
    const needed = (P.minutes(previewItem.end) - rangeStart) * pixelsPerMinute + 80;
    document.querySelectorAll('.day-track,.time-axis').forEach(el => { if (parseFloat(el.style.height) < needed) el.style.height = needed + 'px'; });
  }
  function tick() {
    const bounds = scroller.getBoundingClientRect();
    if (dragging) {
      if (clientY > bounds.bottom - 38) scroller.scrollTop += 9;
      else if (clientY < bounds.top + calendarHeadHeight() + 29) scroller.scrollTop -= 9;
      preview();
    }
    animationFrame = requestAnimationFrame(tick);
  }
  const move = e => { clientY = e.clientY; dragging ||= Math.abs(clientY - startY) >= 2; if (dragging) preview(); };
  function finish(cancelled) {
    if (finished) return; finished = true;
    cancelAnimationFrame(animationFrame); handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',up); handle.removeEventListener('pointercancel',cancel); handle.removeEventListener('lostpointercapture',cancel); document.removeEventListener('keydown',key);
    document.body.classList.remove('resizing');
    if (!cancelled && proposedTime !== original[edge]) { item[edge] = proposedTime; persist(); }
    render();
  }
  const up = () => finish(false), cancel = () => finish(true), key = e => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
  handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',up); handle.addEventListener('pointercancel',cancel); handle.addEventListener('lostpointercapture',cancel); document.addEventListener('keydown',key);
  animationFrame = requestAnimationFrame(tick);
}
function updateDuration() {
  const start = $('itemStart').value, end = $('itemEnd').value;
  $('itemDuration').textContent = P.validTime(start) && P.validTime(end) && P.minutes(end) > P.minutes(start) ? P.durationLabel(P.minutes(end)-P.minutes(start)) : '—';
  updateFeePreview();
}
function updateCustomerDetails() {
  updateClockodoEntry();
  $('customerDetails').hidden = P.timeGroup($('itemCategory').value,data.masterData) !== 'work';
  $('feeDetails').hidden = P.timeGroup($('itemCategory').value,data.masterData) !== 'work';
  $('actualTimeDetails').hidden = !!editingPresetId || P.timeGroup($('itemCategory').value,data.masterData) !== 'work';
  renderEntryIconPicker();
  updateFeePreview();
}
function fillTimeSelect(id,value) {
  const field = $(id); field.replaceChildren();
  // Leave at least one quarter hour before the day's last end time.
  const times = Array.from({length:id === 'itemStart' ? 95 : 96},(_,index) => P.time(index * P.PLAN_STEP));
  if (!times.includes(value)) times.push(value);
  times.sort().forEach(time => field.add(new Option(time + (P.minutes(time) % P.PLAN_STEP ? t(" (bestehend)") : ''),time)));
  field.value = value;
  timePickers[id].sync();
}
function openItem(item = null, day = activeDay, start = 555) {
  closeMenu(); editingId = item?.id || null; $('itemForm').reset(); $('itemError').textContent = '';
  $('itemDialogTitle').textContent = item ? t("Eintrag bearbeiten") : t("Neuer Eintrag");
  $('itemTitle').value = item?.title || ''; $('itemDay').value = item?.day || day;
  refreshCategoryOptions(item?.cat || (['Montag','Mittwoch'].includes(day) ? 'Kunde' : day === 'Dienstag' ? 'AI / Firma' : 'Spiel'),!!item);
  entryIconValue = item?.icon || 'auto'; $('entryIconPicker').open = false;
  fillTimeSelect('itemStart',item?.start || P.time(start));
  fillTimeSelect('itemEnd',item?.end || P.time(Math.min(1425,start + 60)));
  $('itemDescription').value = item?.description || ''; $('itemDone').checked = item?.done || false;
  $('itemDone').closest('label').hidden = !!editingPresetId;
  $('itemHighlight').closest('label').hidden=!!editingPresetId;
  $('itemHighlight').checked=!!item&&!editingPresetId&&Object.values(currentWeek().highlights||{}).some(h=>h.itemId===item.id);
  for (const field of ['Customer','Project','Service','Actual']) $('item'+field).value = item?.[field.toLowerCase()] || '';
  openEntryMasterData(item); resetClockodoEntry();
  $('actualLabel').hidden = !item?.actual;
  $('itemHourlyRate').value = item?.hourlyRateCents == null ? '' : (item.hourlyRateCents/100).toFixed(2).replace('.',I18N.language==='de' ? ',' : '.');
  $('feeDetails').open = item?.hourlyRateCents != null;
  $('itemActualTime').value = item?.actualMinutes == null ? '' : P.durationLabel(item.actualMinutes).replace(' h','');
  $('actualTimeDetails').open = item?.actualMinutes != null || !!item?.done;
  $('customerDetails').open = false; updateCustomerDetails(); updateDuration();
  fillTitleLibrary(item);
  $('deleteItem').hidden = !item; $('itemDialog').showModal(); $('itemTitle').focus();
}
function openDay(day) {
  editingDay = day; $('dayDialogTitle').textContent = tr`${dayLabel(day)} bearbeiten`;
  $('daySubtitle').value = data.settings.days[day].subtitle; $('dayColor').value = data.settings.days[day].color;
  openDayPresets(); $('dayDialog').showModal();
}
function closeMenu() { $('menu').hidden = true; $('menuButton').setAttribute('aria-expanded','false'); }

function refreshPresetDialog(selectedId = $('presetSelect').value || data.defaultPresetId) {
  $('presetSelect').replaceChildren();
  for (const preset of Object.values(data.presets)) $('presetSelect').add(new Option(preset.name + (preset.id === data.defaultPresetId ? t(" · Standard") : ''),preset.id));
  $('presetSelect').value = data.presets[selectedId] ? selectedId : data.defaultPresetId;
  const preset = data.presets[$('presetSelect').value];
  $('presetDefault').checked = preset.id === data.defaultPresetId;
  const total = preset.items.reduce((sum,item) => sum + P.duration(item),0);
  $('presetInfo').textContent = tr`${preset.items.length} Einträge · ${P.durationLabel(total)} geplant. Übernahme in KW ${P.weekNumber(data.selectedWeek)} ab ${new Date(data.selectedWeek+'T12:00:00').toLocaleDateString(I18N.locale)}.`;
  $('deletePreset').disabled = Object.keys(data.presets).length === 1;
}
function openPresets() {
  closeMenu(); $('presetError').textContent = ''; $('createPresetForm').reset();
  refreshPresetDialog(editingPresetId || data.defaultPresetId); $('presetsDialog').showModal();
}
function editPreset(id) {
  editingPresetId = id; activeSection = 'week'; $('presetsDialog').close(); render(); persist();
  document.querySelector('.calendar').scrollTop = 0;
}
$('presetsButton').onclick = $('menuPresets').onclick = openPresets;
$('presetSelect').onchange = () => refreshPresetDialog();
$('editPreset').onclick = () => editPreset($('presetSelect').value);
$('finishPreset').onclick = () => { editingPresetId = null; render(); persist(); };
$('presetDefault').onchange = () => {
  if (!$('presetDefault').checked) { $('presetDefault').checked = true; return; }
  data.defaultPresetId = $('presetSelect').value; persist(); refreshPresetDialog();
};
$('createPresetForm').onsubmit = event => {
  event.preventDefault();
  try {
    const source = $('presetSource').value;
    const items = source === 'week' ? data.weeks[data.selectedWeek].items : source === 'preset' ? data.presets[$('presetSelect').value].items : [];
    const preset = P.createPreset(data,$('presetName').value,items); editPreset(preset.id);
  } catch (error) { $('presetError').textContent = t(error.message); }
};
$('applyPreset').onclick = () => {
  const preset = data.presets[$('presetSelect').value], week = data.weeks[data.selectedWeek];
  if ((week.items.length || week.planSnapshot || Object.keys(week.daySnapshots || {}).length) && !confirm(tr`„${preset.name}“ auf KW ${P.weekNumber(data.selectedWeek)} anwenden? Die ${week.items.length} bisherigen Einträge${(week.planSnapshot || Object.keys(week.daySnapshots || {}).length) ? t(" und der festgehaltene Ausgangsplan") : ''} werden ersetzt.`)) return;
  P.applyPreset(data,preset.id,data.selectedWeek); editingPresetId = null; activeSection = 'week';
  persist(); $('presetsDialog').close(); render(); notify(tr`„${preset.name}“ auf die Kalenderwoche angewendet.`);
};
$('deletePreset').onclick = () => {
  const id = $('presetSelect').value, preset = data.presets[id];
  if (Object.keys(data.presets).length < 2 || !confirm(tr`Preset „${preset.name}“ löschen? Bereits geplante Kalenderwochen bleiben erhalten.`)) return;
  delete data.presets[id];
  if (data.defaultPresetId === id) data.defaultPresetId = Object.keys(data.presets)[0];
  if (editingPresetId === id) editingPresetId = null;
  persist(); render(); refreshPresetDialog(data.defaultPresetId);
};

// The browser keeps a directory handle, never a download or a hard-coded machine path.
function handleDB(write, value) {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open('jsOfficeWeek_files',1);
    request.onupgradeneeded = () => request.result.createObjectStore('handles');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction('handles',write ? 'readwrite' : 'readonly'), store = tx.objectStore('handles');
        const action = write ? store.put(value,'project') : store.get('project');
        tx.oncomplete = () => { resolve(action.result); db.close(); };
        tx.onerror = tx.onabort = () => { reject(tx.error || new Error(t("Ordnerverbindung konnte nicht gespeichert werden."))); db.close(); };
      } catch (error) { db.close(); reject(error); }
    };
  });
}
function folderStatus() { $('folderStatus').textContent = directoryHandle ? `${directoryHandle.name}/tool/backup` : t("Projektordner noch nicht verbunden"); }
async function connectFolder() {
  if (!window.showDirectoryPicker) throw new Error(t("Für Backups direkt im Projektordner bitte diese Datei in Microsoft Edge oder Google Chrome öffnen."));
  const selected = await window.showDirectoryPicker({id:'office-week-project',mode:'readwrite'});
  let html;
  try { html = await (await (await selected.getFileHandle('index.html')).getFile()).text(); }
  catch { throw new Error(t("Bitte den Projektordner JS_Office_Week mit seiner index.html auswählen.")); }
  if (!html.includes('JS OFFICE WEEK') && !html.includes('DAYFORM') && !html.includes('DAYRIVO')) throw new Error(t("Der gewählte Ordner enthält nicht diese JS OFFICE WEEK App."));
  directoryHandle = selected; folderStatus();
  try { await handleDB(true,selected); } catch { notify(t("Ordner verbunden. Der Browser kann die Verbindung nur für diese Sitzung behalten.")); }
  return selected;
}
async function backup() {
  if (loadError) { notify(t("Backup gestoppt: Zuerst den Fehler beim Laden der vorhandenen Daten beheben."),true); return; }
  $('backupButton').disabled = true;
  try {
    let handle = directoryHandle;
    if (!handle) handle = await connectFolder();
    else if (await handle.queryPermission({mode:'readwrite'}) !== 'granted' && await handle.requestPermission({mode:'readwrite'}) !== 'granted') throw new Error(t("Keine Schreibfreigabe. Bitte den Projektordner im Menü erneut verbinden."));
    const payload = {app:'JS OFFICE WEEK',version:1,savedAt:new Date().toISOString(),data};
    P.validateData(data);
    const folder = await (await handle.getDirectoryHandle('tool',{create:true})).getDirectoryHandle('backup',{create:true});
    const name = 'js-office-week-' + new Date().toISOString().replace(/[:.]/g,'-') + '-' + P.uid().slice(0,8) + '.json';
    const file = await folder.getFileHandle(name,{create:true}); const writable = await file.createWritable();
    try { await writable.write(JSON.stringify(payload,null,2)); await writable.close(); }
    catch (error) { try { await writable.abort(); } catch {} throw error; }
    notify(t("Backup gespeichert: ") + handle.name + '/tool/backup/' + name);
  } catch (error) {
    if (error.name !== 'AbortError') notify(t("Backup nicht gespeichert: ") + t(error.message),true);
  } finally { $('backupButton').disabled = false; }
}

P.days.forEach(day => $('itemDay').add(new Option(day,day)));
const timePickers = Object.fromEntries(['itemStart','itemEnd'].map(id => [id,new TimePicker($(id))]));
$('itemStart').onchange = () => {
  const start = P.minutes($('itemStart').value);
  // Preserve support for historical late-night exceptions; regular planning ends at 23:45.
  fillTimeSelect('itemEnd',P.time(Math.min(start >= 1425 ? 1439 : 1425,start + 60)));
  updateDuration();
};
$('itemEnd').onchange = updateDuration;
$('itemCategory').onchange = updateCustomerDetails;
$('itemHourlyRate').oninput = () => { $('itemError').textContent = ''; updateFeePreview(); };
$('itemActualTime').oninput = () => { $('itemError').textContent = ''; updateFeePreview(); };
$('itemForm').onsubmit = event => {
  event.preventDefault();
  const start = $('itemStart').value, end = $('itemEnd').value, title = $('itemTitle').value.trim();
  if (!title || !P.validTime(start) || !P.validTime(end) || P.minutes(end) <= P.minutes(start)) { $('itemError').textContent = t("Bitte Titel und eine Endzeit nach der Startzeit eingeben."); return; }
  const old = currentWeek().items.find(item => item.id === editingId);
  let actualMinutes = old?.actualMinutes ?? null;
  try { if (!editingPresetId && P.timeGroup($('itemCategory').value,data.masterData)==='work') actualMinutes = P.parseActualTime($('itemActualTime').value); }
  catch (error) { $('itemError').textContent = t(error.message); $('actualTimeDetails').open = true; $('itemActualTime').focus(); return; }
  let hourlyRateCents;
  try { hourlyRateCents = P.timeGroup($('itemCategory').value,data.masterData) === 'work' ? P.parseRate($('itemHourlyRate').value) : old?.hourlyRateCents ?? null; }
  catch (error) { $('itemError').textContent = t(error.message); $('feeDetails').open = true; $('itemHourlyRate').focus(); return; }
  const item = {...old,id:editingId || P.uid(),day:$('itemDay').value,start,end,cat:$('itemCategory').value,title,description:$('itemDescription').value.trim(),done:editingPresetId ? false : $('itemDone').checked};
  if (hourlyRateCents !== null || old?.hourlyRateCents !== undefined) item.hourlyRateCents = hourlyRateCents;
  if (actualMinutes !== null || old?.actualMinutes !== undefined) item.actualMinutes = actualMinutes;
  for (const field of ['Customer','Project','Service','Actual']) item[field.toLowerCase()] = $('item'+field).value.trim();
  const before = P.clone(data), wasDone = !!old?.done, previousPercent = P.dayMetrics(data.weeks[data.selectedWeek],item.day,data.masterData)?.percent??null;
  try {
    prepareClockodoEntry(item); attachEntryMasterData(item); item.icon = entryIconValue;
    P.assignTitle(data,item,$('itemTitleType').value,$('newStandardTitle').checked);
    if (old) { delete old.titleId; for (const field of ['customerId','projectId','serviceId']) if (!(field in item)) delete old[field]; Object.assign(old,item); } else currentWeek().items.push(item);
    if(!editingPresetId){
      if($('itemHighlight').checked)P.setHighlight(currentWeek(),item.day,item.id);
      else for(const day of P.days)if(currentWeek().highlights?.[day]?.itemId===item.id)delete currentWeek().highlights[day];
    }
    if (!persist()) throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    $('itemDialog').close(); activeDay=item.day; render();
    if (item.done && !wasDone) celebrateCompletion([...document.querySelectorAll('.item')].find(c=>c.dataset.id===item.id),previousPercent);
  } catch (error) { data = before; $('itemError').textContent = t(error.message); }
};
$('deleteItem').onclick = () => {
  currentWeek().items = currentWeek().items.filter(item => item.id !== editingId); persist(); $('itemDialog').close(); activeDay=item.day; render();
};
$('dayForm').onsubmit = event => {
  event.preventDefault(); saveDaySettings();
};
document.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
$('previousWeek').onclick = () => navigatePeriod(-1);
$('followingWeek').onclick = () => navigatePeriod(1);
$('nextWeekButton').onclick = $('menuNextWeek').onclick = openNextWeek;
$('todayButton').onclick = () => {
  activeDay = P.days[Math.min(4,(new Date().getDay()+6)%7)];
  if (activeSection === 'month') { monthCursor = P.dateISO(new Date()).slice(0,7); render(); }
  else changeWeek(P.mondayISO());
};
$('menuButton').onclick = () => { const open = $('menu').hidden; $('menu').hidden = !open; $('menuButton').setAttribute('aria-expanded',String(open)); if (open) $('menuAdd').focus(); };
document.addEventListener('click', event => { if (!event.target.closest('.menu-wrap')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('menu').hidden) { closeMenu(); $('menuButton').focus(); } });
$('menuAdd').onclick = () => { activeSection = 'week'; render(); openItem(); };
$('backupButton').onclick = backup;
$('menuFolder').onclick = async () => { closeMenu(); try { await connectFolder(); notify(t("Verbunden. Backups werden unter ") + directoryHandle.name + t("/tool/backup gespeichert.")); } catch (error) { if (error.name !== 'AbortError') notify(t(error.message),true); } };
$('menuRestore').onclick = () => { closeMenu(); $('restoreFile').click(); };
$('restoreFile').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error(t("Die Backup-Datei ist zu groß (maximal 20 MB)."));
    pendingRestore = P.parseBackup(JSON.parse(await file.text()));
    const count = Object.values(pendingRestore.weeks).reduce((sum,week) => sum + week.items.length,0);
    $('restoreInfo').textContent = tr`${file.name}: ${Object.keys(pendingRestore.weeks).length} Wochen mit ${count} Einträgen.`; $('restoreDialog').showModal();
  } catch (error) { pendingRestore = null; notify(t("Backup konnte nicht gelesen werden: ") + t(error.message),true); }
  event.target.value = '';
};
$('restoreForm').onsubmit = event => {
  event.preventDefault(); if (!pendingRestore) return;
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY+'_beforeRestore', previous || JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY,JSON.stringify(pendingRestore));
    data = P.ensureDayform(pendingRestore); pendingRestore = null; loadError = null; editingPresetId = null; refreshLanguageUI(); persist(); render(); $('restoreDialog').close(); notify(t("Backup wiederhergestellt."));
  } catch (error) { notify(t("Wiederherstellen fehlgeschlagen. Die vorhandenen Daten bleiben erhalten."),true); }
};

$('languageSelect').onchange = () => {
  const previous = data.settings.language;
  data.settings.language = $('languageSelect').value;
  refreshLanguageUI();
  if (!persist()) { data.settings.language = previous; refreshLanguageUI(); }
  closeMenu(); render();
};
data = load(); initializeMasterData(); initializeLanguagePicker(); refreshLanguageUI(); initializeOverview(); initializeLooks(); initializeDayPresets(); render(); initializeDayform(); initializeRefinements(); initializeRhythm(); initializeClockodo();
if (loadError) {
  $('saveStatus').textContent = t("Daten nicht geladen"); $('saveStatus').classList.add('error');
  notify(t("Vorhandene Daten konnten nicht gelesen werden und wurden nicht überschrieben: ") + loadError.message,true);
} else persist();
handleDB(false).then(handle => { if (!directoryHandle) directoryHandle = handle || null; folderStatus(); }).catch(() => {});
let layoutFrame;
new ResizeObserver(() => {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    if (!document.body.classList.contains('moving') && !document.body.classList.contains('resizing')) render();
  });
}).observe(document.querySelector('.calendar'));
