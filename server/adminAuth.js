// Simple admin authentication endpoint
const express = require('express');
const router = express.Router();

// Admin login endpoint - bypass all complex authentication
router.post('/api/admin/simple-login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@police.gov.il' && password === 'admin123') {
    // Set admin session
    req.session.adminUser = {
      id: 'admin-user',
      email: 'admin@police.gov.il',
      isAdmin: true,
      deviceId: 'admin-device-simple'
    };
    
    res.json({ 
      success: true, 
      isAdmin: true,
      user: req.session.adminUser 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Admin check endpoint - simple version
router.get('/api/admin/check-simple', (req, res) => {
  if (req.session.adminUser) {
    res.json({ 
      isAdmin: true, 
      user: req.session.adminUser 
    });
  } else {
    res.status(401).json({ isAdmin: false });
  }
});

module.exports = router;