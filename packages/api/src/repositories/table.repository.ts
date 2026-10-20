import { Database } from '@config/database.js'
import type { Table } from '@models/table.model.js'

export interface TableFilters {
    estado?: Table['estado']
    capacidadMin?: number
}

export interface TableRepository {
    findById(id: string): Promise<Table | null>
    findByRestaurantId(restaurantId: string, filters?: TableFilters): Promise<Table[]>
    findByNumero(restaurantId: string, numero: number): Promise<Table | null>
    save(table: Table): Promise<void>
    delete(id: string): Promise<void>
    /** Atomic libre -> ocupada. Returns false if the table was not libre. */
    occupyIfFree(id: string, updatedAt: string): Promise<boolean>
}

const SELECT = 'SELECT id, restaurant_id as restaurantId, numero, descripcion, capacidad, estado, created_at as createdAt, updated_at as updatedAt FROM tables'

export class SqliteTableRepository implements TableRepository {
    constructor(private db: Database) {}

    async findById(id: string): Promise<Table | null> {
        const row = await this.db.get<Table>(`${SELECT} WHERE id = ?`, [id])
        return row ? this.map(row) : null
    }

    async findByRestaurantId(restaurantId: string, filters: TableFilters = {}): Promise<Table[]> {
        let sql = `${SELECT} WHERE restaurant_id = ?`
        const params: any[] = [restaurantId]
        if (filters.estado) {
            sql += ' AND estado = ?'
            params.push(filters.estado)
        }
        if (filters.capacidadMin !== undefined) {
            sql += ' AND capacidad >= ?'
            params.push(filters.capacidadMin)
        }
        sql += ' ORDER BY numero ASC'
        const rows = await this.db.all<Table>(sql, params)
        return rows.map(r => this.map(r))
    }

    async findByNumero(restaurantId: string, numero: number): Promise<Table | null> {
        const row = await this.db.get<Table>(`${SELECT} WHERE restaurant_id = ? AND numero = ?`, [restaurantId, numero])
        return row ? this.map(row) : null
    }

    async save(table: Table): Promise<void> {
        const existing = await this.findById(table.id)
        if (existing) {
            await this.db.run(
                'UPDATE tables SET numero = ?, descripcion = ?, capacidad = ?, estado = ?, updated_at = ? WHERE id = ?',
                [table.numero, table.descripcion, table.capacidad, table.estado, table.updatedAt, table.id]
            )
        } else {
            await this.db.run(
                'INSERT INTO tables (id, restaurant_id, numero, descripcion, capacidad, estado, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [table.id, table.restaurantId, table.numero, table.descripcion, table.capacidad, table.estado, table.createdAt, table.updatedAt]
            )
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.run('DELETE FROM tables WHERE id = ?', [id])
    }

    async occupyIfFree(id: string, updatedAt: string): Promise<boolean> {
        const result = await this.db.run(
            "UPDATE tables SET estado = 'ocupada', updated_at = ? WHERE id = ? AND estado = 'libre'",
            [updatedAt, id]
        )
        return result.changes > 0
    }

    private map(row: Table): Table {
        return { ...row, descripcion: row.descripcion ?? null }
    }
}
