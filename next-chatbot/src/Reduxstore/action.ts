// actions.js
export const setToken = (token: string) => ({
    type: 'SET_TOKEN',
    payload: token,
  });
  
  export const clearToken = () => ({
    type: 'CLEAR_TOKEN',
  });
