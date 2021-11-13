import axios from "axios";
import { showAlert } from "./alerts";

// TYPE IS PASSWORD OR DATA
export const updateSettings = async (type, data) => {
  try {
    const url = type == "password" ? "updatePassword" : "updateMe";
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/users/${url}`,
      data,
    });

    if (res.data.status === "Success") {
      showAlert("success", `${type.toUpperCase()} Updated Succesfully`);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
