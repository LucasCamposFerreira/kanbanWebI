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
    const fab = this.shadowRoot.querySelector(".fab");
    const fabMenu = this.shadowRoot.querySelector(".fab-menu");
    const btnNewColumn = this.shadowRoot.querySelector("#btn-new-column");
    const btnNewBoard = this.shadowRoot.querySelector("#btn-new-board");
    
    const addColumnForm = this.shadowRoot.querySelector(".add-column-form");
    const newColumnName = this.shadowRoot.querySelector(".new-column-name");
    const saveColumnButton = this.shadowRoot.querySelector(".save-column");

    // Lógica para abrir/fechar o menu do FAB
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      const isMenuOpen = fabMenu.style.display === "flex";
      fabMenu.style.display = isMenuOpen ? "none" : "flex";
      // Animação simples de rotação no botão principal
      fab.style.transform = isMenuOpen ? "rotate(0deg)" : "rotate(45deg)";
    });

    // Ação do botão "Nova Coluna" no menu do FAB
    btnNewColumn.addEventListener("click", () => {
      fabMenu.style.display = "none";
      fab.style.transform = "rotate(0deg)";
      
      // Exibe o formulário que fica no fluxo da tela
      addColumnForm.style.display = "block";
      newColumnName.focus();
    });

    // Ação do botão "Novo Quadro" (Mock)
    btnNewBoard.addEventListener("click", () => {
      alert("A função de criar um Novo Quadro será implementada em breve!");
      fabMenu.style.display = "none";
      fab.style.transform = "rotate(0deg)";
    });

    // Lógica original de salvar a coluna
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
    
    // Supondo que 'board' é uma variável global ou acessível no seu escopo
    board.insertBefore(columnEl, this);
  }

  closeForm() {
    const newColumnName = this.shadowRoot.querySelector(".new-column-name");
    const addColumnForm = this.shadowRoot.querySelector(".add-column-form");

    // Apenas esconde o formulário e limpa o input
    addColumnForm.style.display = "none";
    newColumnName.value = "";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
       :host {
         display: block;
         width: 100%;
         height: 100%;
       } 
       .add-column {
         width: 100%;
         font-family: sans-serif;
       }
       .add-column-form {
         border-radius: 5px;
         padding: 15px;
         background: white;
         box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
       }
       
       /* Estilos do FAB e do Menu */
       .fab-container {
         position: fixed;
         bottom: 90px;
         right: 20px;
         display: flex;
         flex-direction: column;
         align-items: flex-end;
         gap: 15px;
         z-index: 1000;
       }
       .fab-menu {
         display: flex;
         flex-direction: column;
         align-items: flex-end;
         gap: 10px;
       }
       .fab-item {
         background-color: white;
         color: #333;
         border: none;
         padding: 12px 20px;
         border-radius: 24px;
         box-shadow: 0 2px 10px rgba(0,0,0,0.2);
         cursor: pointer;
         font-family: sans-serif;
         font-size: 14px;
         font-weight: bold;
         transition: background-color 0.2s;
       }
       .fab-item:hover {
         background-color: #f0f0f0;
       }
       .fab {
         position: fixed;
         bottom: 20px;
         right: 20px; 
         width: 60px;
         height: 60px;
         background-color: #007bff;
         color: white;
         border: none;
         border-radius: 50%;
         text-align: center;
         font-size: 30px;
         line-height: 60px;
         box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
         cursor: pointer;
         transition: transform 0.3s ease, background-color 0.3s;
         display: flex;
         align-items: center;
         justify-content: center;
       }
       .fab:hover {
         background-color: #0056b3;
       }
      </style>
      
      <div class="add-column">
        <div class="add-column-form" style="display:none;">
          <input type="text" class="new-column-name" placeholder="Escreva o nome da coluna..." style="width: 100%; padding: 8px; box-sizing: border-box; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
          <button class="save-column" style="padding: 8px; width: 100%; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvar Coluna</button>
        </div>
      </div>

      <div class="fab-container">
        <div class="fab-menu" style="display: none;">
          <button class="fab-item" id="btn-new-board">Novo Quadro</button>
          <button class="fab-item" id="btn-new-column">Nova Coluna</button>
        </div>
        <button class="fab">+</button>
      </div>
    `;
  }
}

customElements.define("add-column", AddColumn);