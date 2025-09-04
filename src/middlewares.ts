import { type Request,type Response, type NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

interface MyJwtPayload extends JwtPayload {
  id: string;
}
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(secret: string) {
  return function(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({
        message: "You are not signed in or token is missing",
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({
        message: "Token is missing",
      });
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown as MyJwtPayload;
      
      req.userId = decoded.id;
      next();

    } catch (error) {
      return res.status(403).json({
        message: "Authentication failed. Please sign in again.",
      });
    }
  };
}