"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from '@/lib/i18n';
import { Container, Section, cn, VaultCardSkeleton, VaultTableRowSkeleton, ErrorState, EmptyState } from "@/components/ui";
import { usePublicVaultsQuery } from "@/features/vault/hooks";
import { MOCK_PUBLIC_VAULTS } from "@/features/vault/mocks";
import { DepositModal } from "@/features/vault/components/DepositModal";
import { MilestoneConfetti } from "@/components/dashboard/MilestoneConfetti";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { VaultCard } from "@/features/vault/components/VaultCard";
import { VaultTable } from "@/features/vault/components/VaultTable";
import { WithdrawModal } from "@/features/vault/components/WithdrawModal";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { useMilestones } from "@/hooks/useMilestones";
import { calculateProgress, getAchievedMilestones } from "@/lib/milestones";
import { formatCurrency, formatPercentage } from "@/lib/vault-utils";
import { Vault } from "@/types/vault";
import { Coins, Leaf, Shield, Zap, LayoutGrid, List } from "lucide-react";

const MOCK_VAULTS = MOCK_PUBLIC_VAULTS;

const getVaultIcon = (iconName: string | undefined) => {
  switch (iconName) {
    case "Coins": return <Coins className="w-6 h-6" />;
    case "Zap": return <Zap className="w-6 h-6" />;
    case "Leaf": return <Leaf className="w-6 h-6" />;
    case "Shield": return <Shield className="w-6 h-6" />;
    default: return <Coins className="w-6 h-6" />;
  }
};


function VaultWithProgress({
  vault,
  onDeposit,
  onWithdraw,
}: {
  vault: Vault;
  onDeposit: (vaultId: string) => void;
  onWithdraw: (vaultId: string) => void;
}) {
  const deposited = parseFloat(vault.balance) || 0;
  const progress = calculateProgress(deposited, vault.seasonalTarget);
  const achieved = getAchievedMilestones(progress);

  return (
    <div className="space-y-0">
      <VaultCard
        {...vault}
        apy={formatPercentage(vault.apy)}
        tvl={formatCurrency(vault.tvl)}
        icon={getVaultIcon(vault.iconName)}
        onDeposit={onDeposit}
        onWithdraw={onWithdraw}
      />
      <div className="px-4 py-4 -mt-1 bg-white dark:bg-[#162a1a] border border-t-0 border-gray-100 dark:border-[rgba(141,187,85,0.12)] rounded-b-xl">
        <ProgressBar
          progress={progress}
          achievedMilestones={achieved}
          totalDeposited={deposited}
          seasonalTarget={vault.seasonalTarget}
          asset={vault.asset}
        />
      </div>
    </div>
  );
}

export default function VaultsPage() {
  const { t } = useTranslation();
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [vaultBalances, setVaultBalances] = useState<Record<string, number>>(
    () => {
      const map: Record<string, number> = {};
      for (const vault of MOCK_VAULTS) {
        map[vault.id] = parseFloat(vault.balance) || 0;
      }
      return map;
    },
  );

  const { data: vaults = MOCK_VAULTS, isLoading, isError, refetch } = usePublicVaultsQuery();

  const vault1Milestones = useMilestones({
    vaultId: "1",
    seasonalTarget: MOCK_VAULTS[0].seasonalTarget,
  });
  const vault2Milestones = useMilestones({
    vaultId: "2",
    seasonalTarget: MOCK_VAULTS[1].seasonalTarget,
  });
  const vault3Milestones = useMilestones({
    vaultId: "3",
    seasonalTarget: MOCK_VAULTS[2].seasonalTarget,
  });
  const vault4Milestones = useMilestones({
    vaultId: "4",
    seasonalTarget: MOCK_VAULTS[3].seasonalTarget,
  });

  const milestoneHooks: Record<string, ReturnType<typeof useMilestones>> = {
    "1": vault1Milestones,
    "2": vault2Milestones,
    "3": vault3Milestones,
    "4": vault4Milestones,
  };

  const handleDepositClick = (vaultId: string) => {
    const vault = vaults.find((item) => item.id === vaultId) || null;
    setSelectedVault(vault);
    setIsDepositOpen(true);
  };

  const handleWithdrawClick = (vaultId: string) => {
    const vault = vaults.find((item) => item.id === vaultId) || null;
    setSelectedVault(vault);
    setIsWithdrawOpen(true);
  };

  const handleDepositSuccess = useCallback(
    (vaultId: string, amount: number) => {
      const prev = vaultBalances[vaultId] ?? 0;
      const next = prev + amount;

      setVaultBalances((balances) => ({ ...balances, [vaultId]: next }));

      const hook = milestoneHooks[vaultId];
      if (hook) {
        const result = hook.processDeposit(prev, next);
        if (result.newMilestones.length > 0) {
          setShowConfetti(true);
        }
      }
    },
    [vaultBalances, milestoneHooks],
  );

  const vaultsWithBalances = useMemo(() => {
    return vaults.map((vault) => {
      const balanceNum = vaultBalances[vault.id] ?? 0;
      return {
        ...vault,
        balance: balanceNum.toFixed(2),
        projections: {
          progressPercentage: calculateProgress(balanceNum, vault.seasonalTarget || 10000),
        },
      };
    });
  }, [vaults, vaultBalances]);


  return (
    <div className="min-h-screen bg-[#f4f8f0] dark:bg-[#0d1f12] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <Section paddingY="lg">
          <Container size="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('vaults.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('vaults.subtitle')}
                </p>
              </div>

              <div className="flex items-center bg-gray-100 dark:bg-[#162a1a] border border-transparent dark:border-[rgba(141,187,85,0.12)] p-1 rounded-lg self-start">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === 'grid'
                      ? "bg-white dark:bg-[#1a3020] text-harvest-green-600 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{t('vaults.grid')}</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === 'list'
                      ? "bg-white dark:bg-[#1a3020] text-harvest-green-600 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  <List className="w-4 h-4" />
                  <span>{t('vaults.list')}</span>
                </button>
              </div>
            </div>

            {isError ? (
              <ErrorState
                variant="inline"
                title="Unable to load vaults"
                onAction={() => { void refetch() }}
              />
            ) : !isLoading && vaultsWithBalances.length === 0 ? (
              <EmptyState variant="no-vaults" />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <VaultCardSkeleton key={i} />)
                  : vaultsWithBalances.map((vault) => (
                    <VaultWithProgress
                      key={vault.id}
                      vault={vault as Record<string, unknown>}
                      onDeposit={handleDepositClick}
                      onWithdraw={handleWithdrawClick}
                    />
                  ))}
              </div>
            ) : isLoading ? (
              <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => <VaultTableRowSkeleton key={i} />)}
                  </tbody>
                </table>
              </div>
            ) : (
              <VaultTable
                vaults={vaultsWithBalances as Record<string, unknown>[]}
                onDeposit={handleDepositClick}
                onWithdraw={handleWithdrawClick}
              />
            )}

          </Container>
        </Section>
      </main>

      <Footer />

      {selectedVault && (
        <>
          <DepositModal
            isOpen={isDepositOpen}
            onClose={() => setIsDepositOpen(false)}
            vault={selectedVault}
            onDepositSuccess={handleDepositSuccess}
          />

          <WithdrawModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            vault={selectedVault}
          />
        </>
      )}


      <MilestoneConfetti
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
}
