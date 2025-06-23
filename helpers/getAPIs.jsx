import axios from "axios";
import { BASE_URL } from "./url";

// get Profile data
export const getProfileData = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}auth/profile/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}
export const getFriends = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}chat/friends/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}
export const getFriendRequests = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}chat/friends/pending/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// Get all groups
export const getAllGroups = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}chat/groups/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// // Get all group members
export const getAllGroupMembers = async (token, groupId) => {
  try {
    const response = await axios.get(`${BASE_URL}chat/group-members/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// Get all messages
export const getAllMessages = async (token, userData) => {
  try {
    const response = await axios.get(`${BASE_URL}chat/messages/?group_id=${userData.group_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

