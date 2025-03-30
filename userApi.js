// src/api/userApi.js

export const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Ошибка при загрузке пользователей: ', error);
      throw error;
    }
  };
  