export function requireAuth(request, response, next) {
  if (!request.session?.user) {
    console.warn('Authorization denied', { path: request.path, reason: 'unauthenticated', timestamp: new Date().toISOString() });
    return response.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function requireAdmin(request, response, next) {
  if (!request.session?.user) {
    console.warn('Authorization denied', { path: request.path, reason: 'unauthenticated', timestamp: new Date().toISOString() });
    return response.status(401).json({ message: 'Authentication required' });
  }
  if (request.session.user.role !== 'admin') {
    console.warn('Authorization denied', { path: request.path, userId: request.session.user.id, reason: 'admin_required', timestamp: new Date().toISOString() });
    return response.status(403).json({ message: 'Admin access required' });
  }
  next();
}
