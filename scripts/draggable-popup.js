export default class DraggablePopup {
  constructor(title, closable = true) {
    this.mainElement = document.createElement("div");
    this.mainElement.className = "ezr-main";

    this.titleBar = this.mainElement.addElement("div", {
      className: "ezr-title-bar",
      textContent: title,
    });

    this.initDrag();

    this.contentElement = this.mainElement.addElement("div", {
      className: "ezr-content",
    });

    if (closable) {
      this.closeListeners = [];

      this.mainElement.classList.add("centered");

      this.mainElement.addElement("span", {
        className: "ezr-x-button",
        textContent: "X",
        onclick: this.remove.bind(this),
      });
    }

    document.body.appendChild(this.mainElement);
  }

  initDrag() {
    let lastX, lastY, diffX, diffY, newX, newY;

    this.titleBar.addEventListener("mousedown", (event) => {
      lastX = event.clientX;
      lastY = event.clientY;

      this.isDragging = true;
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    window.addEventListener("blur", () => {
      this.isDragging = false;
    });

    window.addEventListener("mousemove", (event) => {
      if (!this.isDragging) return;

      event.preventDefault();

      newX = event.clientX;
      newY = event.clientY;
      diffX = newX - lastX;
      diffY = newY - lastY;
      lastX = newX;
      lastY = newY;

      this.mainElement.style.top = this.mainElement.offsetTop + diffY + "px";
      this.mainElement.style.left = this.mainElement.offsetLeft + diffX + "px";
    });
  }

  clear() {
    this.contentElement.innerHTML = "";
  }

  remove() {
    for (let listener of this.closeListeners) {
      listener();
    }
    this.mainElement.remove();
  }
}
