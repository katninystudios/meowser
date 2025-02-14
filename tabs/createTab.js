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
            addMenuOption("Save Image As...", () => {
               downloadFile(fullHref, getFilenameFromUrl(fullHref), (progress, received, total) => {
                  // if visible, hide the "no downloaded items"
                  document.getElementById("noDownloads").style.display = "none";

                  // create a div and show content there
                  document.getElementById("downloads").style.display = "block";
                  if (document.getElementById(`downloading-${getFilenameFromUrl(fullHref)}`)) {
                     document.getElementById(`downloading-${getFilenameFromUrl(fullHref)}`).innerHTML = `
                        <h3>${getFilenameFromUrl(fullHref)}</h3>
                        <p>${Math.round(progress)}% downloaded (${received}bytes / ${total}bytes)</p>
                     `;
                  } else {
                     const item = document.createElement("div");
                     //${Math.round(progress)}% (${received} / ${total} bytes)
                     item.innerHTML = `
                        <h3>${getFilenameFromUrl(fullHref)}</h3>
                        <p>${Math.round(progress)}% downloaded (${received}bytes / ${total}bytes)</p>
                     `;
                     item.setAttribute("id", `downloading-${getFilenameFromUrl(fullHref)}`);
                     item.className = "downloadingItem";
                     document.getElementById("downloads").prepend(item);
                  }

                  if (document.getElementById("downloads-info").style.display === "" || document.getElementById("downloads-info").style.display === "none") {
                     showDownloads();
                  }
               }).catch(err => {
                  console.error("Failed to download: ", err);
               });
            });
            addMenuOption("Copy Image Address", () => {
               navigator.clipboard.writeText(fullHref).then(() => {
                  console.log(`Copied to clipboard: ${fullHref}`);
               }).catch(err => {
                  console.error("failed to copy text: ", err);
               });
            });
         } else if (tagName === "VIDEO" && attributes.src) {
            const fullHref = resolveUrl(webview.src, attributes.src);
            addMenuOption("Open Video in New Tab", () => addTab(fullHref));
            addMenuOption("Save Video As...", () => {
               downloadFile(fullHref, getFilenameFromUrl(fullHref), (progress, received, total) => {
                  // if visible, hide the "no downloaded items"
                  document.getElementById("noDownloads").style.display = "none";

                  // create a div and show content there
                  document.getElementById("downloads").style.display = "block";
                  if (document.getElementById(`downloading-${getFilenameFromUrl(fullHref)}`)) {
                     document.getElementById(`downloading-${getFilenameFromUrl(fullHref)}`).innerHTML = `
                        <h3>${getFilenameFromUrl(fullHref)}</h3>
                        <p>${Math.round(progress)}% downloaded (${received}bytes / ${total}bytes)</p>
                     `;
                  } else {
                     const item = document.createElement("div");
                     //${Math.round(progress)}% (${received} / ${total} bytes)
                     item.innerHTML = `
                        <h3>${getFilenameFromUrl(fullHref)}</h3>
                        <p>${Math.round(progress)}% downloaded (${received}bytes / ${total}bytes)</p>
                     `;
                     item.setAttribute("id", `downloading-${getFilenameFromUrl(fullHref)}`);
                     item.className = "downloadingItem";
                     document.getElementById("downloads").prepend(item);
                  }

                  if (document.getElementById("downloads-info").style.display === "" || document.getElementById("downloads-info").style.display === "none") {
                     showDownloads();
                  }
               }).catch(err => {
                  console.error("Failed to download: ", err);
               });
            });
            addMenuOption("Copy Video Address", () => {
               navigator.clipboard.writeText(fullHref).then(() => {
                  console.log(`Copied to clipboard: ${fullHref}`);
               }).catch(err => {
                  console.error("failed to copy text: ", err);
               });
            });
         } else {
            addMenuOption("Unknown or Unsupported. Click to learn more.", () => {
               if (tagName !== "A" && tagName !== "IMG" && tagName !== "VIDEO") {
                  addTab("context-menu.html");
               }
            });
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