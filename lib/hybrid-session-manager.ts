import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabase-admin';

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
 * Session Manager with persistent database storage
 */
export class HybridSessionManager {
  private static readonly SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Create a new photo session
   */
  static async createSession(userId?: string): Promise<SessionData> {
    return this.createPersistentSession(userId);
  }

  /**
   * Get session by session ID
   */
  static async getSession(sessionId: string): Promise<SessionData | null> {
    return this.getPersistentSession(sessionId);
  }

  /**
   * Add a photo to an existing session
   */
  static async addPhoto(sessionId: string, photoBase64: string): Promise<boolean> {
    return this.addPhotoPersistent(sessionId, photoBase64);
  }

  /**
   * Mark session as completed
   */
  static async completeSession(sessionId: string): Promise<SessionData | null> {
    return this.completePersistentSession(sessionId);
  }

  // DATABASE STORAGE METHODS
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