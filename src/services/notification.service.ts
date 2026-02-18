import prisma from '../config/database';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

/**
 * Create in-app notification
 * Note: This is a basic implementation. You can extend with a notifications table later.
 */
export async function createNotification(data: NotificationData): Promise<void> {
  // For Phase 1, we'll just log notifications
  // In Phase 2, you can create a notifications table and store them
  
  console.log(`[NOTIFICATION] ${data.type}: ${data.title} - ${data.message}`, data);
  
  // TODO: Store in notifications table when needed
  // await prisma.notification.create({ data: { ... } });
}

/**
 * Send notification for application status change
 */
export async function notifyApplicationStatus(
  userId: string,
  status: string,
  reason?: string
): Promise<void> {
  const messages: Record<string, { title: string; message: string }> = {
    SUBMITTED: {
      title: 'Application Submitted',
      message: 'Your player application has been submitted successfully. Trial will be assigned soon.',
    },
    UNDER_REVIEW: {
      title: 'Under Review',
      message: 'Your application is being reviewed by admin.',
    },
    APPROVED: {
      title: 'Application Approved!',
      message: 'Congratulations! You are now a registered player.',
    },
    REJECTED: {
      title: 'Application Rejected',
      message: reason || 'Your application has been rejected. Please check the reason and resubmit.',
    },
    HOLD: {
      title: 'Application on Hold',
      message: reason || 'Your application is on hold. Please complete required actions.',
    },
  };

  const notification = messages[status];
  if (notification) {
    await createNotification({
      userId,
      type: 'APPLICATION_STATUS',
      title: notification.title,
      message: notification.message,
      data: { status, reason },
    });
  }
}

/**
 * Send notification for trial assignment
 */
export async function notifyTrialAssignment(
  userId: string,
  trialDate: Date,
  coachName?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'TRIAL_ASSIGNED',
    title: 'Trial Assigned',
    message: `Your trial has been scheduled. ${coachName ? `Coach: ${coachName}. ` : ''}Date: ${trialDate.toLocaleDateString()}`,
    data: { trialDate, coachName },
  });
}

/**
 * Send notification for document verification
 */
export async function notifyDocumentVerification(
  userId: string,
  documentType: string,
  status: string,
  reason?: string
): Promise<void> {
  const messages: Record<string, string> = {
    VERIFIED: `Your ${documentType} has been verified.`,
    REJECTED: `Your ${documentType} was rejected. ${reason || 'Please upload a clearer copy.'}`,
  };

  await createNotification({
    userId,
    type: 'DOCUMENT_VERIFICATION',
    title: 'Document Verification',
    message: messages[status] || `Your ${documentType} status: ${status}`,
    data: { documentType, status, reason },
  });
}
