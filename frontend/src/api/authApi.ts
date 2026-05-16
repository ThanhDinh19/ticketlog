import axiosClient from "./axiosClient";

export async function loginApi(payload: {
  username: string;
  password: string;
}) {
  const res = await axiosClient.post("/auth/login", payload);
  return res.data;
}

export async function meApi() {
  const res = await axiosClient.get("/auth/me");
  return res.data;
}