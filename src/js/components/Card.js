export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.handleDragStart = this.handleDragStart.bind(this);
  }

  handleDragStart(e) {
    const id = this.getAttribute("id");
    
    e.dataTransfer.setData("text/plain", id);
  }

  connectedCallback() {
    this.render();

    this.setAttribute("draggable", "true");
    this.addEventListener("dragstart", this.handleDragStart);
  }

  render() {
    const title = this.getAttribute("title") || "No title";
    const id = this.getAttribute("id") || "No id";
    const description = this.getAttribute("description") || "";

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
        cursor: pointer;
        font-family: sans-serif;
        pointer-events: all;
      }
      p {
        margin-top: 5px;
        font-size: 0.8rem;}
     </style>

     <div class="card" draggable="true" data-id="${id}">
       <span>${title}</span>
       <p>${description}</p>
     </div>
    `;

    this.shadowRoot.querySelector(".card").addEventListener("click", () => {
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