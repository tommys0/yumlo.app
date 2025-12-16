import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  id: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
  photos: string[];
  status: 'waiting' | 'active' | 'completed' | 'expired';
}

// In-memory store (v produkci by bylo Redis/databáze)
const sessions = new Map<string, SessionData>();

export class SessionManager {
  static createSession(userId?: string): SessionData {
    const id = uuidv4();
    const session: SessionData = {
      id,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minut expiration
      photos: [],
      status: 'waiting'
    };

    sessions.set(id, session);

    // Auto-cleanup po expiraci
    setTimeout(() => {
      sessions.delete(id);
    }, 10 * 60 * 1000);

    return session;
  }

  static getSession(sessionId: string): SessionData | null {
    const session = sessions.get(sessionId);

    if (!session) return null;

    // Check expiration
    if (new Date() > session.expiresAt) {
      sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  static addPhoto(sessionId: string, photoBase64: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.photos.push(photoBase64);
    session.status = 'active';
    sessions.set(sessionId, session);

    return true;
  }

  static completeSession(sessionId: string): SessionData | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.status = 'completed';
    sessions.set(sessionId, session);

    return session;
  }

  static getActiveSessions(): SessionData[] {
    return Array.from(sessions.values()).filter(s => s.status !== 'expired');
  }
}