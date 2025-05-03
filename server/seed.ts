import { db } from './db';
import { users, plans, customers } from '@shared/schema';
import * as crypto from 'crypto';

// Function to hash a password
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Seed the database with initial data
export async function seedDatabase() {
  console.log('Checking if seed data is needed...');
  
  // Check if admin user exists
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    console.log('Seeding admin user...');
    
    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      password: hashPassword('admin123'),
      email: 'admin@radius-isp.com',
      fullName: 'Administrator',
      role: 'admin'
    });
    
    // Create sample plans
    console.log('Seeding sample plans...');
    await db.insert(plans).values([
      {
        name: 'Basic',
        description: 'Basic internet plan for everyday use',
        price: 29.99,
        downloadSpeed: 10,
        uploadSpeed: 2,
        dataLimit: 100
      },
      {
        name: 'Standard',
        description: 'Standard internet plan for families',
        price: 49.99,
        downloadSpeed: 50,
        uploadSpeed: 10,
        dataLimit: 500
      },
      {
        name: 'Premium',
        description: 'Premium high-speed internet for power users',
        price: 79.99,
        downloadSpeed: 100,
        uploadSpeed: 20,
        dataLimit: 1000
      },
      {
        name: 'Business',
        description: 'Business class internet with guaranteed uptime',
        price: 149.99,
        downloadSpeed: 200,
        uploadSpeed: 50,
        dataLimit: 2000
      }
    ]);
    
    console.log('Seed completed successfully');
  } else {
    console.log('Database already contains data, skipping seed');
  }
}