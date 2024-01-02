import { jwtDecode } from "jwt-decode";

export const extractTokenData = (token: string): { sub: string } => {
  const decodedToken = jwtDecode(token);
  return {
    sub: decodedToken.sub as string,
  };
};
