import { randomUUID } from 'crypto'
import type { Table, TableStatus } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'
import type { TableRepository, TableFilters } from '@repositories/table.repository.js'
import type { RestaurantRepository } from '@repositories/restaurant.repository.js'
import {
    TableNotFoundError,
    RestaurantNotFoundError,
    InvalidTableNumberError,
    InvalidTableCapacityError,
    DuplicateTableNumberError,
    TableNotAvailableError,
    TableCapacityExceededError
} from '@errors/DomainErrors.js'

export interface TableDTO {
    numero: number
    descripcion?: string | null
    capacidad: number
    estado?: TableStatus
}

export interface TableFilterInput {
    estado?: string | undefined
    capacidadMin?: number | undefined
}

const isPositiveInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0

export class TableService {
    constructor(
        private readonly tableRepository: TableRepository,
        private readonly restaurantRepository: RestaurantRepository
    ) {}

    async create(restaurantId: string, dto: TableDTO): Promise<Table> {
        await this.ensureRestaurant(restaurantId)
        this.validate(dto)
        await this.ensureNumeroFree(restaurantId, dto.numero)
        const now = new Date().toISOString()
        const table: Table = {
            id: randomUUID(),
            restaurantId,
            numero: dto.numero,
            descripcion: dto.descripcion ?? null,
            capacidad: dto.capacidad,
            estado: dto.estado === undefined ? 'libre' : normalizeTableStatus(dto.estado),
            createdAt: now,
            updatedAt: now
        }
        await this.tableRepository.save(table)
        return table
    }

    async update(restaurantId: string, id: string, dto: TableDTO): Promise<Table> {
        const existing = await this.getById(restaurantId, id)
        this.validate(dto)
        await this.ensureNumeroFree(restaurantId, dto.numero, id)
        const updated: Table = {
            ...existing,
            numero: dto.numero,
            descripcion: dto.descripcion ?? null,
            capacidad: dto.capacidad,
            estado: dto.estado === undefined ? existing.estado : normalizeTableStatus(dto.estado),
            updatedAt: new Date().toISOString()
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async getById(restaurantId: string, id: string): Promise<Table> {
        const table = await this.tableRepository.findById(id)
        if (!table || table.restaurantId !== restaurantId) throw new TableNotFoundError()
        return table
    }

    async list(restaurantId: string, filters: TableFilterInput = {}): Promise<Table[]> {
        await this.ensureRestaurant(restaurantId)
        const f: TableFilters = {}
        if (filters.estado !== undefined) f.estado = normalizeTableStatus(filters.estado)
        if (filters.capacidadMin !== undefined) {
            if (!isPositiveInt(filters.capacidadMin)) throw new InvalidTableCapacityError()
            f.capacidadMin = filters.capacidadMin
        }
        return this.tableRepository.findByRestaurantId(restaurantId, f)
    }

    async listAvailable(restaurantId: string, personas?: number): Promise<Table[]> {
        await this.ensureRestaurant(restaurantId)
        if (personas !== undefined && !isPositiveInt(personas)) throw new InvalidTableCapacityError()
        const filters: TableFilters = { estado: 'libre' }
        if (personas !== undefined) filters.capacidadMin = personas
        const tables = await this.tableRepository.findByRestaurantId(restaurantId, filters)
        return tables.sort((a, b) => a.capacidad - b.capacidad || a.numero - b.numero)
    }

    async delete(restaurantId: string, id: string): Promise<void> {
        await this.getById(restaurantId, id)
        await this.tableRepository.delete(id)
    }

    async updateStatus(restaurantId: string, id: string, estado: unknown): Promise<Table> {
        const existing = await this.getById(restaurantId, id)
        const updated: Table = { ...existing, estado: normalizeTableStatus(estado), updatedAt: new Date().toISOString() }
        await this.tableRepository.save(updated)
        return updated
    }

    async occupy(restaurantId: string, id: string, personas?: number): Promise<Table> {
        const table = await this.getById(restaurantId, id)
        if (personas !== undefined && personas !== null) {
            if (!isPositiveInt(personas)) throw new InvalidTableCapacityError()
            if (personas > table.capacidad) throw new TableCapacityExceededError()
        }
        const ok = await this.tableRepository.occupyIfFree(id, new Date().toISOString())
        if (!ok) throw new TableNotAvailableError()
        return this.getById(restaurantId, id)
    }

    private validate(dto: TableDTO): void {
        if (!isPositiveInt(dto.numero)) throw new InvalidTableNumberError()
        if (!isPositiveInt(dto.capacidad)) throw new InvalidTableCapacityError()
    }

    private async ensureNumeroFree(restaurantId: string, numero: number, selfId?: string): Promise<void> {
        const other = await this.tableRepository.findByNumero(restaurantId, numero)
        if (other && other.id !== selfId) throw new DuplicateTableNumberError()
    }

    private async ensureRestaurant(restaurantId: string): Promise<void> {
        if (!(await this.restaurantRepository.findById(restaurantId))) throw new RestaurantNotFoundError()
    }
}
