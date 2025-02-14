// check for updates
const updateStatuses = {
   "checking-for-update": "checking",
   "update-found": "found",
   "no-update-found": "false",
   "error-ending-update": "error",
   "downloading-update": "downloading",
   "downloaded-update": "downloaded",
};

Object.keys(updateStatuses).forEach((event) => {
   window.updates.onUpdateStatus(event, () => {
      localStorage.setItem("updateStatus", updateStatuses[event]);
      console.log(localStorage.getItem("updateStatus"));
   });
});