// src/app/data/overnight-sleep-data.ts

export class OvernightSleepData {
  sleepStart: Date;
  sleepEnd: Date;

  constructor(sleepStart: Date, sleepEnd: Date) {
    this.sleepStart = sleepStart;
    this.sleepEnd = sleepEnd;
  }

  /** e.g., "Fri, Nov 28, 2025" */
  dateString(): string {
    return this.sleepStart.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /** e.g., "10:45 PM – 6:30 AM · 7.8 h" */
  summaryString(): string {
    const hours = this.durationHours();
    const startTime = this.sleepStart.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = this.sleepEnd.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${startTime} – ${endTime} · ${hours.toFixed(1)} h`;
  }

  private durationHours(): number {
    const diffMs = this.sleepEnd.getTime() - this.sleepStart.getTime();
    return diffMs / (1000 * 60 * 60);
  }
}