import axios from "axios";

//User DB call
export function createUser(user: any): Promise<any> {
  return axios.post(`api/users/create`, user);
}
export function getUser(userId: number): Promise<any> {
  return axios.get(`api/users/${userId}`);
}

export function updateUser(userId: number, user: any): Promise<any> {
  return axios.put(`api/users/${userId}`, user);
}

export function deleteUser(userId: number): Promise<any> {
  return axios.delete(`api/users/delete/${userId}`);
}
