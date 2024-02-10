declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      DISCORD_APPID: string;
      REDIS_URL: string;
      MYSQL_URL: string;
    }
  }
}

export {};
