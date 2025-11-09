document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const tabButtons = document.querySelectorAll(".header-tools .tool");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      if (!section) return;

      root.setAttribute("data-active-section", section);

      tabButtons.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
    });
  });
});
