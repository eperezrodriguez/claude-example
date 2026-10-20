import type { Request, Response, NextFunction } from 'express'
import type { TableService } from '@services/table.service.js'

const parseIntParam = (v: unknown): number | undefined => {
    if (v === undefined) return undefined
    const n = Number(v)
    return typeof v === 'string' && v.trim() !== '' ? n : NaN
}

export class TableController {
    constructor(private readonly tableService: TableService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const table = await this.tableService.create(req.params.restaurantId as string, req.body)
            res.status(201).json(table)
        } catch (error) {
            next(error)
        }
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tables = await this.tableService.list(req.params.restaurantId as string, {
                estado: req.query.estado as string | undefined,
                capacidadMin: parseIntParam(req.query.capacidadMin)
            })
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    getPublicAvailable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tables = await this.tableService.listAvailable(
                req.params.restaurantId as string,
                parseIntParam(req.query.personas)
            )
            res.status(200).json(tables)
        } catch (error) {
            next(error)
        }
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.getById(req.params.restaurantId as string, req.params.id as string))
        } catch (error) {
            next(error)
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.update(req.params.restaurantId as string, req.params.id as string, req.body))
        } catch (error) {
            next(error)
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.tableService.delete(req.params.restaurantId as string, req.params.id as string)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.updateStatus(req.params.restaurantId as string, req.params.id as string, req.body?.estado))
        } catch (error) {
            next(error)
        }
    }

    occupy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.tableService.occupy(req.params.restaurantId as string, req.params.id as string, req.body?.personas))
        } catch (error) {
            next(error)
        }
    }
}
