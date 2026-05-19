import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Testimonial } from '@app/core/interfaces/testimonial';
import { TestimonialsService } from '@app/core/service/testimonials-service';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TestimonialsComponent implements OnInit {
  private readonly testimonialsService = inject(TestimonialsService);
  private readonly destroyRef = inject(DestroyRef);

  starsArray = [1, 2, 3, 4, 5];

  testimonials: Testimonial[] = [];

  private readonly fallbackTestimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Adolfo Moreno',
      role: 'Licenciado en Finanzas',
      quote:
        'Éxito Juntos cambió completamente mi perspectiva sobre las inversiones. En menos de 6 meses logré resultados que no habría imaginado por mi cuenta.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
    {
      id: 2,
      name: 'María González',
      role: 'Emprendedora',
      quote:
        'La comunidad es increíble. Aprendí estrategias reales de trading y hoy puedo decir que tengo una fuente de ingreso pasivo estable.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
    {
      id: 3,
      name: 'Carlos Ramírez',
      role: 'Ingeniero de Sistemas',
      quote:
        'Llevaba años buscando algo confiable. La transparencia y el acompañamiento del equipo me dieron la seguridad que necesitaba para dar el primer paso.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
    {
      id: 4,
      name: 'Daniela Fuentes',
      role: 'Diseñadora Freelance',
      quote:
        'Empecé con poca experiencia y la plataforma me guió en cada etapa. Hoy soy parte activa de la red y mis ingresos han crecido mes a mes.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
    {
      id: 5,
      name: 'Jorge Peña',
      role: 'Contador Público',
      quote:
        'Como contador siempre fui escéptico, pero los números no mienten. Éxito Juntos tiene un modelo sólido y resultados verificables.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
    {
      id: 6,
      name: 'Valentina Cruz',
      role: 'Directora Comercial',
      quote:
        'La red de apoyo y las herramientas de análisis son de primer nivel. Es la mejor decisión financiera que he tomado en los últimos años.',
      avatar: 'assets/images/user.png',
      stars: 5,
    },
  ];

  ngOnInit(): void {
    this.testimonialsService
      .getActive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: testimonials => {
          this.testimonials =
            testimonials.length > 0 ? testimonials : this.fallbackTestimonials;
        },
        error: error => {
          console.error('Error al cargar testimonios:', error);
          this.testimonials = this.fallbackTestimonials;
        },
      });
  }

  getStars(stars?: number): number[] {
    const totalStars = Math.min(Math.max(stars ?? 5, 1), 5);
    return this.starsArray.slice(0, totalStars);
  }
}
