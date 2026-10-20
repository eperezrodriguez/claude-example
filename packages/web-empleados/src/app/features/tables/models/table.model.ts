export type TableStatus = 'libre' | 'ocupada' | 'reservada'

export interface Table {
  id: string
  restaurantId: string
  numero: number
  descripcion: string | null
  capacidad: number
  estado: TableStatus
}

export interface UpdateTableStatusDto {
  estado: TableStatus
}

export const TABLE_STATUSES: TableStatus[] = ['libre', 'ocupada', 'reservada']
