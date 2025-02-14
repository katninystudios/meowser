// delete history
function deleteHistory() {
   localStorage.removeItem("history"); // removes all the history

   // i stole my own code (gasp)
   const displayHistory = document.getElementById("display-history");
   document.getElementById("history").showModal();
   displayHistory.innerHTML = "";
   document.getElementById("delete-history").close();

   // display history
   let history = localStorage.getItem("history");
   if (history) {
      history = JSON.parse(history);

      history.forEach(item => {
         const div = document.createElement("div");
         div.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${item}" draggable="false" /> <a href="javascript:void(0);" onclick="addTab('${item}')">${item}</a>`;
         displayHistory.appendChild(div);
      })
   } else {
      displayHistory.innerHTML = "You have no history yet. Start browsing!";
   }
}