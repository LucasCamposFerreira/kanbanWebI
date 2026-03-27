import { Card } from "./components/Card.js";
import { Column } from "./components/Column.js";
import { Modal } from "./components/Modal.js";
import { AddColumn } from "./components/AddColumn.js";

const KEY = "kanban-data";

const board = document.querySelector("#board");
const modal = document.getElementById("modal");

function loadData() {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : initialColumns;
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const initialColumns = [
  { id: "todo", name: "A fazer", cards: [
    { id: "1", title: "Tarefa 1", description: "Descrição da tarefa 1" },
  ] },
  { id: "in-progress", name: "Em progresso", cards: [] },
  { id: "done", name: "Concluído", cards: [] }
]

function initApp() {
  const columnsData = loadData();

  columnsData.forEach(col => {
    const columnEl = document.createElement('kanban-column');
    columnEl.setAttribute('id', col.id);
    columnEl.setAttribute('name', col.name);
    columnEl.classList.add("column-container");

    board.appendChild(columnEl);

    col.cards.forEach(card => {
      columnEl.addCard(card.title, card.id, card.description);
    });
  })

  const addColumnEl = document.createElement("add-column");
  board.appendChild(addColumnEl);
}

board.addEventListener("card-added", (e) => {
  const { columnId, title, id, description } = e.detail;
  const data = loadData();

  const column = data.find(col => col.id === columnId);
  column.cards.push({ title, id, description });
  saveData(data);
});

board.addEventListener("column-added", (e) => {
  const { id, name } = e.detail;
  const data = loadData();

  data.push({ id, name, cards: [] });
  saveData(data);
});

board.addEventListener("card-moved", (e) => {
  const { toColumnId, cardId } = e.detail;

  const data = loadData();
  
  let card = null;
  let sourceColumn = null;
  
  data.forEach(col => {
    const found = col.cards.find(c => {
      return c.id === cardId;
    });
    if (found) {
      card = found;
      sourceColumn = col;
    }
  });

  if (!card || sourceColumn.id === toColumnId) return;

  sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== cardId);

  const targetColumn = data.find(col => col.id === toColumnId);
  targetColumn.cards.push(card);

  const toColumnEl = document.getElementById(toColumnId);
  const cardEl = document.getElementById(cardId);
  toColumnEl.appendChild(cardEl);

  saveData(data);
});

board.addEventListener("card-clicked", (e) => {
  modal.open(e.detail);
});

document.addEventListener("card-updated", (e) => {
  const { id, title, description } = e.detail;
  const data = loadData();

  data.forEach(col => {
    const card = col.cards.find(c => c.id === id);
    if (card) {
      card.title = title;
      card.description = description;
    }
  });

  const cardEl = document.getElementById(id);
  if (cardEl) {
    cardEl.setAttribute("title", title);
    cardEl.setAttribute("description", description);
    cardEl.render();
  }

  saveData(data);
});

document.addEventListener("card-deleted", (e) => {
  const { id } = e.detail;
  const data = loadData();

  data.forEach(col => {
    col.cards = col.cards.filter(c => c.id !== id);
  });

  document.getElementById(id)?.remove();

  saveData(data);
});

initApp();
