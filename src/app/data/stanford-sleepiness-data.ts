// src/app/data/stanford-sleepiness-data.ts

export class StanfordSleepinessData {
  value: number;
  loggedAt: Date;

  constructor(value: number, loggedAt: Date) {
    this.value = value;
    this.loggedAt = loggedAt;
  }

  /** e.g., "11/28/2025, 10:32 PM" */
  dateString(): string {
    return this.loggedAt.toLocaleString();
  }

  /** Simple summary text for history list */
  summaryString(): string {
    return `Stanford sleepiness level ${this.value}`;
  }
}