import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  GetHeroesResponse,
  Hero,
  EditHeroResponse,
  NewHeroResponse,
  UploadImageResponse,
  DeleteHeroResponse,
  HeroStatsResponse,
  HeroPayload,
} from '../interfaces/heroes.interface';
import { environment } from '../environments/environment';
import { FiltersQuery } from '../interfaces/heroesFilters.interface';

@Injectable({
  providedIn: 'root',
})
export class HeroesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.url}/api/heroes`;

  /**
   * Devuelve todos los heroes de la db. Consulta paginada con filtros opcionales
   * por los filtros del formulario. Único punto de serialización
   * Filters → query params: solo viajan los filtros con valor.
   */
  getHeroes(
    page: number,
    itemsPerPage: number,
    query?: FiltersQuery,
  ): Observable<GetHeroesResponse> {
    let params = new HttpParams().set('page', page).set('elements_per_page', itemsPerPage);

    // Trim acá: la URL y la request quedan canónicas en un solo lugar.
    // Solo viajan los filtros con valor; el orden es estable para el contrato.
    const filterKeys = ['name', 'alias', 'team', 'universe', 'category', 'status'] as const;
    for (const key of filterKeys) {
      const value = (query?.[key] ?? '').trim();
      if (value) params = params.set(key, value);
    }

    return this.http.get<GetHeroesResponse>(this.apiUrl, { params });
  }

  // Obtener un heroe por slug
  getHeroBySlug(heroSlug: string): Observable<Hero> {
    return this.http.get<Hero>(`${this.apiUrl}/${heroSlug}`);
  }

  // Contadores del catálogo (GET /heroes/stats). El endpoint puede no existir
  // todavía: el consumidor degrada con gracia ocultando la sección (ver HeroesPage).
  getStats(): Observable<HeroStatsResponse> {
    return this.http.get<HeroStatsResponse>(`${this.apiUrl}/stats`);
  }

  // Grabar un nuevo heroe en la db
  addNewHero(newHero: HeroPayload): Observable<NewHeroResponse> {
    return this.http.post<NewHeroResponse>(this.apiUrl, newHero);
  }

  // Subir la imagen de un heroe por su slug: envia el archivo crudo como binario (max 1 MB en el backend)
  uploadHeroImage(heroSlug: string, file: File): Observable<UploadImageResponse> {
    return this.http.post<UploadImageResponse>(`${this.apiUrl}/${heroSlug}/image`, file, {
      headers: new HttpHeaders({ 'Content-Type': file.type }),
    });
  }

  // Editar un heroe por su slug: PATCH con semantica parcial (el backend aplica solo los campos presentes)
  editHero(heroSlug: string, hero: Partial<HeroPayload>): Observable<EditHeroResponse> {
    return this.http.patch<EditHeroResponse>(`${this.apiUrl}/${heroSlug}`, hero);
  }

  // Eliminar un heroe de la db por su slug
  deleteHero(heroSlug: string): Observable<DeleteHeroResponse> {
    return this.http.delete<DeleteHeroResponse>(`${this.apiUrl}/${heroSlug}`);
  }
}
