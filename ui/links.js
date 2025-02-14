// listen to link hovers
window.link.on("update-hovered-link", (href) => {
   const linkStatus = document.getElementById("link-status");
   if (linkStatus) {
      linkStatus.textContent = href;
      linkStatus.style.opacity = "1";
   }
});

window.link.on("clear-hovered-link", () => {
   const linkStatus = document.getElementById("link-status");
   if (linkStatus) {
      linkStatus.textContent = "";
      linkStatus.style.opacity = "0";
   }
});