import { Card } from "./components/Card.js";
import { Column } from "./components/Column.js";

const board = document.querySelector("#board");

const KEY = "kanban-data";

function loadData() {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : initialColumns;
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const initialColumns = [
  { id: "todo", name: "To Do", cards: [
    { id: "1", title: "Task 1" },
    { id: "2", title: "Task 2" }
  ] },
  { id: "in-progress", name: "In Progress", cards: [] },
  { id: "done", name: "Done", cards: [] }
]

function initApp() {
  const columnsData = loadData();

  columnsData.forEach(col => {
    const columnEl = document.createElement('kanban-column');
    columnEl.setAttribute('id', col.id);
    columnEl.setAttribute('name', col.name);

    board.appendChild(columnEl);

    col.cards.forEach(card => {
      columnEl.addCard(card.title, card.id, card.description);
    });
  })
}

board.addEventListener("card-added", (e) => {
  const { columnId, title, id } = e.detail;
  const data = loadData();

  const column = data.find(col => col.id === columnId);
  column.cards.push({ title, id, description: e.detail.description });
  saveData(data);
});

initApp();
