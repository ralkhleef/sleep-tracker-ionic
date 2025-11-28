import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  // Check or ask for notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return true;

      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  }

  // Set a sleepiness reminder in X minutes
  async scheduleSleepinessReminder(minutesFromNow: number): Promise<boolean> {
    const allowed = await this.requestPermission();
    if (!allowed) {
      alert('Notifications are not allowed on this device/browser.');
      return false;
    }

    const when = new Date(Date.now() + minutesFromNow * 60_000);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: 'Time to log your sleepiness ',
            body: 'Open Sleep Tracker and record how you feel right now.',
            schedule: { at: when },
            sound: undefined,
          },
        ],
      });

      return true;
    } catch (e) {
      console.error('Error scheduling notification', e);
      alert('Could not schedule a reminder on this device.');
      return false;
    }
  }
}