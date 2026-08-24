export function requireAuth(request, response, next) {
  if (!request.session?.user) {
    return response.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function requireAdmin(request, response, next) {
  if (!request.session?.user) {
    return response.status(401).json({ message: 'Authentication required' });
  }
  if (request.session.user.role !== 'admin') {
    return response.status(403).json({ message: 'Admin access required' });
  }
  next();
}
