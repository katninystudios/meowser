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