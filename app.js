/* ═══════════════════════════════════════════
   Taskflow — Kanban Board  |  app.js
   Features: Drag & Drop, CRUD, LocalStorage,
             Dark/Light mode, Due dates, Priority
═══════════════════════════════════════════ */

// ── State ──────────────────────────────────
const STORAGE_KEY = 'taskflow_tasks_v2';
const THEME_KEY   = 'taskflow_theme';
const PROJ_KEY    = 'taskflow_project';

let tasks      = [];
let editingId  = null;
let deletingId = null;
let dragSrcId  = null;
let placeholder = null;

const COLUMNS = ['backlog','todo','inprogress','review','done'];

// ── Helpers ────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36);
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const el  = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === 'className') e.className = v;
    else if (k === 'textContent') e.textContent = v;
    else if (k === 'innerHTML') e.innerHTML = v;
    else if (k.startsWith('data-')) e.setAttribute(k, v);
    else e[k] = v;
  });
  children.forEach(c => c && e.appendChild(c));
  return e;
};

// ── Persistence ────────────────────────────
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const load = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    tasks = d ? JSON.parse(d) : getDefaultTasks();
  } catch { tasks = getDefaultTasks(); }
};

function getDefaultTasks() {
  const now = Date.now();
  const day = 86400000;
  return [
    { id: uid(), title: 'Research competitor products',  desc: 'Analyze top 5 competitors, focus on UX patterns.',  priority:'high',     column:'backlog',    tag:'Research', due: new Date(now + 7*day).toISOString().slice(0,10) },
    { id: uid(), title: 'Set up project repository',      desc: 'Init GitHub repo, branch strategy, CI pipeline.',  priority:'medium',   column:'done',       tag:'Dev',      due: '' },
    { id: uid(), title: 'Design system tokens',           desc: 'Define colors, spacing, radius, typography scale.', priority:'high',    column:'inprogress', tag:'Design',   due: new Date(now + 2*day).toISOString().slice(0,10) },
    { id: uid(), title: 'Write API documentation',        desc: '',                                                  priority:'low',     column:'todo',       tag:'Docs',     due: new Date(now + 10*day).toISOString().slice(0,10) },
    { id: uid(), title: 'Fix login redirect bug',         desc: 'Users get 404 after OAuth callback on Safari.',     priority:'critical',column:'todo',       tag:'Bug',      due: new Date(now - 1*day).toISOString().slice(0,10) },
    { id: uid(), title: 'Accessibility audit',            desc: 'Run axe-core, fix WCAG 2.1 AA issues.',             priority:'medium',  column:'review',     tag:'Testing',  due: new Date(now + 3*day).toISOString().slice(0,10) },
    { id: uid(), title: 'Landing page copy',              desc: 'Hero, features section, FAQ, footer.',              priority:'medium',  column:'backlog',    tag:'Feature',  due: '' },
    { id: uid(), title: 'Setup database schema',          desc: '',                                                  priority:'high',    column:'done',       tag:'Dev',      due: '' },
  ];
}

// ── Render ─────────────────────────────────
function renderAll() {
  COLUMNS.forEach(col => {
    const container = document.getElementById(`col-${col}`);
    const colTasks  = tasks.filter(t => t.column === col);
    container.innerHTML = '';

    if (colTasks.length === 0) {
      container.appendChild(el('div', {
        className: 'empty-state',
        innerHTML: `<span class="empty-icon">◎</span><span>Drop tasks here</span>`
      }));
    } else {
      colTasks.forEach(t => container.appendChild(buildCard(t)));
    }

    document.getElementById(`count-${col}`).textContent = colTasks.length;
  });
  updateStats();
  updateProgressBar();
}

