interface JWTPayload {
  sub: string;        // userId
  role: string;
  email: string;
  exp: number;        // expiry timestamp
  iat: number;
}

/** Decode JWT (không verify signature — Gateway đã verify) */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Payload = token.split(".")[1];
    const decoded = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
};

/** Kiểm tra token còn hạn không (thêm buffer 30 giây) */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  const bufferSeconds = 30;
  return Date.now() / 1000 >= payload.exp - bufferSeconds;
};

/** Lấy payload từ token */
export const getPayload = (token: string): JWTPayload | null =>
  decodeJWT(token);