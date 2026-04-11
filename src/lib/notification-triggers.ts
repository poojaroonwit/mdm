import { notificationService } from './notification-service';
import { NotificationPriority } from '@/types/notifications';

// Assignment notification triggers
export async function triggerAssignmentNotification(
  assignmentId: string,
  assignedToUserId: string,
  createdByUserId: string,
  title: string,
  description: string,
  type: 'ASSIGNMENT_CREATED' | 'ASSIGNMENT_UPDATED' | 'ASSIGNMENT_COMPLETED',
  priority: NotificationPriority = 'MEDIUM'
) {
  try {
    await notificationService.createAssignmentNotification(
      assignedToUserId,
      assignmentId,
      type,
      title,
      description,
      priority
    );

    // Also notify the creator if it's not the same person
    if (assignedToUserId !== createdByUserId) {
      await notificationService.createAssignmentNotification(
        createdByUserId,
        assignmentId,
        type,
        `Assignment ${type === 'ASSIGNMENT_CREATED' ? 'created' : type === 'ASSIGNMENT_UPDATED' ? 'updated' : 'completed'}`,
        `Assignment "${title}" has been ${type === 'ASSIGNMENT_CREATED' ? 'created' : type === 'ASSIGNMENT_UPDATED' ? 'updated' : 'completed'}`,
        'LOW'
      );
    }
  } catch (error) {
    console.error('Error triggering assignment notification:', error);
  }
}

// Customer notification triggers
export async function triggerCustomerNotification(
  customerId: string,
  customerName: string,
  userId: string,
  type: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED',
  priority: NotificationPriority = 'MEDIUM'
) {
  try {
    await notificationService.createCustomerNotification(
      userId,
      customerId,
      type,
      customerName,
      priority
    );
  } catch (error) {
    console.error('Error triggering customer notification:', error);
  }
}

// User management notification triggers
export async function triggerUserInvitationNotification(
  invitedUserId: string,
  inviterName: string,
  inviterEmail: string
) {
  try {
    await notificationService.createUserNotification(
      invitedUserId,
      'USER_INVITED',
      'You have been invited to join the team',
      `${inviterName} (${inviterEmail}) has invited you to join the Unified Data Platform.`,
      'MEDIUM',
      { inviter_name: inviterName, inviter_email: inviterEmail }
    );
  } catch (error) {
    console.error('Error triggering user invitation notification:', error);
  }
}

export async function triggerUserRoleChangeNotification(
  userId: string,
  newRole: string,
  adminName: string
) {
  try {
    await notificationService.createUserNotification(
      userId,
      'USER_ROLE_CHANGED',
      'Your role has been updated',
      `Your role has been changed to ${newRole} by ${adminName}.`,
      'HIGH',
      { new_role: newRole, admin_name: adminName }
    );
  } catch (error) {
    console.error('Error triggering user role change notification:', error);
  }
}

// System notification triggers
export async function triggerSystemMaintenanceNotification(
  userIds: string[],
  title: string,
  message: string,
  priority: NotificationPriority = 'HIGH',
  expiresAt?: Date
) {
  try {
    const promises = userIds.map(userId =>
      notificationService.createSystemNotification(
        userId,
        'SYSTEM_MAINTENANCE',
        title,
        message,
        priority,
        expiresAt
      )
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error triggering system maintenance notification:', error);
  }
}

// Data job notification triggers
export async function triggerDataJobNotification(
  userId: string,
  jobId: string,
  type: 'DATA_IMPORT_COMPLETED' | 'DATA_EXPORT_COMPLETED',
  status: 'SUCCESS' | 'FAILED',
  message: string,
  priority: NotificationPriority = 'MEDIUM'
) {
  try {
    await notificationService.createDataJobNotification(
      userId,
      type,
      jobId,
      status,
      message,
      priority
    );
  } catch (error) {
    console.error('Error triggering data job notification:', error);
  }
}

// Audit log notification triggers
export async function triggerAuditLogNotification(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  userName: string,
  priority: NotificationPriority = 'LOW'
) {
  try {
    await notificationService.createAuditLogNotification(
      userId,
      action,
      entityType,
      entityId,
      userName,
      priority
    );
  } catch (error) {
    console.error('Error triggering audit log notification:', error);
  }
}

// Bulk notification for all users
export async function triggerBulkNotification(
  userIds: string[],
  type: 'INFO' | 'WARNING' | 'ERROR',
  title: string,
  message: string,
  priority: NotificationPriority = 'MEDIUM'
) {
  try {
    await notificationService.createBulkNotification(
      userIds,
      type,
      title,
      message,
      priority
    );
  } catch (error) {
    console.error('Error triggering bulk notification:', error);
  }
}
