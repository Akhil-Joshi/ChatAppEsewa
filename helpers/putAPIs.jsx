import axios from "axios";
import { BASE_URL } from "./url";

// update profile data
export const updateProfileData = async (token, data) => {
  try {
    const response = await axios.put(`${BASE_URL}auth/profile/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}