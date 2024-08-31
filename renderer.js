// tabs
const tabsContainer = document.getElementById("tabs");
const contentContainer = document.getElementById("content");
const urlBar = document.getElementById("url-bar");

function addTab(url) {
    // create new tab element
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.url = url; // store URL for later use

    // create favicon element
    const favicon = document.createElement("img");
    favicon.className = "tab-favicon";
    //favicon.onerror = () => { favicon.src = "default-favicon.png"; }; // fallback favicon in case of error
        
    // create tab title and close button
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

    // append favicon, title, and close button to the tab
    tab.appendChild(favicon);
    tab.appendChild(title);
    tab.appendChild(closeButton);
    tab.onclick = () => switchTab(tab);
    tabsContainer.appendChild(tab);

    // create new webview
    const webview = document.createElement("webview");
    webview.src = url || "https://www.google.com/";
    webview.style.display = "none";
    webview.style.width = "100%";
    webview.style.height = "100%";
    webview.setAttribute("webpreferences", "nativeWindowOpen=true");
    webview.setAttribute("allowpopups", ""); // we intercept this to open new tabs

    // update the tab title when the webview's title changes
    webview.addEventListener("page-title-updated", (event) => {
        title.textContent = event.title || new URL(tab.dataset.url).hostname || "Fetching..."; // set the title or default to "New Tab"
        document.title = `${event.title} — Meowser` || `${new URL(tab.dataset.url).hostname} — Meowser` || "Fetching... — Meowser";
        if (tab.dataset.url) {
            favicon.src = `https://www.google.com/s2/favicons?domain=${event.target.src}&sz=16`;
        }
    });

    // update url bar
    webview.addEventListener("did-navigate", (event) => {
        urlBar.value = event.url;
    });

    contentContainer.appendChild(webview);

    // automatically switch the tab
    switchTab(tab);
}

// switch tab
function switchTab(tab) {
    // hide all webviews
    document.querySelectorAll("webview").forEach((wv) => (wv.style.display = "none"));

    // highlight the selected tab
    document.querySelectorAll(".tab").forEach((t) => (t.style.backgroundColor = "#eee"));
    tab.style.backgroundColor = "#ddd";

    // show the webview corresponding to the clicked tab
    const index = Array.from(tabsContainer.children).indexOf(tab);
    if (index !== -1) {
        const webview = contentContainer.children[index];
        webview.style.display = "flex";
        urlBar.value = webview.getURL(); // this prints out an initial error when loading. idk why.
    }
}

// close tab
function closeTab(tab) {
    const index = Array.from(tabsContainer.children).indexOf(tab);
    if (index !== -1) {
        // remove tab
        tabsContainer.removeChild(tab);

        // remove associated webview
        if (contentContainer.children[index]) {
            contentContainer.removeChild(contentContainer.children[index]);
        }

        // switch to next tab if available
        if (tabsContainer.children.length > 0) {
            const newIndex = Math.min(index, tabsContainer.children.length - 1);
            switchTab(tabsContainer.children[newIndex]);
        }
    }
}

// listen for open-url messages from main process
// this will open a new tab when the web page requests one/a new window
window.api.handle("open-url", (event, url) => {
    addTab(url);
});

// initial tab
addTab("https://www.google.com/");

// search or url
// TO:DO - fix this not working
urlBar.addEventListener('keydown', (event) => {
    console.log("hi");

    if (event.key === 'Enter') {
        console.log('Enter key pressed!');
        // Perform desired actions here
    }
});