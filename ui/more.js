function showMoreMenu() {
   if (document.getElementById("show-more-info").style.display === "none" || document.getElementById("show-more-info").style.display === "") {
      document.getElementById("show-more-info").style.display = "block";
   } else {
      document.getElementById("show-more-info").style.display = "none";
   }
}

function openNewWindow() {
   window.new.openNewWindow();
}