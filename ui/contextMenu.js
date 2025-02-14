// create context menu
const contextMenu = document.createElement("div");
contextMenu.style = `
   position: absolute;
   display: none;
   background: var(--controls);
   border: 1px solid transparent;
   z-index: 1000;
   box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
   padding: 8px 0;
   border-radius: 15px;
`
document.body.appendChild(contextMenu);