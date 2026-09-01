const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    navigation.classList.toggle("open");
  });
}

document.querySelectorAll("[data-placeholder]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    alert(
      "This feature will be connected in a later phase of the website."
    );
  });
});

document.querySelectorAll("form[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    alert(
      "The frontend form is working. Email/database functionality will be connected later."
    );
  });
});