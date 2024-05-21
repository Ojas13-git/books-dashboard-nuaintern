
import axios from 'axios';

const BASE_URL = 'https://openlibrary.org';

export const fetchBooks = async (page = 1, limit = 10) => {
  const response = await axios.get(`${BASE_URL}/search.json`, {
    params: {
      page,
      limit
    }
  });
  return response.data;
};

export const fetchAuthorDetails = async (authorKey) => {
  const response = await axios.get(`${BASE_URL}${authorKey}.json`);
  return response.data;
};
