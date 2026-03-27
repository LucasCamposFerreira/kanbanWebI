export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._touchStartX = 0;
    this._touchStartY = 0;
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  // ── Drag (desktop) ──────────────────────────────────────────────────────────

  handleDragStart(e) {
    e.dataTransfer.setData("text/plain", this.getAttribute("id"));
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => this.shadowRoot.querySelector(".card")?.classList.add("dragging"), 0);
  }

  // ── Touch (mobile) ──────────────────────────────────────────────────────────

  handleTouchStart(e) {
    const t = e.touches[0];
    this._touchStartX = t.clientX;
    this._touchStartY = t.clientY;
    this._touchMoved = false;
    this._touchTimer = setTimeout(() => {
      this._touchActive = true;
      this.shadowRoot.querySelector(".card")?.classList.add("dragging");
    }, 200);
  }

  handleTouchMove(e) {
    if (!this._touchActive) { clearTimeout(this._touchTimer); return; }
    e.preventDefault();

    this._touchMoved = true;
    const t = e.touches[0];
    const el = this.shadowRoot.querySelector(".card");
    el.style.position = "fixed";
    el.style.zIndex = "9999";
    el.style.left = (t.clientX - el.offsetWidth / 2) + "px";
    el.style.top = (t.clientY - el.offsetHeight / 2) + "px";
    el.style.width = "260px";
    el.style.pointerEvents = "none";
  }

  handleTouchEnd(e) {
    clearTimeout(this._touchTimer);
    const el = this.shadowRoot.querySelector(".card");
    el.classList.remove("dragging");
    el.style.position = "";
    el.style.zIndex = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.pointerEvents = "";

    if (!this._touchActive) { this._touchActive = false; return; }
    this._touchActive = false;

    const t = e.changedTouches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY);

    // Walk up shadow DOM to find kanban-column
    let col = target;
    while (col && col.tagName !== "KANBAN-COLUMN") {
      col = col.parentElement || col.getRootNode()?.host;
    }

    if (col && col.tagName === "KANBAN-COLUMN") {
      const toColumnId = col.getAttribute("id");
      this.dispatchEvent(new CustomEvent("card-moved", {
        detail: { cardId: this.getAttribute("id"), toColumnId },
        bubbles: true,
        composed: true
      }));
    }
  }

  connectedCallback() {
    this.render();
    this.setAttribute("draggable", "true");
    this.addEventListener("dragstart", this.handleDragStart);
    this.addEventListener("dragend", () => {
      this.shadowRoot.querySelector(".card")?.classList.remove("dragging");
    });
    this.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    this.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.addEventListener("touchend", this.handleTouchEnd);
  }

  // ── Color legend ────────────────────────────────────────────────────────────

  static colorMap = {
    null:          { label: "Padrão",       bar: "transparent",          badge: "transparent",    text: "transparent" },
    "":            { label: "Padrão",       bar: "transparent",          badge: "transparent",    text: "transparent" },
    "blue":        { label: "Em progresso", bar: "#3b82f6",              badge: "rgba(59,130,246,0.15)",  text: "#93c5fd" },
    "green":       { label: "Concluído",    bar: "#10b981",              badge: "rgba(16,185,129,0.15)",  text: "#6ee7b7" },
    "yellow":      { label: "Revisão",      bar: "#f59e0b",              badge: "rgba(245,158,11,0.15)",  text: "#fcd34d" },
    "red":         { label: "Bloqueado",    bar: "#ef4444",              badge: "rgba(239,68,68,0.15)",   text: "#fca5a5" },
    "purple":      { label: "Planejado",    bar: "#8b5cf6",              badge: "rgba(139,92,246,0.15)",  text: "#c4b5fd" },
    "orange":      { label: "Em risco",     bar: "#f97316",              badge: "rgba(249,115,22,0.15)",  text: "#fdba74" },
  };

  render() {
    const title = this.getAttribute("title") || "Sem título";
    const id = this.getAttribute("id") || "";
    const description = this.getAttribute("description") || "";
    const colorKey = this.getAttribute("color") || "";
    const c = Card.colorMap[colorKey] ?? Card.colorMap[""];

    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        display: block;
        margin-bottom: 6px;
        margin-left: 4px;
        margin-right: 4px;
        cursor: grab;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      }

      :host(:active) { cursor: grabbing; }

      .card {
        background: #21253a;
        border: 1px solid rgba(255,255,255,0.06);
        border-left: 3px solid ${c.bar === "transparent" ? "rgba(255,255,255,0.06)" : c.bar};
        border-radius: 10px;
        padding: 10px 12px;
        transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        cursor: pointer;
      }

      .card:hover {
        background: #272b40;
        border-color: rgba(99,102,241,0.2);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
      }

      .card.dragging { opacity: 0.45; transform: rotate(1.5deg) scale(1.02); }

      .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }

      .card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #e8eaf0;
        line-height: 1.4;
        flex: 1;
      }

      ${c.badge !== "transparent" ? `
      .color-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.68rem;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 99px;
        background: ${c.badge};
        color: ${c.text};
        white-space: nowrap;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .color-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${c.bar};
        flex-shrink: 0;
      }
      ` : ".color-badge { display: none; }"}

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
        margin-top: 6px;
      }

      .edit-hint {
        font-size: 0.68rem;
        color: #3f4561;
        opacity: 0;
        transition: opacity 0.15s;
      }

      .card:hover .edit-hint { opacity: 1; }
    </style>

    <div class="card" data-id="${id}">
      <div class="card-header">
        <p class="card-title">${title}</p>
        ${c.badge !== "transparent" ? `
        <span class="color-badge">
          <span class="color-dot"></span>
          ${c.label}
        </span>` : ""}
      </div>
      ${description ? `<p class="card-description">${description}</p>` : ""}
      <div class="card-footer">
        <span class="edit-hint">duplo clique para editar</span>
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