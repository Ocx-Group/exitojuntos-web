import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { map } from 'rxjs/operators';
import { Response } from '@app/core/models/response-model/response.model';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private readonly urlApi: string;
  public readonly http: HttpClient = inject(HttpClient);

  constructor() {
    this.urlApi = environment.apiUrl;
  }

  getCountries() {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      }),
    };
    return this.http
      .get<Response>(this.urlApi.concat('/countries'), options)
      .pipe(
        map(response => {
          console.log('getCountries response:', response);
          if (response && response.success && response.data) {
            return response.data;
          } else {
            console.error('ERROR - Invalid countries response:', response);
            return null;
          }
        }),
      );
  }
}
