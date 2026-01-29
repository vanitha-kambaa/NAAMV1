export const API_CONFIG = {
  //BASE_URL: 'https://9jlldx6w-9000.inc1.devtunnels.ms/api',
  //UPLOADS_URL: 'https://9jlldx6w-9000.inc1.devtunnels.ms/uploads',
  BASE_URL: 'http://65.0.100.65:8000/api',
  UPLOADS_URL: 'http://65.0.100.65:8000/uploads',


};

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/users/login',
  VERIFY_OTP: '/users/verify-otp',
  LOGOUT: '/users/logout',
  
  // User endpoints
  PROFILE: '/users/profile',
  LAND_DETAILS: '/users/land-details/farmer',
  UPDATE_LAND_DETAILS: '/users/land-details',
  
  // Events endpoints
  UPCOMING_EVENTS: '/upcoming-events',
  NEWS_EVENTS: '/news-events',
};