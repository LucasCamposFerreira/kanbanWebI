export class Sidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._expanded = false;
    this._hoverTimeout = null;
  }

  connectedCallback() {
    this.render();
    this.initEvents();
  }

  get expanded() { return this._expanded; }

  set expanded(val) {
    this._expanded = val;
    const nav = this.shadowRoot.querySelector(".nav");
    nav.classList.toggle("expanded", val);
    this.shadowRoot.querySelector(".toggle-btn").setAttribute("aria-expanded", val);
  }

  initEvents() {
    const nav = this.shadowRoot.querySelector(".nav");
    const toggleBtn = this.shadowRoot.querySelector(".toggle-btn");

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.expanded = !this._expanded;
    });

    nav.addEventListener("mouseenter", () => {
      clearTimeout(this._hoverTimeout);
      if (!this._expanded) this.expanded = true;
    });

    nav.addEventListener("mouseleave", () => {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = setTimeout(() => {
        if (this._expanded) this.expanded = false;
      }, 250);
    });

    this.shadowRoot.querySelector(".add-board-btn").addEventListener("click", () => {
      this._toggleAddForm(true);
    });

    this.shadowRoot.querySelector(".cancel-board").addEventListener("click", () => {
      this._toggleAddForm(false);
    });

    const saveBtn = this.shadowRoot.querySelector(".save-board");
    const input = this.shadowRoot.querySelector(".new-board-input");

    saveBtn.addEventListener("click", () => this._saveBoard());
    input.addEventListener("keypress", (e) => { if (e.key === "Enter") this._saveBoard(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") this._toggleAddForm(false); });
  }

  _toggleAddForm(show) {
    const form = this.shadowRoot.querySelector(".add-board-form");
    const btn = this.shadowRoot.querySelector(".add-board-btn");
    form.style.display = show ? "block" : "none";
    btn.style.display = show ? "none" : "flex";
    if (show) {
      if (!this._expanded) this.expanded = true;
      this.shadowRoot.querySelector(".new-board-input").focus();
    }
  }

  _saveBoard() {
    const input = this.shadowRoot.querySelector(".new-board-input");
    const name = input.value.trim();
    if (!name) return;

    const id = crypto.randomUUID();
    input.value = "";
    this._toggleAddForm(false);

    this.dispatchEvent(new CustomEvent("board-added", {
      detail: { id, name },
      bubbles: true,
      composed: true
    }));
  }

  addBoard(id, name, active = false) {
    const list = this.shadowRoot.querySelector(".boards-list");
    const item = document.createElement("button");
    item.className = "board-item" + (active ? " active" : "");
    item.dataset.id = id;
    item.innerHTML = `
      <span class="board-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </span>
      <span class="board-label">${name}</span>
    `;
    item.addEventListener("click", () => {
      this.setActiveBoard(id);
      this.dispatchEvent(new CustomEvent("board-selected", {
        detail: { id },
        bubbles: true,
        composed: true
      }));
    });
    list.appendChild(item);
  }

  setActiveBoard(id) {
    this.shadowRoot.querySelectorAll(".board-item").forEach(el => {
      el.classList.toggle("active", el.dataset.id === id);
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        display: block;
        height: 100vh;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }

      .nav {
        width: var(--nav-width-collapsed, 56px);
        height: 100vh;
        background: #13151f;
        border-right: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .nav.expanded { width: var(--nav-width-expanded, 220px); }

      .nav-header {
        display: flex;
        align-items: center;
        height: 56px;
        padding: 0 14px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        flex-shrink: 0;
        gap: 10px;
        overflow: hidden;
      }

      .toggle-btn {
        width: 28px;
        height: 28px;
        min-width: 28px;
        background: transparent;
        border: none;
        border-radius: 7px;
        color: #5a5f7a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
      }

      .toggle-btn:hover { background: rgba(255,255,255,0.07); color: #e8eaf0; }

      .nav-title {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #5a5f7a;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
      }

      .nav.expanded .nav-title { opacity: 1; }

      .nav-section {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-section::-webkit-scrollbar { width: 3px; }
      .nav-section::-webkit-scrollbar-track { background: transparent; }
      .nav-section::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 99px; }

      .section-label {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #3f4561;
        padding: 6px 8px 4px;
        white-space: nowrap;
        opacity: 0;
        height: 0;
        overflow: hidden;
        transition: opacity 0.15s, height 0.2s;
      }

      .nav.expanded .section-label { opacity: 1; height: 26px; }

      .boards-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .board-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #6b7194;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s, color 0.15s;
        overflow: hidden;
        white-space: nowrap;
      }

      .board-item:hover { background: rgba(255,255,255,0.05); color: #c4c7d9; }
      .board-item.active { background: rgba(99,102,241,0.15); color: #a5b4fc; }
      .board-item.active .board-icon { color: #6366f1; }

      .board-icon {
        width: 24px;
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 6px;
        background: rgba(255,255,255,0.04);
        transition: background 0.15s;
      }

      .board-item:hover .board-icon { background: rgba(255,255,255,0.07); }
      .board-item.active .board-icon { background: rgba(99,102,241,0.2); }

      .board-label {
        font-size: 0.83rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0;
        width: 0;
        transition: opacity 0.15s, width 0.2s;
      }

      .nav.expanded .board-label { opacity: 1; width: auto; }

      .nav-footer {
        padding: 8px;
        border-top: 1px solid rgba(255,255,255,0.05);
        flex-shrink: 0;
      }

      .add-board-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #5a5f7a;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s, color 0.15s;
        overflow: hidden;
        white-space: nowrap;
      }

      .add-board-btn:hover { background: rgba(99,102,241,0.1); color: #a5b4fc; }

      .add-icon {
        width: 24px;
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 6px;
        border: 1px dashed rgba(99,102,241,0.3);
        transition: border-color 0.15s;
      }

      .add-board-btn:hover .add-icon { border-color: rgba(99,102,241,0.6); }

      .add-board-label {
        font-size: 0.83rem;
        font-weight: 500;
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition: opacity 0.15s, width 0.2s;
      }

      .nav.expanded .add-board-label { opacity: 1; width: auto; }

      .add-board-form {
        display: none;
        padding: 4px 0 2px;
      }

      .new-board-input {
        width: 100%;
        padding: 7px 10px;
        background: #181b26;
        border: 1px solid rgba(99,102,241,0.4);
        border-radius: 7px;
        color: #e8eaf0;
        font-family: inherit;
        font-size: 0.82rem;
        outline: none;
        margin-bottom: 7px;
      }

      .new-board-input::placeholder { color: #3f4561; }
      .new-board-input:focus { border-color: rgba(99,102,241,0.7); }

      .form-actions { display: flex; gap: 5px; }

      .btn {
        flex: 1;
        padding: 6px 8px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.77rem;
        font-weight: 600;
        transition: background 0.15s;
      }

      .btn-primary { background: #6366f1; color: #fff; }
      .btn-primary:hover { background: #4f52d1; }
      .btn-muted { background: #3f4561; color: #e8eaf0; }
      .btn-muted:hover { background: #4a506e; }

      @media (max-width: 768px) {
        .nav { width: var(--nav-width-collapsed, 48px); }
        .nav.expanded { width: var(--nav-width-expanded, 200px); }
      }
    </style>

    <nav class="nav">
      <div class="nav-header">
        <button class="toggle-btn" title="Toggle menu" aria-expanded="false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span class="nav-title">Quadros</span>
      </div>

      <div class="nav-section">
        <span class="section-label">Meus Quadros</span>
        <div class="boards-list"></div>
      </div>

      <div class="nav-footer">
        <button class="add-board-btn">
          <span class="add-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </span>
          <span class="add-board-label">Novo quadro</span>
        </button>
        <div class="add-board-form">
          <input type="text" class="new-board-input" placeholder="Nome do quadro...">
          <div class="form-actions">
            <button class="btn btn-primary save-board">Criar</button>
            <button class="btn btn-muted cancel-board">Cancelar</button>
          </div>
        </div>
      </div>
    </nav>
    `;
  }
}

customElements.define('kanban-sidebar', Sidebar);