import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeroHeader } from '@/components/HeroHeader';
import { GoalCard } from '@/components/GoalCard';
import { AssetCard } from '@/components/AssetCard';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { useGoals, useFundGoal, useCreateGoal } from '@/data/goals';
import { useAssets, useCreateAsset, useUpdateAssetValue, useDeleteAsset } from '@/data/assets';
import { useProfile, useUpdateLiquidSavings } from '@/data/profile';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/money';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';
import type { FinancialGoal, AssetType } from '@/types/database';

type SavingsTab = 'liquidity' | 'assets' | 'goals';

const ASSET_TYPES: { key: AssetType; label: string }[] = [
  { key: 'fund', label: 'Fondo' },
  { key: 'bond', label: 'Bono' },
  { key: 'etf', label: 'ETF' },
  { key: 'other', label: 'Otro' },
];

export default function Goals() {
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const liquidSavings = profile?.liquid_savings ?? 0;

  const { data: goals = [] } = useGoals();
  const { data: assets = [] } = useAssets();
  const fundGoal = useFundGoal();
  const createGoal = useCreateGoal();
  const createAsset = useCreateAsset();
  const updateAssetValue = useUpdateAssetValue();
  const deleteAsset = useDeleteAsset();
  const updateLiquidSavings = useUpdateLiquidSavings();
  const toast = useToast();

  const [tab, setTab] = useState<SavingsTab>('liquidity');

  // Goal modals
  const [funding, setFunding] = useState<FinancialGoal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  // Liquid savings modal
  const [editingLiquidity, setEditingLiquidity] = useState(false);
  const [liquidInput, setLiquidInput] = useState('');

  // Asset modals
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('fund');
  const [assetValue, setAssetValue] = useState('');
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editAssetValue, setEditAssetValue] = useState('');

  // Aggregates
  const totalAssetValue = useMemo(
    () => assets.reduce((s, a) => s + a.current_value, 0),
    [assets],
  );
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalPatrimony = liquidSavings + totalAssetValue;

  // ── Goal handlers ──

  function submitFund() {
    const value = Number(fundAmount.replace(',', '.'));
    if (!funding || !value || value <= 0) return toast('Introduce una cantidad', 'info');
    fundGoal.mutate(
      { goalId: funding.id, amount: value },
      { onError: (e: any) => toast(e?.message ?? 'Funding failed — reverted', 'error') },
    );
    setFunding(null);
    setFundAmount('');
  }

  function submitCreate() {
    const value = Number(target.replace(',', '.'));
    if (!title.trim() || !value || value <= 0) return toast('Introduce título y objetivo', 'info');
    createGoal.mutate(
      { title: title.trim(), target_amount: value },
      { onError: (e: any) => toast(e?.message ?? 'No se pudo crear la meta', 'error') },
    );
    setCreating(false);
    setTitle('');
    setTarget('');
  }

  // ── Liquidity handlers ──

  function submitLiquidity() {
    const value = Number(liquidInput.replace(',', '.'));
    if (isNaN(value) || value < 0) return toast('Introduce un saldo válido', 'info');
    updateLiquidSavings.mutate(value, {
      onError: (e: any) => toast(e?.message ?? 'No se pudo actualizar', 'error'),
      onSuccess: () => toast('Liquidez actualizada', 'success'),
    });
    setEditingLiquidity(false);
    setLiquidInput('');
  }

  // ── Asset handlers ──

  function submitNewAsset() {
    const value = Number(assetValue.replace(',', '.'));
    if (!assetName.trim() || !value || value <= 0) return toast('Introduce nombre y valor', 'info');
    createAsset.mutate(
      { name: assetName.trim(), asset_type: assetType, current_value: value },
      {
        onError: (e: any) => toast(e?.message ?? 'No se pudo crear el activo', 'error'),
        onSuccess: () => toast('Activo añadido', 'success'),
      },
    );
    setCreatingAsset(false);
    setAssetName('');
    setAssetType('fund');
    setAssetValue('');
  }

  function submitEditAsset() {
    const value = Number(editAssetValue.replace(',', '.'));
    if (!editingAsset || isNaN(value) || value < 0) return toast('Introduce un valor válido', 'info');
    updateAssetValue.mutate(
      { assetId: editingAsset, value },
      { onError: (e: any) => toast(e?.message ?? 'No se pudo actualizar', 'error') },
    );
    setEditingAsset(null);
    setEditAssetValue('');
  }

  function handleDeleteAsset(id: string) {
    deleteAsset.mutate(id, {
      onError: (e: any) => toast(e?.message ?? 'No se pudo eliminar', 'error'),
      onSuccess: () => toast('Activo eliminado', 'success'),
    });
  }

  return (
    <View style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroHeader
          title="Patrimonio"
          balance={totalPatrimony}
          expense={Math.max(totalTarget - totalSaved, 0)}
          limit={totalTarget || 1000}
          currency={currency}
        />

        <View style={styles.sheet}>
          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="water-outline" size={20} color={colors.accentBlue} />
              <Text style={styles.summaryLabel}>Liquidez</Text>
              <Text style={styles.summaryValue}>{formatMoney(liquidSavings, currency)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="trending-up" size={20} color={colors.brand} />
              <Text style={styles.summaryLabel}>Activos</Text>
              <Text style={styles.summaryValue}>{formatMoney(totalAssetValue, currency)}</Text>
            </View>
          </View>

          {/* Tab bar */}
          <View style={{ marginTop: spacing.lg }}>
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              options={[
                { key: 'liquidity' as SavingsTab, label: 'Liquidez' },
                { key: 'assets' as SavingsTab, label: 'Activos' },
                { key: 'goals' as SavingsTab, label: 'Metas' },
              ]}
            />
          </View>

          {/* ── Tab: Liquidez ── */}
          {tab === 'liquidity' && (
            <View style={styles.tabContent}>
              <View style={styles.liquidCard}>
                <View style={styles.liquidHeader}>
                  <View style={styles.liquidIconBox}>
                    <Ionicons name="wallet-outline" size={28} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liquidTitle}>Cuenta Remunerada</Text>
                    <Text style={styles.liquidSubtitle}>Saldo en liquidez</Text>
                  </View>
                </View>
                <Text style={styles.liquidAmount}>{formatMoney(liquidSavings, currency)}</Text>
                <Pressable
                  style={styles.editLiquidBtn}
                  onPress={() => {
                    setLiquidInput(liquidSavings > 0 ? String(liquidSavings) : '');
                    setEditingLiquidity(true);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color={colors.brand} />
                  <Text style={styles.editLiquidText}>Actualizar saldo</Text>
                </Pressable>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accentBlue} />
                <Text style={styles.infoText}>
                  Aquí puedes reflejar el dinero que tienes disponible en tu cuenta remunerada.
                  Actualízalo manualmente cuando lo necesites.
                </Text>
              </View>
            </View>
          )}

          {/* ── Tab: Activos ── */}
          {tab === 'assets' && (
            <View style={styles.tabContent}>
              <View style={styles.headerRow}>
                <Text style={styles.h2}>Tus activos</Text>
                <Pressable style={styles.addBtn} onPress={() => setCreatingAsset(true)}>
                  <Text style={styles.addText}>Añadir</Text>
                </Pressable>
              </View>

              {assets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="pie-chart-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    No tienes activos registrados.{'\n'}Pulsa "Añadir" para empezar.
                  </Text>
                </View>
              ) : (
                assets.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    currency={currency}
                    onEdit={() => {
                      setEditingAsset(a.id);
                      setEditAssetValue(String(a.current_value));
                    }}
                    onDelete={() => handleDeleteAsset(a.id)}
                  />
                ))
              )}

              {assets.length > 0 && (
                <View style={styles.totalBar}>
                  <Text style={styles.totalLabel}>Total activos</Text>
                  <Text style={styles.totalValue}>{formatMoney(totalAssetValue, currency)}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Tab: Metas ── */}
          {tab === 'goals' && (
            <View style={styles.tabContent}>
              <View style={styles.headerRow}>
                <Text style={styles.h2}>Tus metas</Text>
                <Pressable style={styles.addBtn} onPress={() => setCreating(true)}>
                  <Text style={styles.addText}>Añadir</Text>
                </Pressable>
              </View>

              {goals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>
                    No tienes metas creadas.{'\n'}Pulsa "Añadir" para crear una.
                  </Text>
                </View>
              ) : (
                goals.map((g) => (
                  <GoalCard key={g.id} goal={g} currency={currency} onFund={() => setFunding(g)} />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Modals ── */}

      {/* Fund goal modal */}
      <Modal visible={!!funding} transparent animationType="fade" onRequestClose={() => setFunding(null)}>
        <Pressable style={styles.backdrop} onPress={() => setFunding(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Añadir fondos</Text>
            <Text style={styles.modalSub}>{funding?.title}</Text>
            <TextInput
              style={styles.modalInput}
              value={fundAmount}
              onChangeText={setFundAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable style={styles.modalCta} onPress={submitFund}>
              <Text style={styles.modalCtaText}>Añadir</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create goal modal */}
      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCreating(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nueva meta</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Fondo de emergencia"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { marginTop: spacing.md }]}
              value={target}
              onChangeText={setTarget}
              placeholder="Cantidad objetivo"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.modalCta} onPress={submitCreate}>
              <Text style={styles.modalCtaText}>Crear meta</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit liquidity modal */}
      <Modal visible={editingLiquidity} transparent animationType="fade" onRequestClose={() => setEditingLiquidity(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditingLiquidity(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Actualizar liquidez</Text>
            <Text style={styles.modalSub}>Saldo actual de la cuenta remunerada</Text>
            <TextInput
              style={styles.modalInput}
              value={liquidInput}
              onChangeText={setLiquidInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable style={styles.modalCta} onPress={submitLiquidity}>
              <Text style={styles.modalCtaText}>Guardar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create asset modal */}
      <Modal visible={creatingAsset} transparent animationType="fade" onRequestClose={() => setCreatingAsset(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCreatingAsset(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Nuevo activo</Text>

            <TextInput
              style={styles.modalInput}
              value={assetName}
              onChangeText={setAssetName}
              placeholder="e.g. Vanguard S&P 500"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <Text style={styles.typeLabel}>Tipo de activo</Text>
            <View style={styles.typeRow}>
              {ASSET_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.typeChip, assetType === t.key && styles.typeChipActive]}
                  onPress={() => setAssetType(t.key)}
                >
                  <Text style={[styles.typeChipText, assetType === t.key && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, { marginTop: spacing.md }]}
              value={assetValue}
              onChangeText={setAssetValue}
              placeholder="Valor actual"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Pressable style={styles.modalCta} onPress={submitNewAsset}>
              <Text style={styles.modalCtaText}>Crear activo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit asset value modal */}
      <Modal visible={!!editingAsset} transparent animationType="fade" onRequestClose={() => setEditingAsset(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditingAsset(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Actualizar valor</Text>
            <Text style={styles.modalSub}>
              {assets.find((a) => a.id === editingAsset)?.name}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editAssetValue}
              onChangeText={setEditAssetValue}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable style={styles.modalCta} onPress={submitEditAsset}>
              <Text style={styles.modalCtaText}>Guardar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  sheet: {
    backgroundColor: colors.brandTintBg,
    borderTopLeftRadius: radius.lg + 10,
    borderTopRightRadius: radius.lg + 10,
    marginTop: -spacing.xl,
    padding: spacing.lg,
    minHeight: 600,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
    ...shadow.card,
  },
  summaryLabel: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semibold as any,
  },
  summaryValue: {
    fontSize: font.size.lg,
    fontWeight: font.weight.heavy as any,
    color: colors.textPrimary,
  },

  // Tab content
  tabContent: { marginTop: spacing.lg },

  // ── Liquidity ──
  liquidCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.card,
  },
  liquidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  liquidIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold as any,
    color: colors.textPrimary,
  },
  liquidSubtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  liquidAmount: {
    fontSize: font.size.xxl,
    fontWeight: font.weight.heavy as any,
    color: colors.brand,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  editLiquidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTintBg,
  },
  editLiquidText: {
    color: colors.brand,
    fontWeight: font.weight.bold as any,
    fontSize: font.size.sm,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#EAF2FF',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.accentBlue,
    lineHeight: 20,
  },

  // ── Assets & Goals shared ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  h2: {
    fontSize: font.size.lg,
    fontWeight: font.weight.heavy as any,
    color: colors.textPrimary,
  },
  addBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  addText: {
    color: colors.white,
    fontWeight: font.weight.bold as any,
    fontSize: font.size.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl + spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: font.size.sm,
    textAlign: 'center',
    lineHeight: 22,
  },

  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  totalLabel: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: font.weight.semibold as any,
  },
  totalValue: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: font.weight.heavy as any,
  },

  // ── Modals ──
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,27,43,0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.heavy as any,
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.brandTintBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.size.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  modalCta: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalCtaText: {
    color: colors.white,
    fontWeight: font.weight.bold as any,
    fontSize: font.size.md,
  },

  // Asset type selector
  typeLabel: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    fontWeight: font.weight.semibold as any,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTintBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  typeChipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold as any,
    color: colors.textPrimary,
  },
  typeChipTextActive: {
    color: colors.brand,
    fontWeight: font.weight.bold as any,
  },
});
