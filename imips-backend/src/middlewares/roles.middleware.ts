import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }

        if (!roles.includes(user.role)) {
            // Log security event
            console.warn(`Unauthorized access attempt: User ${user.id} with role ${user.role} tried to access ${req.method} ${req.path}`);

            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have permission to access this resource'
            });
        }

        // Additional role-based restrictions
        if (user.role === 'Staff') {
            // Staff restrictions can be added here
            if (req.method === 'DELETE' && req.path.includes('/users/')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Staff cannot delete users'
                });
            }
        }

        next();
    };
};

// Specific middleware for admin-only endpoints
export const requireAdmin = authorizeRoles('Admin');

// Middleware for management-level access
export const requireManagement = authorizeRoles('Admin', 'Manager');