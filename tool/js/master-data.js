'use strict';
let masterKind = 'categories', masterEditingId = null, entryMasterRefs = {};
function categoryRecord(id) { return data.masterData?.categories.find(record=>record.id === id); }
function masterName(kind,id,fallback = '') { return data.masterData?.[kind].find(record=>record.id === id)?.name || fallback; }
function refreshCategoryOptions(value = $('itemCategory').value, allowArchived = true) {
  const options = data.masterData.categories.filter(record=>record.active || (allowArchived && record.id === value));
  $('itemCategory').replaceChildren();
  for (const record of options) $('itemCategory').add(new Option(categoryLabel(record.id) + (!record.active ? ' · '+t('Archiviert') : ''),record.id));
  // Unknown legacy categories remain editable without relabeling past entries.
  if (allowArchived && value && !options.some(record=>record.id === value)) $('itemCategory').add(new Option(categoryLabel(value),value));
  $('itemCategory').value = options.some(record=>record.id === value) || (allowArchived && value) ? value : options[0]?.id || '';
}
function resolveMasterReference(kind,name,previousId,customerId) {
  const records = data.masterData[kind].filter(record=>kind !== 'projects' || record.customerId === customerId);
  const previous = records.find(record=>record.id === previousId && record.name === name);
  return previous || records.find(record=>record.active && record.name === name);
}
function refreshMasterSuggestions() {
  const customer = resolveMasterReference('customers',$('itemCustomer').value,entryMasterRefs.customerId);
  for (const [kind,list] of [['customers','customerSuggestions'],['projects','projectSuggestions'],['services','serviceSuggestions']]) {
    $(list).replaceChildren();
    for (const record of data.masterData[kind].filter(record=>record.active && (kind !== 'projects' || record.customerId === customer?.id))) {
      const option = document.createElement('option'); option.value = record.name; $(list).append(option);
    }
  }
}
function openEntryMasterData(item) {
  entryMasterRefs = {};
  for (const [kind,field] of [['customers','customer'],['projects','project'],['services','service']]) {
    $('item'+field[0].toUpperCase()+field.slice(1)).value = masterName(kind,item?.[field+'Id'],item?.[field] || '');
    const record = resolveMasterReference(kind,$('item'+field[0].toUpperCase()+field.slice(1)).value,item?.[field+'Id'],entryMasterRefs.customerId);
    if (record) entryMasterRefs[field+'Id'] = record.id;
  }
  refreshMasterSuggestions();
}
function attachEntryMasterData(item) {
  const customer = resolveMasterReference('customers',item.customer,entryMasterRefs.customerId);
  const project = resolveMasterReference('projects',item.project,entryMasterRefs.projectId,customer?.id);
  const service = resolveMasterReference('services',item.service,entryMasterRefs.serviceId);
  for (const [field,record] of [['customerId',customer],['projectId',project],['serviceId',service]]) {
    if (record) item[field] = record.id; else delete item[field];
  }
}
function openMasterData(kind = 'categories') {
  closeMenu(); masterKind = kind; masterEditingId = null;
  $('masterShowArchived').checked = false; $('masterError').textContent = ''; $('masterStatus').textContent = '';
  renderMasterData(); $('masterDataDialog').showModal();
}
function renderMasterData() {
  document.querySelectorAll('[data-master-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.masterKind === masterKind)));
  const visible = data.masterData[masterKind].filter(record=>record.active || $('masterShowArchived').checked);
  $('masterList').replaceChildren();
  for (const record of visible) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.recordId = record.id;
    button.classList.toggle('archived',!record.active); button.setAttribute('aria-pressed',String(record.id === masterEditingId));
    const title = document.createElement('strong'); title.textContent = masterKind === 'categories' ? categoryLabel(record.id) : record.name;
    const note = document.createElement('small');
    note.textContent = [masterKind === 'categories' ? t(P.timeGroups.find(group=>group.id === record.group).label) : masterKind === 'projects' ? masterName('customers',record.customerId) : '',!record.active ? t('Archiviert') : ''].filter(Boolean).join(' · ');
    button.append(title,note); button.onclick = () => {masterEditingId = record.id; $('masterError').textContent = ''; renderMasterData();}; $('masterList').append(button);
  }
  if (!visible.length) {const empty = document.createElement('p'); empty.className = 'dialog-note'; empty.textContent = t('Noch keine Stammdaten.'); $('masterList').append(empty);}
  const record = data.masterData[masterKind].find(record=>record.id === masterEditingId);
  $('masterFormTitle').textContent = t(record ? 'Bearbeiten' : 'Neu anlegen');
  $('masterName').value = record?.name || '';
  $('masterGroupLabel').hidden = $('masterGroupHint').hidden = masterKind !== 'categories';
  $('masterCustomerLabel').hidden = $('masterProjectHint').hidden = masterKind !== 'projects';
  $('masterGroup').replaceChildren(...P.timeGroups.map(group=>new Option(t(group.label),group.id))); $('masterGroup').value = record?.group || 'work';
  $('masterCustomer').replaceChildren(new Option(t('Kunde auswählen'),''));
  data.masterData.customers.filter(customer=>customer.active || customer.id === record?.customerId).forEach(customer=>$('masterCustomer').add(new Option(customer.name,customer.id)));
  $('masterCustomer').value = record?.customerId || ''; $('masterCustomer').required = masterKind === 'projects'; $('masterCustomer').disabled = masterKind !== 'projects' || !!record;
  $('masterArchive').hidden = !record; $('masterArchive').textContent = t(record?.active ? 'Archivieren' : 'Aktivieren');
}
function commitMasterData(catalog) {
  const previous = data.masterData;
  MasterData.validate(catalog,MasterData.allItems(data));
  data.masterData = catalog;
  if (!persist()) { data.masterData = previous; throw new Error('Speichern fehlgeschlagen. Bitte erneut versuchen.'); }
  // Keep an open entry linked when its selected master record is renamed.
  for (const [kind,field] of [['customers','customer'],['projects','project'],['services','service']]) {
    const input = $('item'+field[0].toUpperCase()+field.slice(1)), id = entryMasterRefs[field+'Id'];
    const old = previous[kind].find(record=>record.id === id), next = catalog[kind].find(record=>record.id === id);
    if (old && next && input.value === old.name) input.value = next.name;
  }
  refreshCategoryOptions($('itemCategory').value,!!editingId); refreshMasterSuggestions(); updateCustomerDetails(); render(); renderMasterData();
  $('masterStatus').textContent = t('Stammdaten gespeichert.'); $('masterError').textContent = '';
}
function initializeMasterData() {
  MasterData.ensure(data,P.categories,P.uid,P.timeGroup);
  $('menuMasterData').onclick = $('manageCategories').onclick = () => openMasterData('categories');
  $('manageCustomers').onclick = () => openMasterData('customers');
  document.querySelectorAll('[data-master-kind]').forEach(button=>button.onclick = () => {masterKind = button.dataset.masterKind; masterEditingId = null; $('masterError').textContent = ''; $('masterStatus').textContent = ''; renderMasterData();});
  $('masterShowArchived').onchange = () => {masterEditingId = null; renderMasterData();};
  $('masterNew').onclick = () => {masterEditingId = null; $('masterError').textContent = ''; renderMasterData(); $('masterName').focus();};
  $('masterForm').onsubmit = event => {
    event.preventDefault();
    try {
      const old = data.masterData[masterKind].find(record=>record.id === masterEditingId);
      const record = {...old,id:old?.id || P.uid(),name:$('masterName').value.trim(),active:old?.active ?? true};
      if (masterKind === 'categories') record.group = $('masterGroup').value;
      if (masterKind === 'projects') record.customerId = old?.customerId || $('masterCustomer').value;
      const catalog = MasterData.save(data.masterData,masterKind,record);
      const previousId = masterEditingId; masterEditingId = record.id;
      try {commitMasterData(catalog);} catch (error) {masterEditingId = previousId; throw error;}
    } catch (error) {$('masterError').textContent = t(error.message);}
  };
  $('masterArchive').onclick = () => {
    try {
      const record = data.masterData[masterKind].find(record=>record.id === masterEditingId);
      const catalog = MasterData.save(data.masterData,masterKind,{...record,active:!record.active});
      $('masterShowArchived').checked = true; commitMasterData(catalog);
    } catch (error) {$('masterError').textContent = t(error.message);}
  };
  $('itemCustomer').addEventListener('input',() => {
    const project = data.masterData.projects.find(record=>record.id === entryMasterRefs.projectId);
    if (project && masterName('customers',project.customerId) !== $('itemCustomer').value) {$('itemProject').value = ''; delete entryMasterRefs.projectId;}
    refreshMasterSuggestions();
  });
}
