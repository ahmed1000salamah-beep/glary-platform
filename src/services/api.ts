/**
 * API Service for Glary Platform
 * Communicates with the Node.js / Express backend server.
 * Handles server-side bcrypt-authenticated JWT sessions, SQLite data sync, and server-side Gemini AI calls.
 */
import { StudentGroup, GroupDailyAttendance } from '../types';

const TOKEN_KEY = 'glary_staff_jwt';

export interface AuthUser {
  id: string;
  role: 'teacher' | 'secretary';
  username: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

class ApiService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  public getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  public clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  // 1. Staff Login (Server-side password verification with bcrypt)
  public async login(role: 'teacher' | 'secretary', username: string, password: string): Promise<LoginResult> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ role, username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        this.setToken(data.token);
        return {
          success: true,
          message: data.message,
          token: data.token,
          user: data.user,
        };
      }
      return {
        success: false,
        message: data.message || 'بيانات الدخول غير صحيحة!',
      };
    } catch (err: any) {
      console.warn('API login network error, fallback to local verification if server is unreachable:', err);
      return {
        success: false,
        message: 'تعذر الاتصال بالسيرفر، يرجى التأكد من تشغيل الخادم.',
      };
    }
  }

  // 2. Staff Password Reset (Server-side security key verification & bcrypt re-hashing)
  public async resetPassword(
    role: 'teacher' | 'secretary',
    username: string,
    securityKey: string,
    newPassword: string
  ): Promise<ResetPasswordResult> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ role, username, securityKey, newPassword }),
      });
      const data = await res.json();
      return {
        success: data.success ?? res.ok,
        message: data.message || (res.ok ? 'تم إعادة تعيين كلمة المرور بنجاح.' : 'فشل إعادة التعيين.'),
      };
    } catch {
      return {
        success: false,
        message: 'حدث خطأ في الاتصال بالسيرفر أثناء إعادة تعيين كلمة المرور.',
      };
    }
  }

  // 3. Verify current token
  public async verifyToken(): Promise<{ success: boolean; user?: AuthUser }> {
    const token = this.getToken();
    if (!token) return { success: false };

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(true),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, user: data.user };
      }
      this.clearToken();
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  // 4. Update credentials (Protected endpoint)
  public async updateCredentials(payload: {
    role: 'teacher' | 'secretary';
    username?: string;
    newPassword?: string;
    securityKey?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'فشل التحديث في السيرفر.' };
    }
  }

  // 5. Hydrate all platform collections from SQLite
  public async fetchAllData(): Promise<any | null> {
    try {
      const res = await fetch('/api/data/all');
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
      return null;
    } catch (err) {
      console.warn('Could not fetch from backend SQLite database:', err);
      return null;
    }
  }

  // 6. Sync data changes to SQLite
  public async syncData(dataPayload: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch('/api/data/sync', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(dataPayload),
      });
      return res.ok;
    } catch (err) {
      console.warn('Sync to SQLite failed:', err);
      return false;
    }
  }

  // 7. Server-side Gemini AI generation (API key never exposed to client)
  public async generateAiText(prompt: string, systemInstruction?: string): Promise<{ success: boolean; text?: string; message?: string }> {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ prompt, systemInstruction }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'فشل الاتصال بخدمة الذكاء الاصطناعي على السيرفر.',
      };
    }
  }

  // 8. Server-side Gemini AI Student Performance Analysis
  public async analyzeStudent(studentData: {
    studentName: string;
    gradeLevel?: string;
    attendanceCount?: number;
    examScores?: any[];
    vocabScores?: any[];
    notes?: any[];
  }): Promise<{ success: boolean; analysis?: string; message?: string }> {
    try {
      const res = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(studentData),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: 'فشل التحليل الذكي من السيرفر.',
      };
    }
  }

  // 9. Groups API
  public async fetchGroups(): Promise<StudentGroup[]> {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const json = await res.json();
        return json.groups || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public async saveGroup(group: StudentGroup): Promise<boolean> {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(group),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async deleteGroup(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // 10. Attendance API
  public async fetchGroupAttendance(groupId: string, date?: string): Promise<GroupDailyAttendance[]> {
    try {
      let url = `/api/groups/${groupId}/attendance`;
      if (date) url += `?date=${encodeURIComponent(date)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.records || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public async saveGroupAttendance(record: GroupDailyAttendance): Promise<boolean> {
    try {
      const res = await fetch(`/api/groups/${record.groupId}/attendance`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async deleteGroupAttendance(groupId: string, id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/groups/${groupId}/attendance/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchStorageStats(): Promise<any | null> {
    try {
      const res = await fetch('/api/system/storage');
      const data = await res.json();
      return data.success ? data.storage : null;
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();
