// ====== CONFIG ======
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxRIaW9MfkYPG2aRghtHPaERHVi68ciGBu0YhYtq0pR581flV8NpAcSADI3J6Pv7G05Zg/exec';

const CATEGORY_META = {
  GST:  { label: 'GST',       color: '#A6742C' },
  ITR:  { label: 'ITR',       color: '#1F6F63' },
  LOAN: { label: 'Loan/CMA',  color: '#6B4C6E' },
  MISC: { label: 'Misc.',     color: '#3E5C76' }
};

const FIELDS = {
  GST: [
    { key: 'TradeName', label: 'Trade Name', type: 'text', required: true, full: true },
    { key: 'GSTIN', label: 'GSTIN No.', type: 'text' },
    { key: 'MobileNo', label: 'Mobile No.', type: 'tel' },
    { key: 'EmailId', label: 'Email ID', type: 'email' },
    { key: 'UserId', label: 'User ID', type: 'text' },
    { key: 'GSTPassword', label: 'GSTIN Password', type: 'text' },
    { key: 'FeesCharged', label: 'Fees Charged', type: 'text' },
    { key: 'FilingFrequency', label: 'Filing Frequency', type: 'select', options: ['Monthly', 'Quarterly'] }
  ],
  ITR: [
    { key: 'Name', label: 'Name', type: 'text', required: true, full: true },
    { key: 'BirthDate', label: 'Birth Date', type: 'date' },
    { key: 'PhoneNo', label: 'Phone No.', type: 'tel' },
    { key: 'Address', label: 'Address', type: 'textarea', full: true },
    { key: 'EmailId', label: 'Email ID', type: 'email' },
    { key: 'AadharNo', label: 'Aadhar No.', type: 'text' },
    { key: 'PanNo', label: 'PAN Card No.', type: 'text' },
    { key: 'ITRPassword', label: 'ITR Password', type: 'text' },
    { key: 'AISTISPassword', label: 'AIS / TIS Password', type: 'text' }
  ],
  LOAN: [
    { key: 'Name', label: 'Client Name', type: 'text', required: true, full: true },
    { key: 'MobileNo', label: 'Mobile No.', type: 'tel' },
    { key: 'LoanAmount', label: 'Loan Amount', type: 'text' },
    { key: 'Address', label: 'Address', type: 'textarea', full: true },
    { key: 'FeesCharged', label: 'Fees Charged', type: 'text' },
    { key: 'Details', label: 'Details', type: 'textarea', full: true }
  ],
  MISC: [
    { key: 'Name', label: 'Client Name', type: 'text', required: true, full: true },
    { key: 'MobileNo', label: 'Mobile No.', type: 'tel' },
    { key: 'FeesCharged', label: 'Fees Charged', type: 'text' },
    { key: 'Address', label: 'Address', type: 'textarea', full: true },
    { key: 'OtherDetails', label: 'Other Details (optional)', type: 'textarea', full: true }
  ]
};

const ENTRY_FIELDS = {
  GST: [
    { key: 'Month', label: 'Month', type: 'month' },
    { key: 'TaxableValue', label: 'Taxable Value of Sales', type: 'text' },
    { key: 'DocumentsIssued', label: 'Documents Issued', type: 'text' },
    { key: 'HSN', label: 'HSN No.', type: 'text' },
    { key: 'OtherDetails', label: 'Other Details', type: 'text' }
  ],
  ITR: [
    { key: 'Year', label: 'Year', type: 'text' },
    { key: 'ReturnFiledOn', label: 'Return Filed On', type: 'date' },
    { key: 'IncomeDeclared', label: 'Income Declared', type: 'text' },
    { key: 'TaxPaid', label: 'Tax Paid', type: 'text' },
    { key: 'FeesCharged', label: 'Fees Charged', type: 'text' }
  ]
};

const ENTRY_TABLE_COLUMNS = {
  GST: ['Month', 'TaxableValue', 'DocumentsIssued', 'HSN', 'OtherDetails', 'DocLinks'],
  ITR: ['Year', 'ReturnFiledOn', 'IncomeDeclared', 'TaxPaid', 'FeesCharged', 'DocLinks']
};

// ====== STATE ======
let allClients = [];
let activeCategory = 'ALL';
let searchTerm = '';
let currentDetail = null; // { category, clientNo }
let editMode = false;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  buildAddFormFields('GST');
  loadClients();

  document.getElementById('addClientBtn').addEventListener('click', openAddModal);
  document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
  document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
  document.getElementById('saveNewClientBtn').addEventListener('click', submitNewClient);
  document.getElementById('newCategorySelect').addEventListener('change', (e) => buildAddFormFields(e.target.value));
  document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
  document.getElementById('searchInput').addEventListener('input', (e) => { searchTerm = e.target.value.toLowerCase(); renderList(); });

  document.getElementById('categoryChips').addEventListener('click', (e) => {
    if (!e.target.classList.contains('chip')) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.cat;
    renderList();
  });
});

