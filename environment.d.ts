declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      REDIS_URL: string;
    }
  }
}

export {};
