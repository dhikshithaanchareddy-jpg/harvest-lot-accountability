// server/middleware/auth.js
const { localStore } = require('../config/database');

const ROLE_PERMISSIONS = {
  visitor: ['read:public', 'read:crops', 'read:facilities', 'read:lots_public'],
  requester: ['read:public', 'read:crops', 'read:facilities', 'read:lots', 'create:dispatch_request', 'read:metrics'],
  operator: ['read:public', 'read:crops', 'read:facilities', 'read:lots', 'create:lots', 'update:lots', 'create:inspections', 'create:lineage', 'create:dispatches', 'create:spoilage', 'read:metrics', 'read:audit'],
  admin: ['read:public', 'read:crops', 'read:facilities', 'read:lots', 'create:lots', 'update:lots', 'create:inspections', 'create:lineage', 'create:dispatches', 'create:spoilage', 'manage:system', 'read:metrics', 'read:audit', 'delete:records']
};

function authMiddleware(req, res, next) {
  // Check for persona or role header
  const roleHeader = req.headers['x-user-role'] || process.env.DEMO_ROLE || 'operator';
  const userId = req.headers['x-user-id'];

  let currentUser = null;
  if (userId) {
    currentUser = localStore.systemUsers.find(u => u.id === userId);
  }
  if (!currentUser) {
    currentUser = localStore.systemUsers.find(u => u.role === roleHeader) || {
      id: 'demo-user',
      full_name: `${roleHeader.charAt(0).toUpperCase() + roleHeader.slice(1)} User`,
      role: roleHeader,
      department: 'Operations'
    };
  }

  req.user = currentUser;
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${req.user.role}' lacks permission for this action.`
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  ROLE_PERMISSIONS
};
