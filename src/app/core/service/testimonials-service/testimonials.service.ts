import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { Response } from '@app/core/models/response-model/response.model';
import { Testimonial } from '@app/core/interfaces/testimonial';

export type TestimonialPayload = Omit<
  Testimonial,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

@Injectable({
  providedIn: 'root',
})
export class TestimonialsService {
  private readonly baseUrl = `${environment.apiUrl}/testimonials`;

  constructor(private readonly http: HttpClient) {}

  getActive(): Observable<Testimonial[]> {
    return this.http
      .get<Response<Testimonial[]>>(this.baseUrl)
      .pipe(map(response => response.data || []));
  }

  getAll(): Observable<Testimonial[]> {
    return this.http
      .get<Response<Testimonial[]>>(`${this.baseUrl}/admin`)
      .pipe(map(response => response.data || []));
  }

  create(payload: TestimonialPayload): Observable<Testimonial> {
    return this.http
      .post<Response<Testimonial>>(this.baseUrl, payload)
      .pipe(map(response => response.data));
  }

  update(
    id: number,
    payload: Partial<TestimonialPayload>,
  ): Observable<Testimonial> {
    return this.http
      .patch<Response<Testimonial>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map(response => response.data));
  }

  delete(id: number): Observable<Response<{ message: string }>> {
    return this.http.delete<Response<{ message: string }>>(
      `${this.baseUrl}/${id}`,
    );
  }
}
