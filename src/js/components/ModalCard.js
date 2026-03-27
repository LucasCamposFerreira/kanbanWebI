export class ModalCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentCard = null;
  }

  connectedCallback() {
    this.render();
    this.initEvents();
  }

  open(card) {
    this.currentCard = card;
    this.shadowRoot.querySelector(".title-input").value = card.title;
    this.shadowRoot.querySelector(".description-input").value = card.description || "";
    const overlay = this.shadowRoot.querySelector(".overlay");
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("visible"));
    this.shadowRoot.querySelector(".title-input").focus();
  }

  close() {
    const overlay = this.shadowRoot.querySelector(".overlay");
    overlay.classList.remove("visible");
    setTimeout(() => {
      overlay.style.display = "none";
      this.currentCard = null;
    }, 200);
  }

  initEvents() {
    const overlay = this.shadowRoot.querySelector(".overlay");
    const saveButton = this.shadowRoot.querySelector(".save-button");
    const deleteButton = this.shadowRoot.querySelector(".delete-button");
    const closeButton = this.shadowRoot.querySelector(".close-button");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    closeButton.addEventListener("click", () => this.close());

    saveButton.addEventListener("click", () => {
      const title = this.shadowRoot.querySelector(".title-input").value.trim();
      const description = this.shadowRoot.querySelector(".description-input").value.trim();
      if (!title) return;

      this.dispatchEvent(new CustomEvent("card-updated", {
        detail: { id: this.currentCard.id, title, description },
        bubbles: true,
        composed: true
      }));

      this.close();
    });

    deleteButton.addEventListener("click", () => {
      if (!confirm("Você tem certeza que deseja excluir este card?")) return;

      this.dispatchEvent(new CustomEvent("card-deleted", {
        detail: { id: this.currentCard.id },
        bubbles: true,
        composed: true
      }));

      this.close();
    });

    this.shadowRoot.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") saveButton.click();
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 100;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .overlay.visible { opacity: 1; }

        .modal {
          background: #1a1d27;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 0;
          width: 480px;
          max-width: 92vw;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          overflow: hidden;
          transform: translateY(0);
          transition: transform 0.2s ease;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .modal-title {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #5a5f7a;
        }

        .close-button {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.06);
          border: none;
          border-radius: 7px;
          color: #8b90a7;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .close-button:hover { background: rgba(255,255,255,0.12); color: #e8eaf0; }

        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field-group { display: flex; flex-direction: column; gap: 6px; }

        label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5a5f7a;
        }

        .title-input {
          width: 100%;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          padding: 10px 12px;
          background: #181b26;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #e8eaf0;
          outline: none;
          transition: border-color 0.15s;
        }

        .title-input:focus { border-color: rgba(99,102,241,0.6); }

        .description-input {
          width: 100%;
          height: 110px;
          font-family: inherit;
          font-size: 0.875rem;
          padding: 10px 12px;
          background: #181b26;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #c4c7d9;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s;
          line-height: 1.5;
        }

        .description-input::placeholder { color: #3f4561; }
        .description-input:focus { border-color: rgba(99,102,241,0.6); }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px 18px;
          border-top: 1px solid rgba(255,255,255,0.06);
          gap: 10px;
        }

        .shortcut-hint {
          font-size: 0.7rem;
          color: #3f4561;
        }

        .footer-actions { display: flex; gap: 8px; }

        .btn {
          padding: 8px 18px;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          transition: background 0.15s, transform 0.1s;
        }

        .btn:active { transform: scale(0.97); }

        .save-button { background: #6366f1; color: #fff; }
        .save-button:hover { background: #4f52d1; }

        .delete-button {
          background: transparent;
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.25);
        }

        .delete-button:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5); }

        @media (max-width: 600px) {
          .modal { max-width: 96vw; }
          .description-input { height: 90px; }
          .shortcut-hint { display: none; }
        }
      </style>

      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Editar cartão</span>
            <button class="close-button" title="Fechar (Esc)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="field-group">
              <label>Título</label>
              <input class="title-input" type="text" placeholder="Título do cartão...">
            </div>
            <div class="field-group">
              <label>Descrição</label>
              <textarea class="description-input" placeholder="Adicione uma descrição..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <div class="footer-actions">
              <button class="btn delete-button">Excluir</button>
              <button class="btn save-button">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('kanban-modal-card', ModalCard);