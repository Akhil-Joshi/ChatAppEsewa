import axios from "axios";
import { BASE_URL } from "./url";

// email registration 
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/register/`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};


// registration OTP verification
export const verifyRegistrationOTP = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/verify-email/`, userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// Resend Registration OTP
export const resendOTP = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/resend-otp/`, userData)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}


// login
export const login = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/login/`, userData)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}


// sendResetPasswordOTP
export const sendResetPasswordOTP = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/password-reset/request/`, userData)
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}


// verifyResetPasswordOTP
export const verifyResetPasswordOTP = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/password-reset/verify-otp/`, userData)
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// resetPassword
export const resetPassword = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}auth/password-reset/set-password/`, userData)
    return response.data
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}





