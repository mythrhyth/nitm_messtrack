import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { usersRepository } from '../repositories/users.repository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345-nitm-messtrack-app-production-key';

export class AuthService {
  async login(username: string, password: string) {
    const norm = username.trim();
    let user = await usersRepository.findByUsername(norm);
    if (!user) {
      user = await usersRepository.findByUsername(norm.toUpperCase());
    }
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId,
        studentName: user.student?.name || null
      }
    };
  }

  async getMe(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      studentId: user.studentId,
      studentName: user.student?.name || null
    };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const matched = await bcrypt.compare(oldPass, user.password);
    if (!matched) {
      throw new Error('Incorrect old password');
    }
    const hashed = await bcrypt.hash(newPass, 10);
    await usersRepository.updatePassword(userId, hashed);
    return { success: true };
  }
}

export const authService = new AuthService();

