// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { localStore } = require('../config/database');

router.get('/me', (req, res) => {
  res.json({
    success: true,
    user: req.user,
    available_personas: localStore.systemUsers
  });
});

router.post('/switch-role', (req, res) => {
  const { role, user_id } = req.body;
  let targetUser = null;

  if (user_id) {
    targetUser = localStore.systemUsers.find(u => u.id === user_id);
  } else if (role) {
    targetUser = localStore.systemUsers.find(u => u.role === role);
  }

  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'Persona not found' });
  }

  res.json({
    success: true,
    user: targetUser,
    message: `Switched active persona to ${targetUser.full_name} (${targetUser.role})`
  });
});

module.exports = router;
