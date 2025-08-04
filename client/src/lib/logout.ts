// Centralized logout function with improved cleanup
export const performLogout = () => {
  console.log('Starting logout process...');
  
  // Clear all localStorage items related to authentication
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('user');
  localStorage.removeItem('deviceId');
  localStorage.removeItem('admin-device-id');
  localStorage.removeItem('device-id');
  
  // Clear sessionStorage completely
  sessionStorage.clear();
  
  // Clear any cached API data
  try {
    // Clear any potential cached authentication data
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  } catch (e) {
    console.log('Cookie clearing failed:', e);
  }
  
  console.log('All data cleared, redirecting to login...');
  
  // Force redirect to login page
  window.location.replace("/login");
};