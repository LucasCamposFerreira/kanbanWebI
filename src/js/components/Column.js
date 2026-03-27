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
      container.style.background = "rgba(0,0,0,0.05)";
    });

    container.addEventListener("dragleave", () => {
      container.style.background = "transparent";
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.style.background = "transparent";

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

    addCardButton.addEventListener("click", () => {
      addCardButton.style.display = "none";
      newCardTitle.parentElement.style.display = "block";
      newCardTitle.focus();

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
      addCardButton.style.display = "block";
    });

    newCardTitle.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveCardButton.click();
      if (e.key === "Escape") {
        newCardTitle.value = "";
        addCardForm.style.display = "none";
        addCardButton.style.display = "block";
      }
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

    if (newName === oldName) {
      this.closeEditColumnForm();
      return;
    }

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
      h1, h2, h3, h4, h5, h6, p {
        padding: 0;
        margin: 0;
      }
      :host {
        display: block;
        width: 300px;
        margin: 10px;
      }
      .column {
        border-radius: 5px;
        padding: 15px;
        min-width: 250px;
        min-height: 60vh;
        box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
      }
      
      .column-title {
        font-size: 1.2em;
        margin: 0 0 10px 0;
        font-family: sans-serif;
      }
      .add-card {
        padding: .5rem;
        background: rgba(0,0,0,0.05);
        box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
        text-align: center;
        border-radius: 5px;
        cursor: pointer;
        font-family: sans-serif;
        width: 100%;
      }

      .add-card:hover {
        background: rgba(0,0,0,0.1);
      }

      .edit-column-buttons {
        display: flex;
        gap: .5rem;
        margin-bottom: 1rem;
      }

      .edit-column-buttons button {
        padding: 5px; 
        width: 100%;
        margin-top: 5px;
      }

      .save-column-name {
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      }

      .cancel-edit-column {
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      }

      .delete-column {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        :host {
          width: 100%;
          margin: 10px 0;
        }
      }
    </style>

    <div class="column" id="${id}">
      <h3 class="column-title">${title}</h3>
      <div class="edit-column" style="display:none;">
        <label>Editar nome da coluna</label>
        <input type="text" class="edit-column-name" style="width: 100%; padding: 5px; box-sizing: border-box; margin-bottom: 5px;">
        <div class="edit-column-buttons" style="display:none;">
          <button class="save-column-name" >Salvar</button>
          <button class="cancel-edit-column">Cancelar</button>
          <button class="delete-column">Excluir</button>
        </div>
      </div>
      <div class="items-container">
        <slot></slot>
      </div>
      <div class="add-card-container">
        <button class="add-card">Adicionar Card</button>
        <div class="add-card-form" style="display:none; margin-top: 10px;">
          <input type="text" class="new-card-title" placeholder="Escreva o título do card..." style="width: 100%; padding: 5px; box-sizing: border-box; margin-bottom: 5px;">
          <button class="save-card" style="padding: 5px; width: 100%;">Salvar</button>
        </div>
      </div>
    </div>
    `;

    this.shadowRoot.querySelector(".column-title").addEventListener("dblclick", () => {
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
      if (e.key === "Escape") this.closeEditColumnForm();
    });

    this.shadowRoot.querySelector(".delete-column").addEventListener("click", () => {
      this.deleteColumn();
    });
  }
}

customElements.define('kanban-column', Column);