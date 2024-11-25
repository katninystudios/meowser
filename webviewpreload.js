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