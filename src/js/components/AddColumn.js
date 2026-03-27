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
    const cancelColumnButton = this.shadowRoot.querySelector(".cancel-column");

    fab.addEventListener("click", (e) => {
      e.preventDefault();
      const isMenuOpen = fabMenu.classList.contains("open");
      fabMenu.classList.toggle("open", !isMenuOpen);
      fab.classList.toggle("active", !isMenuOpen);
    });

    btnNewColumn.addEventListener("click", () => {
      fabMenu.classList.remove("open");
      fab.classList.remove("active");
      addColumnForm.style.display = "block";
      newColumnName.focus();
    });

    btnNewBoard.addEventListener("click", () => {
      alert("A função de criar um Novo Quadro será implementada em breve!");
      fabMenu.classList.remove("open");
      fab.classList.remove("active");
    });

    saveColumnButton.addEventListener("click", () => {
      const name = newColumnName.value.trim();
      if (!name) return;
      const id = crypto.randomUUID();

      this.dispatchEvent(new CustomEvent("column-added", {
        detail: { id, name },
        bubbles: true,
        composed: true
      }));

      this.closeForm();
    });

    cancelColumnButton.addEventListener("click", () => {
      this.closeForm();
    });

    newColumnName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveColumnButton.click();
    });
    newColumnName.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeForm();
    });
  }

  closeForm() {
    const newColumnName = this.shadowRoot.querySelector(".new-column-name");
    const addColumnForm = this.shadowRoot.querySelector(".add-column-form");
    addColumnForm.style.display = "none";
    newColumnName.value = "";
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          display: block;
          width: 300px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        .add-column-form {
          display: none;
          background: #1a1d27;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 12px 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }

        .form-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5a5f7a;
          margin-bottom: 8px;
        }

        .new-column-name {
          width: 100%;
          padding: 8px 10px;
          background: #181b26;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          color: #e8eaf0;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
          margin-bottom: 10px;
        }

        .new-column-name:focus { border-color: rgba(99,102,241,0.6); }

        .form-actions { display: flex; gap: 6px; }

        .btn {
          padding: 7px 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          transition: background 0.15s, transform 0.1s;
          flex: 1;
        }

        .btn:active { transform: scale(0.97); }
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover { background: #4f52d1; }
        .btn-neutral { background: #3f4561; color: #e8eaf0; }
        .btn-neutral:hover { background: #4a506e; }

        .fab-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          z-index: 1000;
        }

        .fab-menu {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          opacity: 0;
          transform: translateY(10px) scale(0.95);
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .fab-menu.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .fab-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a1d27;
          color: #e8eaf0;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 10px 16px;
          border-radius: 99px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.83rem;
          font-weight: 600;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
          white-space: nowrap;
        }

        .fab-item:hover {
          background: #272b40;
          border-color: rgba(99,102,241,0.3);
          transform: translateX(-3px);
        }

        .fab-item-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .fab-item-icon.indigo { background: rgba(99,102,241,0.2); color: #a5b4fc; }
        .fab-item-icon.purple { background: rgba(139,92,246,0.2); color: #c4b5fd; }

        .fab {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          font-size: 24px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fab:hover {
          box-shadow: 0 6px 28px rgba(99,102,241,0.65), 0 4px 12px rgba(0,0,0,0.4);
          transform: scale(1.05);
        }

        .fab.active { transform: rotate(45deg) scale(1.05); }

        .fab svg { transition: transform 0.25s ease; pointer-events: none; }
      </style>

      <div class="add-column">
        <div class="add-column-form">
          <label class="form-label">Nova coluna</label>
          <input type="text" class="new-column-name" placeholder="Nome da coluna...">
          <div class="form-actions">
            <button class="btn btn-primary save-column">Adicionar</button>
            <button class="btn btn-neutral cancel-column">Cancelar</button>
          </div>
        </div>
      </div>

      <div class="fab-container">
        <div class="fab-menu">
          <button class="fab-item" id="btn-new-board">
            <span class="fab-item-icon purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            Novo Quadro
          </button>
          <button class="fab-item" id="btn-new-column">
            <span class="fab-item-icon indigo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            Nova Coluna
          </button>
        </div>
        <button class="fab" title="Adicionar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    `;
  }
}

customElements.define("add-column", AddColumn);