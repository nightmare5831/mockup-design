
import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeNotification } from '@/store/slices/uiSlice';
import { toast } from '@/hooks/use-toast';

const NotificationDisplay = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.ui);

  useEffect(() => {
    notifications.forEach((notification) => {
      toast({
        title: notification.type === 'success' ? 'Success' : 
               notification.type === 'error' ? 'Error' : 'Info',
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });

      // Remove notification after showing
      dispatch(removeNotification(notification.id));
    });
  }, [notifications, dispatch]);

  return null;
};

export default NotificationDisplay;
