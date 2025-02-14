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