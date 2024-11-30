const { ipcRenderer } = require("electron");

// find the closest parent <a> tag
function getClosestAnchor(element) {
   while (element && element.tagName !== "A") {
      element = element.parentElement;
   }
   return element;
}

document.addEventListener("mouseover", (event) => {
   const anchor = getClosestAnchor(event.target);
   if (anchor && anchor.href) {
      ipcRenderer.sendToHost("link-hover", anchor.href);
   }
});

document.addEventListener("mouseout", (event) => {
   const anchor = getClosestAnchor(event.target);
   if (anchor) {
      ipcRenderer.sendToHost("link-unhover");
   }
});

// context menus
document.addEventListener("contextmenu", (event) => {
   event.preventDefault();

   // send stuff about the element to the main process
   const elementDetails = {
      tagName: event.target.tagName,
      textContent: event.target.textContent.trim(),
      attributes: Array.from(event.target.attributes).reduce((attrs, attr) => {
         attrs[attr.name] = attr.value;
         return attrs;
      }, {}),
      x: event.clientX,
      y: event.clientY,
   };
   ipcRenderer.sendToHost("custom-contextmenu", elementDetails);
});

document.addEventListener("mousedown", () => {
   ipcRenderer.sendToHost("hide-contextmenu");
});