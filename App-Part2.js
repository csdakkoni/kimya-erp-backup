// PART 2 - Modül Componentleri

  // Cari Hesaplar Modülü
  const CurrentAccountsModule = () => {
    const [view, setView] = useState('list');
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [editingAccount, setEditingAccount] = useState({ name: '', type: 'Müşteri', contact: '', phone: '' });
    const [filterType, setFilterType] = useState('');

    const handleAddAccount = async (account) => {
      try {
        if (account.id) {
          const { error } = await supabase.from('accounts').update({
            name: account.name, type: account.type, contact: account.contact, phone: account.phone
          }).eq('id', account.id);
          if (error) throw error;
          setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
          alert('✅ Cari güncellendi!');
        } else {
          const { data, error } = await supabase.from('accounts').insert({
            user_id: user.id, name: account.name, type: account.type, contact: account.contact, phone: account.phone
          }).select().single();
          if (error) throw error;
          setAccounts([data, ...accounts]);
          alert('✅ Cari eklendi!');
        }
      } catch (error) {
        alert('❌ Hata: ' + error.message);
      }
    };

    const handleDeleteAccount = async (id) => {
      if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
      try {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
        setAccounts(prev => prev.filter(a => a.id !== id));
        alert('✅ Cari silindi!');
      } catch (error) {
        alert('❌ Silme hatası: ' + error.message);
      }
    };

    const saveAccount = () => {
      if (!editingAccount.name) {
        alert('⚠️ Firma adı zorunludur!');
        return;
      }
      handleAddAccount(editingAccount);
      setView('list');
      setEditingAccount({ name: '', type: 'Müşteri', contact: '', phone: '' });
    };

    const filteredAccounts = accounts.filter(a => {
      if (filterType && a.type !== filterType) return false;
      return true;
    });

    const exportAccountsExcel = () => {
      const data = filteredAccounts.map(a => ({
        'Firma Adı': a.name,
        'Tip': a.type,
        'Yetkili': a.contact || '-',
        'Telefon': a.phone || '-'
      }));
      exportToExcel(data, 'Cari Hesaplar');
    };

    const exportAccountsPDF = () => {
      const headers = ['Firma Adı', 'Tip', 'Yetkili', 'Telefon'];
      const data = filteredAccounts.map(a => [a.name, a.type, a.contact || '-', a.phone || '-']);
      exportToPDF('Cari Hesaplar Listesi', headers, data, 'Cari Hesaplar');
    };

    const printAccounts = () => {
      let html = '<table><thead><tr><th>Firma Adı</th><th>Tip</th><th>Yetkili</th><th>Telefon</th></tr></thead><tbody>';
      filteredAccounts.forEach(a => {
        html += '<tr><td>' + a.name + '</td><td>' + a.type + '</td><td>' + (a.contact || '-') + '</td><td>' + (a.phone || '-') + '</td></tr>';
      });
      html += '</tbody></table>';
      handlePrint('Cari Hesaplar Listesi', html);
    };

    if (view === 'form') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">{editingAccount.id ? '✏️ Cari Düzenle' : '➕ Yeni Cari'}</h2>
            <button onClick={() => { setView('list'); setEditingAccount({ name: '', type: 'Müşteri', contact: '', phone: '' }); }} className="text-slate-500 hover:text-slate-700 font-medium">İptal</button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Firma Adı *</label>
                <input type="text" className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none" placeholder="Örn: ABC Kimya" value={editingAccount.name} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tip</label>
                <select className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none" value={editingAccount.type} onChange={e => setEditingAccount({...editingAccount, type: e.target.value})}>
                  <option>Müşteri</option>
                  <option>Tedarikçi</option>
                  <option>Her İkisi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Yetkili</label>
                <input type="text" className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none" placeholder="Ahmet Yılmaz" value={editingAccount.contact} onChange={e => setEditingAccount({...editingAccount, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
                <input type="text" className="w-full border-2 border-slate-200 p-3 rounded-lg focus:border-indigo-500 focus:outline-none" placeholder="+90 555 123 45 67" value={editingAccount.phone} onChange={e => setEditingAccount({...editingAccount, phone: e.target.value})} />
              </div>
              <button onClick={saveAccount} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg font-bold text-lg">💾 Kaydet</button>
            </div>
          </div>
        </div>
      );
    }

    const typeOptions = [...new Set(accounts.map(a => a.type))];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">📒 Cari Hesaplar</h2>
          <div className="flex gap-3">
            <button onClick={exportAccountsExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Excel
            </button>
            <button onClick={exportAccountsPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Download className="h-5 w-5" /> PDF
            </button>
            <button onClick={printAccounts} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Printer className="h-5 w-5" /> Yazdır
            </button>
            <button onClick={() => setView('form')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5" /> Yeni Cari
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-200">
              <tr>
                <th className="p-4 text-left font-bold text-slate-700">Firma Adı</th>
                <th className="p-4 text-left font-bold text-slate-700">
                  Tip
                  <FilterDropdown 
                    column="type"
                    options={typeOptions}
                    value={filterType}
                    onChange={setFilterType}
                    label="Tip"
                  />
                </th>
                <th className="p-4 text-left font-bold text-slate-700">Yetkili</th>
                <th className="p-4 text-left font-bold text-slate-700">Telefon</th>
                <th className="p-4 text-right font-bold text-slate-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? filteredAccounts.map(account => (
                <tr key={account.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{account.name}</td>
                  <td className="p-4">
                    <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (account.type === 'Müşteri' ? 'bg-green-100 text-green-700' : account.type === 'Tedarikçi' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {account.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{account.contact || '-'}</td>
                  <td className="p-4 text-slate-600">{account.phone || '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingAccount(account); setView('form'); }} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded" title="Düzenle">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteAccount(account.id)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded" title="Sil">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="text-slate-400 text-lg">📭 Henüz cari kaydı yok</div>
                    <button onClick={() => setView('form')} className="mt-4 text-indigo-600 hover:text-indigo-800 font-bold">İlk cariyi ekleyin →</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredAccounts.length > 0 && (
          <div className="text-sm text-slate-500 text-center">
            {filteredAccounts.length} / {accounts.length} cari gösteriliyor
          </div>
        )}
      </div>
    );
  };

  // Satınalma ve Reçete modülleri Part 3'te olacak
  const PurchasingModule = () => <div className="p-8"><h2 className="text-2xl font-bold">🛒 Satınalma Modülü - Part 3'te</h2></div>;
  const RecipesModule = () => <div className="p-8"><h2 className="text-2xl font-bold">🧪 Reçete Modülü - Part 3'te</h2></div>;

// PART 2 ENDS - Continue to Part 3
