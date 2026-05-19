import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Testimonial } from '@app/core/interfaces/testimonial';
import {
  TestimonialPayload,
  TestimonialsService,
} from '@app/core/service/testimonials-service';

@Component({
  selector: 'app-testimonials-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './testimonials-management.component.html',
  styleUrls: ['./testimonials-management.component.scss'],
})
export class TestimonialsManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly testimonialsService = inject(TestimonialsService);
  private readonly toastr = inject(ToastrService);

  protected readonly testimonials = signal<Testimonial[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly saving = signal<boolean>(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    role: ['', [Validators.required, Validators.maxLength(160)]],
    quote: ['', [Validators.required, Validators.maxLength(1200)]],
    avatar: ['', [Validators.maxLength(500)]],
    videoUrl: ['', [Validators.maxLength(500)]],
    stars: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    displayOrder: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadTestimonials();
  }

  protected loadTestimonials(): void {
    this.loading.set(true);

    this.testimonialsService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: testimonials => {
          this.testimonials.set(testimonials);
          this.loading.set(false);
        },
        error: error => {
          console.error('Error al cargar testimonios:', error);
          this.toastr.error('No se pudieron cargar los testimonios', 'Error');
          this.loading.set(false);
        },
      });
  }

  protected saveTestimonial(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const editingId = this.editingId();
    const request$ = editingId
      ? this.testimonialsService.update(editingId, payload)
      : this.testimonialsService.create(payload);

    this.saving.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success(
          editingId
            ? 'Testimonio actualizado correctamente'
            : 'Testimonio creado correctamente',
        );
        this.resetForm();
        this.loadTestimonials();
        this.saving.set(false);
      },
      error: error => {
        console.error('Error al guardar testimonio:', error);
        this.toastr.error('No se pudo guardar el testimonio', 'Error');
        this.saving.set(false);
      },
    });
  }

  protected editTestimonial(testimonial: Testimonial): void {
    this.editingId.set(testimonial.id);
    this.form.patchValue({
      name: testimonial.name,
      role: testimonial.role,
      quote: testimonial.quote,
      avatar: testimonial.avatar || '',
      videoUrl: testimonial.videoUrl || '',
      stars: testimonial.stars || 5,
      displayOrder: testimonial.displayOrder || 0,
      isActive: testimonial.isActive ?? true,
    });
  }

  protected deleteTestimonial(testimonial: Testimonial): void {
    Swal.fire({
      title: '¿Eliminar testimonio?',
      text: `Se eliminará el testimonio de ${testimonial.name}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      this.loading.set(true);
      this.testimonialsService
        .delete(testimonial.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Testimonio eliminado correctamente');
            this.loadTestimonials();
          },
          error: error => {
            console.error('Error al eliminar testimonio:', error);
            this.toastr.error('No se pudo eliminar el testimonio', 'Error');
            this.loading.set(false);
          },
        });
    });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      role: '',
      quote: '',
      avatar: '',
      videoUrl: '',
      stars: 5,
      displayOrder: 0,
      isActive: true,
    });
  }

  protected trackById(_index: number, testimonial: Testimonial): number {
    return testimonial.id;
  }

  private buildPayload(): TestimonialPayload {
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      role: value.role.trim(),
      quote: value.quote.trim(),
      avatar: value.avatar.trim() || 'assets/images/user.png',
      videoUrl: value.videoUrl.trim() || undefined,
      stars: Number(value.stars),
      displayOrder: Number(value.displayOrder),
      isActive: value.isActive,
    };
  }
}
