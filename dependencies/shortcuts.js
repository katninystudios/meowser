// keyboard shortcuts
// FIXME: these shortcuts will NOT work when a webview is selected.
document.addEventListener("keydown", (event) => {
   // open dev tools
   if (event.ctrlKey && event.shiftKey && event.key === "I") {
      event.preventDefault();
      event.stopPropagation();
      const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

      if (currentWebview) {
         currentWebview.openDevTools();
      }
   } else if (event.ctrlKey && event.key === "t") { // new tab
      addTab();
   }
}, true);