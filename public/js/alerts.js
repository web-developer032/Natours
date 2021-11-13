export const hideAlert = () => {
  const el = document.querySelector(".alert");
  if (el) el.remove();
};

export const showAlert = (type, msg) => {
  hideAlert();
  // TYPE IS success or error
  const marker = `<div class="alert alert--${type}">${msg}</div>`;

  document.querySelector("body").insertAdjacentHTML("afterbegin", marker);

  setTimeout(() => {
    hideAlert();
  }, 5000);
};
