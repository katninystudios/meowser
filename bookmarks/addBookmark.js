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