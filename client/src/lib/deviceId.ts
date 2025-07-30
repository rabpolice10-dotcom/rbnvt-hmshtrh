export function getDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}

export function clearDeviceId(): void {
  localStorage.removeItem('deviceId');
}