function buildCard(t) {
  const card = el('div', {
    className: 'card',
    'data-id': t.id,
    draggable: true
  });

  // Top row
  const editBtn = el('button', { className: 'card-btn', title: 'Edit', innerHTML: '✎' });
  const delBtn  = el('button', { className: 'card-btn del', title: 'Delete', innerHTML: '✕' });
  editBtn.addEventListener('click', e => { e.stopPropagation(); openModal(t.id); });
  delBtn.addEventListener('click',  e => { e.stopPropagation(); openDelete(t.id); });

  const actions = el('div', { className: 'card-actions' }, [editBtn, delBtn]);
  const title   = el('div', { className: 'card-title', textContent: t.title });
  const top     = el('div', { className: 'card-top' }, [title, actions]);
  card.appendChild(top);

  if (t.desc) {
    card.appendChild(el('div', { className: 'card-desc', textContent: t.desc }));
  }

  // Footer
  const footer = el('div', { className: 'card-footer' });

  const pBadge = el('span', {
    className: `priority-badge p-${t.priority}`,
    textContent: t.priority
  });
  footer.appendChild(pBadge);

  if (t.tag) {
    footer.appendChild(el('span', { className: 'tag-badge', textContent: t.tag }));
  }

  if (t.due) {
    const due   = new Date(t.due + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff  = Math.round((due - today) / 86400000);
    let cls = 'due-badge';
    let label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diff < 0)  { cls += ' overdue'; label = `${Math.abs(diff)}d overdue`; }
    else if (diff <= 2) { cls += ' soon'; label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : label; }
    footer.appendChild(el('span', { className: cls, innerHTML: `⏰ ${label}` }));
  }

  card.appendChild(footer);

  // Drag events
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragend',   onDragEnd);

  return card;
}

// ── Stats ──────────────────────────────────
function updateStats() {
  document.getElementById('total-count').textContent = tasks.length;
  document.getElementById('done-count').textContent  = tasks.filter(t => t.column === 'done').length;
}

function updateProgressBar() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.column === 'done').length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  let wrap = qs('.progress-bar-wrap');
  if (!wrap) {
    const header = qs('.column[data-column="done"] .column-header');
    wrap = el('div', { className: 'progress-bar-wrap' });
    wrap.appendChild(el('div', { className: 'progress-bar-fill' }));
    header.appendChild(wrap);
  }
  qs('.progress-bar-fill').style.width = `${pct}%`;
}

// ── Modal: Add / Edit ──────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle   = document.getElementById('modalTitle');
const taskTitle    = document.getElementById('taskTitle');
const taskDesc     = document.getElementById('taskDesc');
const taskPriority = document.getElementById('taskPriority');
const taskColumn   = document.getElementById('taskColumn');
const taskTag      = document.getElementById('taskTag');
const taskDue      = document.getElementById('taskDue');

function openModal(id = null, defaultCol = null) {
  editingId = id;
  if (id) {
    const t = tasks.find(t => t.id === id);
    modalTitle.textContent   = 'Edit Task';
    taskTitle.value          = t.title;
    taskDesc.value           = t.desc || '';
    taskPriority.value       = t.priority;
    taskColumn.value         = t.column;
    taskTag.value            = t.tag || '';
    taskDue.value            = t.due || '';
  } else {
    modalTitle.textContent   = 'New Task';
    taskTitle.value          = '';
    taskDesc.value           = '';
    taskPriority.value       = 'medium';
    taskColumn.value         = defaultCol || 'todo';
    taskTag.value            = '';
    taskDue.value            = '';
  }
  modalOverlay.classList.add('open');
  setTimeout(() => taskTitle.focus(), 80);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editingId = null;
}

function saveTask() {
  const title = taskTitle.value.trim();
  if (!title) {
    taskTitle.focus();
    taskTitle.style.borderColor = '#f87171';
    setTimeout(() => taskTitle.style.borderColor = '', 1200);
    showToast('Title is required', 'error');
    return;
  }

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    tasks[idx] = { ...tasks[idx], title, desc: taskDesc.value.trim(), priority: taskPriority.value, column: taskColumn.value, tag: taskTag.value, due: taskDue.value };
    showToast('Task updated ✓', 'success');
  } else {
    tasks.push({ id: uid(), title, desc: taskDesc.value.trim(), priority: taskPriority.value, column: taskColumn.value, tag: taskTag.value, due: taskDue.value });
    showToast('Task added ✓', 'success');
  }

  save();
  renderAll();
  closeModal();
}

// ── Modal: Delete ──────────────────────────
const deleteOverlay  = document.getElementById('deleteOverlay');

