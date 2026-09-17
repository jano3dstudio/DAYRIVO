'use strict';
let reminderDay = null, reminderWeek = null, reminderEditingId = null;
function dayReminders(week,day) { return (week.reminders || []).filter(item=>item.day===day).sort((a,b)=>Number(a.done)-Number(b.done)); }
function saveReminders(iso,change,refresh=true) {
  const week = data.weeks[iso], before = week.reminders;
  const next = P.clone(before || []);
  try {
    change(next); P.validateReminders(next); week.reminders = next;
    if (!persist()) throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.');
    if(refresh) render(); return true;
  } catch (error) {
    if (before === undefined) delete week.reminders; else week.reminders = before;
    if ($('reminderDialog').open) $('reminderError').textContent = t(error.message); else notify(t(error.message),true);
    if(refresh) render(); return false;
  }
}
function createReminderHead(day) {
  const iso = data.selectedWeek, entries = dayReminders(data.weeks[iso],day), open = entries.filter(item=>!item.done).length;
  const section = document.createElement('div'); section.className = 'mini-reminders';
  const preview = document.createElement('div'); preview.className = 'reminder-preview';
  if (!entries.length) { const hint = document.createElement('button');hint.className='reminder-hint';hint.textContent=t('Quick-To-dos');hint.onclick=()=>openReminders(day);preview.append(hint); }
  for (const item of entries.slice(0,2)) {
    const row = document.createElement('div'); row.className='mini-reminder'+(item.done?' done':'');
    const check = document.createElement('input');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label',tr`${item.text} erledigt`);
    check.onchange=()=>{
      if(!saveReminders(iso,list=>{list.find(entry=>entry.id===item.id).done=check.checked;},false)){check.checked=!check.checked;return;}
      row.classList.toggle('done',check.checked);
      const entries=dayReminders(data.weeks[iso],day),open=entries.filter(entry=>!entry.done).length;
      count.textContent=String(open);count.title=tr`Quick-To-dos für ${dayLabel(day)}: ${open} offen, ${entries.length} insgesamt`;count.setAttribute('aria-label',count.title);
    };
    const label=document.createElement('button');label.textContent=item.text;label.title=item.text;label.onclick=()=>openReminders(day,item.id);
    row.append(check,label);preview.append(row);
  }
  const actions=document.createElement('div');actions.className='reminder-head-actions';
  const add=document.createElement('button');add.className='reminder-add';add.textContent='＋';add.title=tr`Quick-To-do für ${dayLabel(day)} hinzufügen`;add.setAttribute('aria-label',add.title);add.onclick=()=>openReminders(day);
  const count=document.createElement('button');count.className='reminder-count';count.textContent=entries.length ? String(open) : '☑';count.title=tr`Quick-To-dos für ${dayLabel(day)}: ${open} offen, ${entries.length} insgesamt`;count.setAttribute('aria-label',count.title);count.onclick=()=>openReminders(day);
  actions.append(add,count);section.append(preview,actions);return section;
}
function resetReminderEditor() {
  reminderEditingId=null;$('reminderText').value='';$('reminderSave').textContent=t('Hinzufügen');$('reminderCancelEdit').hidden=true;
}
function editReminder(item) {
  reminderEditingId=item.id;$('reminderText').value=item.text;$('reminderSave').textContent=t('Speichern');$('reminderCancelEdit').hidden=false;$('reminderText').focus();
}
function renderReminderList() {
  const entries=dayReminders(data.weeks[reminderWeek],reminderDay), list=$('reminderList');list.replaceChildren();
  if(!entries.length){const empty=document.createElement('p');empty.className='dialog-note';empty.textContent=t('Noch keine Erinnerungen für diesen Tag.');list.append(empty);}
  for(const item of entries){
    const row=document.createElement('div');row.className='reminder-row'+(item.done?' done':'');row.dataset.reminderId=item.id;
    const check=document.createElement('input');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label',tr`${item.text} erledigt`);
    check.onchange=()=>{
      if(!saveReminders(reminderWeek,entries=>{entries.find(entry=>entry.id===item.id).done=check.checked;},false)){check.checked=!check.checked;return;}
      row.classList.toggle('done',check.checked);render();
    };
    const label=document.createElement('button');label.className='reminder-text';label.textContent=item.text;label.title=t('Bearbeiten');label.onclick=()=>editReminder(item);
    const remove=document.createElement('button');remove.className='reminder-delete';remove.textContent='×';remove.setAttribute('aria-label',tr`Erinnerung „${item.text}“ löschen`);remove.title=t('Löschen');
    remove.onclick=()=>{if(saveReminders(reminderWeek,entries=>entries.splice(entries.findIndex(entry=>entry.id===item.id),1))){if(reminderEditingId===item.id)resetReminderEditor();renderReminderList();$('reminderText').focus();}};
    row.append(check,label,remove);list.append(row);
  }
}
function openReminders(day,id=null) {
  reminderDay=day;reminderWeek=data.selectedWeek;resetReminderEditor();$('reminderError').textContent='';
  const date=P.addDays(reminderWeek,P.days.indexOf(day));$('reminderDate').textContent=dayLabel(day)+' · '+new Date(date+'T12:00:00').toLocaleDateString(I18N.locale);
  renderReminderList();$('reminderDialog').showModal();
  if(id)editReminder(data.weeks[reminderWeek].reminders.find(item=>item.id===id));else $('reminderText').focus();
  $('reminderCancelEdit').onclick=()=>{resetReminderEditor();$('reminderText').focus();};
  $('reminderForm').onsubmit=event=>{
    event.preventDefault();const text=$('reminderText').value.trim();if(!text)return;$('reminderError').textContent='';
    if(saveReminders(reminderWeek,entries=>{if(reminderEditingId)entries.find(item=>item.id===reminderEditingId).text=text;else entries.push({id:P.uid(),day:reminderDay,text,done:false});})){
      resetReminderEditor();renderReminderList();$('reminderText').focus();
    }
  };
  $('reminderDialog').onclose=()=>document.querySelector(`.day-head[data-reminder-day="${reminderDay}"] .reminder-count`)?.focus({preventScroll:true});
}
