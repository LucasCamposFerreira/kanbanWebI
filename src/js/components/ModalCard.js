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
    this.shadowRoot.querySelector(".overlay").style.display = "flex";
  }

  close() {
    this.shadowRoot.querySelector(".overlay").style.display = "none";
    this.currentCard = null;
  }

  initEvents() {
    const overlay = this.shadowRoot.querySelector(".overlay");
    const saveButton = this.shadowRoot.querySelector(".save-button");
    const deleteButton = this.shadowRoot.querySelector(".delete-button");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

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
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 100;
          align-items: center;
          justify-content: center;
        }
        .modalCard {
          background: #f4f5f7;
          border-radius: 8px;
          padding: 24px;
          width: 500px;
          max-width: 90vw;
          font-family: sans-serif;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #5e6c84;
          display: block;
          margin-bottom: 4px;
        }
        .title-input {
          width: 100%;
          font-size: 1rem;
          font-weight: 600;
          padding: 8px;
          border: 2px solid transparent;
          border-radius: 4px;
          background: white;
          box-sizing: border-box;
          outline: none;
          color: #172b4d;
        }
        .title-input:focus { border-color: #0079bf; }
        .description-input {
          width: 100%;
          height: 120px;
          padding: 8px;
          font-size: 0.9rem;
          border: 2px solid transparent;
          border-radius: 4px;
          background: white;
          box-sizing: border-box;
          resize: vertical;
          outline: none;
          font-family: sans-serif;
          color: #172b4d;
        }
        .description-input:focus { border-color: #0079bf; }
        .actions {
          display: flex;
          justify-content: space-between;
        }
        .save-button {
          background: #0079bf;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .save-button:hover { background: #006aa3; }
        .delete-button {
          background: #eb5a46;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        .delete-button:hover { background: #c9372c; }
        @media (max-width: 600px) {
          .modal {
            width: 95vw;
            padding: 16px;
          }
          .description-input {
            height: 100px;
          }
        }
      </style>

      <div class="overlay">
        <div class="modalCard">
          <div>
            <label>Título</label>
            <input class="title-input" type="text">
          </div>
          <div>
            <label>Descrição</label>
            <textarea class="description-input" placeholder="Adicione uma descrição..."></textarea>
          </div>
          <div class="actions">
            <button class="save-button">Salvar</button>
            <button class="delete-button">Remover card</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('kanban-modal-card', ModalCard);