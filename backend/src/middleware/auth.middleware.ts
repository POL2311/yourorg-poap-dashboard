import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizerId: string;
    role: string;
  };
  organizer?: {
    id: string;
    email: string;
    tier: string;
    name: string;
  };
  apiKey?: {
    id: string;
    organizerId: string;
    name: string;
  };
}

// JWT Authentication (for both users and organizers)
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Si es un usuario normal (userId presente)
    if (decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, error: 'Invalid or inactive user' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizerId: '', // No aplicable para usuarios normales
      };

      next();
      return;
    }

    // Si es un organizador (organizerId presente o id presente)
    const organizerId = decoded.organizerId || decoded.id;
    if (organizerId) {
      const organizer = await prisma.organizer.findUnique({ where: { id: organizerId } });
      if (!organizer || !organizer.isActive) {
        return res.status(401).json({ success: false, error: 'Invalid or inactive organizer' });
      }

      req.organizer = {
        id: organizer.id,
        email: organizer.email,
        tier: organizer.tier,
        name: organizer.name
      };

      req.user = {
        id: organizer.id,
        email: organizer.email,
        role: 'admin',
        organizerId: organizer.id,
      };

      next();
      return;
    }

    return res.status(401).json({ success: false, error: 'Invalid token format' });
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};


// API Key Authentication (for POAP claiming operations)
export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.startsWith('ApiKey ') 
    ? authHeader.substring(7) 
    : null;

  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API key required. Use header: Authorization: ApiKey <your-key>' 
    });
  }

  try {
    // Find active API key
    const keyRecord = await prisma.apiKey.findFirst({
      where: { 
        key: apiKey,
        isActive: true 
      },
      include: { organizer: true }
    });

    if (!keyRecord || !keyRecord.organizer.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or inactive API key' 
      });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    req.apiKey = {
      id: keyRecord.id,
      organizerId: keyRecord.organizerId,
      name: keyRecord.name
    };

    // Also set organizer info for compatibility
    req.organizer = {
      id: keyRecord.organizer.id,
      email: keyRecord.organizer.email,
      tier: keyRecord.organizer.tier,
      name: keyRecord.organizer.name
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

// Legacy alias for backward compatibility
export const authenticateToken = authenticate;

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// User Authentication (for regular users)
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // For regular users, look for userId in the token
    if (decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, error: 'Invalid or inactive user' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizerId: '' // Not applicable for regular users
      };

      next();
      return;
    }

    // For organizers, use the existing logic
    if (decoded.organizerId) {
      const organizer = await prisma.organizer.findUnique({ where: { id: decoded.organizerId } });
      if (!organizer || !organizer.isActive) {
        return res.status(401).json({ success: false, error: 'Invalid or inactive organizer' });
      }

      req.organizer = {
        id: organizer.id,
        email: organizer.email,
        tier: organizer.tier,
        name: organizer.name
      };

      req.user = {
        id: organizer.id,
        email: organizer.email,
        role: 'admin',
        organizerId: organizer.id,
      };

      next();
      return;
    }

    return res.status(401).json({ success: false, error: 'Invalid token format' });
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

export const requireOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.organizer) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const organizer = await prisma.organizer.findUnique({
      where: { id: req.organizer.id }
    });

    if (!organizer || !organizer.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Organizer not found or inactive' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Database error' });
  }
};