import axios from "axios";

const API = axios.create({
  baseURL: "https://vience.io:6040",
});

export default API;
