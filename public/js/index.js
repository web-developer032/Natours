import "@babel/polyfill";
import axios from "axios";
import { login, logout, signup } from "./userActions";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { showAlert } from "./alerts";

const formSignup = document.querySelector(".form--signup");
if (formSignup) {
  formSignup.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = formSignup.querySelector("button");
    btn.textContent = "processing...";

    let name = e.target.name.value.trim();
    let email = e.target.email.value.trim();
    let password = e.target.password.value.trim();
    let confirmPassword = e.target.confirmPassword.value.trim();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);

    if (e.target.photo.files.length)
      formData.append("photo", e.target.photo.files[0]);

    try {
      const res = await axios({
        method: "post",
        url: "/api/v1/users/signup",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data;",
        },
      });

      console.log(res);

      if (res.data.status == "Success") {
        showAlert("success", "Signed Up Successfully");
        setTimeout(() => {
          location.assign("/");
        }, 1500);
      }
    } catch (err) {
      console.dir(err);

      showAlert("error", err.response.data.message);
    }
    btn.textContent = "Signup";
  });
}

const formLogin = document.querySelector(".form--login");
if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    let email = e.target.email.value.trim();
    let password = e.target.password.value.trim();
    login(email, password);
  });
}

const logoutBtn = document.querySelector(".nav__el--logout");
if (logoutBtn) logoutBtn.addEventListener("click", logout);

let mapBox = document.getElementById("map");
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

const formUpdateData = document.querySelector(".form--updateData");
if (formUpdateData) {
  formUpdateData.addEventListener("submit", (e) => {
    e.preventDefault();
    updateSettings("data", {
      name: e.target.name.value.trim(),
      email: e.target.email.value.trim(),
    });
  });
}

const formUpdatePassword = document.querySelector(".form--updatePassword");
if (formUpdatePassword) {
  formUpdatePassword.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save--password").textContent = "Updating..";
    await updateSettings("password", {
      currentPassword: e.target.currentPassword.value.trim(),
      newPassword: e.target.newPassword.value.trim(),
      confirmNewPassword: e.target.confirmNewPassword.value.trim(),
    });

    document.querySelector(".btn--save--password").textContent =
      "Save Password";
    e.target.currentPassword.value = "";
    e.target.newPassword.value = "";
    e.target.confirmNewPassword.value = "";
  });
}

const bookTourBtn = document.getElementById("book-tour");
if (bookTourBtn)
  bookTourBtn.addEventListener("click", (e) => {
    let tourId = e.target.dataset.tourid;
    e.target.textContent = "Processing...";
    bookTour(tourId);
  });
