import { Injectable } from '@angular/core';
import { SleepData } from '../data/sleep-data';
import { OvernightSleepData } from '../data/overnight-sleep-data';
import { StanfordSleepinessData } from '../data/stanford-sleepiness-data';

@Injectable({
  providedIn: 'root',
})
export class SleepService {
  private static LoadDefaultData = true;

  // All logged data
  // NOTE: use any[] here so OvernightSleepData + StanfordSleepinessData can both live in this array
  public static AllSleepData: any[] = [];
  public static AllOvernightData: OvernightSleepData[] = [];
  public static AllSleepinessData: StanfordSleepinessData[] = [];

  // Current saved bed time (waiting for wake time)
  private static currentSleepStart: Date | null = null;

  // localStorage keys
  private readonly OVERNIGHT_KEY = 'sleeptracker_overnight';
  private readonly SLEEPINESS_KEY = 'sleeptracker_sleepiness';
  private readonly CURRENT_START_KEY = 'sleeptracker_current_start';

  constructor() {
    if (SleepService.LoadDefaultData) {
      SleepService.LoadDefaultData = false;
      this.loadFromStorage();
    }
  }

  // ---------- STORAGE ----------

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    // Save overnight sleep
    const overnightRaw = SleepService.AllOvernightData.map(
      (o: OvernightSleepData) => ({
        sleepStart: o.sleepStart ? o.sleepStart.toISOString() : null,
        sleepEnd: o.sleepEnd ? o.sleepEnd.toISOString() : null,
      }),
    );
    localStorage.setItem(this.OVERNIGHT_KEY, JSON.stringify(overnightRaw));

    // Save sleepiness
    const sleepinessRaw = SleepService.AllSleepinessData.map(
      (s: StanfordSleepinessData) => ({
        loggedAt: s.loggedAt ? s.loggedAt.toISOString() : null,
        value: s.value,
      }),
    );
    localStorage.setItem(this.SLEEPINESS_KEY, JSON.stringify(sleepinessRaw));

    // Save current bed time
    if (SleepService.currentSleepStart) {
      localStorage.setItem(
        this.CURRENT_START_KEY,
        SleepService.currentSleepStart.toISOString(),
      );
    } else {
      localStorage.removeItem(this.CURRENT_START_KEY);
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    // Reset arrays
    SleepService.AllSleepData = [];
    SleepService.AllOvernightData = [];
    SleepService.AllSleepinessData = [];
    SleepService.currentSleepStart = null;

    // Load overnight data
    const overnightJson = localStorage.getItem(this.OVERNIGHT_KEY);
    if (overnightJson) {
      try {
        const raw = JSON.parse(overnightJson) as any[];
        raw.forEach((r) => {
          if (!r.sleepStart || !r.sleepEnd) return;
          const start = new Date(r.sleepStart);
          const end = new Date(r.sleepEnd);
          const entry = new OvernightSleepData(start, end);
          SleepService.AllOvernightData.push(entry);
          SleepService.AllSleepData.push(entry);
        });
      } catch {
        // bad saved data, skip
      }
    }

    // Load sleepiness data
    const sleepinessJson = localStorage.getItem(this.SLEEPINESS_KEY);
    if (sleepinessJson) {
      try {
        const raw = JSON.parse(sleepinessJson) as any[];
        raw.forEach((r) => {
          if (r.value == null) return;
          const when = r.loggedAt ? new Date(r.loggedAt) : new Date();
          const entry = new StanfordSleepinessData(r.value, when);
          SleepService.AllSleepinessData.push(entry);
          SleepService.AllSleepData.push(entry);
        });
      } catch {
        // bad saved data, skip
      }
    }

    // Load current bed time
    const currentStart = localStorage.getItem(this.CURRENT_START_KEY);
    if (currentStart) {
      SleepService.currentSleepStart = new Date(currentStart);
    }
  }

  // ---------- OVERNIGHT ----------

  // Save bed time
  public setSleepStart(start: Date): void {
    SleepService.currentSleepStart = start;
    this.saveToStorage();
  }

  // Get saved bed time
  public getCurrentSleepStart(): Date | null {
    return SleepService.currentSleepStart;
  }

  // Finish an overnight entry when wake time is chosen
  public completeSleep(end: Date): OvernightSleepData | null {
    if (!SleepService.currentSleepStart) {
      return null;
    }

    const start = SleepService.currentSleepStart;
    if (end <= start) {
      return null;
    }

    const data = new OvernightSleepData(start, end);
    SleepService.AllSleepData.push(data);
    SleepService.AllOvernightData.push(data);
    SleepService.currentSleepStart = null;
    this.saveToStorage();
    return data;
  }

  // ---------- SLEEPINESS ----------

  // Log one sleepiness entry
  public logSleepinessData(sleepData: StanfordSleepinessData): void {
    SleepService.AllSleepData.push(sleepData);
    SleepService.AllSleepinessData.push(sleepData);
    this.saveToStorage();
  }

  // ---------- DELETE (HISTORY) ----------

  // Delete one overnight entry
  public deleteOvernight(entry: OvernightSleepData): void {
    SleepService.AllOvernightData = SleepService.AllOvernightData.filter(
      (d) => d !== entry,
    );
    SleepService.AllSleepData = SleepService.AllSleepData.filter(
      (d: any) => d !== entry,
    );
    this.saveToStorage();
  }

  // Delete one sleepiness entry
  public deleteSleepiness(entry: StanfordSleepinessData): void {
    SleepService.AllSleepinessData = SleepService.AllSleepinessData.filter(
      (d) => d !== entry,
    );
    SleepService.AllSleepData = SleepService.AllSleepData.filter(
      (d: any) => d !== entry,
    );
    this.saveToStorage();
  }

  // ---------- GETTERS ----------

  // Keep the return type as SleepData[] for the rest of the app,
  // but internally we store it as any[]
  public getAllSleepData(): SleepData[] {
    return SleepService.AllSleepData as SleepData[];
  }

  public getAllOvernightData(): OvernightSleepData[] {
    return SleepService.AllOvernightData;
  }

  public getAllSleepinessData(): StanfordSleepinessData[] {
    return SleepService.AllSleepinessData;
  }
}