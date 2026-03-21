export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }

  handleDragStart(e) {
    const id = this.getAttribute("id");
    
    e.dataTransfer.setData("text/plain", id);
    this.style.opacity = "0.5";
  }

  handleDragEnd() {
    this.style.opacity = "1";
  }

  connectedCallback() {
    this.render();

    this.setAttribute("draggable", "true");
    this.addEventListener("dragstart", this.handleDragStart);
    this.addEventListener("dragend", this.handleDragEnd);
  }

  render() {
    const title = this.getAttribute("title") || "No title";
    const id = this.getAttribute("id") || "No id";
    const description = this.getAttribute("description") || "No description";

    this.shadowRoot.innerHTML = `
     <style>
      h1, h2, h3, h4, h5, h6, p {
        padding: 0;
        margin: 0;
      }
      :host { display: block; margin-bottom: 10px; cursor: grab; }
      :host(:active) { cursor: grabbing; }
      .card {
        margin-bottom: .5rem;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 1px 15px rgba(0,0,0,.04),0 1px 6px rgba(0,0,0,.04);
        cursor: grab;
        font-family: sans-serif;
        pointer-events: none;
      }
     </style>

     <div class="card" draggable="true" data-id="${id}">
       <span>${title}</span>
       <p>${description}</p>
     </div>
    `;
  }
}

customElements.define('kanban-card', Card);