import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "Success") {
      location.assign("/");
    }

    console.log(res);
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    if (res.data.status === "Success") {
      showAlert("success", "Logged Out Succesfull");
      setTimeout(() => {
        location.reload(true);
      }, 3500);
    }
  } catch {
    showAlert("error", "Error Logging out Try Again!!!");
  }
};

export const signup = async () => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
    });

    if (res.data.status === "Success") {
      showAlert("success", "Logged Out Succesfull");
      setTimeout(() => {
        location.reload(true);
      }, 3500);
    }
  } catch {
    showAlert("error", "Error Logging out Try Again!!!");
  }
};
