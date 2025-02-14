// search or url
function changeCurrentTabUrl(newUrl) {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (newUrl.startsWith("meow://")) {
      // handle custom protocol
      const path = newUrl.replace("meow://", "");

      const staticHtmlPath = `file://${__dirname}/${path}.html`;
      if (currentWebview) {
         currentWebview.src = staticHtmlPath;
         urlBar.innerHTML = urlBar.innerHTML = formatURL(newUrl);
      }
   } else {
      if (currentWebview) {
         currentWebview.src = newUrl;
         urlBar.innerHTML = urlBar.innerHTML = formatURL(newUrl);
      }
   }
}

urlBar.addEventListener("keydown", (event) => {
   if (event.key === "Enter") {
      const input = urlBar.textContent.trim();
      let formattedInput;

      // check if input starts with a valid protocol
      if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("file://") || input.startsWith("meow://")) {
         formattedInput = input;
      } else {
         // add https:// if no protocol is provided
         formattedInput = `https://${input}`;
      }

      try {
         // try creating a new url object to validate the formatted input
         const url = new URL(formattedInput);

         // check if the urls protocol is valid
         if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:" || url.protocol === "meow:") {
            // ensure the URL has a valid hostname
            if (url.hostname && url.hostname.includes(".")) {
               console.log(`formattedInput: ${formattedInput}`);
               changeCurrentTabUrl(formattedInput);
            } else {
               throw new Error("Invalid hostname");
            }
         }
      } catch (e) {
         const url = new URL(formattedInput); // we need this again :pensive:

         // if creating a url fails or hostname is invalid, treat input as a search term
         if (url.protocol !== "meow:") {
            if (userDefaultEngine === "https://www.startpage.com/") {
               changeCurrentTabUrl(`https://www.startpage.com/sp/search?q=${encodeURIComponent(input)}`);
            } else if (userDefaultEngine === "https://www.qwant.com/") {
               changeCurrentTabUrl(`https://www.qwant.com/?q=${encodeURIComponent(input)}`);
            } else if (userDefaultEngine === "https://www.google.com/") {
               changeCurrentTabUrl(`https://www.google.com/search?q=${encodeURIComponent(input)}`);
            } else if (userDefaultEngine === "https://www.bing.com/") {
               changeCurrentTabUrl(`https://www.bing.com/search?q=${encodeURIComponent(input)}`);
            } else if (userDefaultEngine === null) {
               changeCurrentTabUrl(`https://www.startpage.com/sp/search?q=${encodeURIComponent(input)}`);
            }
         } else {
            const path = formattedInput.replace("meow://", "");

            // check if we need a popup or just display a webview.
            if (path !== "history" && path !== "developer-tools") {
               changeCurrentTabUrl(`file://${currentDir}/${path}.html`);
            } else if (path === "settings") {
               document.getElementById("settings").showModal();
            } else if (path === "history") {
               const displayHistory = document.getElementById("display-history");
               document.getElementById("history").showModal();
               displayHistory.innerHTML = "";

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
            } else if (path === "developer-tools") {
               const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

               if (currentWebview) {
                  currentWebview.openDevTools();
               }
            }
         }
      }
   }
});