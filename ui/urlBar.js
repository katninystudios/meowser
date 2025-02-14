// format url bar
function formatURL(url) {
   try {
      const parsedURL = new URL(url);
      const protocol = parsedURL.protocol;
      const domain = parsedURL.hostname;
      const path = parsedURL.pathname + parsedURL.search + parsedURL.hash;

      // if the url ends with .txt or .xml, make the background dark so the text is visible
      if (url.endsWith(".txt") || url.endsWith(".xml") || url.endsWith(".json")) {
         document.body.style.backgroundColor = "black";
      } else {
         document.body.style.backgroundColor = "transparent";
      }

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

// prevent new lines in the url bar
urlBar.addEventListener("keydown", (evt) => {
   if (evt.key === "Enter") {
      evt.preventDefault();
   }
});