function openDelete(id) {
  deletingId = id;
  deleteOverlay.classList.add('open');
}
function closeDelete() {
  deleteOverlay.classList.remove('open');
  deletingId = null;
}
function confirmDelete() {
  tasks = tasks.filter(t => t.id !== deletingId);
  save();
  renderAll();
  closeDelete();
  showToast('Task deleted', 'error');
}

// ── Toast ──────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Drag & Drop ────────────────────────────
function onDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
}

function onDragEnd() {
  this.classList.remove('dragging');
  placeholder && placeholder.remove();
  placeholder = null;
  document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
  dragSrcId = null;
}

function setupDropZones() {
  document.querySelectorAll('.cards-container').forEach(container => {
    container.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const col = container.closest('.column');
      document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
      col.classList.add('drag-over');

      // Move placeholder
      const afterEl = getDragAfterElement(container, e.clientY);
      if (!placeholder) {
        placeholder = el('div', { className: 'drop-placeholder' });
      }
      if (afterEl) container.insertBefore(placeholder, afterEl);
      else container.appendChild(placeholder);
    });

    container.addEventListener('dragleave', e => {
      if (!container.contains(e.relatedTarget)) {
        container.closest('.column').classList.remove('drag-over');
        placeholder && placeholder.remove();
        placeholder = null;
      }
    });

    container.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrcId) return;
      const newCol = container.dataset.column;
      const idx = tasks.findIndex(t => t.id === dragSrcId);
      if (idx !== -1) {
        tasks[idx].column = newCol;
        save();
        renderAll();
        showToast(`Moved to ${colLabel(newCol)} ✓`, 'success');
      }
      container.closest('.column').classList.remove('drag-over');
      placeholder && placeholder.remove();
      placeholder = null;
    });
  });
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  return cards.reduce((closest, child) => {
    const box    = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

const colLabel = c => ({ backlog:'Backlog', todo:'To Do', inprogress:'In Progress', review:'Review', done:'Done' }[c] || c);

// ── Theme ──────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') applyLight();
}
function toggleTheme() {
  if (document.body.classList.contains('light-mode')) {
    document.body.classList.remove('light-mode');
    document.getElementById('themeToggle').textContent = '☽';
    localStorage.setItem(THEME_KEY, 'dark');
  } else {
    applyLight();
    localStorage.setItem(THEME_KEY, 'light');
  }
}
function applyLight() {
  document.body.classList.add('light-mode');
  document.getElementById('themeToggle').textContent = '☀';
}

// ── Project Name Edit ──────────────────────
function initProjectName() {
  const nameEl  = document.getElementById('project-name');
  const editBtn = document.getElementById('editProjectBtn');
  const saved   = localStorage.getItem(PROJ_KEY);
  if (saved) nameEl.textContent = saved;

  editBtn.addEventListener('click', () => {
    nameEl.contentEditable = 'true';
    nameEl.focus();
    const range = document.createRange();
    range.selectNodeContents(nameEl);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });

  nameEl.addEventListener('blur', () => {
    nameEl.contentEditable = 'false';
    const val = nameEl.textContent.trim() || 'My Workspace';
    nameEl.textContent = val;
    localStorage.setItem(PROJ_KEY, val);
  });

  nameEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
  });
}

// ── Column add buttons ─────────────────────
function setupColAddBtns() {
  document.querySelectorAll('.col-add-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(null, btn.dataset.column));
  });
}

// ── Event Listeners ────────────────────────
function setupEvents() {
  document.getElementById('addCardBtn').addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveTask);
  document.getElementById('deleteClose').addEventListener('click', closeDelete);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDelete);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Close modals on overlay click
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  deleteOverlay.addEventListener('click', e => { if (e.target === deleteOverlay) closeDelete(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeDelete(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openModal(); }
    if (e.key === 'Enter' && modalOverlay.classList.contains('open') && e.target !== taskDesc) {
      e.preventDefault(); saveTask();
    }
  });
}

// ── Boot ───────────────────────────────────
(function init() {
  load();
  initTheme();
  initProjectName();
  setupColAddBtns();
  setupDropZones();
  setupEvents();
  renderAll();
  console.log('%c Taskflow loaded ⬡ ', 'background:#6ee7b7;color:#0e2a1f;font-weight:700;border-radius:4px;padding:2px 6px;');
})();