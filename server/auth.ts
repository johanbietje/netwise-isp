import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import * as crypto from 'crypto';

// Function to verify a password against a stored hash
async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  try {
    // For simple password format (testing only)
    if (!storedPassword.includes(':')) {
      return password === storedPassword;
    }
    
    // If using the hash format from our seed.ts
    const [salt, hash] = storedPassword.split(':');
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    return hash === calculatedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Simple authentication middleware for admin/staff users
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // In a real app, this would validate a JWT or other token
  // For simplicity, we'll just check if the token is a valid username
  try {
    const user = await storage.getUserByUsername(token);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid authorization token' });
    }
    
    // Add user to request object
    (req as any).user = user;
    
    // Log the authentication
    await storage.createActivityLog({
      userId: user.id,
      action: 'API Authentication',
      details: `User ${user.username} authenticated API request to ${req.path}`,
      ipAddress: req.ip
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Customer authentication middleware
export const authenticateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const customer = await storage.getCustomerByUsername(token);
    
    if (!customer) {
      return res.status(401).json({ message: 'Invalid authorization token' });
    }
    
    // Add customer to request object
    (req as any).customer = customer;
    
    // Log the authentication
    await storage.createActivityLog({
      customerId: customer.id,
      action: 'Customer Portal Authentication',
      details: `Customer ${customer.username} authenticated portal request to ${req.path}`,
      ipAddress: req.ip
    });
    
    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if the user has the required role
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};

// Admin Login handler
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify the password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Log the login
    await storage.createActivityLog({
      userId: user.id,
      action: 'User Login',
      details: `User ${user.username} logged in`,
      ipAddress: req.ip
    });
    
    return res.json({ 
      token: username,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Customer Login handler
export const customerLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    const customer = await storage.getCustomerByUsername(username);
    
    if (!customer) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify the password
    const isPasswordValid = await verifyPassword(password, customer.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Log the login
    await storage.createActivityLog({
      customerId: customer.id,
      action: 'Customer Portal Login',
      details: `Customer ${customer.username} logged in to portal`,
      ipAddress: req.ip
    });
    
    return res.json({ 
      token: username,
      customer: {
        id: customer.id,
        username: customer.username,
        email: customer.email,
        fullName: customer.fullName,
        status: customer.status
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
