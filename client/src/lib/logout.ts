// Centralized logout function
export const performLogout = () => {
  console.log('Starting logout process...');
  
  // Clear specific items from localStorage
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('user');
  localStorage.removeItem('deviceId');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('All data cleared, redirecting...');
  
  // Direct redirect without reload to avoid timing issues
  window.location.replace("/");
};