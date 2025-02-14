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