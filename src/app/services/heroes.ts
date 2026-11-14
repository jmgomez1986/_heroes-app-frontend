import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Filters,
  GetHeroesResponse,
  Hero,
  EditHeroResponse,
  NewHeroResponse,
  UploadImageResponse,
  DeleteHeroResponse,
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

    return this.http.get<GetHeroesResponse>(this.apiUrl, { params });
  }

  // Obtener un heroe por slug
  getHeroBySlug(heroSlug: string): Observable<Hero> {
    return this.http.get<Hero>(`${this.apiUrl}/${heroSlug}`);
  }

  // Grabar un nuevo heroe en la db
  addNewHero(newHero: Hero): Observable<NewHeroResponse> {
    return this.http.post<NewHeroResponse>(this.apiUrl, newHero);
  }

  // Subir la imagen de un heroe por su slug: envia el archivo crudo como binario (max 1 MB en el backend)
  uploadHeroImage(heroSlug: string, file: File): Observable<UploadImageResponse> {
    return this.http.post<UploadImageResponse>(`${this.apiUrl}/${heroSlug}/image`, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
    });
  }

  // Editar un heroe por su slug: PATCH con semantica parcial (el backend aplica solo los campos presentes)
  editHero(heroSlug: string, hero: Hero): Observable<EditHeroResponse> {
    return this.http.patch<EditHeroResponse>(`${this.apiUrl}/${heroSlug}`, hero);
  }

  // Eliminar un heroe de la db por su slug
  deleteHero(heroSlug: string): Observable<DeleteHeroResponse> {
    return this.http.delete<DeleteHeroResponse>(`${this.apiUrl}/${heroSlug}`);
  }
}
