'use client';

import React from 'react';
import { Button } from '@/components/ui';
import { Download, ChevronDown, FileText, Table as TableIcon } from 'lucide-react';
import axios from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';

interface ExportButtonProps {
  userId: string;
  vaultId?: string;
  variant?: 'outline' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  userId, 
  vaultId,
  variant = 'outline',
  size = 'sm'
}) => {
  const { token } = useAuthStore();
  const [isExporting, setIsExporting] = React.useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(format);
    try {
      const endpoint = vaultId 
        ? `http://localhost:3001/api/v1/export/users/${userId}/vault/export`
        : `http://localhost:3001/api/v1/export/users/${userId}/transactions`;

      const response = await axios.get(endpoint, {
        params: { format },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'csv' ? 'csv' : 'xlsx';
      const filename = vaultId ? `vault_report_${Date.now()}.${extension}` : `transaction_history_${Date.now()}.${extension}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          leftIcon={<Download className="w-4 h-4" />}
          rightIcon={<ChevronDown className="w-4 h-4" />}
          isLoading={!!isExporting}
        >
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('csv')} className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-emerald-600" />
          <span>Export as Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
