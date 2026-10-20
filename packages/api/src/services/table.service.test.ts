import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import { MockRestaurantRepository } from '@repositories/mocks/MockRestaurantRepository.js'
import type { Restaurant } from '@models/restaurant.model.js'

const restaurant: Restaurant = {
    id: 'r1', name: 'R', address: 'A', email: 'a@b.com', phone: '123456789',
    ownerFirstName: 'O', ownerLastName: 'L', logoUrl: null, createdAt: 'x', updatedAt: 'x'
}

describe('TableService', () => {
    let repo: MockTableRepository
    let service: TableService

    beforeEach(async () => {
        repo = new MockTableRepository()
        const restRepo = new MockRestaurantRepository()
        await restRepo.save(restaurant)
        service = new TableService(repo, restRepo)
    })

    const dto = { numero: 1, descripcion: 'Ventana', capacidad: 4 }

    describe('create', () => {
        it('creates a libre table by default', async () => {
            const t = await service.create('r1', dto)
            expect(t.id).toBeDefined()
            expect(t.estado).toBe('libre')
            expect(t.restaurantId).toBe('r1')
            expect(await repo.findById(t.id)).not.toBeNull()
        })

        it('stores null descripcion when omitted', async () => {
            const t = await service.create('r1', { numero: 2, capacidad: 2 })
            expect(t.descripcion).toBeNull()
        })

        it('rejects unknown restaurant', async () => {
            await expect(service.create('nope', dto)).rejects.toThrow('Restaurant not found')
        })

        it.each([0, -1, 1.5, '3', undefined])('rejects invalid numero %s', async (numero) => {
            await expect(service.create('r1', { ...dto, numero: numero as any })).rejects.toThrow('Table number')
        })

        it.each([0, -1, 2.5, null])('rejects invalid capacidad %s', async (capacidad) => {
            await expect(service.create('r1', { ...dto, capacidad: capacidad as any })).rejects.toThrow('Table capacity')
        })

        it('rejects invalid estado', async () => {
            await expect(service.create('r1', { ...dto, estado: 'rota' as any })).rejects.toThrow('Invalid table status')
        })

        it('rejects duplicate numero in same restaurant', async () => {
            await service.create('r1', dto)
            await expect(service.create('r1', dto)).rejects.toThrow('already exists')
        })
    })

    describe('update', () => {
        it('updates fields and keeps estado when omitted', async () => {
            const t = await service.create('r1', { ...dto, estado: 'reservada' })
            const u = await service.update('r1', t.id, { numero: 7, descripcion: null, capacidad: 6 })
            expect(u.numero).toBe(7)
            expect(u.capacidad).toBe(6)
            expect(u.estado).toBe('reservada')
            expect(u.createdAt).toBe(t.createdAt)
        })

        it('allows keeping the same numero', async () => {
            const t = await service.create('r1', dto)
            await expect(service.update('r1', t.id, dto)).resolves.toBeDefined()
        })

        it('rejects numero used by another table', async () => {
            await service.create('r1', dto)
            const t2 = await service.create('r1', { numero: 2, capacidad: 2 })
            await expect(service.update('r1', t2.id, dto)).rejects.toThrow('already exists')
        })

        it('throws not found for missing or foreign-restaurant table', async () => {
            await expect(service.update('r1', 'nope', dto)).rejects.toThrow('Table not found')
            const t = await service.create('r1', dto)
            await expect(service.update('other', t.id, dto)).rejects.toThrow('Table not found')
        })
    })

    describe('get / list / delete', () => {
        it('getById returns or throws', async () => {
            const t = await service.create('r1', dto)
            expect((await service.getById('r1', t.id)).id).toBe(t.id)
            await expect(service.getById('r1', 'nope')).rejects.toThrow('Table not found')
            await expect(service.getById('other', t.id)).rejects.toThrow('Table not found')
        })

        it('lists with filters ordered by numero', async () => {
            await service.create('r1', { numero: 3, capacidad: 6 })
            await service.create('r1', { numero: 1, capacidad: 2 })
            await service.create('r1', { numero: 2, capacidad: 4, estado: 'ocupada' })
            expect((await service.list('r1')).map(t => t.numero)).toEqual([1, 2, 3])
            expect((await service.list('r1', { estado: 'ocupada' })).map(t => t.numero)).toEqual([2])
            expect((await service.list('r1', { capacidadMin: 4 })).map(t => t.numero)).toEqual([2, 3])
        })

        it('list validates filters and restaurant', async () => {
            await expect(service.list('nope')).rejects.toThrow('Restaurant not found')
            await expect(service.list('r1', { estado: 'x' as any })).rejects.toThrow('Invalid table status')
            await expect(service.list('r1', { capacidadMin: 0 })).rejects.toThrow('Table capacity')
        })

        it('deletes', async () => {
            const t = await service.create('r1', dto)
            await service.delete('r1', t.id)
            expect(await repo.findById(t.id)).toBeNull()
            await expect(service.delete('r1', t.id)).rejects.toThrow('Table not found')
        })
    })

    describe('updateStatus', () => {
        it('changes estado', async () => {
            const t = await service.create('r1', dto)
            const u = await service.updateStatus('r1', t.id, 'reservada')
            expect(u.estado).toBe('reservada')
        })

        it('rejects invalid estado and missing table', async () => {
            const t = await service.create('r1', dto)
            await expect(service.updateStatus('r1', t.id, 'x')).rejects.toThrow('Invalid table status')
            await expect(service.updateStatus('r1', 'nope', 'libre')).rejects.toThrow('Table not found')
        })
    })

    describe('listAvailable', () => {
        it('returns only libre tables with enough capacity ordered by capacidad, numero', async () => {
            await service.create('r1', { numero: 1, capacidad: 6 })
            await service.create('r1', { numero: 2, capacidad: 4 })
            await service.create('r1', { numero: 3, capacidad: 4, estado: 'ocupada' })
            await service.create('r1', { numero: 4, capacidad: 2 })
            const r = await service.listAvailable('r1', 3)
            expect(r.map(t => t.numero)).toEqual([2, 1])
            expect((await service.listAvailable('r1')).map(t => t.numero)).toEqual([4, 2, 1])
        })

        it('validates personas and restaurant', async () => {
            await expect(service.listAvailable('r1', 0)).rejects.toThrow('Table capacity')
            await expect(service.listAvailable('nope')).rejects.toThrow('Restaurant not found')
        })
    })

    describe('occupy', () => {
        it('occupies a libre table', async () => {
            const t = await service.create('r1', dto)
            const o = await service.occupy('r1', t.id, 3)
            expect(o.estado).toBe('ocupada')
            expect((await repo.findById(t.id))!.estado).toBe('ocupada')
        })

        it('works without personas', async () => {
            const t = await service.create('r1', dto)
            expect((await service.occupy('r1', t.id)).estado).toBe('ocupada')
        })

        it('fails with 409-type error when not libre', async () => {
            const t = await service.create('r1', dto)
            await service.occupy('r1', t.id)
            await expect(service.occupy('r1', t.id)).rejects.toThrow('not available')
            const r = await service.create('r1', { numero: 2, capacidad: 2, estado: 'reservada' })
            await expect(service.occupy('r1', r.id)).rejects.toThrow('not available')
        })

        it('rejects personas above capacidad without occupying', async () => {
            const t = await service.create('r1', dto)
            await expect(service.occupy('r1', t.id, 5)).rejects.toThrow('exceeds')
            expect((await repo.findById(t.id))!.estado).toBe('libre')
        })

        it('rejects invalid personas and missing table', async () => {
            const t = await service.create('r1', dto)
            await expect(service.occupy('r1', t.id, 0)).rejects.toThrow('Table capacity')
            await expect(service.occupy('r1', 'nope')).rejects.toThrow('Table not found')
            await expect(service.occupy('other', t.id)).rejects.toThrow('Table not found')
        })
    })
})
