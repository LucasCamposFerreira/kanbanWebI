export class Column extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initEvents();
    this.initFormEvents();
  }

  initEvents() {
    const container = this.shadowRoot.querySelector(".column");

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.classList.add("drag-over");
    });

    container.addEventListener("dragleave", () => {
      container.classList.remove("drag-over");
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-over");

      const cardId = e.dataTransfer.getData("text/plain");

      this.dispatchEvent(new CustomEvent("card-moved", {
        detail: { cardId, toColumnId: this.getAttribute("id") },
        bubbles: true,
        composed: true
      }));
    });
  }

  initFormEvents() {
    const addCardButton = this.shadowRoot.querySelector(".add-card");
    const addCardForm = this.shadowRoot.querySelector(".add-card-form");
    const newCardTitle = this.shadowRoot.querySelector(".new-card-title");
    const saveCardButton = this.shadowRoot.querySelector(".save-card");
    const cancelCardButton = this.shadowRoot.querySelector(".cancel-card");

    addCardButton.addEventListener("click", () => {
      addCardButton.style.display = "none";
      addCardForm.style.display = "block";
      newCardTitle.focus();
    });

    cancelCardButton.addEventListener("click", () => {
      newCardTitle.value = "";
      addCardForm.style.display = "none";
      addCardButton.style.display = "flex";
    });

    saveCardButton.addEventListener("click", () => {
      const title = newCardTitle.value.trim();
      if (!title) return;
      const id = crypto.randomUUID();

      this.addCard(title, id, "");

      this.dispatchEvent(new CustomEvent("card-added", {
        detail: { columnId: this.getAttribute("id"), title, id, description: "" },
        bubbles: true,
        composed: true
      }));

      newCardTitle.value = "";
      addCardForm.style.display = "none";
      addCardButton.style.display = "flex";
    });

    newCardTitle.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveCardButton.click();
    });
    newCardTitle.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cancelCardButton.click();
    });
  }

  openEditColumnForm() {
    const columnTitle = this.shadowRoot.querySelector(".column-title");
    const editColumnSection = this.shadowRoot.querySelector(".edit-column");
    const editColumnNameInput = this.shadowRoot.querySelector(".edit-column-name");
    const editColumnButtons = this.shadowRoot.querySelector(".edit-column-buttons");

    editColumnButtons.style.display = "flex";
    editColumnSection.style.display = "block";
    columnTitle.style.display = "none";

    editColumnNameInput.value = this.getAttribute("name");
    editColumnNameInput.focus();
  }

  closeEditColumnForm() {
    const columnTitle = this.shadowRoot.querySelector(".column-title");
    const editColumnSection = this.shadowRoot.querySelector(".edit-column");
    const editColumnNameInput = this.shadowRoot.querySelector(".edit-column-name");
    const editColumnButtons = this.shadowRoot.querySelector(".edit-column-buttons");

    editColumnButtons.style.display = "none";
    editColumnSection.style.display = "none";
    columnTitle.style.display = "block";
    editColumnNameInput.value = "";
  }

  saveEditedColumnName() {
    const editColumnNameInput = this.shadowRoot.querySelector(".edit-column-name");
    const newName = editColumnNameInput.value.trim();
    const oldName = this.getAttribute("name");

    if (!newName) return;
    if (newName === oldName) { this.closeEditColumnForm(); return; }

    const columnId = this.getAttribute("id");
    this.setAttribute("name", newName);
    this.shadowRoot.querySelector(".column-title").textContent = newName;
    this.closeEditColumnForm();

    this.dispatchEvent(new CustomEvent("column-updated", {
      detail: { id: columnId, newName },
      bubbles: true,
      composed: true
    }));
  }

  deleteColumn() {
    if (!confirm("Você tem certeza que deseja excluir esta coluna? Todos os cards dentro dela também serão excluídos.")) return;

    const columnId = this.getAttribute("id");

    this.dispatchEvent(new CustomEvent("column-deleted", {
      detail: { id: columnId },
      bubbles: true,
      composed: true
    }));
  }

  addCard(title, id, description) {
    const newCard = document.createElement("kanban-card");
    newCard.setAttribute("title", title);
    newCard.setAttribute("id", id);
    newCard.setAttribute("description", description);
    this.appendChild(newCard);
  }

  render() {
    const title = this.getAttribute("name");
    const id = this.getAttribute("id");

    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }

      .column {
        background: #1a1d27;
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 14px;
        padding: 14px 12px 12px;
        min-height: 60vh;
        max-height: calc(100vh - 48px);
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        transition: border-color 0.18s ease, background 0.18s ease;
        overflow: hidden;
      }

      .column.drag-over {
        border-color: rgba(99,102,241,0.5);
        background: #1e2132;
      }

      .column-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0;
      }

      .column-title {
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: #8b90a7;
        cursor: default;
        user-select: none;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .column-title:hover { color: #c4c7d9; }

      .column-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .icon-btn {
        width: 26px;
        height: 26px;
        border: none;
        background: transparent;
        color: #5a5f7a;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
        font-size: 14px;
      }

      .icon-btn:hover { background: rgba(255,255,255,0.07); color: #e8eaf0; }
      .icon-btn.danger:hover { background: rgba(239,68,68,0.15); color: #ef4444; }

      .edit-column { display: none; flex-shrink: 0; }

      .edit-column label {
        display: block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #5a5f7a;
        margin-bottom: 6px;
      }

      .edit-column-name {
        width: 100%;
        padding: 7px 10px;
        background: #181b26;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 7px;
        color: #e8eaf0;
        font-family: inherit;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.15s;
        margin-bottom: 8px;
      }

      .edit-column-name:focus { border-color: rgba(99,102,241,0.6); }

      .edit-column-buttons {
        display: none;
        gap: 6px;
      }

      .btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 600;
        transition: background 0.15s, transform 0.1s;
        flex: 1;
      }

      .btn:active { transform: scale(0.97); }
      .btn-success { background: #10b981; color: #fff; }
      .btn-success:hover { background: #059669; }
      .btn-neutral { background: #3f4561; color: #e8eaf0; }
      .btn-neutral:hover { background: #4a506e; }
      .btn-danger { background: #ef4444; color: #fff; }
      .btn-danger:hover { background: #dc2626; }

      .items-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 2px;
      }

      .items-container::-webkit-scrollbar { width: 4px; }
      .items-container::-webkit-scrollbar-track { background: transparent; }
      .items-container::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.08);
        border-radius: 99px;
      }

      .add-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 8px;
        background: transparent;
        border: 1px dashed rgba(255,255,255,0.1);
        border-radius: 8px;
        color: #5a5f7a;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        flex-shrink: 0;
      }

      .add-card:hover {
        background: rgba(99,102,241,0.08);
        border-color: rgba(99,102,241,0.35);
        color: #a5b4fc;
      }

      .add-card-form {
        display: none;
        flex-shrink: 0;
      }

      .new-card-title {
        width: 100%;
        padding: 8px 10px;
        background: #181b26;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 7px;
        color: #e8eaf0;
        font-family: inherit;
        font-size: 0.875rem;
        outline: none;
        resize: none;
        transition: border-color 0.15s;
        margin-bottom: 8px;
      }

      .new-card-title:focus { border-color: rgba(99,102,241,0.6); }

      .add-card-actions {
        display: flex;
        gap: 6px;
      }

      @media (max-width: 768px) {
        :host { width: 100%; margin: 0; }
        .column { min-height: 40vh; }
      }
    </style>

    <div class="column" id="${id}">
      <div class="column-header">
        <h3 class="column-title" title="Duplo clique para editar">${title}</h3>
        <div class="column-actions">
          <button class="icon-btn edit-btn" title="Editar coluna">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger delete-btn" title="Excluir coluna">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="edit-column">
        <label>Renomear coluna</label>
        <input type="text" class="edit-column-name">
        <div class="edit-column-buttons">
          <button class="btn btn-success save-column-name">Salvar</button>
          <button class="btn btn-neutral cancel-edit-column">Cancelar</button>
        </div>
      </div>

      <div class="items-container">
        <slot></slot>
      </div>

      <div class="add-card-container">
        <button class="add-card">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar cartão
        </button>
        <div class="add-card-form">
          <input type="text" class="new-card-title" placeholder="Título do cartão...">
          <div class="add-card-actions">
            <button class="btn btn-success save-card">Salvar</button>
            <button class="btn btn-neutral cancel-card">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    `;

    this.shadowRoot.querySelector(".column-title").addEventListener("dblclick", () => {
      this.openEditColumnForm();
    });

    this.shadowRoot.querySelector(".edit-btn").addEventListener("click", () => {
      this.openEditColumnForm();
    });

    this.shadowRoot.querySelector(".cancel-edit-column").addEventListener("click", () => {
      this.closeEditColumnForm();
    });

    this.shadowRoot.querySelector(".save-column-name").addEventListener("click", () => {
      this.saveEditedColumnName();
    });

    this.shadowRoot.querySelector(".edit-column-name").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.saveEditedColumnName();
    });
    this.shadowRoot.querySelector(".edit-column-name").addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeEditColumnForm();
    });

    this.shadowRoot.querySelector(".delete-btn").addEventListener("click", () => {
      this.deleteColumn();
    });
  }
}

customElements.define('kanban-column', Column);