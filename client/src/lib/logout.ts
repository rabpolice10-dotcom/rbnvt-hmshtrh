// Centralized logout function
export const performLogout = () => {
  console.log('Starting logout process...');
  
  // Clear all localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log('All data cleared, triggering page reload...');
  
  // Force complete page refresh to clear all React state
  window.location.href = "/";
  window.location.reload();
};