// required content
const tabsContainer = document.getElementById("tabs");
const contentContainer = document.getElementById("content");
const urlBar = document.getElementById("url-bar");
const reloadOrStop = document.getElementById("reloadOrStop");
let draggedTab = null; // store
const currentDir = window.api.dirname();
const browserVersion = "v0.1_alpha";
const linkPreview = document.getElementById("link-preview");

// user preferences
let userDefaultEngine = "N/A";
let historySave = null;

// get user preferences
userDefaultEngine = localStorage.getItem("defaultEngine");
if (userDefaultEngine === null) {
   addTab("https://www.startpage.com/");
} else {
   addTab(userDefaultEngine);

   if (userDefaultEngine === "https://www.startpage.com/") {
      document.getElementById("search-engine").selectedIndex = 0;
   } else if (userDefaultEngine === "https://www.qwant.com/") {
      document.getElementById("search-engine").selectedIndex = 1;
   } else if (userDefaultEngine === "https://www.google.com/") {
      document.getElementById("search-engine").selectedIndex = 2;
   } else if (userDefaultEngine === "https://www.bing.com/") {
      document.getElementById("search-engine").selectedIndex = 3;
   } else if (userDefaultEngine === "https://search.yahoo.com/") {
      document.getElementById("search-engine").selectedIndex = 4;
   }
}

userSaveHistory = localStorage.getItem("saveHistory");
console.log(userSaveHistory);
if (userSaveHistory === null) {
   saveHistory = true;
} else {
   if (userSaveHistory === "true") {
      saveHistory = true;
      document.getElementById("search-engine").selectedIndex = 0;
   } else {
      saveHistory = false;
      document.getElementById("history-pref").selectedIndex = 1;
   }
}

// show version
document.getElementById("browser-version").textContent = `Meowser ${browserVersion}`;

// tabs
function addTab(url) {
   const tab = document.createElement("div");
   tab.className = "tab";
   tab.dataset.url = url; // store URL for later use
   tab.draggable = true;

   const favicon = document.createElement("span");
   favicon.className = "tab-favicon";
   favicon.onerror = () => {
      //favicon.src = "https://www.google.com/s2/favicons?domain=https://katniny.vercel.app/";
      console.log("im tired boss");
   }; // fallback favicon in case of error

   const title = document.createElement("span");
   title.textContent = "New Tab"; // default to hostname if no title
   title.className = "tab-title";

   const closeButton = document.createElement("button");
   closeButton.textContent = "x";
   closeButton.className = "tab-close-button";
   closeButton.onclick = (event) => {
      event.stopPropagation(); // prevents triggering tab click event
      closeTab(tab);
   };

   tab.appendChild(favicon);
   tab.appendChild(title);
   tab.appendChild(closeButton);
   tab.onclick = () => switchTab(tab);

   // allow dragging of tabs
   tab.addEventListener("dragstart", handleDragStart);
   tab.addEventListener("dragover", handleDragOver);
   tab.addEventListener("drop", handleDrop);
   tab.addEventListener("dragend", handleDragEnd);

   // find the "new-tab" button and insert the new tab before it
   tabsContainer.insertBefore(tab, document.getElementById("new-tab"));

   // create a new webview
   const webview = document.createElement("webview");
   webview.src = url || userDefaultEngine;
   webview.style.display = "none";
   webview.style.width = "100%";
   webview.style.height = "100%";
   webview.setAttribute("webpreferences", "nativeWindowOpen=true");
   webview.setAttribute("allowpopups", "");

   webview.addEventListener("did-navigate", updateNavigationButtons);
   webview.addEventListener("did-navigate-in-page", updateNavigationButtons);

   // update the tab title when the webview's title changes
   webview.addEventListener("page-title-updated", (event) => {
      title.textContent = event.title || new URL(webview.src).hostname || "Fetching...";
      document.title = `${event.title} — Meowser`;
      //favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(webview.src).hostname}`;
   });

   webview.addEventListener("did-navigate", (event) => {
      urlBar.innerHTML = formatURL(event.url);
      addToHistory(event.url);
      console.log(event);
   });

   // check if the webview is currently loading
   webview.addEventListener("did-start-loading", () => {
      favicon.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
      reloadOrStop.className = `fa-solid fa-xmark fa-lg active`;
      reloadOrStop.setAttribute("onclick", "cancelLoading()");
   });

   webview.addEventListener("did-stop-loading", () => {
      if (!webview.src.startsWith("file:///")) {
         favicon.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${new URL(webview.src).hostname}" />`;
      } else {
         favicon.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=https://example.com" />`;
      }
      reloadOrStop.className = `fa-solid fa-rotate-right active`;
      reloadOrStop.setAttribute("onclick", "reload()");
   });

   contentContainer.appendChild(webview);

   // set data-index attribute to keep track of webview and tab index
   tab.dataset.index = contentContainer.children.length - 1;

   // automatically switch to the new tab
   setTimeout(() => {
      switchTab(tab);
   }, 40);
}

