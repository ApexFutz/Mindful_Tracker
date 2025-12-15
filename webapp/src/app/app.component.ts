import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface MoodEntry { id?: string; moodScore: number; notes: string; timestamp: number; }
interface TriggerItem { id?: string; name: string; timestamp: number; }
interface CravingsItem { id?: string; name: string; timestamp: number; }

type AppView = 'log' | 'history' | 'triggers' | 'cravings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
      <header class="text-center space-y-1">
        <h1 class="text-3xl font-extrabold text-indigo-700">Mindful Tracker (Local)</h1>
        <p class="text-gray-500">Local demo version — no Firebase required</p>
      </header>

      <div class="text-xs text-gray-400 text-center truncate p-2 border border-gray-100 rounded-lg">
        Local demo user
      </div>

      <nav class="grid grid-cols-4 gap-2 p-1 bg-gray-100 rounded-xl">
        <button (click)="currentView='log'" [class.bg-white]="currentView==='log'" class="py-2 text-sm font-medium rounded-xl">Log</button>
        <button (click)="currentView='history'" [class.bg-white]="currentView==='history'" class="py-2 text-sm font-medium rounded-xl">History ({{moodEntries.length}})</button>
        <button (click)="currentView='triggers'" [class.bg-white]="currentView==='triggers'" class="py-2 text-sm font-medium rounded-xl">Triggers ({{triggers.length}})</button>
        <button (click)="currentView='cravings'" [class.bg-white]="currentView==='cravings'" class="py-2 text-sm font-medium rounded-xl">Cravings ({{cravings.length}})</button>
      </nav>

      <div class="pt-4">
        <div *ngIf="currentView==='log'">
          <h2 class="text-xl font-semibold text-gray-800">How are you feeling right now?</h2>
          <div class="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div class="text-center">
              <span class="text-5xl font-bold text-indigo-600">{{newEntryScore}}</span>
              <p class="text-gray-600 mt-1">{{moodDescription}}</p>
            </div>
            <input type="range" min="1" max="10" [(ngModel)]="newEntryScore" class="w-full h-2 bg-indigo-200 rounded-lg" />
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Notes / Context</label>
              <textarea rows="3" [(ngModel)]="newEntryNotes" class="w-full border rounded-lg p-3" placeholder="E.g., I just finished a workout, feeling great!"></textarea>
            </div>
            <button (click)="logMood()" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Log My Mood</button>
            <p *ngIf="successMessage" class="text-green-600 text-center mt-2">{{successMessage}}</p>
          </div>
        </div>

        <div *ngIf="currentView==='history'">
          <h2 class="text-xl font-semibold text-gray-800">Mood History</h2>
          <p *ngIf="moodEntries.length===0" class="text-gray-500 text-center py-4">No entries logged yet.</p>
          <ul *ngIf="moodEntries.length>0" class="space-y-3">
            <li *ngFor="let entry of sortedEntries" class="p-4 bg-white border rounded-xl">
              <div class="flex justify-between items-center mb-1">
                <span class="text-lg font-bold">Score: {{entry.moodScore}}</span>
                <span class="text-sm text-gray-500">{{formatDate(entry.timestamp)}}</span>
              </div>
              <p *ngIf="entry.notes" class="text-gray-600 italic text-sm">"{{entry.notes}}"</p>
            </li>
          </ul>
        </div>

        <div *ngIf="currentView==='triggers'">
          <h2 class="text-xl font-semibold text-gray-800">My Emotional Triggers</h2>
          <div class="flex space-x-2">
            <input [(ngModel)]="newTriggerName" class="flex-1 border rounded-lg p-3" placeholder="Add a new trigger" />
            <button (click)="addTrigger()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">Add</button>
          </div>
          <ul *ngIf="triggers.length>0" class="space-y-2 pt-2">
            <li *ngFor="let t of triggers" class="flex justify-between p-3 bg-gray-100 rounded-lg">
              <span>{{t.name}}</span>
              <button (click)="deleteItem(t, 'trigger')" class="text-red-500">Delete</button>
            </li>
          </ul>
        </div>

        <div *ngIf="currentView==='cravings'">
          <h2 class="text-xl font-semibold text-gray-800">My Recurring Cravings</h2>
          <div class="flex space-x-2">
            <input [(ngModel)]="newCravingsName" class="flex-1 border rounded-lg p-3" placeholder="Add a new craving" />
            <button (click)="addCravings()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">Add</button>
          </div>
          <ul *ngIf="cravings.length>0" class="space-y-2 pt-2">
            <li *ngFor="let c of cravings" class="flex justify-between p-3 bg-gray-100 rounded-lg">
              <span>{{c.name}}</span>
              <button (click)="deleteItem(c, 'cravings')" class="text-red-500">Delete</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class App {
  currentView: AppView = 'log';

  newEntryScore = 5;
  newEntryNotes = '';
  moodEntries: MoodEntry[] = JSON.parse(localStorage.getItem('moodEntries') || '[]');

  newTriggerName = '';
  triggers: TriggerItem[] = JSON.parse(localStorage.getItem('triggers') || '[]');

  newCravingsName = '';
  cravings: CravingsItem[] = JSON.parse(localStorage.getItem('cravings') || '[]');

  successMessage: string | null = null;

  get sortedEntries() {
    return [...this.moodEntries].sort((a, b) => b.timestamp - a.timestamp);
  }

  get moodDescription() {
    const score = this.newEntryScore;
    if (score === 1) return 'Deep Distress / Crisis';
    if (score <= 3) return 'Very Low / Struggling';
    if (score <= 5) return 'Neutral / Stable';
    if (score <= 7) return 'Good / Positive';
    if (score <= 9) return 'Very Happy / Energized';
    if (score === 10) return 'Peak State / Excellent';
    return '';
  }

  logMood() {
    const entry: MoodEntry = { moodScore: this.newEntryScore, notes: this.newEntryNotes.trim(), timestamp: Date.now() };
    this.moodEntries.push(entry);
    localStorage.setItem('moodEntries', JSON.stringify(this.moodEntries));
    this.newEntryScore = 5;
    this.newEntryNotes = '';
    this.successMessage = 'Mood logged locally';
    setTimeout(() => this.successMessage = null, 2500);
  }

  addTrigger() {
    if (!this.newTriggerName.trim()) return;
    const item = { name: this.newTriggerName.trim(), timestamp: Date.now() };
    this.triggers.push(item);
    localStorage.setItem('triggers', JSON.stringify(this.triggers));
    this.newTriggerName = '';
  }

  addCravings() {
    if (!this.newCravingsName.trim()) return;
    const item = { name: this.newCravingsName.trim(), timestamp: Date.now() };
    this.cravings.push(item);
    localStorage.setItem('cravings', JSON.stringify(this.cravings));
    this.newCravingsName = '';
  }

  deleteItem(item: any, type: 'trigger' | 'cravings') {
    if (type === 'trigger') {
      this.triggers = this.triggers.filter(t => t !== item);
      localStorage.setItem('triggers', JSON.stringify(this.triggers));
    } else {
      this.cravings = this.cravings.filter(c => c !== item);
      localStorage.setItem('cravings', JSON.stringify(this.cravings));
    }
  }

  formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString();
  }
}
