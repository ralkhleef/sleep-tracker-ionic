import { Component, OnInit } from '@angular/core';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonList,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonFooter,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SleepService } from '../services/sleep.service';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { NgFor, NgIf, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../services/reminder.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButton,
    IonList,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSegment,
    IonSegmentButton,
    IonFooter,
    IonToolbar,
    NgFor,
    NgIf,
    NgClass,
    FormsModule,
    DatePipe,
  ],
})
export class HomePage implements OnInit {
  // Which tab is active
  currentTab: 'overnight' | 'sleepiness' | 'history' = 'overnight';

  // Overnight picks
  bedSelection: string = new Date().toISOString();
  wakeSelection: string = new Date().toISOString();

  // Sleepiness log
  sleepinessValue = 3;
  sleepinessTime: string = new Date().toISOString();

  // Reminder in hours
  reminderHours = 4;

  // Theme toggle (night = dark, day = light)
  isNight = false;

  // Streak
  streakCount = 0;

  constructor(
    public sleepService: SleepService,
    private reminderService: ReminderService,
  ) {}

  ngOnInit(): void {
    this.updateThemeByTimeOrPreference();
    this.updateStreakFromEntries();
  }

  // ---------- THEME HELPERS ----------

  /** Decide initial theme from saved preference or current time */
  private updateThemeByTimeOrPreference() {
    const saved = localStorage.getItem('sleepTheme');
    if (saved === 'night' || saved === 'day') {
      this.isNight = saved === 'night';
    } else {
      const hour = new Date().getHours(); // 0–23
      // Night: before 7am or after 7pm
      this.isNight = hour < 7 || hour >= 19;
    }
    this.applyThemeToBody();
  }

  /** Apply a body class so global.scss can style alerts / modals per theme */
  private applyThemeToBody() {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(this.isNight ? 'theme-dark' : 'theme-light');
  }

  /** Called by the little sun/moon button */
  toggleTheme() {
    this.isNight = !this.isNight;
    localStorage.setItem('sleepTheme', this.isNight ? 'night' : 'day');
    this.applyThemeToBody();
  }

  // Hero image (swap based on theme)
  get heroImage(): string {
    // Make sure these files exist in: src/assets/
    // overnight-moon.svg  and overnight-sun.svg
    return this.isNight
      ? 'assets/overnight-moon.svg'
      : 'assets/overnight-sun.svg';
  }

  // Subtitle under heading (changes with tab)
  get headerSub(): string {
    if (this.currentTab === 'overnight') {
      return 'Log when you went to bed and when you woke up.';
    }
    if (this.currentTab === 'sleepiness') {
      return 'Track how sleepy you feel during the day.';
    }
    return 'Review or delete your past logs.';
  }

  // ---------- Streak helpers ----------

  get hasOvernightLogs(): boolean {
    return this.overnightEntries.length > 0;
  }

  private getEntryDate(e: OvernightSleepData): Date {
    // Prefer end time if available, otherwise start
    return (e.sleepEnd ?? e.sleepStart) as Date;
  }

  private dayOnly(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private updateStreakFromEntries(): void {
    const entries = [...this.overnightEntries];
    if (!entries.length) {
      this.streakCount = 0;
      return;
    }

    // Sort newest → oldest by sleep date
    entries.sort(
      (a, b) =>
        this.getEntryDate(b).getTime() - this.getEntryDate(a).getTime(),
    );

    const dayMs = 24 * 60 * 60 * 1000;
    let streak = 1;
    let prevDay = this.dayOnly(this.getEntryDate(entries[0]));

    for (let i = 1; i < entries.length; i++) {
      const currDay = this.dayOnly(this.getEntryDate(entries[i]));
      const diffDays = Math.round(
        (prevDay.getTime() - currDay.getTime()) / dayMs,
      );

      if (diffDays === 1) {
        streak++;
        prevDay = currDay;
      } else {
        break; // gap in days → streak stops
      }
    }

    this.streakCount = streak;
  }

  // ---------- Overnight helpers ----------

  get currentSleepStart() {
    return this.sleepService.getCurrentSleepStart();
  }

  saveBedTime() {
    const start = new Date(this.bedSelection);
    this.sleepService.setSleepStart(start);
    alert(
      'Saved sleep time: ' +
        start.toLocaleString() +
        '. You can log wake-up later.',
    );
  }

  saveWakeTime() {
    const end = new Date(this.wakeSelection);
    const start = this.sleepService.getCurrentSleepStart();

    if (!start) {
      alert('You need to save a sleep time first.');
      return;
    }

    if (end <= start) {
      alert('Wake-up time must be after your sleep time.');
      return;
    }

    const result = this.sleepService.completeSleep(end);
    if (result) {
      alert('Overnight sleep saved for ' + result.dateString());
      // Recompute streak whenever we successfully save a new overnight log
      this.updateStreakFromEntries();
    }
  }

  get overnightEntries(): OvernightSleepData[] {
    return this.sleepService.getAllOvernightData();
  }

  get latestOvernight(): OvernightSleepData | null {
    const arr = this.overnightEntries;
    if (!arr.length) return null;
    return arr[arr.length - 1];
  }

  get latestSleepHours(): number | null {
    const last = this.latestOvernight;
    if (!last) return null;

    const start: Date = last.sleepStart;
    const end: Date = last.sleepEnd;
    if (!start || !end) return null;

    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10;
  }

  get latestLabel(): string {
    const h = this.latestSleepHours;
    if (h == null) return 'No data yet';
    if (h >= 8) return 'Well rested';
    if (h >= 6) return 'Okay night';
    if (h >= 4) return 'Short sleep';
    return 'Running on fumes';
  }

  // ---------- Sleepiness tab ----------

  addSleepiness() {
    const when = new Date(this.sleepinessTime);
    this.sleepService.logSleepinessData(
      new StanfordSleepinessData(this.sleepinessValue, when),
    );
  }

  quickSetSleepiness(v: number) {
    this.sleepinessValue = v;
  }

  async scheduleReminder() {
    const minutes = this.reminderHours * 60;
    const ok = await this.reminderService.scheduleSleepinessReminder(minutes);
    if (ok) {
      alert(
        `Reminder set for about ${this.reminderHours} hour(s) from now to log your sleepiness.`,
      );
    }
  }

  // ---------- History tab ----------

  get sleepinessEntries() {
    return this.sleepService.getAllSleepinessData();
  }

  deleteOvernight(entry: OvernightSleepData) {
    this.sleepService.deleteOvernight(entry);
    this.updateStreakFromEntries(); // streak might change if you delete
  }

  deleteSleepiness(entry: StanfordSleepinessData) {
    this.sleepService.deleteSleepiness(entry);
  }
}