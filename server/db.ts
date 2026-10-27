import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = process.env.DATABASE_PATH 
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(DATA_DIR, 'glary.db');

export const db = new DatabaseSync(DB_FILE);

// Initialize Tables
export function initDatabase() {
  // 1. Staff users table (teacher and secretary with bcrypt hashed passwords)
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      security_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      group_name TEXT NOT NULL,
      phone TEXT,
      parent_phone TEXT,
      password TEXT,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Parents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Study Materials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      category TEXT,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Video Lectures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Quizzes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Student Quiz Results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      data_json TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Platform Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Student Groups table (Damietta and Kafr Saad)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      schedule TEXT NOT NULL,
      grade_level TEXT NOT NULL,
      monthly_price REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Live Group Attendance table (NFC + manual check-in)
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_attendance (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_code TEXT NOT NULL,
      nfc_card_code TEXT,
      date TEXT NOT NULL,
      exact_time TEXT NOT NULL,
      homework_status TEXT NOT NULL DEFAULT 'completed',
      recitation_score REAL DEFAULT 10,
      recitation_max_score REAL DEFAULT 10,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default staff accounts with bcrypt password hashes if not present
  seedDefaultStaff();
  seedDefaultGroups();
}

function seedDefaultGroups() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM student_groups').get() as { c: number })?.c || 0;
  if (count === 0) {
    const insertGroup = db.prepare(`
      INSERT INTO student_groups (id, name, location, schedule, grade_level, monthly_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertGroup.run('grp-1', 'مجموعة النخبة (دمياط)', 'دمياط', 'الأحد والأربعاء - 5:00 م', 'الصف الثالث الثانوي', 350, 'مجموعة متميزة لطلاب الثانوية العامة بدمياط');
    insertGroup.run('grp-2', 'مجموعة أوائل كفر سعد', 'كفر سعد', 'السبت والثلاثاء - 4:30 م', 'الصف الثالث الثانوي', 300, 'سنتر الأوائل - كفر سعد');
    insertGroup.run('grp-3', 'مجموعة التفوق اللغوي (دمياط)', 'دمياط', 'الإثنين والخميس - 6:00 م', 'الصف الثاني الثانوي', 300, 'قاعة التفوق - دمياط الجديدة');
    insertGroup.run('grp-4', 'مجموعة الأمل بكفر سعد', 'كفر سعد', 'الأحد والأربعاء - 3:30 م', 'الصف الأول الثانوي', 280, 'مجموعة تأسيس لغوي مكثف');
    console.log('✅ SQLite: Initial Student Groups seeded successfully.');
  }
}

function seedDefaultStaff() {
  const checkTeacher = db.prepare('SELECT id FROM staff_users WHERE role = ?').get('teacher') as { id: string } | undefined;
  if (!checkTeacher) {
    const saltRounds = 10;
    const defaultTeacherHash = bcrypt.hashSync('ahmed2026', saltRounds);
    const insertTeacher = db.prepare(`
      INSERT INTO staff_users (id, role, username, password_hash, security_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertTeacher.run('staff-teacher-1', 'teacher', 'ahmed', defaultTeacherHash, '202600');
    console.log('✅ SQLite: Default Teacher account seeded with secure bcrypt hash.');
  }

  const checkSec = db.prepare('SELECT id FROM staff_users WHERE role = ?').get('secretary') as { id: string } | undefined;
  if (!checkSec) {
    const saltRounds = 10;
    const defaultSecHash = bcrypt.hashSync('sec2026', saltRounds);
    const insertSec = db.prepare(`
      INSERT INTO staff_users (id, role, username, password_hash, security_key, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertSec.run('staff-sec-1', 'secretary', 'secretary', defaultSecHash, '102030');
    console.log('✅ SQLite: Default Secretary account seeded with secure bcrypt hash.');
  }
}

// Staff user queries
export function getStaffUserByRole(role: string): {
  id: string;
  role: string;
  username: string;
  password_hash: string;
  security_key: string;
} | null {
  const row = db.prepare('SELECT id, role, username, password_hash, security_key FROM staff_users WHERE role = ?').get(role);
  return (row as any) || null;
}

export function updateStaffCredentials(
  role: string,
  username?: string,
  newPassword?: string,
  securityKey?: string
): boolean {
  const user = getStaffUserByRole(role);
  if (!user) return false;

  const newUsername = username ? username.trim() : user.username;
  const newHash = newPassword ? bcrypt.hashSync(newPassword.trim(), 10) : user.password_hash;
  const newKey = securityKey ? securityKey.trim() : user.security_key;

  const stmt = db.prepare(`
    UPDATE staff_users 
    SET username = ?, password_hash = ?, security_key = ?, updated_at = datetime('now')
    WHERE role = ?
  `);
  stmt.run(newUsername, newHash, newKey, role);
  return true;
}

// Student queries
export function getAllStudents(): any[] {
  const rows = db.prepare('SELECT data_json FROM students').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveStudents(students: any[]): void {
  if (!Array.isArray(students)) return;
  const upsert = db.prepare(`
    INSERT INTO students (id, code, full_name, grade_level, group_name, phone, parent_phone, password, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code,
      full_name = excluded.full_name,
      grade_level = excluded.grade_level,
      group_name = excluded.group_name,
      phone = excluded.phone,
      parent_phone = excluded.parent_phone,
      password = excluded.password,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const s of students) {
    if (!s || !s.id) continue;
    upsert.run(
      s.id,
      s.code || s.id,
      s.fullName || '',
      s.gradeLevel || '',
      s.groupName || '',
      s.phone || '',
      s.parentPhone || '',
      s.password || '123456',
      JSON.stringify(s)
    );
  }
}

export function deleteStudent(id: string): void {
  db.prepare('DELETE FROM students WHERE id = ?').run(id);
}

// Parents queries
export function getAllParents(): any[] {
  const rows = db.prepare('SELECT data_json FROM parents').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveParents(parents: any[]): void {
  if (!Array.isArray(parents)) return;
  const upsert = db.prepare(`
    INSERT INTO parents (id, phone, full_name, password_hash, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      phone = excluded.phone,
      full_name = excluded.full_name,
      password_hash = excluded.password_hash,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const p of parents) {
    if (!p || !p.id) continue;
    upsert.run(
      p.id,
      p.phone || p.id,
      p.fullName || '',
      p.passwordHash || '',
      JSON.stringify(p)
    );
  }
}

// Materials queries
export function getAllMaterials(): any[] {
  const rows = db.prepare('SELECT data_json FROM materials').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveMaterials(materials: any[]): void {
  if (!Array.isArray(materials)) return;
  const upsert = db.prepare(`
    INSERT INTO materials (id, title, grade_level, category, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      grade_level = excluded.grade_level,
      category = excluded.category,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const m of materials) {
    if (!m || !m.id) continue;
    upsert.run(
      m.id,
      m.title || '',
      m.gradeLevel || '',
      m.category || '',
      JSON.stringify(m)
    );
  }
}

export function deleteMaterial(id: string): void {
  db.prepare('DELETE FROM materials WHERE id = ?').run(id);
}

// Videos queries
export function getAllVideos(): any[] {
  const rows = db.prepare('SELECT data_json FROM videos').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveVideos(videos: any[]): void {
  if (!Array.isArray(videos)) return;
  const upsert = db.prepare(`
    INSERT INTO videos (id, title, grade_level, data_json, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      grade_level = excluded.grade_level,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const v of videos) {
    if (!v || !v.id) continue;
    upsert.run(v.id, v.title || '', v.gradeLevel || '', JSON.stringify(v));
  }
}

export function deleteVideo(id: string): void {
  db.prepare('DELETE FROM videos WHERE id = ?').run(id);
}

// Quizzes queries
export function getAllQuizzes(): any[] {
  const rows = db.prepare('SELECT data_json FROM quizzes').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveQuizzes(quizzes: any[]): void {
  if (!Array.isArray(quizzes)) return;
  const upsert = db.prepare(`
    INSERT INTO quizzes (id, title, grade_level, data_json, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      grade_level = excluded.grade_level,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const q of quizzes) {
    if (!q || !q.id) continue;
    upsert.run(q.id, q.title || '', q.gradeLevel || '', JSON.stringify(q));
  }
}

export function deleteQuiz(id: string): void {
  db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
}

// Quiz Results queries
export function getAllQuizResults(): any[] {
  const rows = db.prepare('SELECT data_json FROM quiz_results').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveQuizResults(results: any[]): void {
  if (!Array.isArray(results)) return;
  const upsert = db.prepare(`
    INSERT INTO quiz_results (id, student_id, quiz_id, data_json, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      student_id = excluded.student_id,
      quiz_id = excluded.quiz_id,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const r of results) {
    if (!r || !r.id) continue;
    upsert.run(r.id, r.studentId || '', r.quizId || '', JSON.stringify(r));
  }
}

// Notifications queries
export function getAllNotifications(): any[] {
  const rows = db.prepare('SELECT data_json FROM notifications').all() as { data_json: string }[];
  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function saveNotifications(notifications: any[]): void {
  if (!Array.isArray(notifications)) return;
  const upsert = db.prepare(`
    INSERT INTO notifications (id, title, data_json, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      data_json = excluded.data_json,
      updated_at = datetime('now')
  `);

  for (const n of notifications) {
    if (!n || !n.id) continue;
    upsert.run(n.id, n.title || '', JSON.stringify(n));
  }
}

export function deleteNotification(id: string): void {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
}

// Settings queries
export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}

export function saveSettings(settingsMap: Record<string, string>): void {
  if (!settingsMap || typeof settingsMap !== 'object') return;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `);

  for (const [k, v] of Object.entries(settingsMap)) {
    upsert.run(k, String(v));
  }
}

// Student Groups queries
export function getAllStudentGroups(): any[] {
  const rows = db.prepare('SELECT id, name, location, schedule, grade_level, monthly_price, notes, created_at, updated_at FROM student_groups ORDER BY created_at ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    location: r.location,
    schedule: r.schedule,
    gradeLevel: r.grade_level,
    monthlyPrice: Number(r.monthly_price) || 0,
    notes: r.notes || '',
    createdAt: r.created_at
  }));
}

export function saveStudentGroup(group: any): any {
  if (!group || !group.name || !group.location) return null;
  const id = group.id || `grp-${Date.now()}`;
  const upsert = db.prepare(`
    INSERT INTO student_groups (id, name, location, schedule, grade_level, monthly_price, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      location = excluded.location,
      schedule = excluded.schedule,
      grade_level = excluded.grade_level,
      monthly_price = excluded.monthly_price,
      notes = excluded.notes,
      updated_at = datetime('now')
  `);
  upsert.run(
    id,
    group.name,
    group.location,
    group.schedule || '',
    group.gradeLevel || group.grade_level || '',
    Number(group.monthlyPrice || group.monthly_price) || 0,
    group.notes || ''
  );
  return { ...group, id };
}

export function deleteStudentGroup(id: string): void {
  db.prepare('DELETE FROM student_groups WHERE id = ?').run(id);
}

// Group Attendance queries
export function getGroupAttendance(groupId: string, date?: string): any[] {
  let query = 'SELECT * FROM group_attendance WHERE group_id = ?';
  const params: any[] = [groupId];
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    groupId: r.group_id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentCode: r.student_code,
    nfcCardCode: r.nfc_card_code,
    date: r.date,
    exactTime: r.exact_time,
    homeworkStatus: r.homework_status,
    recitationScore: Number(r.recitation_score) || 0,
    recitationMaxScore: Number(r.recitation_max_score) || 10,
    notes: r.notes || '',
    createdAt: r.created_at
  }));
}

export function saveGroupAttendanceRecord(record: any): any {
  if (!record || !record.groupId || !record.studentId) return null;
  const id = record.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const upsert = db.prepare(`
    INSERT INTO group_attendance (
      id, group_id, student_id, student_name, student_code, nfc_card_code, 
      date, exact_time, homework_status, recitation_score, recitation_max_score, notes, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      homework_status = excluded.homework_status,
      recitation_score = excluded.recitation_score,
      recitation_max_score = excluded.recitation_max_score,
      exact_time = excluded.exact_time,
      notes = excluded.notes
  `);

  upsert.run(
    id,
    record.groupId,
    record.studentId,
    record.studentName || '',
    record.studentCode || '',
    record.nfcCardCode || '',
    record.date,
    record.exactTime || '',
    record.homeworkStatus || 'completed',
    Number(record.recitationScore) || 0,
    Number(record.recitationMaxScore) || 10,
    record.notes || ''
  );

  return { ...record, id };
}

export function deleteGroupAttendanceRecord(id: string): void {
  db.prepare('DELETE FROM group_attendance WHERE id = ?').run(id);
}

