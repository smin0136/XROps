import axios from "axios";

const API2 = axios.create({
  baseURL: "https://vience.io:6050",
});

export default API2;
