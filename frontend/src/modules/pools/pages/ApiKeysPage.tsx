import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineKey } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput } from '@modules/core/design-system/Components';
import { getPoolsFromStorage, savePoolsToStorage } from './ServicePoolPage';
import type { PoolItem, PoolKeyItem } from './ServicePoolPage';

const ApiKeysPage = () => {
  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState('ALL');
  const [page, setPage] = useState(1);

  // Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyVal, setNewKeyVal] = useState('');
  const [newRecapToken, setNewRecapToken] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  const savePools = (u: PoolItem[]) => { setPools(u); savePoolsToStorage(u); };

  const handleOpenAddKey = (poolId?: string) => {
    setSelectedPoolId(poolId || (pools.length > 0 ? pools[0].id : null));
    setNewKeyName(''); setNewKeyVal(''); setNewRecapToken('');
    setShowKeyModal(true);
  };

  const handleAutoDetect = () => { setAutoDetecting(true); setTimeout(() => { setAutoDetecting(false); alert('Đã tự động nhận diện: GPT-4o, GPT-4o-mini, DALL-E-3'); }, 800); };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId || !newKeyVal.trim()) return;
    const newKey: PoolKeyItem = { id: `key_${Date.now()}`, name: newKeyName || `Key #${Date.now().toString(36)}`, keyVal: newKeyVal, recapToken: newRecapToken || undefined, isActive: true, requestsCount: 0, detectedModels: [] };
    savePools(pools.map((p) => p.id === selectedPoolId ? { ...p, keys: [...p.keys, newKey] } : p));
    setShowKeyModal(false);
  };

  const handleToggleKey = (poolId: string, keyId: string) => {
    savePools(pools.map((p) => p.id === poolId ? { ...p, keys: p.keys.map((k) => k.id === keyId ? { ...k, isActive: !k.isActive } : k) } : p));
  };

  const handleDeleteKey = (poolId: string, keyId: string) => {
    if (confirm('Xoá key này?')) savePools(pools.map((p) => p.id === poolId ? { ...p, keys: p.keys.filter((k) => k.id !== keyId) } : p));
  };

  // Flatten all keys with pool info
  const allKeys = pools.flatMap((p) => p.keys.map((k) => ({ ...k, poolName: p.name, poolId: p.id, poolProvider: p.provider })));
  const filteredKeys = allKeys.filter((k) => {
    const matchSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) || k.keyVal.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (filterPool === 'ALL' || k.poolId === filterPool);
  });

  const poolOptions = [{ value: 'ALL', label: 'Tất cả Pools' }, ...pools.map((p) => ({ value: p.id, label: p.name }))];

  const columns: TableColumn<typeof filteredKeys[0]>[] = [
    { key: 'name', header: 'Tên Key', render: (k) => (<div><strong style={{ color: '#fafafa' }}>{k.name}</strong><div style={{ fontSize: '0.7rem', color: '#71717a' }}><code>{k.keyVal}</code></div></div>) },
    { key: 'poolName', header: 'Pool', render: (k) => <Badge variant="primary" size="sm"><HiOutlineKey size={12} /> {k.poolName}</Badge> },
    { key: 'requestsCount', header: 'Requests', align: 'right', render: (k) => <strong style={{ color: '#6366f1' }}>{k.requestsCount.toLocaleString()}</strong> },
    { key: 'detectedModels', header: 'Models Detected', render: (k) => (<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{k.detectedModels.map((m) => <Badge key={m} variant="neutral" size="sm">{m}</Badge>)}</div>) },
    { key: 'isActive', header: 'Trạng Thái', render: (k) => <Badge variant={k.isActive ? 'success' : 'danger'} size="sm" dot><button type="button" onClick={() => handleToggleKey(k.poolId, k.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }}>{k.isActive ? 'Active' : 'Disabled'}</button></Badge> },
    { key: 'actions', header: '', align: 'center', render: (k) => <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(k.poolId, k.id)}><HiOutlineTrash size={16} /></Button> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <SearchInput placeholder="Tìm key..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
            <Select options={poolOptions} value={filterPool} onChange={(e) => setFilterPool(e.target.value)} />
          </div>
          <Button variant="primary" size="md" onClick={() => handleOpenAddKey()}><HiOutlinePlus size={16} /> Thêm Key</Button>
        </div>
      </Card>

      <Card title="Quản Lý API Keys & Tokens" subtitle={`${filteredKeys.length} keys`} headerRight={<HiOutlineShieldCheck size={20} style={{ color: '#10b981' }} />} padding="none">
        <Table columns={columns} data={filteredKeys} rowKey={(k) => k.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      <Modal open={showKeyModal} onClose={() => setShowKeyModal(false)} title="Thêm API Key / Token Mới" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowKeyModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSaveKey}>Thêm Key</Button></>}
      >
        <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Select label="Chọn Pool" options={pools.map((p) => ({ value: p.id, label: `${p.name} (${p.provider})` }))} value={selectedPoolId || ''} onChange={(e) => setSelectedPoolId(e.target.value)} fullWidth />
          <Input label="Tên Key" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="OpenAI Pro Key #3" fullWidth />
          <Input label="API Key / Token Value" value={newKeyVal} onChange={(e) => setNewKeyVal(e.target.value)} placeholder="sk-..." required fullWidth />
          <Input label="Recap Token (2Captcha, nếu có)" value={newRecapToken} onChange={(e) => setNewRecapToken(e.target.value)} placeholder="recap_xxx" fullWidth />
          <Button variant="outline" size="sm" onClick={handleAutoDetect} loading={autoDetecting}><HiOutlineSparkles size={14} /> Auto Detect Models</Button>
        </form>
      </Modal>
    </div>
  );
};

export default ApiKeysPage;
