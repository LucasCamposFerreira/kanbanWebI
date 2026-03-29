// ─────────────────────────────────────────────
// App state
// ─────────────────────────────────────────────
let currentUser = null;
let currentBoardId = null;
let unsubscribeListeners = [];

// Drag-and-drop state
let draggedCard = null;
let draggedCardColumnId = null;

// Card modal state
let editingCardId = null;
let editingCardColumnId = null;

// ─────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────
const authSection      = document.getElementById('auth-section');
const appSection       = document.getElementById('app-section');
const loginForm        = document.getElementById('login-form');
const registerForm     = document.getElementById('register-form');
const columnsContainer = document.getElementById('columns-container');
const cardModal        = document.getElementById('card-modal');

// ─────────────────────────────────────────────
// Auth state listener
// ─────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('user-name').textContent = user.displayName || user.email;
    authSection.style.display = 'none';
    appSection.style.display  = 'flex';
    await initBoard();
  } else {
    currentUser = null;
    authSection.style.display = 'flex';
    appSection.style.display  = 'none';
    unsubscribeAll();
  }
});

// ─────────────────────────────────────────────
// Board initialisation
// ─────────────────────────────────────────────
async function initBoard() {
  unsubscribeAll();

  // Use the user's UID as the board document ID (one board per user)
  currentBoardId = currentUser.uid;

  const boardRef = db.collection('boards').doc(currentBoardId);
  const boardDoc = await boardRef.get();

  if (!boardDoc.exists) {
    // Create the board document
    await boardRef.set({
      userId:    currentUser.uid,
      name:      'Meu Quadro',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Seed three default columns
    const defaultColumns = ['A Fazer', 'Em Andamento', 'Concluído'];
    for (let i = 0; i < defaultColumns.length; i++) {
      await boardRef.collection('columns').add({
        name:      defaultColumns[i],
        order:     i,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  subscribeToColumns();
}

// ─────────────────────────────────────────────
// Real-time column listener
// ─────────────────────────────────────────────
function subscribeToColumns() {
  const columnsRef = db
    .collection('boards').doc(currentBoardId)
    .collection('columns');

  const unsubscribe = columnsRef.orderBy('order').onSnapshot((snapshot) => {
    const columns = [];
    snapshot.forEach(doc => columns.push({ id: doc.id, ...doc.data() }));
    renderColumns(columns);
  });

  unsubscribeListeners.push(unsubscribe);
}

// ─────────────────────────────────────────────
// Render columns
// ─────────────────────────────────────────────
function renderColumns(columns) {
  // Keep track of which column listeners are already active
  const existingColumnIds = new Set(
    [...columnsContainer.querySelectorAll('.column')].map(el => el.dataset.columnId)
  );

  // Remove columns that no longer exist
  columnsContainer.querySelectorAll('.column').forEach(el => {
    if (!columns.find(c => c.id === el.dataset.columnId)) {
      el.remove();
    }
  });

  // Add / update columns preserving DOM order
  columns.forEach((column, index) => {
    let columnEl = columnsContainer.querySelector(`.column[data-column-id="${column.id}"]`);

    if (!columnEl) {
      // New column — create element and attach card listener
      columnEl = createColumnElement(column);
      columnsContainer.insertBefore(columnEl, columnsContainer.children[index] || null);
      loadCards(column.id, columnEl);
    } else {
      // Update title if it changed
      const titleEl = columnEl.querySelector('.column-title');
      if (titleEl && titleEl.textContent !== column.name) {
        titleEl.textContent = column.name;
      }
      // Move to correct position if needed
      if (columnsContainer.children[index] !== columnEl) {
        columnsContainer.insertBefore(columnEl, columnsContainer.children[index] || null);
      }
    }
  });
}

// ─────────────────────────────────────────────
// Create column DOM element
// ─────────────────────────────────────────────
function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'column';
  columnEl.dataset.columnId = column.id;

  columnEl.innerHTML = `
    <div class="column-header">
      <h3 class="column-title">${escapeHtml(column.name)}</h3>
      <div class="column-actions">
        <button class="btn-icon btn-edit-column"   title="Renomear coluna" data-column-id="${column.id}">✏️</button>
        <button class="btn-icon btn-delete-column" title="Excluir coluna"   data-column-id="${column.id}">🗑️</button>
      </div>
    </div>
    <div class="column-body" data-column-id="${column.id}"></div>
    <button class="btn-add-card" data-column-id="${column.id}">+ Adicionar Card</button>
  `;

  columnEl.querySelector('.btn-edit-column').addEventListener('click', () => {
    const name = prompt('Novo nome da coluna:', column.name);
    if (name && name.trim()) renameColumn(column.id, name.trim());
  });

  columnEl.querySelector('.btn-delete-column').addEventListener('click', () => {
    if (confirm('Excluir esta coluna e todos os seus cards?\nEsta ação não pode ser desfeita.')) deleteColumn(column.id);
  });

  columnEl.querySelector('.btn-add-card').addEventListener('click', () => {
    openCardModal(column.id, null);
  });

  // Drag-and-drop events on the column body
  const columnBody = columnEl.querySelector('.column-body');
  columnBody.addEventListener('dragover',  handleDragOver);
  columnBody.addEventListener('drop',      handleDrop);
  columnBody.addEventListener('dragleave', handleDragLeave);

  return columnEl;
}

// ─────────────────────────────────────────────
// Real-time card listener for a column
// ─────────────────────────────────────────────
function loadCards(columnId, columnEl) {
  const cardsRef = db
    .collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId)
    .collection('cards');

  const unsubscribe = cardsRef.orderBy('order').onSnapshot((snapshot) => {
    const columnBody = columnEl.querySelector(`.column-body[data-column-id="${columnId}"]`);
    if (!columnBody) return;

    const cards = [];
    snapshot.forEach(doc => cards.push({ id: doc.id, ...doc.data() }));
    renderCards(cards, columnBody, columnId);
  });

  unsubscribeListeners.push(unsubscribe);
}

// ─────────────────────────────────────────────
// Render cards inside a column body
// ─────────────────────────────────────────────
function renderCards(cards, columnBody, columnId) {
  columnBody.innerHTML = '';
  cards.forEach(card => columnBody.appendChild(createCardElement(card, columnId)));
}

// ─────────────────────────────────────────────
// Create card DOM element
// ─────────────────────────────────────────────
function createCardElement(card, columnId) {
  const cardEl = document.createElement('div');
  cardEl.className  = 'card';
  cardEl.draggable  = true;
  cardEl.dataset.cardId   = card.id;
  cardEl.dataset.columnId = columnId;

  cardEl.innerHTML = `
    <div class="card-content">
      <p class="card-title">${escapeHtml(card.title)}</p>
      ${card.description ? `<p class="card-desc">${escapeHtml(card.description)}</p>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn-icon btn-edit-card"   title="Editar card">✏️</button>
      <button class="btn-icon btn-delete-card" title="Excluir card">🗑️</button>
    </div>
  `;

  cardEl.querySelector('.btn-edit-card').addEventListener('click', (e) => {
    e.stopPropagation();
    openCardModal(columnId, card);
  });

  cardEl.querySelector('.btn-delete-card').addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm('Excluir este card?\nEsta ação não pode ser desfeita.')) deleteCard(columnId, card.id);
  });

  cardEl.addEventListener('dragstart', handleDragStart);
  cardEl.addEventListener('dragend',   handleDragEnd);

  return cardEl;
}

// ─────────────────────────────────────────────
// Card modal
// ─────────────────────────────────────────────
function openCardModal(columnId, card) {
  editingCardColumnId = columnId;
  editingCardId       = card ? card.id : null;

  document.getElementById('modal-title').textContent          = card ? 'Editar Card' : 'Novo Card';
  document.getElementById('card-title-input').value           = card ? card.title : '';
  document.getElementById('card-desc-input').value            = card ? (card.description || '') : '';

  cardModal.style.display = 'flex';
  document.getElementById('card-title-input').focus();
}

function closeCardModal() {
  cardModal.style.display = 'none';
  editingCardId       = null;
  editingCardColumnId = null;
}

document.getElementById('btn-save-card').addEventListener('click', async () => {
  const title       = document.getElementById('card-title-input').value.trim();
  const description = document.getElementById('card-desc-input').value.trim();

  if (!title) {
    showInputError('card-title-input', 'Por favor, digite um título para o card.');
    return;
  }

  if (editingCardId) {
    await updateCard(editingCardColumnId, editingCardId, title, description);
  } else {
    await addCard(editingCardColumnId, title, description);
  }

  closeCardModal();
});

document.getElementById('btn-cancel-card').addEventListener('click', closeCardModal);

cardModal.addEventListener('click', (e) => {
  if (e.target === cardModal) closeCardModal();
});

document.getElementById('card-title-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-save-card').click();
});

// ─────────────────────────────────────────────
// Column CRUD
// ─────────────────────────────────────────────
async function addColumn(name) {
  const columnsRef = db.collection('boards').doc(currentBoardId).collection('columns');
  const snapshot   = await columnsRef.get();
  await columnsRef.add({
    name,
    order:     snapshot.size,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function renameColumn(columnId, name) {
  await db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId)
    .update({ name });
}

async function deleteColumn(columnId) {
  // Delete all cards in the column first (Firestore doesn't cascade deletes)
  const cardsRef      = db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId).collection('cards');
  const cardsSnapshot = await cardsRef.get();
  const batch         = db.batch();
  cardsSnapshot.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  await db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId).delete();
}

// ─────────────────────────────────────────────
// Card CRUD
// ─────────────────────────────────────────────
async function addCard(columnId, title, description) {
  const cardsRef = db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId).collection('cards');
  const snapshot = await cardsRef.get();
  await cardsRef.add({
    title,
    description: description || '',
    order:       snapshot.size,
    createdAt:   firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function updateCard(columnId, cardId, title, description) {
  await db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId)
    .collection('cards').doc(cardId)
    .update({ title, description: description || '' });
}

async function deleteCard(columnId, cardId) {
  await db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(columnId)
    .collection('cards').doc(cardId).delete();
}

// ─────────────────────────────────────────────
// Move card between columns (drag-and-drop)
// ─────────────────────────────────────────────
async function moveCard(cardId, fromColumnId, toColumnId) {
  if (fromColumnId === toColumnId) return;

  const cardRef = db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(fromColumnId)
    .collection('cards').doc(cardId);

  const cardDoc = await cardRef.get();
  if (!cardDoc.exists) return;

  const cardData = cardDoc.data();

  const targetCardsRef = db.collection('boards').doc(currentBoardId)
    .collection('columns').doc(toColumnId).collection('cards');
  const targetSnapshot = await targetCardsRef.get();

  // Add to target column
  await targetCardsRef.add({
    ...cardData,
    order:     targetSnapshot.size,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Remove from source column
  await cardRef.delete();
}

// ─────────────────────────────────────────────
// Drag-and-drop handlers
// ─────────────────────────────────────────────
function handleDragStart(e) {
  draggedCard         = e.target.closest('.card');
  draggedCardColumnId = draggedCard.dataset.columnId;
  draggedCard.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedCard.dataset.cardId);
}

function handleDragEnd() {
  if (draggedCard) {
    draggedCard.classList.remove('dragging');
    draggedCard         = null;
    draggedCardColumnId = null;
  }
  document.querySelectorAll('.column-body').forEach(col => col.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove('drag-over');
  }
}

async function handleDrop(e) {
  e.preventDefault();
  const targetColumnId = e.currentTarget.dataset.columnId;
  e.currentTarget.classList.remove('drag-over');

  if (draggedCard && targetColumnId && targetColumnId !== draggedCardColumnId) {
    const cardId = draggedCard.dataset.cardId;
    await moveCard(cardId, draggedCardColumnId, targetColumnId);
  }
}

// ─────────────────────────────────────────────
// Add column button
// ─────────────────────────────────────────────
document.getElementById('btn-add-column').addEventListener('click', () => {
  const name = prompt('Nome da nova coluna:');
  if (name && name.trim()) addColumn(name.trim());
});

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', async () => {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');

  try {
    clearError('login-error');
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
  }
});

document.getElementById('btn-register').addEventListener('click', async () => {
  const name     = document.getElementById('register-name').value.trim();
  const email    = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const errorEl  = document.getElementById('register-error');

  try {
    clearError('register-error');
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    if (name) {
      await userCredential.user.updateProfile({ displayName: name });
    }
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
  }
});

document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());

document.getElementById('show-register').addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display    = 'none';
  registerForm.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display    = 'block';
});

// Enter-key shortcuts
document.getElementById('login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});
document.getElementById('register-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-register').click();
});

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function unsubscribeAll() {
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function showInputError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('input-error');
  input.addEventListener('input', () => input.classList.remove('input-error'), { once: true });
  // Show inline message near the input
  let msg = input.nextElementSibling;
  if (!msg || !msg.classList.contains('field-error')) {
    msg = document.createElement('span');
    msg.className = 'field-error';
    input.parentNode.insertBefore(msg, input.nextSibling);
  }
  msg.textContent = message;
  setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found':      'Usuário não encontrado.',
    'auth/wrong-password':      'Senha incorreta.',
    'auth/email-already-in-use':'E-mail já está em uso.',
    'auth/weak-password':       'Senha fraca — mínimo 6 caracteres.',
    'auth/invalid-email':       'E-mail inválido.',
    'auth/too-many-requests':   'Muitas tentativas. Tente novamente mais tarde.',
    'auth/invalid-credential':  'E-mail ou senha inválidos.',
    'auth/network-request-failed': 'Erro de rede. Verifique sua conexão.'
  };
  return messages[code] || 'Ocorreu um erro. Tente novamente.';
}