// ====== API HELPERS ======
async function apiGet(params) {
  const url = new URL(WEBAPP_URL);
  Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
  const res = await fetch(url.toString());
  return res.json();
}
async function apiPost(action, payload) {
  const res = await fetch(WEBAPP_URL, {
    method: 'POST',
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}
function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? '#9C3B3B' : '#1F2A24';
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 3200);
}
function filesToPayload(fileInput) {
  const files = Array.from(fileInput.files || []);
  return Promise.all(files.map(f => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: f.name, mime: f.type, data: reader.result.split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(f);
  })));
}

// ====== LIST ======
async function loadClients() {
  try {
    const data = await apiGet({ action: 'listClients' });
    if (!data.ok) { showToast(data.error || 'Failed to load clients', true); return; }
    allClients = data.clients;
    renderList();
  } catch (err) {
    showToast('Could not reach the server. Check your connection.', true);
  }
}

function renderList() {
  const container = document.getElementById('clientList');
  const empty = document.getElementById('emptyState');
  let list = allClients;
  if (activeCategory !== 'ALL') list = list.filter(c => c.category === activeCategory);
  if (searchTerm) {
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(searchTerm) ||
      (c.clientNo || '').toLowerCase().includes(searchTerm) ||
      (c.mobile || '').toLowerCase().includes(searchTerm)
    );
  }
  container.innerHTML = '';
  if (list.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  list.forEach(c => {
    const meta = CATEGORY_META[c.category] || { label: c.category, color: '#555' };
    const row = document.createElement('div');
    row.className = 'ledger-row client-row';
    row.innerHTML = `
      <span class="col-no mono">${c.clientNo}</span>
      <span class="col-name">${escapeHtml(c.name || '(unnamed)')}</span>
      <span class="col-cat"><span class="badge" style="background:${meta.color}">${meta.label}</span></span>
      <span class="col-mobile">${escapeHtml(c.mobile || '')}</span>
    `;
    row.addEventListener('click', () => openDetailModal(c.category, c.clientNo));
    container.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

// ====== ADD CLIENT MODAL ======
function openAddModal() {
  document.getElementById('newCategorySelect').value = 'GST';
  buildAddFormFields('GST');
  document.getElementById('addOverlay').hidden = false;
}
function closeAddModal() { document.getElementById('addOverlay').hidden = true; }

function buildAddFormFields(category) {
  const wrap = document.getElementById('newClientFields');
  wrap.innerHTML = '';
  FIELDS[category].forEach(f => {
    const labelEl = document.createElement('label');
    labelEl.className = 'field-label' + (f.full ? ' full' : '');
    labelEl.textContent = f.label;
    labelEl.style.gridColumn = f.full ? '1 / -1' : 'auto';

    let inputEl;
    if (f.type === 'textarea') { inputEl = document.createElement('textarea'); }
    else if (f.type === 'select') {
      inputEl = document.createElement('select');
      f.options.forEach(o => {
        const opt = document.createElement('option'); opt.value = o; opt.textContent = o;
        inputEl.appendChild(opt);
      });
    } else {
      inputEl = document.createElement('input'); inputEl.type = f.type;
    }
    inputEl.className = 'field-input' + (f.full ? ' full' : '');
    inputEl.id = 'new_' + f.key;
    inputEl.dataset.key = f.key;
    if (f.full) { labelEl.style.gridColumn = '1 / -1'; inputEl.style.gridColumn = '1 / -1'; }

    wrap.appendChild(labelEl);
    wrap.appendChild(inputEl);
  });
}

async function submitNewClient() {
  const category = document.getElementById('newCategorySelect').value;
  const fields = {};
  FIELDS[category].forEach(f => {
    fields[f.key] = document.getElementById('new_' + f.key).value.trim();
  });
  const nameField = FIELDS[category][0].key;
  if (!fields[nameField]) { showToast('Please enter a name before saving.', true); return; }

  const btn = document.getElementById('saveNewClientBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const res = await apiPost('addClient', { category, fields });
    if (!res.ok) { showToast(res.error || 'Could not save client', true); return; }
    showToast('Client added.');
    closeAddModal();
    await loadClients();
  } catch (err) {
    showToast('Save failed — check your connection.', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Save Client';
  }
}

// ====== DETAIL MODAL ======
async function openDetailModal(category, clientNo) {
  currentDetail = { category, clientNo };
  editMode = false;
  document.getElementById('detailOverlay').hidden = false;
  document.getElementById('detailBody').innerHTML = '<p>Loading…</p>';
  await refreshDetail();
}
function closeDetailModal() { document.getElementById('detailOverlay').hidden = true; currentDetail = null; }

async function refreshDetail() {
  const { category, clientNo } = currentDetail;
  const data = await apiGet({ action: 'getClient', category, clientNo });
  if (!data.ok) { showToast(data.error || 'Could not load client', true); return; }

  const meta = CATEGORY_META[category];
  const nameField = FIELDS[category][0].key;
  document.getElementById('detailStamp').textContent = meta.label;
  document.getElementById('detailStamp').style.background = meta.color;
  document.getElementById('detailName').textContent = data.client[nameField] || '(unnamed)';
  document.getElementById('detailFolio').textContent = 'No. ' + data.client.ClientNo;

  renderDetailBody(data);
}

function renderDetailBody(data) {
  const { category } = currentDetail;
  const client = data.client;
  const body = document.getElementById('detailBody');
  body.innerHTML = '';

  // top actions
  const actions = document.createElement('div');
  actions.className = 'top-actions';
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-ghost btn-small';
  editBtn.textContent = editMode ? 'Cancel Edit' : 'Edit Details';
  editBtn.addEventListener('click', () => { editMode = !editMode; renderDetailBody(data); });
  actions.appendChild(editBtn);

  if (editMode) {
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary btn-small';
    saveBtn.textContent = 'Save Changes';
    saveBtn.addEventListener('click', () => saveEditedDetails(client));
    actions.appendChild(saveBtn);
  }
  if (client.DriveLink) {
    const driveBtn = document.createElement('a');
    driveBtn.className = 'btn btn-ghost btn-small';
    driveBtn.href = client.DriveLink; driveBtn.target = '_blank';
    driveBtn.textContent = 'Open Drive Folder ↗';
    actions.appendChild(driveBtn);
  }
  body.appendChild(actions);

  // details section
  const section = document.createElement('div');
  section.className = 'detail-section';
  const h3 = document.createElement('h3'); h3.textContent = 'Details';
  section.appendChild(h3);

  if (editMode) {
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    FIELDS[category].forEach(f => {
      const label = document.createElement('label');
      label.className = 'field-label' + (f.full ? ' full' : '');
      label.textContent = f.label;
      let input;
      if (f.type === 'textarea') { input = document.createElement('textarea'); }
      else if (f.type === 'select') {
        input = document.createElement('select');
        f.options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; input.appendChild(opt); });
      } else { input = document.createElement('input'); input.type = f.type; }
      input.className = 'field-input';
      input.id = 'edit_' + f.key;
      input.value = client[f.key] || '';
      if (f.full) { label.style.gridColumn = '1/-1'; input.style.gridColumn = '1/-1'; }
      grid.appendChild(label); grid.appendChild(input);
    });
    section.appendChild(grid);
  } else {
    const dl = document.createElement('dl');
    dl.className = 'detail-grid';
    FIELDS[category].forEach(f => {
      const item = document.createElement('div');
      item.className = 'detail-item' + (f.full ? '' : '');
      item.innerHTML = `<dt>${f.label}</dt><dd>${escapeHtml(client[f.key] || '—')}</dd>`;
      dl.appendChild(item);
    });
    section.appendChild(dl);
  }
  body.appendChild(section);

  // documents section
  body.appendChild(buildDocsSection(data));

  // entries table (GST/ITR only)
  if (ENTRY_FIELDS[category]) {
    body.appendChild(buildEntriesSection(data));
  }
}

function buildDocsSection(data) {
  const { category, clientNo } = currentDetail;
  const wrap = document.createElement('div');
  wrap.className = 'detail-section';
  wrap.innerHTML = '<h3>Client Documents</h3>';

  const filesWrap = document.createElement('div');
  if (data.documentFiles && data.documentFiles.length) {
    data.documentFiles.forEach(f => {
      const a = document.createElement('a');
      a.href = f.url; a.target = '_blank'; a.className = 'file-chip';
      a.textContent = '📄 ' + f.name;
      filesWrap.appendChild(a);
    });
  } else {
    filesWrap.innerHTML = '<p style="color:var(--ink-soft);font-size:13.5px;">No documents uploaded yet.</p>';
  }
  wrap.appendChild(filesWrap);

  const uploadRow = document.createElement('div');
  uploadRow.style.marginTop = '10px';
  uploadRow.innerHTML = `<input type="file" id="docsUploadInput" multiple style="font-size:13px;">`;
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'btn btn-ghost btn-small';
  uploadBtn.style.marginLeft = '10px';
  uploadBtn.textContent = 'Upload';
  uploadBtn.addEventListener('click', async () => {
    const input = document.getElementById('docsUploadInput');
    if (!input.files.length) { showToast('Choose files first.', true); return; }
    uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…';
    try {
      const files = await filesToPayload(input);
      const res = await apiPost('uploadDocs', { category, clientNo, files, folderType: 'documents' });
      if (!res.ok) { showToast(res.error || 'Upload failed', true); return; }
      showToast('Documents uploaded.');
      await refreshDetail();
    } finally {
      uploadBtn.disabled = false; uploadBtn.textContent = 'Upload';
    }
  });
  uploadRow.appendChild(uploadBtn);
  wrap.appendChild(uploadRow);

  return wrap;
}

function buildEntriesSection(data) {
  const { category, clientNo } = currentDetail;
  const wrap = document.createElement('div');
  wrap.className = 'detail-section';
  const title = category === 'GST' ? 'Monthly Filing Record' : 'Yearly Return Record';
  wrap.innerHTML = `<h3>${title}</h3>`;

  const cols = ENTRY_TABLE_COLUMNS[category];
  const table = document.createElement('table');
  table.className = 'ledger-table';
  const theadLabels = ENTRY_FIELDS[category].map(f => f.label).concat(['Documents']);
  table.innerHTML = `<thead><tr>${theadLabels.map(l => `<th>${l}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');

  (data.entries || []).slice().reverse().forEach(entry => {
    const tr = document.createElement('tr');
    const cells = cols.map(c => {
      if (c === 'DocLinks') {
        if (!entry.DocLinks) return '<td>—</td>';
        const links = entry.DocLinks.split(',').map((u, i) => `<a href="${u.trim()}" target="_blank">File ${i + 1}</a>`).join(', ');
        return `<td>${links}</td>`;
      }
      return `<td>${escapeHtml(entry[c] || '—')}</td>`;
    }).join('');
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  if (!data.entries || data.entries.length === 0) {
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--ink-soft);font-size:13.5px;margin-top:8px;';
    p.textContent = 'No entries recorded yet.';
    wrap.appendChild(p);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-ghost btn-small';
  addBtn.style.marginTop = '12px';
  addBtn.textContent = '+ Add Entry';
  const formHolder = document.createElement('div');

  addBtn.addEventListener('click', () => {
    if (formHolder.children.length) { formHolder.innerHTML = ''; return; }
    formHolder.appendChild(buildEntryForm(category, clientNo));
  });

  wrap.appendChild(addBtn);
  wrap.appendChild(formHolder);
  return wrap;
}

function buildEntryForm(category, clientNo) {
  const form = document.createElement('div');
  form.className = 'inline-form';
  const grid = document.createElement('div');
  grid.className = 'field-grid';

  ENTRY_FIELDS[category].forEach(f => {
    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = f.label;
    const input = document.createElement('input');
    input.type = f.type; input.className = 'field-input';
    input.id = 'entry_' + f.key;
    grid.appendChild(label); grid.appendChild(input);
  });
  form.appendChild(grid);

  const fileLabel = document.createElement('label');
  fileLabel.className = 'field-label';
  fileLabel.textContent = category === 'GST' ? 'Upload this month\'s documents / return' : 'Upload this year\'s return';
  form.appendChild(fileLabel);
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.multiple = true; fileInput.id = 'entryFileInput';
  form.appendChild(fileInput);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary btn-small';
  saveBtn.style.marginTop = '14px';
  saveBtn.textContent = 'Save Entry';
  saveBtn.addEventListener('click', async () => {
    const entry = {};
    ENTRY_FIELDS[category].forEach(f => { entry[f.key] = document.getElementById('entry_' + f.key).value.trim(); });
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const files = await filesToPayload(fileInput);
      const res = await apiPost('addEntry', { category, clientNo, entry, files });
      if (!res.ok) { showToast(res.error || 'Could not save entry', true); return; }
      showToast('Entry added.');
      await refreshDetail();
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = 'Save Entry';
    }
  });
  form.appendChild(saveBtn);
  return form;
}

async function saveEditedDetails(client) {
  const { category, clientNo } = currentDetail;
  const fields = {};
  FIELDS[category].forEach(f => { fields[f.key] = document.getElementById('edit_' + f.key).value.trim(); });
  try {
    const res = await apiPost('updateClient', { category, clientNo, fields });
    if (!res.ok) { showToast(res.error || 'Could not save changes', true); return; }
    showToast('Details updated.');
    editMode = false;
    await refreshDetail();
    await loadClients();
  } catch (err) {
    showToast('Save failed — check your connection.', true);
  }
}
