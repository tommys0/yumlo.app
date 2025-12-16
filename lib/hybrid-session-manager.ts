import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabase-admin';
import { SessionManager } from './session-manager';

export interface SessionData {
  id: string;
  userId?: string;
  createdAt: Date;
  expiresAt: Date;
  photos: string[];
  status: 'waiting' | 'active' | 'completed' | 'expired';
  photoCount?: number;
}

interface DbSessionData {
  id: string;
  user_id?: string;
  session_id: string;
  created_at: string;
  expires_at: string;
  status: 'waiting' | 'active' | 'completed' | 'expired';
  photo_count: number;
  photos: string[];
}

/**
 * Hybrid Session Manager that falls back to in-memory storage
 * if the database table doesn't exist yet
 */
export class HybridSessionManager {
  private static readonly SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  private static usePersistentStorage: boolean | null = null;

  /**
   * Check if persistent storage is available
   */
  private static async checkPersistentStorage(): Promise<boolean> {
    // Don't cache the result - always check to handle migration scenarios
    // if (this.usePersistentStorage !== null) {
    //   return this.usePersistentStorage;
    // }

    try {
      // Test if photo_sessions table exists
      const { error } = await supabaseAdmin
        .from('photo_sessions')
        .select('count')
        .limit(1);

      const isPersistent = !error;

      if (error) {
        console.warn('⚠️ photo_sessions table not found, falling back to in-memory storage');
        console.warn('💡 Run the migration in supabase-sessions-migration.sql to enable persistent storage');
      } else {
        console.log('✅ Using persistent session storage');
      }

      return isPersistent;
    } catch (err) {
      console.warn('⚠️ Database check failed, using in-memory storage:', err);
      return false;
    }
  }

  /**
   * Create a new photo session
   */
  static async createSession(userId?: string): Promise<SessionData> {
    const isPersistent = await this.checkPersistentStorage();

    if (isPersistent) {
      return this.createPersistentSession(userId);
    } else {
      return this.createInMemorySession(userId);
    }
  }

  /**
   * Get session by session ID
   */
  static async getSession(sessionId: string): Promise<SessionData | null> {
    const isPersistent = await this.checkPersistentStorage();

    if (isPersistent) {
      return this.getPersistentSession(sessionId);
    } else {
      return this.getInMemorySession(sessionId);
    }
  }

  /**
   * Add a photo to an existing session
   */
  static async addPhoto(sessionId: string, photoBase64: string): Promise<boolean> {
    const isPersistent = await this.checkPersistentStorage();

    if (isPersistent) {
      return this.addPhotoPersistent(sessionId, photoBase64);
    } else {
      return this.addPhotoInMemory(sessionId, photoBase64);
    }
  }

  /**
   * Mark session as completed
   */
  static async completeSession(sessionId: string): Promise<SessionData | null> {
    const isPersistent = await this.checkPersistentStorage();

    if (isPersistent) {
      return this.completePersistentSession(sessionId);
    } else {
      return this.completeInMemorySession(sessionId);
    }
  }

  // PERSISTENT STORAGE METHODS
  private static async createPersistentSession(userId?: string): Promise<SessionData> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION_MS);

    const { data, error } = await supabaseAdmin
      .from('photo_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        status: 'waiting',
        photo_count: 0,
        photos: []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating persistent session:', error);
      throw new Error('Failed to create session');
    }

    return this.mapDbToSession(data);
  }

  private static async getPersistentSession(sessionId: string): Promise<SessionData | null> {
    const { data, error } = await supabaseAdmin
      .from('photo_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if session is expired
    if (new Date() > new Date(data.expires_at)) {
      await this.expirePersistentSession(sessionId);
      return null;
    }

    return this.mapDbToSession(data);
  }

  private static async addPhotoPersistent(sessionId: string, photoBase64: string): Promise<boolean> {
    const session = await this.getPersistentSession(sessionId);
    if (!session) return false;

    const newPhotos = [...session.photos, photoBase64];

    const { error } = await supabaseAdmin
      .from('photo_sessions')
      .update({
        photos: newPhotos,
        photo_count: newPhotos.length,
        status: 'active'
      })
      .eq('session_id', sessionId);

    return !error;
  }

  private static async completePersistentSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.getPersistentSession(sessionId);
    if (!session) return null;

    const { data, error } = await supabaseAdmin
      .from('photo_sessions')
      .update({ status: 'completed' })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return null;
    }

    return this.mapDbToSession(data);
  }

  private static async expirePersistentSession(sessionId: string): Promise<void> {
    await supabaseAdmin
      .from('photo_sessions')
      .update({ status: 'expired' })
      .eq('session_id', sessionId);
  }

  // IN-MEMORY STORAGE METHODS (FALLBACK)
  private static createInMemorySession(userId?: string): SessionData {
    return SessionManager.createSession(userId);
  }

  private static getInMemorySession(sessionId: string): SessionData | null {
    return SessionManager.getSession(sessionId);
  }

  private static addPhotoInMemory(sessionId: string, photoBase64: string): boolean {
    return SessionManager.addPhoto(sessionId, photoBase64);
  }

  private static completeInMemorySession(sessionId: string): SessionData | null {
    return SessionManager.completeSession(sessionId);
  }

  // UTILITY METHODS
  private static mapDbToSession(data: DbSessionData): SessionData {
    return {
      id: data.session_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      photos: Array.isArray(data.photos) ? data.photos : [],
      status: data.status,
      photoCount: data.photo_count
    };
  }
}