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