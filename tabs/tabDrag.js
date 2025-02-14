// dragging tabs
function handleDragStart(event) {
   draggedTab = this;
   event.dataTransfer.effectAllowed = "move";
   this.style.opacity = "0.5";
}

function handleDragOver(event) {
   event.preventDefault();
   event.dataTransfer.dropEffect = "move";
}

function handleDrop(event) {
   event.preventDefault();
   if (draggedTab !== this) {
      // move the dragged tab before the one it was dropped onto
      tabsContainer.insertBefore(draggedTab, this);

      // update the corresponding webviews to reflect the new order
      const draggedTabIndex = [...tabsContainer.children].indexOf(draggedTab);
      const droppedTabIndex = [...tabsContainer.children].indexOf(this);

      // swap the webviews in contentContainer
      const draggedWebview = contentContainer.children[draggedTabIndex];
      const droppedWebview = contentContainer.children[droppedTabIndex];
      contentContainer.insertBefore(draggedWebview, droppedWebview);
   }
   return false;
}

function handleDragEnd(event) {
   this.style.opacity = "";
   draggedTab = null;
}