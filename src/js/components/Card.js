export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.handleDragStart = this.handleDragStart.bind(this);
  }

  handleDragStart(e) {
    const id = this.getAttribute("id");
    e.dataTransfer.setData("text/plain", id);
    this.shadowRoot.querySelector(".card").classList.add("dragging");
    setTimeout(() => this.shadowRoot.querySelector(".card")?.classList.remove("dragging"), 0);
  }

  connectedCallback() {
    this.render();
    this.setAttribute("draggable", "true");
    this.addEventListener("dragstart", this.handleDragStart);
  }

  render() {
    const title = this.getAttribute("title") || "Sem título";
    const id = this.getAttribute("id") || "";
    const description = this.getAttribute("description") || "";

    this.shadowRoot.innerHTML = `
     <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        display: block;
        margin-bottom: 8px;
        cursor: grab;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }

      :host(:active) { cursor: grabbing; }

      .card {
        background: #21253a;
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px;
        padding: 11px 13px;
        transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        cursor: pointer;
      }

      .card:hover {
        background: #272b40;
        border-color: rgba(99,102,241,0.2);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }

      .card.dragging {
        opacity: 0.5;
        transform: rotate(2deg) scale(1.02);
      }

      .card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #e8eaf0;
        line-height: 1.4;
      }

      .card-description {
        margin-top: 5px;
        font-size: 0.775rem;
        color: #6b7194;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-top: 8px;
      }

      .edit-hint {
        font-size: 0.68rem;
        color: #3f4561;
        opacity: 0;
        transition: opacity 0.15s;
        letter-spacing: 0.03em;
      }

      .card:hover .edit-hint { opacity: 1; }
     </style>

     <div class="card" data-id="${id}">
       <p class="card-title">${title}</p>
       ${description ? `<p class="card-description">${description}</p>` : ''}
       <div class="card-footer">
         <span class="edit-hint">Duplo clique para editar</span>
       </div>
     </div>
    `;

    this.shadowRoot.querySelector(".card").addEventListener("dblclick", () => {
      this.dispatchEvent(new CustomEvent("card-clicked", {
        bubbles: true,
        composed: true,
        detail: {
          id: this.getAttribute("id"),
          title: this.getAttribute("title"),
          description: this.getAttribute("description") || ""
        }
      }));
    });
  }
}

customElements.define('kanban-card', Card);