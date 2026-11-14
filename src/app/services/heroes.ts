import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Filters, GetHeroesResponse, Hero, NewHeroResponse } from '../interfaces/heroes.interface';
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
    // por ahora los terminos solo se normalizan aca y no viajan como params.

    const params = new HttpParams().set('page', page).set('elements_per_page', itemsPerPage);

    const url = `${environment.url}/api/heroes`;

    return this.http.get<GetHeroesResponse>(url, { params });
  }

  // Obtener un heroe por id
  getHeroById(heroId: string): Observable<Hero> {
    return this.http.get<Hero>(`${this.apiUrl}/${heroId}`);
  }

  // Grabar un nuevo heroe en la db
  addNewHero(newHero: Hero): Observable<NewHeroResponse> {
    return this.http.post<NewHeroResponse>(this.apiUrl, newHero);
  }

  // Editar un heroe por un id dado
  editHero(heroId: string, hero: Hero): Observable<Hero> {
    return this.http.put<Hero>(`${this.apiUrl}/${heroId}`, hero);
  }

  // Eliminar un heroe de la db por un id dado
  deleteHero(heroId: string): Observable<Hero> {
    return this.http.delete<Hero>(`${this.apiUrl}/${heroId}`);
  }
}
