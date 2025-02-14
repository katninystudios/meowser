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