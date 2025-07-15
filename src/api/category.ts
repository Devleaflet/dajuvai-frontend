import axiosInstance from "./axiosInstance";

export const fetchCategory = async () => {
  try {
    const response = await axiosInstance.get("/api/categories");
    console.log("cat = :", response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.log(error.message);
  }
};
