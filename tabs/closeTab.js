function closeTab(tab) {
   // skip if the tab is the new tab button
   if (tab.classList.contains("new-tab")) return;

   const index = tab.dataset.index;
   if (tabs.children.length - 1 === 1) { // if there's only one tab left, close the window
      window.close();
   }

   if (index !== undefined) {
      tabsContainer.removeChild(tab);

      if (contentContainer.children[index]) {
         contentContainer.removeChild(contentContainer.children[index]);
      }

      // update data-index for all remaining tabs except the "new-tab" button
      document.querySelectorAll(".tab:not(.new-tab)").forEach((t, i) => (t.dataset.index = i));

      if (tabsContainer.children.length > 1) { // avoid selecting the new-tab button
         const newIndex = Math.min(index, tabsContainer.children.length - 2);
         switchTab(tabsContainer.children[newIndex]);
      }
   }
}