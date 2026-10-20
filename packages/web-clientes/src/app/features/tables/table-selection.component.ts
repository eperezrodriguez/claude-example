import { Component, inject, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { TableService } from '../../core/services/table.service'
import { RestaurantService } from '../../core/services/restaurant.service'
import { CartStore } from '../../core/store/cart.store'
import { Restaurant } from '../../core/models/restaurant.model'
import { Table } from '../../core/models/table.model'

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <a routerLink="/restaurants" class="back-link">← Volver a restaurantes</a>
        <h1>{{ restaurant()?.name || 'Reserva tu mesa' }}</h1>
        <p>Indica cuántas personas sois y elige una mesa</p>
      </div>

      <div class="card people-box">
        <label for="personas">Número de personas</label>
        <input id="personas" type="number" min="1" step="1" [value]="personas()"
               (input)="onPersonasInput($any($event.target).value)" />
        <button class="btn btn-primary" [disabled]="!validPersonas() || loading()" (click)="search()">
          Ver mesas disponibles
        </button>
      </div>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (searched()) {
        @if (loading()) {
          <div class="spinner"></div>
        } @else if (tables().length === 0) {
          <div class="empty-state card"><p>No hay mesas disponibles para {{ personas() }} personas</p></div>
        } @else {
          <div class="tables-grid">
            @for (table of tables(); track table.id) {
              <button type="button" class="table-card card" [class.selected]="selected()?.id === table.id"
                      (click)="selected.set(table)">
                <strong>Mesa {{ table.numero }}</strong>
                <span>{{ table.capacidad }} personas</span>
                @if (table.descripcion) {
                  <span class="desc">{{ table.descripcion }}</span>
                }
              </button>
            }
          </div>
          <button class="btn btn-primary continue" [disabled]="!selected() || occupying()" (click)="continue()">
            @if (occupying()) { Reservando... } @else { Continuar }
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; }
    .back-link { font-size: 13px; color: var(--text-muted); display: inline-block; margin-bottom: 8px; }
    .people-box { display: flex; align-items: center; gap: 12px; padding: 16px 20px; margin-bottom: 20px; flex-wrap: wrap; }
    .people-box input { width: 90px; }
    .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .table-card { display: flex; flex-direction: column; gap: 4px; padding: 16px; text-align: left; cursor: pointer; }
    .table-card.selected { border-color: var(--green-light); }
    .table-card .desc { color: var(--text-muted); font-size: 13px; }
  `]
})
export class TableSelectionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly tableService = inject(TableService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly cartStore = inject(CartStore)

  private restaurantId = ''
  readonly restaurant = signal<Restaurant | null>(null)
  readonly personas = signal(2)
  readonly tables = signal<Table[]>([])
  readonly selected = signal<Table | null>(null)
  readonly searched = signal(false)
  readonly loading = signal(false)
  readonly occupying = signal(false)
  readonly error = signal<string | null>(null)

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id')!
    this.restaurantService.getById(this.restaurantId).subscribe({
      next: (r) => this.restaurant.set(r),
      error: () => {}
    })
  }

  validPersonas(): boolean {
    const n = this.personas()
    return Number.isInteger(n) && n >= 1
  }

  onPersonasInput(value: string): void {
    this.personas.set(Number(value))
    this.selected.set(null)
    this.searched.set(false)
  }

  search(): void {
    if (!this.validPersonas()) return
    this.loading.set(true)
    this.searched.set(true)
    this.error.set(null)
    this.selected.set(null)
    this.tableService.getAvailable(this.restaurantId, this.personas()).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        this.loading.set(false)
      },
      error: () => {
        this.tables.set([])
        this.error.set('Error al cargar las mesas')
        this.loading.set(false)
      }
    })
  }

  continue(): void {
    const table = this.selected()
    if (!table) return
    this.occupying.set(true)
    this.error.set(null)
    this.tableService.occupy(this.restaurantId, table.id, this.personas()).subscribe({
      next: () => {
        this.cartStore.setTable(this.restaurantId, table.id)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err: HttpErrorResponse) => {
        this.occupying.set(false)
        if (err.status === 409) {
          this.search()
          this.error.set('Esa mesa acaba de ser ocupada. Elige otra.')
        } else if (err.status === 400) {
          this.error.set('La mesa no tiene capacidad suficiente.')
        } else {
          this.error.set('No se pudo reservar la mesa. Inténtalo de nuevo.')
        }
      }
    })
  }
}
