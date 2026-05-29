import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Testimonial } from '@app/core/interfaces/testimonial';
import { TestimonialsService } from '@app/core/service/testimonials-service';
import { PublicNavbarComponent } from '@app/shared/components/public-navbar/public-navbar.component';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, PublicNavbarComponent],
})
export class TestimonialsComponent implements OnInit {
  private readonly testimonialsService = inject(TestimonialsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  protected readonly navbarIcon = 'assets/exito-logo.svg';
  readonly starsArray = [1, 2, 3, 4, 5];
  testimonials: Testimonial[] = [];

  ngOnInit(): void {
    this.testimonialsService
      .getActive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: testimonials => {
          this.testimonials =
            testimonials.length > 0 ? testimonials : this.getFallback();
        },
        error: () => {
          this.testimonials = this.getFallback();
        },
      });
  }

  private getFallback(): Testimonial[] {
    const items = this.translate.instant('TESTIMONIALS_PAGE.FALLBACK') as Array<{
      NAME: string;
      ROLE: string;
      QUOTE: string;
    }>;
    if (!Array.isArray(items)) return [];
    return items.map((t, i) => ({
      id: i + 1,
      name: t.NAME,
      role: t.ROLE,
      quote: t.QUOTE,
      avatar: 'assets/images/user.png',
      stars: 5,
    }));
  }

  getStars(stars?: number): number[] {
    const total = Math.min(Math.max(stars ?? 5, 1), 5);
    return this.starsArray.slice(0, total);
  }
}
