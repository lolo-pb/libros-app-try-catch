import axios from "axios";

//User DB call
export function createBook(book: any): Promise<any> {
  return axios.post(`api/books/create`, book);
}
export function getBook(bookId: number): Promise<any> {
  return axios.get(`api/books/${bookId}`);
}

export function getBooks(user: any): Promise<any> {
  return axios.get(`api/books/`, user);
}

export function updateBook(bookId: number, book: any): Promise<any> {
  return axios.put(`api/books/${bookId}`, book);
}

export function deleteBook(bookId: number): Promise<any> {
  return axios.delete(`api/books/delete/${bookId}`);
}
