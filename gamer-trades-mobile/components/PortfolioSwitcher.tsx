import { useState } from 'react';
import { View, Modal, Pressable, TextInput } from 'react-native';
import { Card, PixelText, BodyText, PixelButton } from './ui';
import { colors } from '../lib/theme';
import { useAuth } from '../lib/AuthContext';
import { LastPortfolioError } from '../lib/trading';

export default function PortfolioSwitcher() {
  const { portfolios, activePortfolio, switchPortfolio, addPortfolio, renamePortfolio, removePortfolio } = useAuth();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('100000');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setRenamingId(null);
    setCreating(false);
    setError(null);
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameText(currentName);
    setCreating(false);
    setError(null);
  };

  const confirmRename = async () => {
    if (!renamingId || !renameText.trim()) return;
    setBusy(true);
    try {
      await renamePortfolio(renamingId, renameText.trim());
      setRenamingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename account');
    } finally {
      setBusy(false);
    }
  };

  const confirmCreate = async () => {
    if (!newName.trim()) {
      setError('Give the account a name');
      return;
    }
    const balance = parseFloat(newBalance);
    if (!Number.isFinite(balance) || balance <= 0) {
      setError('Starting balance must be greater than $0');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addPortfolio(newName.trim(), balance);
      setCreating(false);
      setNewName('');
      setNewBalance('100000');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await removePortfolio(id);
    } catch (err) {
      setError(err instanceof LastPortfolioError ? err.message : 'Could not delete account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: colors.cyan, backgroundColor: `${colors.cyan}14` }}
      >
        <BodyText color={colors.cyan} size={12} weight="semibold" numberOfLines={1}>
          {activePortfolio?.name ?? 'ACCOUNT'}
        </BodyText>
        <BodyText color={colors.cyan} size={11}>▾</BodyText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={close}>
          <Pressable onPress={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
            <Card borderColor={colors.cyan}>
              <PixelText color={colors.cyan} size={11} glow style={{ marginBottom: 12 }}>◉ TRADING ACCOUNTS</PixelText>

              {portfolios.map(p => {
                const isActive = p.id === activePortfolio?.id;
                const isRenaming = renamingId === p.id;
                return (
                  <View key={p.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    {isRenaming ? (
                      <View style={{ gap: 8 }}>
                        <TextInput
                          autoFocus
                          value={renameText}
                          onChangeText={setRenameText}
                          placeholder="Account name"
                          placeholderTextColor={colors.muted}
                          style={{ fontSize: 14, padding: 10, backgroundColor: colors.bg, color: colors.text, borderWidth: 2, borderColor: colors.cyan }}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <PixelButton color={colors.muted} disabled={busy} onPress={() => setRenamingId(null)} style={{ flex: 1 }}>CANCEL</PixelButton>
                          <PixelButton color={colors.cyan} disabled={busy} onPress={confirmRename} style={{ flex: 1 }}>SAVE</PixelButton>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable onPress={() => !isActive && switchPortfolio(p.id)} style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isActive && <BodyText color={colors.green} size={12}>●</BodyText>}
                            <BodyText color={isActive ? colors.green : colors.text} size={13} weight={isActive ? 'semibold' : 'regular'} numberOfLines={1}>
                              {p.name}
                            </BodyText>
                          </View>
                          <BodyText color={colors.muted} size={11} style={{ marginTop: 2 }}>
                            ${p.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} cash
                          </BodyText>
                        </Pressable>
                        <Pressable onPress={() => startRename(p.id, p.name)} style={{ padding: 6 }}>
                          <BodyText color={colors.muted} size={13}>✎</BodyText>
                        </Pressable>
                        {portfolios.length > 1 && (
                          <Pressable onPress={() => handleDelete(p.id)} style={{ padding: 6 }}>
                            <BodyText color={colors.red} size={13}>✕</BodyText>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {creating ? (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TextInput
                    autoFocus
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Account name (e.g. Swing Trades)"
                    placeholderTextColor={colors.muted}
                    style={{ fontSize: 14, padding: 10, backgroundColor: colors.bg, color: colors.text, borderWidth: 2, borderColor: colors.green }}
                  />
                  <TextInput
                    value={newBalance}
                    onChangeText={setNewBalance}
                    keyboardType="decimal-pad"
                    placeholder="Starting balance"
                    placeholderTextColor={colors.muted}
                    style={{ fontSize: 14, padding: 10, backgroundColor: colors.bg, color: colors.text, borderWidth: 2, borderColor: colors.border }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <PixelButton color={colors.muted} disabled={busy} onPress={() => setCreating(false)} style={{ flex: 1 }}>CANCEL</PixelButton>
                    <PixelButton color={colors.green} disabled={busy} onPress={confirmCreate} style={{ flex: 1 }}>{busy ? '...' : 'CREATE'}</PixelButton>
                  </View>
                </View>
              ) : (
                <PixelButton color={colors.green} onPress={() => { setCreating(true); setError(null); }} style={{ marginTop: 12 }}>
                  + NEW ACCOUNT
                </PixelButton>
              )}

              {error && (
                <BodyText color={colors.red} size={11} style={{ textAlign: 'center', marginTop: 10 }}>⚠ {error}</BodyText>
              )}

              <PixelButton color={colors.muted} onPress={close} style={{ marginTop: 12 }}>DONE</PixelButton>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
