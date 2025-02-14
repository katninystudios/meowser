// required content
const tabsContainer = document.getElementById("tabs");
const contentContainer = document.getElementById("content");
const urlBar = document.getElementById("url-bar");
const reloadOrStop = document.getElementById("reloadOrStop");
let draggedTab = null; // store
const currentDir = window.api.dirname();
const browserVersion = "v0.2.0_alpha";
const linkPreview = document.getElementById("link-preview");
const siteSecurity = document.getElementById("site-security");
const siteSecurityInfo_container = document.getElementById("site-security-info");
const siteSecurityInfoDesc = document.getElementById("site-security-link");
const bookmarksBar = document.getElementById("bookmarks-bar");
const addBookmarkUrl = document.getElementById("bookmark-url");