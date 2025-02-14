function switchTab(tab) {
   // skip if the clicked tab is the new tab button
   if (tab.classList.contains("new-tab")) return;

   // hide all webviews
   document.querySelectorAll("webview").forEach((wv) => (wv.style.display = "none"));

   // highlight the selected tab
   document.querySelectorAll(".tab").forEach((t) => (t.style.backgroundColor = "var(--tab-background-unselected)"));
   tab.style.backgroundColor = "var(--tab-background)";

   // show the webview corresponding to the clicked tab using the data-index
   const index = tab.dataset.index;
   if (index !== undefined) {
      const webview = contentContainer.children[index];
      webview.style.display = "flex";
      setTimeout(() => {
         updateNavigationButtons();
         urlBar.innerHTML = formatURL(webview.getURL());
         addBookmarkUrl.value = webview.getURL();
         checkSiteSecurity(webview.getURL());
      }, 100);
   }
}