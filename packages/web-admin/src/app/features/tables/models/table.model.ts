export type TableStatus = 'libre' | 'ocupada' | 'reservada'

export interface RestaurantTable {
  id: string
  restaurantId: string
  numero: number
  descripcion: string | null
  capacidad: number
  estado: TableStatus
  createdAt: string
  updatedAt: string
}

export interface CreateTableDto {
  numero: number
  descripcion: string | null
  capacidad: number
  estado: TableStatus
}
