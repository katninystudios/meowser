// required content
const tabsContainer = document.getElementById("tabs");
const contentContainer = document.getElementById("content");
const urlBar = document.getElementById("url-bar");
const reloadOrStop = document.getElementById("reloadOrStop");
let draggedTab = null; // store
const currentDir = window.api.dirname();
const browserVersion = "v0.2.0_alpha";
const linkPreview = document.getElementById("link-preview");
const siteSecurity = document.getElementById("site-security");
const siteSecurityInfo_container = document.getElementById("site-security-info");
const siteSecurityInfoDesc = document.getElementById("site-security-link");
const bookmarksBar = document.getElementById("bookmarks-bar");
const addBookmarkUrl = document.getElementById("bookmark-url");

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

// user preferences
let userDefaultEngine = "N/A";
let historySave = null;
let haveUsedBrowser = null;
let hasSeenNewUpdate = null;

// get user preferences
haveUsedBrowser = localStorage.getItem("browserUsed");
hasSeenNewUpdate = localStorage.getItem(`hasSeen${browserVersion}Logs`);

userDefaultEngine = localStorage.getItem("defaultEngine");
if (userDefaultEngine === null) {
   addTab();
} else {
   addTab();
}

userSaveHistory = localStorage.getItem("saveHistory");
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

   const audio = document.createElement("small");
   audio.textContent = "PLAYING";
   audio.className = "tab-audio";

   const closeButton = document.createElement("button");
   closeButton.textContent = "x";
   closeButton.className = "tab-close-button";
   closeButton.onclick = (event) => {
      event.stopPropagation(); // prevents triggering tab click event
      closeTab(tab);
   };

   tab.appendChild(favicon);
   tab.appendChild(title);
   tab.appendChild(document.createElement("br"));
   tab.appendChild(audio);
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
   if (haveUsedBrowser !== null) {
      webview.src = url || `file:///${currentDir}/new-tab.html`;
   } else {
      webview.src = `file:///${currentDir}/welcome.html`;
      localStorage.setItem("browserUsed", true);
      haveUsedBrowser = true;
   }

   if (hasSeenNewUpdate === null && haveUsedBrowser !== null) {
      webview.src = "https://katniny.github.io/meowser/release-notes?meowserUpdated=1";
      hasSeenNewUpdate = true;
      localStorage.setItem(`hasSeen${browserVersion}Logs`, true);
   } else if (hasSeenNewUpdate === null  && haveUsedBrowser === null) {
      hasSeenNewUpdate = true;
      localStorage.setItem(`hasSeen${browserVersion}Logs`, true); // no need. they're new anyways lol
   }

   webview.style.display = "none";
   webview.style.width = "100%";
   webview.style.height = "100%";
   webview.setAttribute("webpreferences", "nativeWindowOpen=true");
   webview.setAttribute("allowpopups", "");
   webview.setAttribute("preload", "webviewpreload.js");

   // detect when a link is hovered in a webview
   let clearTextTimeout; 

   webview.addEventListener("ipc-message", (event) => {
      const linkStatus = document.getElementById("link-status");
   
      if (event.channel === "link-hover" && linkStatus) {
         clearTimeout(clearTextTimeout);
         linkStatus.textContent = event.args[0];
         linkStatus.style.opacity = "1";
      } else if (event.channel === "link-unhover" && linkStatus) {
         linkStatus.style.opacity = "0";
         clearTextTimeout = setTimeout(() => {
            linkStatus.textContent = "";
         }, 500);
      }

      // context menu
      function resolveUrl(base, relative) {
         try {
            return new URL(relative, base).href;
         } catch {
            return relative; // return as-is if it cant be resolved for some reason
         }
      }

      if (event.channel === "custom-contextmenu") {
         const { tagName, textContent, attributes, x, y } = event.args[0];

         contextMenu.innerHTML = "";

         // add menu options based on the element type
         if (tagName === "A" && attributes.href) {
            const fullHref = resolveUrl(webview.src, attributes.href);
            addMenuOption("Open Link in New Tab", () => addTab(fullHref));

            addMenuOption("Copy Link Address", () => {
               navigator.clipboard.writeText(fullHref).then(() => {
                  console.log(`Copied to clipboard: ${fullHref}`);
               }).catch(err => {
                  console.error("failed to copy text: ", err);
               });
            });

         } else if (tagName === "IMG" && attributes.src) {
            const fullHref = resolveUrl(webview.src, attributes.src);
            addMenuOption("Open Image in New Tab", () => addTab(fullHref));
            addMenuOption("Save Image As...", () => console.log(`Save: ${fullHref}`));
            addMenuOption("Copy Image Address", () => {
               navigator.clipboard.writeText(fullHref).then(() => {
                  console.log(`Copied to clipboard: ${fullHref}`);
               }).catch(err => {
                  console.error("failed to copy text: ", err);
               });
            });
         } else {
            addMenuOption("Copy Text", () => console.log(`Copy: ${textContent}`));
         }

         addMenuOption("Inspect Element", () => webview.openDevTools());

         // show context menu at cursor position
         contextMenu.style.left = `${x}px`;
         contextMenu.style.top = `${y}px`;
         contextMenu.style.display = "block";
      }
   });
   
   // add a menu item
   function addMenuOption(label, callback) {
      const item = document.createElement("div");
      item.textContent = label;
      item.style = `
         padding: 8px 16px;
         cursor: pointer;
         font-size: 14px;
         white-space: nowrap;
      `;
      item.addEventListener("click", () => {
         callback();
         contextMenu.style.display = "none";
      });
      item.addEventListener("mouseenter", () => {
         item.style.backgroundColor = "var(--controls-icon-hover)";
      });
      item.addEventListener("mouseleave", () => {
         item.style.backgroundColor = "transparent";
      });
      contextMenu.appendChild(item);
   }

   // hide when clicking elsewhere
   document.addEventListener("mousedown", (event) => {
      if (!contextMenu.contains(event.target)) {
         contextMenu.style.display = "none";
      }
   });
   
   webview.addEventListener("ipc-message", (event) => {
      if (event.channel === "hide-contextmenu") {
         contextMenu.style.display = "none";
      }
   });
   webview.addEventListener("mousedown", () => {
      webview.send("forward-mousedown");
   });

   webview.addEventListener("did-navigate", updateNavigationButtons);
   webview.addEventListener("did-navigate-in-page", updateNavigationButtons);

   webview.addEventListener("did-fail-load", (event) => {
      if (event.errorCode !== -3 && event.errorCode !== -2 && event.errorCode !== -27 && event.errorCode !== -137 && event.errorCode !== -21 && event.errorCode !== -30 && event.errorCode !== -356 && event.errorCode !== -107 && event.errorCode !== -101 && event.errorCode !== -105) {
         document.getElementById("errorMayHaveOccurred").style.display = "block";
         document.getElementById("reportBugError").setAttribute("onclick", `addTab("https://github.com/katniny/meowser/issues/new?title=Bug Report: (AUTOMATIC) An Error Occurred Loading ${webview.src}&body=The following error occurred: ${event.errorCode} with the error message: ${event.errorDescription}")`);
      }
      //webview.src = "errorloadingpage.html";
   });

   webview.addEventListener("did-fail-provisional-load", (event) => {
      if (event.errorCode !== -3 && event.errorCode !== -2 && event.errorCode !== -27 && event.errorCode !== -137 && event.errorCode !== -21 && event.errorCode !== -30 && event.errorCode !== -356 && event.errorCode !== -107 && event.errorCode !== -101 && event.errorCode !== -105) {
         document.getElementById("errorMayHaveOccurred").style.display = "block";
         document.getElementById("reportBugError").setAttribute("onclick", `addTab("https://github.com/katniny/meowser/issues/new?title=Bug Report: (AUTOMATIC) An Error Occurred Loading ${webview.src}&body=The following error occurred: ${event.errorCode} with the error message: ${event.errorDescription}")`);
      }
      //webview.src = "errorloadingpage.html";
   });

   let faviconSet = false;
   webview.addEventListener("page-favicon-updated", (event) => {
      const favicons = event.favicons;

      if (!favicons || favicons.length === 0) {
         console.log("No favicon found.");
         favicon.innerHTML = `<span class="material-symbols-outlined no-spin">public</span>`;
         setTimeout(() => {
            console.log(favicons);
         }, 500);
         return;
      }

      const faviconUrl = favicons[0];

      if (faviconSet) {
         return;
      }

      fetch(faviconUrl, { method: 'HEAD' })
      .then((response) => {
         if (response.ok) {
            const img = new Image();
            img.src = faviconUrl;

            img.onload = function () {
               favicon.innerHTML = `<img src="${faviconUrl}" />`;
               favicon.style.display = "inline-block";
               faviconSet = true;
            };

            img.onerror = function () {
               console.log("Favicon failed");
               favicon.innerHTML = `<span class="material-symbols-outlined">public</span>`;
            };
         } else {
            console.log("Favicon response was not OK");
            favicon.innerHTML = `<span class="material-symbols-outlined">public</span>`;
         }
      })
      .catch((error) => {
         console.error("Error checking favicon:", error);
         favicon.innerHTML = `<span class="material-symbols-outlined">public</span>`;
      });

      reloadOrStop.innerHTML = `refresh`;
      reloadOrStop.setAttribute("onclick", "reload()");
   });

   setTimeout(() => {
      setInterval(() => {
         if (webview.isCurrentlyAudible()) {
            audio.style.opacity = "1";

            title.style.transform = "translateY(-3px)";
         } else {
            audio.style.opacity = "0";

            // styling
            title.style.transform = "translateY(3px)";
         }
      }, 50);
   }, 50);

   // check when the webview starts navigating
   webview.addEventListener("did-start-navigation", () => {
      faviconSet = false;
   });

   // update the tab title when the webview's title changes
   webview.addEventListener("page-title-updated", (event) => {
      title.textContent = event.title || new URL(webview.src).hostname || "Fetching...";
      document.title = `${event.title} — Meowser`;
      //favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(webview.src).hostname}`;
      urlBar.innerHTML = formatURL(webview.src);
      addToHistory(webview.src);
      checkSiteSecurity(webview.src);
   });

   webview.addEventListener("did-navigate", (event) => {
      urlBar.innerHTML = formatURL(event.url);
      addToHistory(event.url);
      checkSiteSecurity(event.url);
      addBookmarkUrl.value = event.url;
   });

   // check if the webview is currently loading
   webview.addEventListener("did-start-loading", () => {
      favicon.innerHTML = `<span class="material-symbols-outlined spin">progress_activity</span>`;
      reloadOrStop.innerHTML = `close`;
      reloadOrStop.setAttribute("onclick", "cancelLoading()");
   });

   var faviconUpdated = new CustomEvent("page-favicon-updated", { "detail": "When the page updates the favicon" });
   webview.addEventListener("did-stop-loading", () => {
      webview.dispatchEvent(faviconUpdated);
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

// highlight all the text in the div on the first click
let firstClickUrlBar = true;
urlBar.addEventListener("click", () => {
   if (firstClickUrlBar) {
      const range = document.createRange();
      range.selectNodeContents(urlBar);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      firstClickUrlBar = false;
   }
});

urlBar.addEventListener("blur", () => {
   // unselect text lol
   const range = document.createRange();
   range.selectNodeContents(urlBar);
   const selection = window.getSelection();
   selection.removeAllRanges();
   firstClickUrlBar = true;
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

      // check for subdomains
      const domainParts = domain.split(".");
      let subdomain = "";

      // check if subdomain is "www"
      if (domainParts[0] === "www") {
         subdomain = "www";
         domainParts.shift();
      }

      const baseDomain = domainParts.join(".");

      if (!url.startsWith("file:///")) {
         return `<span class="non-domain hidden">${protocol}//</span>` + (subdomain === "www" ? `<span class="non-domain hidden">www.</span>` : subdomain ? `<span class="domain">${subdomain}.</span>` : "") + `<span class="domain">${baseDomain}</span><span class="non-domain">${path}</span>`;
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

// check site security
function checkSiteSecurity(url) {
   if (url.startsWith("https://")) {
      siteSecurity.innerHTML = `lock`;
      siteSecurity.setAttribute("secure", "true");
   } else {
      if (!url.startsWith("file:///")) {
         siteSecurity.innerHTML = `lock_open_right`;
         siteSecurity.setAttribute("secure", "false");
      } else {
         siteSecurity.innerHTML = `description`;
         siteSecurity.setAttribute("secure", "file");
      }
   }
}

function siteSecurityInfo() {
   if (siteSecurityInfo_container.style.display === "" || siteSecurityInfo_container.style.display === "none") { // for some reason the display can be "", which im assuming is because there's no style directly on it?
      if (siteSecurity.getAttribute("secure") === "true") {
         siteSecurityInfoDesc.innerHTML = `<span style="font-size: large; transform: translateY(3px);" class="material-symbols-outlined">lock</span> You are securely connected to ${urlBar.innerHTML}`;
         siteSecurityInfo_container.style.display = "block";
      } else if (siteSecurity.getAttribute("secure") === "false") {
         siteSecurityInfoDesc.innerHTML = `<span style="font-size: large; transform: translateY(3px);" class="material-symbols-outlined">lock_open_right</span> Insecure connection to ${urlBar.innerHTML}<p style="font-size: smaller;">Your connection to this site is insecure. Information you submit could be viewed by others (passwords, messages, credit cards, etc.)</p>`;
         siteSecurityInfo_container.style.display = "block";
      } else if (siteSecurity.getAttribute("secure") === "file") {
         siteSecurityInfoDesc.innerHTML = `<span style="font-size: large; transform: translateY(3px);" class="material-symbols-outlined">description</span> This page is stored on your computer.`;
         siteSecurityInfo_container.style.display = "block";
      }
   } else {
      siteSecurityInfo_container.style.display = "none";
   }
}

// prevent new lines in the url bar
urlBar.addEventListener("keydown", (evt) => {
   if (evt.key === "Enter") {
      evt.preventDefault();
   }
});

// allow users to have their own bookmarks
function loadBookmarks() {
   let bookmarks = localStorage.getItem("bookmarks");
   if (bookmarks) {
      bookmarks = JSON.parse(bookmarks);
      bookmarksBar.innerHTML = "";

      if (bookmarks.length > 0) {
         bookmarks.forEach(item => {
            const div = document.createElement("div");
            div.className = "bookmark";
            div.innerHTML = `
               <img src="https://www.google.com/s2/favicons?domain=${item.url}" draggable="false" />
               <a href="javascript:void(0);" onclick="changeCurrentTabUrl('${item.url}')">${item.name}</a>`;
            bookmarksBar.appendChild(div);
         });
      } else {
         bookmarksBar.innerHTML = "<small>Bookmarks will appear here.</small>";
      }
   } else {
      bookmarksBar.innerHTML = "<small>Bookmarks will appear here.</small>";
   }
}

function addBookmark() {
   if (document.getElementById("add-bookmark-info").style.display === "none" || document.getElementById("add-bookmark-info").style.display === "") {
      document.getElementById("add-bookmark-info").style.display = "block";
   } else {
      document.getElementById("add-bookmark-info").style.display = "none";
   }
}

function addBookmark_finalize(name, url) {
   if (url && name) {
      let bookmarks = localStorage.getItem("bookmarks");
      if (!bookmarks) {
         bookmarks = [];
      } else {
         bookmarks = JSON.parse(bookmarks);
      }

      bookmarks.push({ name: name, url: url });
      localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

      loadBookmarks(); // reload it
      document.getElementById("add-bookmark-info").style.display = "none";
   } else {
      alert("Both the URL and name are required to add a bookmark.");
   }
}

function checkBookmarkDisplayPref() {
   let bookmarkBarDisplay = localStorage.getItem("bookmarksDisplay");

   // pls ignore me nesting ifs... 😇
   if (bookmarkBarDisplay) {
      if (bookmarkBarDisplay === "always") {
         bookmarksBar.style.display = "block";
      } else if (bookmarkBarDisplay === "home") {
         if (urlBar.textContent === "meow://new-tab") {
            bookmarksBar.style.display = "block";
         } else {
            bookmarksBar.style.display = "none";
         }
      } else if (bookmarkBarDisplay === "never") {
         bookmarksBar.style.display = "none";
      }
   } else {
      // by default, show bookmarks bar on new tab'
      // if they dont like it, they can change it :p
      if (urlBar.textContent === "meow://new-tab") {
         bookmarksBar.style.display = "block";
      } else {
         bookmarksBar.style.display = "none";
      }
   }
}

loadBookmarks();
checkBookmarkDisplayPref();

setInterval(() => {
   loadBookmarks();
}, 500);

setInterval(() => {
   checkBookmarkDisplayPref();
}, 50);

// allow users to set vertical/horizontal tabs
let lastUrlBarPref = null;
function checkUrlBarPref() {
   let urlBarPref = localStorage.getItem("urlBarPref");

   // Only proceed if the value has changed
   if (urlBarPref !== lastUrlBarPref) {
      lastUrlBarPref = urlBarPref; // Update the last known value

      if (urlBarPref !== null) {
         if (urlBarPref === "horizontal") {
            const controls = document.getElementById("controls");
            const tabs = document.getElementById("tabs");

            tabs.classList.remove("vertical");
            controls.parentNode.insertBefore(controls, tabs.nextSibling);
         } else if (urlBarPref === "vertical") {
            const controls = document.getElementById("controls");
            const tabs = document.getElementById("tabs");

            tabs.classList.add("vertical");
            controls.parentNode.insertBefore(tabs, controls.nextSibling);
         }
      } else {
         const controls = document.getElementById("controls");
         const tabs = document.getElementById("tabs");

         tabs.classList.remove("vertical");
         controls.parentNode.insertBefore(controls, tabs.nextSibling);
      }
   }
}

checkUrlBarPref();

setInterval(() => {
   checkUrlBarPref();
}, 50);

// get the user's theme
let appliedTheme = null;

async function getTheme() {
   try {
      const theme = await window.theme.getTheme();

      if (localStorage.getItem("shareTheme") !== appliedTheme) {
         writeTheme(localStorage.getItem("shareTheme"));
      }
      appliedTheme = localStorage.getItem("shareTheme");

      if (localStorage.getItem("shareTheme") === "light") {
         // edit css properies
         document.documentElement.style.setProperty("--tab-container-background", "#fff");
         document.documentElement.style.setProperty("--tab-container-text-color", "#000");
         document.documentElement.style.setProperty("--vertical-tabs-color", "#fff");
         document.documentElement.style.setProperty("--tab-background", "#f5f5f5");
         document.documentElement.style.setProperty("--tab-color", "#000");
         document.documentElement.style.setProperty("--tab-close-color", "#000");
         document.documentElement.style.setProperty("--tab-playing-audio", "#888");
         document.documentElement.style.setProperty("--controls", "#f5f5f5");
         document.documentElement.style.setProperty("--controls-icon-hover", "#aaa");
         document.documentElement.style.setProperty("--urlbar-border", "#ccc");
         document.documentElement.style.setProperty("--urlbar-background", "#fff");
         document.documentElement.style.setProperty("--urlbar-border-active", "#000");
         document.documentElement.style.setProperty("--url-non-domain", "#7a7a7a");
         document.documentElement.style.setProperty("--url-non-domain-active", "#000");
         document.documentElement.style.setProperty("--site-security-text", "#000");
         document.documentElement.style.setProperty("--popover-background", "#fff");
         document.documentElement.style.setProperty("--popover-border", "#ccc");
         document.documentElement.style.setProperty("--add-bookmark-input-background", "#f0f0f0");
         document.documentElement.style.setProperty("--add-bookmark-input-border", "#ddd");
         document.documentElement.style.setProperty("--add-bookmark-input-placeholder", "#888");
         document.documentElement.style.setProperty("--add-bookmark-input-border-focused", "#00aaff");
         document.documentElement.style.setProperty("--bookmark-hover", "#e6e6e6");
         document.documentElement.style.setProperty("--bookmark-a", "#222");
         document.documentElement.style.setProperty("--text", "#000");
         document.documentElement.style.setProperty("--tab-close-color-hover", "#808080");
      } else if (localStorage.getItem("shareTheme") === "dark" || localStorage.getItem("shareTheme") === "auto") {
         document.documentElement.style.setProperty("--tab-container-background", "#1f1f1f");
         document.documentElement.style.setProperty("--tab-container-text-color", "#e0e0e0");
         document.documentElement.style.setProperty("--vertical-tabs-color", "#2f2f2f");
         document.documentElement.style.setProperty("--tab-background", "#2f2f2f");
         document.documentElement.style.setProperty("--tab-color", "#ddd");
         document.documentElement.style.setProperty("--tab-close-color", "#888");
         document.documentElement.style.setProperty("--tab-playing-audio", "#b5b5b5");
         document.documentElement.style.setProperty("--controls", "#2f2f2f");
         document.documentElement.style.setProperty("--controls-icon-hover", "#444");
         document.documentElement.style.setProperty("--urlbar-border", "#333");
         document.documentElement.style.setProperty("--urlbar-background", "#1f1f1f");
         document.documentElement.style.setProperty("--urlbar-border-active", "#888");
         document.documentElement.style.setProperty("--url-non-domain", "#757575");
         document.documentElement.style.setProperty("--url-non-domain-active", "#fff");
         document.documentElement.style.setProperty("--site-security-text", "#fff");
         document.documentElement.style.setProperty("--popover-background", "#1f1f1f");
         document.documentElement.style.setProperty("--popover-border", "#3f3f3f");
         document.documentElement.style.setProperty("--add-bookmark-input-background", "#4f4f4f");
         document.documentElement.style.setProperty("--add-bookmark-input-border", "#4f4f4f");
         document.documentElement.style.setProperty("--add-bookmark-input-placeholder", "#c0c0c0");
         document.documentElement.style.setProperty("--add-bookmark-input-border-focused", "cyan");
         document.documentElement.style.setProperty("--bookmark-hover", "#3f3f3f");
         document.documentElement.style.setProperty("--bookmark-a", "#d4d4d4");
         document.documentElement.style.setProperty("--text", "#fff");
         document.documentElement.style.setProperty("--tab-close-color-hover", "#888");
      }
   } catch (error) {
      console.error("Failed to get theme: ", error);
   }
}

getTheme(); // run immediately lol...
setInterval(() => {
   getTheme();
}, 50);

// write theme
async function writeTheme(theme) {
   try {
      const response = await window.theme.setTheme("set-theme", theme);
      console.log("Backend response:", response);
   } catch (error) {
      console.error("Error setting theme: ", error);
   }
}

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

// check for updates
const updateStatuses = {
   "checking-for-update": "checking",
   "update-found": "found",
   "no-update-found": "false",
   "error-ending-update": "error",
   "downloading-update": "downloading",
   "downloaded-update": "downloaded",
};

Object.keys(updateStatuses).forEach((event) => {
   window.updates.onUpdateStatus(event, () => {
      localStorage.setItem("updateStatus", updateStatuses[event]);
      console.log(localStorage.getItem("updateStatus"));
   });
});

// show more info
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