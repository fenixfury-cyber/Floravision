const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".panel");
const searchModal = document.getElementById("search-modal");
const searchInput = document.getElementById("search-input");

function showPanel(panelId) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.panel === panelId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => showPanel(item.dataset.panel));
});

function openSearch() {
  searchModal.classList.remove("hidden");
  window.setTimeout(() => searchInput.focus(), 0);
}

function closeSearch() {
  searchModal.classList.add("hidden");
}

document.getElementById("open-search").addEventListener("click", openSearch);
document.getElementById("close-search").addEventListener("click", closeSearch);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }

  if (event.key === "Escape") {
    closeSearch();
  }
});

document.querySelectorAll(".result-item").forEach((button) => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.target);
    closeSearch();
  });
});

searchModal.addEventListener("click", (event) => {
  if (event.target === searchModal) {
    closeSearch();
  }
});
