// save history
function addToHistory(url) {
   if (historySave === null || historySave === true) {
      let storedItems = localStorage.getItem("history");

      if (!storedItems) {
         storedItems = [];
      } else {
         storedItems = JSON.parse(storedItems);
      }

      if (Array.isArray(storedItems)) {
         storedItems.push(url);
      } else {
         console.error("stored history is somehow not an array. pls fix me.");
      }

      localStorage.setItem("history", JSON.stringify(storedItems));
   }
}