function switchTab(tab) {
   // skip if the clicked tab is the new tab button
   if (tab.classList.contains("new-tab")) return;

   // hide all webviews
   document.querySelectorAll("webview").forEach((wv) => (wv.style.display = "none"));

   // highlight the selected tab
   document.querySelectorAll(".tab").forEach((t) => (t.style.backgroundColor = "#1f1f1f"));
   tab.style.backgroundColor = "#333";

   // show the webview corresponding to the clicked tab using the data-index
   const index = tab.dataset.index;
   if (index !== undefined) {
      const webview = contentContainer.children[index];
      webview.style.display = "flex";
      setTimeout(() => {
         updateNavigationButtons();
         urlBar.innerHTML = formatURL(webview.getURL());
      }, 100);
   }
}

function closeTab(tab) {
   // skip if the tab is the new tab button
   if (tab.classList.contains("new-tab")) return;

   const index = tab.dataset.index;
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

// listen for open-url messages from the main process
// this will open a new tab when the web page requests one/a new window
window.api.handle("open-url", (event, url) => {
   addTab(url);
});

// initial tab
//addTab("https://www.google.com/"); // originally just so there was a tab, but now there's user prefs :p

// search or url
function changeCurrentTabUrl(newUrl) {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (newUrl.startsWith("meow://")) {
      // handle custom protocol
      const path = newUrl.replace("meow://", "");

      const staticHtmlPath = `file://${__dirname}/${path}.html`;
      if (currentWebview) {
         currentWebview.src = staticHtmlPath;
         urlBar.innerHTML = urlBar.innerHTML = formatURL(newUrl);;
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
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
            changeCurrentTabUrl(searchUrl);
         } else {
            const path = formattedInput.replace("meow://", "");

            // check if we need a popup or just display a webview.
            if (path !== "settings" && path !== "history" && path !== "developer-tools") {
               addTab(`file://${currentDir}/${path}.html`);
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

// format url bar
function formatURL(url) {
   try {
      const parsedURL = new URL(url);
      const protocol = parsedURL.protocol;
      const domain = parsedURL.hostname;
      const path = parsedURL.pathname + parsedURL.search + parsedURL.hash;

      if (!url.startsWith("file:///")) {
         return `<span class="non-domain">${protocol}//</span><span class="domain">${domain}</span><span class="non-domain">${path}</span>`;
      } else {
         const fileName = path.split("/").pop().split(".").slice(0, -1).join(".");
         return `<span class="non-domain">meow://</span><span>${fileName}</span>`;
      }
   } catch (e) {
      // if somehow it fails, just return the raw url :p
      return url;
   }
}

// allow user to go forward/back
function updateNavigationButtons() {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (currentWebview) {
      const backButton = document.getElementById("back-button");
      const forwardButton = document.getElementById("forward-button");

      // check if the webview can go back
      if (currentWebview.canGoBack()) {
         backButton.classList.add("active");
         backButton.disabled = false;
      } else {
         backButton.classList.remove("active");
         backButton.disabled = true;
      }

      // check if the webview can go forward
      if (currentWebview.canGoForward()) {
         forwardButton.classList.add("active");
         forwardButton.disabled = false;
      } else {
         forwardButton.classList.remove("active");
         forwardButton.disabled = true;
      }
   }
}

function goBack() {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (currentWebview && currentWebview.canGoBack()) {
      currentWebview.goBack();
   }
}

function goForward() {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (currentWebview && currentWebview.canGoForward()) {
      currentWebview.goForward();
   }
}

function reload() {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (currentWebview) {
      currentWebview.reload();
   }
}

function cancelLoading() {
   const currentWebview = Array.from(contentContainer.children).find((wv) => wv.style.display === "flex");

   if (currentWebview) {
      currentWebview.stop();
   }
}

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

// let users change their preferences
const searchEnginePref = document.getElementById("search-engine");
searchEnginePref.addEventListener("change", () => {
   const selectedEngine = searchEnginePref.options[searchEnginePref.selectedIndex].text;
   //console.log(selectedEngine);

   switch (selectedEngine) {
      case "Startpage":
         localStorage.setItem("defaultEngine", "https://www.startpage.com/");
         userDefaultEngine = "https://www.startpage.com/";
         break;
      case "Qwant":
         localStorage.setItem("defaultEngine", "https://www.qwant.com/");
         userDefaultEngine = "https://www.qwant.com/";
         break;
      case "Google":
         localStorage.setItem("defaultEngine", "https://www.google.com/");
         userDefaultEngine = "https://www.google.com/";
         break;
      case "Bing":
         localStorage.setItem("defaultEngine", "https://www.bing.com/");
         userDefaultEngine = "https://www.bing.com/";
         break;
      case "Yahoo":
         localStorage.setItem("defaultEngine", "https://search.yahoo.com/");
         userDefaultEngine = "https://search.yahoo.com/";
         break;
      default:
         localStorage.setItem("defaultEngine", "https://www.startpage.com/");
         userDefaultEngine = "https://www.startpage.com/";
         break;
   }
});

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

// :p
function test() {
   console.log("successful");
}

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

// allow users to edit whether their history is saved or not
const historyPref = document.getElementById("history-pref");
historyPref.addEventListener("change", () => {
   const selectedPref = historyPref.options[historyPref.selectedIndex].text;
   console.log(selectedPref);

   switch (selectedPref) {
      case "Remember history":
         localStorage.setItem("saveHistory", "true");
         historySave = true;
         break;
      case "Never remember history":
         localStorage.setItem("saveHistory", "false");
         historySave = false;
         break;
      default:
         localStorage.setItem("saveHistory", "true");
         historySave = true;
         break;
   }
});