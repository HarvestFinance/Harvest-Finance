import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);

  constructor(
    @InjectRepository(Order)
    private repo: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async create(data: Partial<Order>): Promise<Order> {
    const entity = this.repo.create({
      id: uuidv4(),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<Order | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(entity: Order): Promise<Order> {
    entity.updatedAt = new Date();
    return this.repo.save(entity);
  }

  async findAll(filter: {
    status?: string;
    cropType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sort?: string;
    role?: 'FARMER' | 'BUYER' | undefined;
    userId?: string | undefined;
  }): Promise<{ items: Order[]; total: number }> {
    const qb = this.repo.createQueryBuilder('order');

    if (filter.status) {
      qb.andWhere('order.status = :status', { status: filter.status });
    }
    if (filter.cropType) {
      qb.andWhere('order.cropType = :cropType', { cropType: filter.cropType });
    }
    if (filter.search) {
      qb.andWhere(
        '(LOWER(order.cropType) LIKE :s OR LOWER(order.buyerId) LIKE :s)',
        { s: `%${filter.search.toLowerCase()}%` },
      );
    }
    if (filter.startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate: new Date(filter.startDate) });
    }
    if (filter.endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate: new Date(filter.endDate) });
    }
    if (filter.role === 'FARMER') {
      qb.andWhere('order.status = :status', { status: OrderStatus.PENDING });
    }
    if (filter.role === 'BUYER' && filter.userId) {
      qb.andWhere('order.buyerId = :buyerId', { buyerId: filter.userId });
    }

    qb.orderBy('order.createdAt', 'DESC');

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
