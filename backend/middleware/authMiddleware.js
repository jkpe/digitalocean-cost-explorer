const axios = require('axios');
const config = require('../config/config');

const authMiddleware = async (req, res, next) => {
    // Check if user has a valid session with DO access token
    if (!req.session || !req.session.doAccessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if token is expired and refresh if needed
    if (req.session.doRefreshToken) {
      try {
        // Check if token is still valid by making a test API call
        const testResponse = await axios.get('https://api.digitalocean.com/v2/account', {
          headers: {
            'Authorization': `Bearer ${req.session.doAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If we get here, token is still valid
        next();
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token is expired, try to refresh it
          try {
            const refreshResponse = await axios.post(
              'https://cloud.digitalocean.com/v1/oauth/token',
              new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: req.session.doRefreshToken,
                client_id: config.clientId,
                client_secret: config.clientSecret
              }),
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            );
            
            // Update session with new tokens
            req.session.doAccessToken = refreshResponse.data.access_token;
            if (refreshResponse.data.refresh_token) {
              req.session.doRefreshToken = refreshResponse.data.refresh_token;
            }
            
            next();
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
            req.session.destroy();
            req.session.destroy((destroyErr) => {
              if (destroyErr) {
                console.error('Session destruction failed:', destroyErr);
              }
              return res.status(401).json({ message: 'Session expired' });
            });
          }
        } else {
          // Other error, proceed with current token
          next();
        }
      }
    } else {
      // No refresh token, proceed with current token
      next();
    }
  };
  
  module.exports = authMiddleware;