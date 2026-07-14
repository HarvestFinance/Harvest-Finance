import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { AiQueryHistory } from './entities/ai-query-history.entity';
import {
  CreateAiQueryHistoryDto,
  AiQueryHistoryResponseDto,
} from './dto/ai-query-history.dto';

@Injectable()
export class AiQueryHistoryService {
  constructor(
    @InjectRepository(AiQueryHistory)
    private readonly historyRepository: Repository<AiQueryHistory>,
  ) {}

  async create(
    userId: string,
    dto: CreateAiQueryHistoryDto,
  ): Promise<AiQueryHistoryResponseDto> {
    const record = this.historyRepository.create({
      userId,
      query: dto.query,
      response: dto.response,
      vaultContext: dto.vaultContext ?? null,
      seasonalData: dto.seasonalData ?? null,
    });
    const saved = await this.historyRepository.save(record);
    return this.toResponseDto(saved);
  }

  async findAll(
    userId: string,
    search?: string,
  ): Promise<AiQueryHistoryResponseDto[]> {
    if (search) {
      const records = await this.historyRepository.find({
        where: [
          { userId, query: ILike(`%${search}%`) },
          { userId, response: ILike(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
      });
      return records.map(this.toResponseDto);
    }
    const records = await this.historyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return records.map(this.toResponseDto);
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<AiQueryHistoryResponseDto> {
    const record = await this.historyRepository.findOne({
      where: { id, userId },
    });
    if (!record) throw new NotFoundException('Query history item not found');
    return this.toResponseDto(record);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const record = await this.historyRepository.findOne({
      where: { id, userId },
    });
    if (!record) throw new NotFoundException('Query history item not found');
    await this.historyRepository.remove(record);
    return { message: 'History item deleted successfully' };
  }

  private toResponseDto(record: AiQueryHistory): AiQueryHistoryResponseDto {
    return {
      id: record.id,
      query: record.query,
      response: record.response,
      vaultContext: record.vaultContext,
      seasonalData: record.seasonalData,
      createdAt: record.createdAt,
    };
  }
}
