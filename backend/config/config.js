const config = {
    port: process.env.PORT || 5000,
    clientId: process.env.DO_CLIENT_ID,
    clientSecret: process.env.DO_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
    frontendUrl: process.env.FRONTEND_URL,
    redis: {
        url: process.env.REDIS_URL
    }
  };
  
  module.exports = config;