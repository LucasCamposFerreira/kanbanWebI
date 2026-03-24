export class AddColumn extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.initFormEvents();
  }

  initFormEvents() {
    const addColumnButton = this.shadowRoot.querySelector(".add-column-button");
    const addColumnForm = this.shadowRoot.querySelector(".add-column-form");
    const newColumnName = this.shadowRoot.querySelector(".new-column-name");
    const saveColumnButton = this.shadowRoot.querySelector(".save-column");

    addColumnButton.addEventListener("click", () => {
      addColumnButton.style.display = "none";
      addColumnForm.style.display = "block";
      newColumnName.focus();
    });

    saveColumnButton.addEventListener("click", () => {
      const name = newColumnName.value.trim();
      
      if (!name) return;
      const id = crypto.randomUUID();

      this.addColumn(name, id);

      this.dispatchEvent(new CustomEvent("column-added", {
        detail: { id, name },
        bubbles: true,
        composed: true
      }));

      this.closeForm();
    });
  }

  addColumn(name, id) {
    const columnEl = document.createElement("kanban-column");
    columnEl.setAttribute("name", name);
    columnEl.setAttribute("id", id);
    board.insertBefore(columnEl, this);
  }

  closeForm() {
    const addColumnButton = this.shadowRoot.querySelector(".add-column-button");
    const newColumnName = this.shadowRoot.querySelector(".new-column-name");
    const addColumnForm = this.shadowRoot.querySelector(".add-column-form");

    addColumnButton.style.display = "block";
    addColumnForm.style.display = "none";
    newColumnName.value = "";
  }

  render() {
    this.shadowRoot.innerHTML = `
     <style>
      :host {
        display: block;
        width: 300px;
        margin: 10px;
      } 
      .add-column {
        width: 100%;
        cursor: pointer;
        font-family: sans-serif;
      }
      .add-column-form {
        border-radius: 5px;
        padding: 15px;
        box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
      }
      .add-column-button{
        padding: .5rem;
        box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
        text-align: center;
        border-radius: 5px;
        cursor: pointer;
        font-family: sans-serif;
        width: 100%;
      }
      .add-column-button:hover {
        background: rgba(0,0,0,0.1);
      }
     </style>
     <div class="add-column">
       <button class="add-column-button">Adicionar Coluna</button>
       <div class="add-column-form" style="display:none;">
         <input type="text" class="new-column-name" placeholder="Escreva o nome da coluna..." style="width: 100%; padding: 5px; box-sizing: border-box; margin-bottom: 5px;">
         <button class="save-column" style="padding: 5px; width: 100%;">Salvar</button>
       </div>
     </div>
    `;
  }
}

customElements.define("add-column", AddColumn);