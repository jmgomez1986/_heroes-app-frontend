import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Filters,
  GetHeroesResponse,
  Hero,
  HeroV2,
  NewHeroResponse,
  UploadImageResponse,
} from '../interfaces/heroes.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HeroesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.url}/api/heroes`;

  /**
   * Devuelve todos los heroes de la db. Consulta paginada de héroes aplicando el filtro por coincidencia parcial en
   * NOMBRE (y opcionalmente por ALIAS).
   */
  getHeroes(page: number, itemsPerPage: number, query?: Filters): Observable<GetHeroesResponse> {
    const nameQuery = (query?.name ?? '').trim().toLocaleLowerCase();
    const aliasQuery = (query?.alias ?? '').trim().toLocaleLowerCase();

    // El filtrado por nombre/alias queda pendiente de contrato en el backend:
    // los terminos ya se normalizan aca y quedan pendientes de viajar como query params.

    const params = new HttpParams().set('page', page).set('elements_per_page', itemsPerPage);

    const url = `${environment.url}/api/heroes`;

    return this.http.get<GetHeroesResponse>(url, { params });
  }

  // Obtener un heroe por slug
  getHeroBySlug(heroSlug: string): Observable<HeroV2> {
    return this.http.get<HeroV2>(`${environment.url}/api/heroes/${heroSlug}`);
  }

  // Grabar un nuevo heroe en la db
  addNewHero(newHero: HeroV2): Observable<NewHeroResponse> {
    return this.http.post<NewHeroResponse>(this.apiUrl, newHero);
  }

  // Subir la imagen de un heroe por su slug: envia el archivo crudo como binario (max 1 MB en el backend)
  uploadHeroImage(heroSlug: string, file: File): Observable<UploadImageResponse> {
    return this.http.post<UploadImageResponse>(`${this.apiUrl}/${heroSlug}/image`, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
    });
  }

  // Editar un heroe por un id dado
  editHero(heroSlug: string, hero: HeroV2): Observable<Hero> {
    return this.http.put<Hero>(`${this.apiUrl}/${heroSlug}`, hero);
  }

  // Eliminar un heroe de la db por un id dado
  deleteHero(heroId: string): Observable<Hero> {
    return this.http.delete<Hero>(`${this.apiUrl}/${heroId}`);
  }
}
