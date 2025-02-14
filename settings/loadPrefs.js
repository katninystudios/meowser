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