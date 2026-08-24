import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { UserRole } from '../database/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Export')
@Controller({
  path: 'export',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * User-side export: GET /api/v1/export/users/:userId/vault/export
   */
  @Get('users/:userId/vault/export')
  @ApiOperation({ summary: 'Export vault data for a user' })
  @ApiQuery({ name: 'format', enum: ['csv', 'excel', 'pdf'], required: true })
  @ApiResponse({ status: 200, description: 'File download initiated' })
  async exportUserVault(
    @Param('userId') userId: string,
    @Query('format') format: 'csv' | 'excel' | 'pdf',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (req.user.id !== userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only export your own vault data');
    }
    const data = await this.exportService.getTransactionData(userId);
    return this.sendExport(res, data, format, `vault_export_${userId}`);
  }

  /**
   * User-side transactions export: GET /api/v1/export/users/:userId/transactions
   */
  @Get('users/:userId/transactions')
  @ApiOperation({ summary: 'Export transaction history for a user' })
  @ApiQuery({ name: 'format', enum: ['csv', 'excel', 'pdf'], required: true })
  @ApiResponse({ status: 200, description: 'File download initiated' })
  async exportUserTransactions(
    @Param('userId') userId: string,
    @Query('format') format: 'csv' | 'excel' | 'pdf',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (req.user.id !== userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only export your own transaction history');
    }
    const data = await this.exportService.getTransactionData(userId);
    return this.sendExport(res, data, format, `transactions_${userId}`);
  }

  /**
   * Admin-side export: GET /api/v1/export/admin/vault/export
   */
  @Get('admin/vault/export')
  @ApiOperation({ summary: 'Export all vault data (Admin only)' })
  @ApiQuery({ name: 'format', enum: ['csv', 'excel', 'pdf'], required: true })
  @ApiResponse({ status: 200, description: 'File download initiated' })
  async exportAllVaults(
    @Query('format') format: 'csv' | 'excel' | 'pdf',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can export all vault data');
    }
    const data = await this.exportService.getTransactionData();
    return this.sendExport(res, data, format, `admin_vault_export`);
  }

  /**
   * Admin-side export: GET /api/v1/export/admin/transactions
   */
  @Get('admin/transactions')
  @ApiOperation({ summary: 'Export all transactions (Admin only)' })
  @ApiQuery({ name: 'format', enum: ['csv', 'excel', 'pdf'], required: true })
  @ApiResponse({ status: 200, description: 'File download initiated' })
  async exportAllTransactions(
    @Query('format') format: 'csv' | 'excel' | 'pdf',
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can export all transactions');
    }
    const data = await this.exportService.getTransactionData();
    return this.sendExport(res, data, format, `admin_transactions`);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Stream or buffer a file response based on format.
   * CSV and Excel are streamed to avoid peak-RAM spikes.
   * PDF is buffered because PDFKit does not expose a true pipe-friendly stream.
   */
  private async sendExport(
    res: Response,
    data: import('../export/export.service').TransactionExportData[],
    format: 'csv' | 'excel' | 'pdf',
    basename: string,
  ): Promise<void> {
    const ts = Date.now();

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${basename}_${ts}.csv`);
      const stream = this.exportService.streamCsv(data);
      stream.pipe(res);
      return;
    }

    if (format === 'excel') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename=${basename}_${ts}.xlsx`);
      await this.exportService.streamExcel(data, res);
      return;
    }

    // PDF — buffered (PDFKit streams via pipe but we need to call res.send for NestJS compat)
    const buffer = await this.exportService.generatePdf(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${basename}_${ts}.pdf`);
    res.send(buffer);
  }
}
