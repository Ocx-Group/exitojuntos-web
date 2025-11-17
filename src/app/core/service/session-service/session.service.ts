import { Injectable, NgZone, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly idleTimeout = 30 * 60 * 1000;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly userActivity = new Subject<void>();
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.listenToUserActivity();
    this.startTimer();
  }

  private listenToUserActivity(): void {
    this.ngZone.runOutsideAngular(() => {
      const events = ['mousemove', 'keypress', 'scroll'] as const;

      for (const event of events) {
        globalThis.addEventListener(event, () =>
          this.ngZone.run(() => this.userHasBeenActive()),
        );
      }
    });
  }

  private userHasBeenActive(): void {
    this.userActivity.next();
  }

  private startTimer(): void {
    this.userActivity
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.idleTimer) {
          clearTimeout(this.idleTimer);
        }
        this.idleTimer = setTimeout(() => {
          this.router.navigate(['/signin']);
        }, this.idleTimeout);
      });
  }
}
