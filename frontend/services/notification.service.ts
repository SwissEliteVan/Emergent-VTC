import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

export const configureNotifications = () => {
  PushNotification.configure({
    onNotification: (notification) => {
      console.log('Notification reçue:', notification);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });
};

export const sendRideNotification = (title: string, message: string) => {
  PushNotification.localNotification({
    title,
    message,
    channelId: 'ride-channel',
  });
};