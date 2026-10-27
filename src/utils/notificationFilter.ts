import { PlatformNotification, UserRole, Student, ParentAccount } from '../types';

export interface NotificationFilterContext {
  role: UserRole | 'guest' | null;
  student?: Student | null;
  parent?: ParentAccount | null;
  parentStudents?: Student[];
  selectedChild?: Student | null;
}

/**
 * Checks whether a notification is relevant for the currently active user (Student, Parent, or Staff)
 * Ensures that notifications targeting specific groups, grades, or individual students ONLY appear for those users.
 */
export function isNotificationRelevantForUser(
  notification: PlatformNotification,
  context: NotificationFilterContext
): boolean {
  // If user is teacher or secretary, they see all platform notifications
  if (context.role === 'teacher' || context.role === 'secretary') {
    return true;
  }

  // Normalize helpers for robust matching
  const cleanGrade = (g?: string) => (g ? g.split('(')[0].trim().toLowerCase() : '');
  const cleanGroup = (grp?: string) => (grp ? grp.trim().toLowerCase() : '');

  // 1. Role matching
  if (notification.targetRole && notification.targetRole !== 'all') {
    if (context.role === 'student' && notification.targetRole !== 'student') {
      return false;
    }
    if (context.role === 'parent' && notification.targetRole !== 'parent') {
      return false;
    }
  }

  // 2. Student context matching
  if (context.role === 'student' && context.student) {
    const st = context.student;

    // Direct student ID / code targeting
    if (notification.targetStudentId) {
      if (notification.targetStudentId !== st.id && notification.targetStudentId !== st.code) {
        return false;
      }
    }
    if (notification.targetStudentCode) {
      if (notification.targetStudentCode.trim().toUpperCase() !== st.code.trim().toUpperCase()) {
        return false;
      }
    }

    // Branch targeting
    if (notification.targetBranch && notification.targetBranch !== 'الكل') {
      if (st.branch && st.branch !== notification.targetBranch) {
        return false;
      }
    }

    // Grade targeting
    if (notification.targetGrade && notification.targetGrade !== 'الكل') {
      const stGrade = cleanGrade(st.gradeLevel);
      const targetGrade = cleanGrade(notification.targetGrade);
      if (!stGrade.includes(targetGrade) && !targetGrade.includes(stGrade)) {
        return false;
      }
    }

    // Group targeting (e.g. "مجموعة النخبة" vs "جميع المجموعات")
    if (notification.targetGroup && notification.targetGroup !== 'الكل' && !notification.targetGroup.includes('جميع المجموعات')) {
      const stGrp = cleanGroup(st.groupName);
      const targetGrp = cleanGroup(notification.targetGroup);
      if (stGrp !== targetGrp && !stGrp.includes(targetGrp) && !targetGrp.includes(stGrp)) {
        return false;
      }
    }

    return true;
  }

  // 3. Parent context matching
  if (context.role === 'parent' && context.parent) {
    const children = context.parentStudents && context.parentStudents.length > 0
      ? context.parentStudents
      : (context.selectedChild ? [context.selectedChild] : []);

    if (children.length === 0) {
      // General announcements only if parent has no children loaded
      const isGeneral = !notification.targetStudentCode && 
                        !notification.targetStudentId && 
                        (!notification.targetGroup || notification.targetGroup.includes('جميع المجموعات')) &&
                        (!notification.targetGrade || notification.targetGrade === 'الكل');
      return isGeneral;
    }

    // Parent sees notification if it applies to AT LEAST ONE of their children!
    return children.some(child => {
      if (notification.targetStudentId) {
        if (notification.targetStudentId !== child.id && notification.targetStudentId !== child.code) {
          return false;
        }
      }
      if (notification.targetStudentCode) {
        if (notification.targetStudentCode.trim().toUpperCase() !== child.code.trim().toUpperCase()) {
          return false;
        }
      }

      if (notification.targetBranch && notification.targetBranch !== 'الكل') {
        if (child.branch && child.branch !== notification.targetBranch) {
          return false;
        }
      }

      if (notification.targetGrade && notification.targetGrade !== 'الكل') {
        const childGrade = cleanGrade(child.gradeLevel);
        const targetGrade = cleanGrade(notification.targetGrade);
        if (!childGrade.includes(targetGrade) && !targetGrade.includes(childGrade)) {
          return false;
        }
      }

      if (notification.targetGroup && notification.targetGroup !== 'الكل' && !notification.targetGroup.includes('جميع المجموعات')) {
        const childGrp = cleanGroup(child.groupName);
        const targetGrp = cleanGroup(notification.targetGroup);
        if (childGrp !== targetGrp && !childGrp.includes(targetGrp) && !targetGrp.includes(childGrp)) {
          return false;
        }
      }

      return true;
    });
  }

  // Guest / Unauthenticated: only general platform announcements
  const isGeneral = !notification.targetStudentId && 
                    !notification.targetStudentCode && 
                    (!notification.targetGroup || notification.targetGroup.includes('جميع المجموعات')) && 
                    (!notification.targetGrade || notification.targetGrade === 'الكل');
  return isGeneral;
}
