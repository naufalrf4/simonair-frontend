export const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (exp: number) => {
  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
};
