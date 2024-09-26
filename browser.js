// required content
const tabsContainer = document.getElementById("tabs");
const contentContainer = document.getElementById("content");
const urlBar = document.getElementById("url-bar");
const reloadOrStop = document.getElementById("reloadOrStop");
let draggedTab = null; // store
const currentDir = window.api.dirname();
const browserVersion = "v0.1_alpha";
const linkPreview = document.getElementById("link-preview");
const siteSecurity = document.getElementById("site-security");
const siteSecurityInfo_container = document.getElementById("site-security-info");
const siteSecurityInfoDesc = document.getElementById("site-security-link");
const bookmarksBar = document.getElementById("bookmarks-bar");
const addBookmarkUrl = document.getElementById("bookmark-url");

// user preferences
let userDefaultEngine = "N/A";
let historySave = null;
let haveUsedBrowser = null;

// get user preferences
haveUsedBrowser = localStorage.getItem("browserUsed");

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
   webview.style.display = "none";
   webview.style.width = "100%";
   webview.style.height = "100%";
   webview.setAttribute("webpreferences", "nativeWindowOpen=true");
   webview.setAttribute("allowpopups", "");

   webview.addEventListener("did-navigate", updateNavigationButtons);
   webview.addEventListener("did-navigate-in-page", updateNavigationButtons);

   webview.addEventListener("did-fail-load", (event) => {
      webview.src = "errorloadingpage.html";
   });

   webview.addEventListener("did-fail-provisional-load", (event) => {
      webview.src = "errorloadingpage.html";
   });

   webview.addEventListener("page-favicon-updated", (event) => {
      const favicons = event.favicons;
      const faviconUrl = favicons[0];
      const img = new Image();

      img.onload = function() {
         favicon.innerHTML = `<img src="${faviconUrl}" />`;
      }

      img.onerror = function() {
         favicon.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${new URL(webview.src).hostname}" />`;
      }

      favicon.innerHTML = `<img src="${favicons[0]}" />`;
      
      reloadOrStop.className = `fa-solid fa-rotate-right active`;
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
      favicon.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
      reloadOrStop.className = `fa-solid fa-xmark fa-lg active`;
      reloadOrStop.setAttribute("onclick", "cancelLoading()");
   });

   webview.addEventListener("did-stop-loading", () => {
      
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
         return `<span class="non-domain hidden">${protocol}//</span>` + (subdomain === "www" ? `<span class="non-domain hidden">www.</span>` : subdomain ? `<span class="domain">${subdomain}.</span>` : "") +  `<span class="domain">${baseDomain}</span><span class="non-domain">${path}</span>`;
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
      siteSecurity.classList = "fa-solid fa-lock active";
      siteSecurity.setAttribute("secure", "true");
   } else {
      if (!url.startsWith("file:///")) {
         siteSecurity.classList = "fa-solid fa-lock-open active";
         siteSecurity.setAttribute("secure", "false");
      } else {
         siteSecurity.classList = "fa-solid fa-file active";
         siteSecurity.setAttribute("secure", "file");
      }
   }
}

function siteSecurityInfo() {
   if (siteSecurityInfo_container.style.display === "" || siteSecurityInfo_container.style.display === "none") { // for some reason the display can be "", which im assuming is because there's no style directly on it?
      if (siteSecurity.getAttribute("secure") === "true") {
         siteSecurityInfoDesc.innerHTML = `<i class="fa-solid fa-lock"></i> You are securely connected to ${urlBar.innerHTML}`;
         siteSecurityInfo_container.style.display = "block";
      } else if (siteSecurity.getAttribute("secure") === "false") {
         siteSecurityInfoDesc.innerHTML = `<i class="fa-solid fa-lock-open"></i> Insecure connection to ${urlBar.innerHTML}<p style="font-size: smaller;">Your connection to this site is insecure. Information you submit could be viewed by others (passwords, messages, credit cards, etc.)</p>`;
         siteSecurityInfo_container.style.display = "block";
      } else if (siteSecurity.getAttribute("secure") === "file") {
         siteSecurityInfoDesc.innerHTML = `<i class="fa-solid fa-file"></i> This page is stored on your computer.`;
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