import { Card } from "./components/Card.js";
import { Column } from "./components/Column.js";
import { ModalCard } from "./components/ModalCard.js";
import { AddColumn } from "./components/AddColumn.js";
import { Sidebar } from "./components/Sidebar.js";

const BOARDS_KEY = "kanban-boards";
const ACTIVE_KEY = "kanban-active-board";

const board = document.querySelector("#board");
const modalCard = document.getElementById("modalCard");
const sidebar = document.getElementById("sidebar");

const DEFAULT_COLUMNS = [
  { name: "A fazer",      id_suffix: "todo"        },
  { name: "Em progresso", id_suffix: "in-progress" },
  { name: "Concluído",    id_suffix: "done"        },
];

function generateDefaultColumns(boardId) {
  return DEFAULT_COLUMNS.map(c => ({
    id: `${boardId}-${c.id_suffix}`,
    name: c.name,
    cards: []
  }));
}

function loadBoards() {
  const raw = localStorage.getItem(BOARDS_KEY);
  if (raw) return JSON.parse(raw);

  const defaultId = crypto.randomUUID();
  const boards = [{
    id: defaultId,
    name: "Meu Quadro",
    columns: generateDefaultColumns(defaultId)
  }];
  saveBoards(boards);
  return boards;
}

function saveBoards(boards) {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

function getActiveId(boards) {
  const stored = localStorage.getItem(ACTIVE_KEY);
  if (stored && boards.find(b => b.id === stored)) return stored;
  return boards[0].id;
}

function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

function getBoardData(boardId) {
  return loadBoards().find(b => b.id === boardId);
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderBoard(boardId) {
  board.innerHTML = "";

  const data = getBoardData(boardId);
  if (!data) return;

  data.columns.forEach(col => {
    const columnEl = document.createElement("kanban-column");
    columnEl.setAttribute("id", col.id);
    columnEl.setAttribute("name", col.name);
    columnEl.classList.add("column-container");
    board.appendChild(columnEl);

    col.cards.forEach(card => {
      columnEl.addCard(card.title, card.id, card.description, card.color);
    });
  });

  const addColumnEl = document.createElement("add-column");
  board.appendChild(addColumnEl);
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initApp() {
  const boards = loadBoards();
  const activeId = getActiveId(boards);

  boards.forEach((b, i) => sidebar.addBoard(b.id, b.name, b.id === activeId));

  setActiveId(activeId);
  renderBoard(activeId);
}

// ── Sidebar events ────────────────────────────────────────────────────────────

sidebar.addEventListener("board-selected", (e) => {
  const { id } = e.detail;
  setActiveId(id);
  renderBoard(id);
});

sidebar.addEventListener("board-added", (e) => {
  const { id, name } = e.detail;

  const boards = loadBoards();
  boards.push({ id, name, columns: generateDefaultColumns(id) });
  saveBoards(boards);

  sidebar.addBoard(id, name, false);
  sidebar.setActiveBoard(id);
  setActiveId(id);
  renderBoard(id);
});

// ── Board events (card / column CRUD) ─────────────────────────────────────────

function activeId() { return localStorage.getItem(ACTIVE_KEY); }

board.addEventListener("card-added", (e) => {
  const { columnId, title, id, description } = e.detail;
  const boards = loadBoards();
  const brd = boards.find(b => b.id === activeId());
  const col = brd?.columns.find(c => c.id === columnId);
  if (col) col.cards.push({ title, id, description, color: null });
  saveBoards(boards);
});

board.addEventListener("column-added", (e) => {
  const { id, name } = e.detail;

  const columnEl = document.createElement("kanban-column");
  columnEl.setAttribute("name", name);
  columnEl.setAttribute("id", id);
  columnEl.classList.add("column-container");

  const addColumnEl = board.querySelector("add-column");
  board.insertBefore(columnEl, addColumnEl);

  const boards = loadBoards();
  const brd = boards.find(b => b.id === activeId());
  if (brd) brd.columns.push({ id, name, cards: [] });
  saveBoards(boards);
});

board.addEventListener("card-moved", (e) => {
  const { toColumnId, cardId } = e.detail;

  const boards = loadBoards();
  const brd = boards.find(b => b.id === activeId());
  if (!brd) return;

  let card = null;
  let sourceColumn = null;

  brd.columns.forEach(col => {
    const found = col.cards.find(c => c.id === cardId);
    if (found) { card = found; sourceColumn = col; }
  });

  if (!card || sourceColumn.id === toColumnId) return;

  sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== cardId);

  const targetColumn = brd.columns.find(c => c.id === toColumnId);

  // Assign color based on column semantic
  const suffix = toColumnId.split("-").slice(1).join("-");
  const colorMap = { "todo": null, "in-progress": "blue", "done": "green" };
  if (suffix in colorMap) card.color = colorMap[suffix];

  targetColumn.cards.push(card);

  const toColumnEl = document.getElementById(toColumnId);
  const cardEl = document.getElementById(cardId);
  if (toColumnEl && cardEl) {
    cardEl.setAttribute("color", card.color ?? "");
    cardEl.render();
    toColumnEl.appendChild(cardEl);
  }

  saveBoards(boards);
});

board.addEventListener("card-clicked", (e) => {
  modalCard.open(e.detail);
});

document.addEventListener("card-updated", (e) => {
  const { id, title, description } = e.detail;
  const boards = loadBoards();
  boards.forEach(b => b.columns.forEach(col => {
    const card = col.cards.find(c => c.id === id);
    if (card) { card.title = title; card.description = description; }
  }));

  const cardEl = document.getElementById(id);
  if (cardEl) {
    cardEl.setAttribute("title", title);
    cardEl.setAttribute("description", description);
    cardEl.render();
  }
  saveBoards(boards);
});

document.addEventListener("column-updated", (e) => {
  const { id, newName } = e.detail;
  const boards = loadBoards();
  const brd = boards.find(b => b.id === activeId());
  const col = brd?.columns.find(c => c.id === id);
  if (col) { col.name = newName; saveBoards(boards); }
});

document.addEventListener("column-deleted", (e) => {
  const { id } = e.detail;
  const boards = loadBoards();
  const brd = boards.find(b => b.id === activeId());
  if (brd) brd.columns = brd.columns.filter(c => c.id !== id);
  saveBoards(boards);
  document.getElementById(id)?.remove();
});

document.addEventListener("card-deleted", (e) => {
  const { id } = e.detail;
  const boards = loadBoards();
  boards.forEach(b => b.columns.forEach(col => {
    col.cards = col.cards.filter(c => c.id !== id);
  }));
  document.getElementById(id)?.remove();
  saveBoards(boards);
});

// ── "Novo Quadro" via FAB ─────────────────────────────────────────────────────

board.addEventListener("new-board-requested", () => {
  sidebar.expanded = true;
  sidebar._toggleAddForm(true);
});

initApp();