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

export class PersistentSessionManager {
  private static readonly SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Create a new photo session with persistent storage
   */
  static async createSession(userId?: string): Promise<SessionData> {
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
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }

    return this.mapDbToSession(data);
  }

  /**
   * Get session by session ID
   */
  static async getSession(sessionId: string): Promise<SessionData | null> {
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
      // Mark as expired in database
      await this.expireSession(sessionId);
      return null;
    }

    return this.mapDbToSession(data);
  }

  /**
   * Add a photo to an existing session
   */
  static async addPhoto(sessionId: string, photoBase64: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
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

    if (error) {
      console.error('Error adding photo:', error);
      return false;
    }

    return true;
  }

  /**
   * Mark session as completed
   */
  static async completeSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const { data, error } = await supabaseAdmin
      .from('photo_sessions')
      .update({ status: 'completed' })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error completing session:', error);
      return null;
    }

    return this.mapDbToSession(data);
  }

  /**
   * Mark session as expired
   */
  private static async expireSession(sessionId: string): Promise<void> {
    await supabaseAdmin
      .from('photo_sessions')
      .update({ status: 'expired' })
      .eq('session_id', sessionId);
  }

  /**
   * Get all active (non-expired) sessions
   */
  static async getActiveSessions(): Promise<SessionData[]> {
    const { data, error } = await supabaseAdmin
      .from('photo_sessions')
      .select('*')
      .neq('status', 'expired')
      .gt('expires_at', new Date().toISOString());

    if (error || !data) {
      console.error('Error fetching active sessions:', error);
      return [];
    }

    return data.map(this.mapDbToSession);
  }

  /**
   * Clean up expired sessions (call periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabaseAdmin.rpc('cleanup_expired_sessions');

    if (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Map database row to SessionData interface
   */
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