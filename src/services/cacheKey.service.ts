export const redisKeys = {
  userSessions: (userId: string) => `user:${userId}:sessions:v1`,
  userAuth: (userId: string) => `user:${userId}:auth:v1`,
};
