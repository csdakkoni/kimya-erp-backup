// PART 2 FULL - Tüm Modüller

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
      alert('❌ Hata: ' + error.message);
    }
  };

  const handlePurchase = async (form) => {
    try {
      if (!form.supplierId || (!form.isNewItem && !form.itemId)) {
        alert('⚠️ Tedarikçi ve malzeme seçimi zorunludur!');
        return false;
      }

      const calculatedTotal = parseInputFloat(form.qty) * parseInputFloat(form.price);
      let itemName = form.itemName;

      if (form.id) {
        const { error } = await supabase.from('purchases').update({
          supplier_id: parseInt(form.supplierId),
          item_name: form.isNewItem ? form.newItemName : inventory.find(i => i.id === parseInt(form.itemId))?.name,
          qty: form.qty, price: form.price, currency: form.currency, total: calculatedTotal, payment_term: form.termDays, lot_no: form.lotNo
        }).eq('id', form.id);
        if (error) throw error;
        
        setPurchases(prev => prev.map(p => p.id === form.id ? {
          ...p, supplier_id: parseInt(form.supplierId), item_name: form.isNewItem ? form.newItemName : inventory.find(i => i.id === parseInt(form.itemId))?.name,
          qty: form.qty, price: form.price, currency: form.currency, total: calculatedTotal, payment_term: form.termDays, lot_no: form.lotNo
        } : p));
        alert('✅ Alım güncellendi!');
        return true;
      }

      if (form.isNewItem) {
        const { data: newItem, error } = await supabase.from('inventory').insert({
          user_id: user.id, name: form.newItemName, type: form.newItemType, unit: form.newItemUnit,
          tare: parseInputFloat(form.newItemTare), cost: parseInputFloat(form.price), currency: form.currency,
          payment_term: parseInputFloat(form.termDays), track_stock: true
        }).select().single();
        if (error) throw error;
        itemName = newItem.name;
        setInventory(prev => [{ ...newItem, lots: [] }, ...prev]);
      } else {
        await supabase.from('inventory').update({
          cost: parseInputFloat(form.price), currency: form.currency, payment_term: parseInputFloat(form.termDays)
        }).eq('id', parseInt(form.itemId));

        const { error: lotError } = await supabase.from('lots').insert({
          inventory_id: parseInt(form.itemId), lot_no: form.lotNo, qty: parseInputFloat(form.qty)
        });
        if (lotError) throw lotError;

        const item = inventory.find(i => i.id === parseInt(form.itemId));
        itemName = item ? item.name : 'Malzeme';

        setInventory(prev => prev.map(item => {
          if (item.id === parseInt(form.itemId)) {
            return {
              ...item, cost: parseInputFloat(form.price), currency: form.currency, payment_term: parseInputFloat(form.termDays),
              lots: [{ lot_no: form.lotNo, qty: parseInputFloat(form.qty), date: new Date().toISOString() }, ...item.lots]
            };
          }
          return item;
        }));
      }

      const { data: purchase, error: purchaseError } = await supabase.from('purchases').insert({
        user_id: user.id, supplier_id: parseInt(form.supplierId), item_name: itemName,
        qty: form.qty, price: form.price, currency: form.currency, total: calculatedTotal, payment_term: form.termDays, lot_no: form.lotNo
      }).select().single();
      if (purchaseError) throw purchaseError;

      setPurchases([purchase, ...purchases]);
      alert('✅ Alım kaydedildi!');
      return true;
    } catch (error) {
      alert('❌ Hata: ' + error.message);
      return false;
    }
  };

  const handleSaveRecipe = async (recipeData, isNewProduct, newProductName) => {
    try {
      let finalProductId = recipeData.productId;

      if (isNewProduct) {
        if (!newProductName) {
          alert('⚠️ Ürün adı giriniz!');
          return false;
        }

        const { data: newProduct, error } = await supabase.from('inventory').insert({
          user_id: user.id, name: newProductName, type: 'Mamul', unit: 'kg',
          cost: 0, currency: 'USD', track_stock: true
        }).select().single();

        if (error) throw error;
        finalProductId = newProduct.id;
        setInventory(prev => [{ ...newProduct, lots: [] }, ...prev]);
      }

      if (recipeData.id) {
        const { error: recipeError } = await supabase.from('recipes').update({
          product_id: finalProductId, customer_id: recipeData.customerId
        }).eq('id', recipeData.id);
        if (recipeError) throw recipeError;

        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeData.id);

        const ingredients = recipeData.ingredients.map(ing => ({
          recipe_id: recipeData.id, item_id: parseInt(ing.itemId), percentage: parseInputFloat(ing.percentage)
        }));
        const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredients);
        if (ingError) throw ingError;

        setRecipes(prev => prev.map(r => r.id === recipeData.id ? { ...recipeData, product_id: finalProductId } : r));
        alert('✅ Reçete güncellendi!');
        return true;
      }

      const { data: newRecipe, error: recipeError } = await supabase.from('recipes').insert({
        user_id: user.id, product_id: finalProductId, customer_id: recipeData.customerId
      }).select().single();
      if (recipeError) throw recipeError;

      const ingredients = recipeData.ingredients.map(ing => ({
        recipe_id: newRecipe.id, item_id: parseInt(ing.itemId), percentage: parseInputFloat(ing.percentage)
      }));
      const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredients);
      if (ingError) throw ingError;

      setRecipes([{ ...newRecipe, ingredients: recipeData.ingredients }, ...recipes]);
      alert('✅ Reçete oluşturuldu!');
      return true;
    } catch (error) {
      alert('❌ Hata: ' + error.message);
      return false;
    }
  };

  const CurrentAccountsModule = () => {
    const [view, setView] = useState('list');
    const [editingAccount, setEditingAccount] = useState({ name: '', type: 'Müşteri', contact: '', phone: '' });
    const [filterType, setFilterType] = useState('');

    const saveAccount = () => {
      if (!editingAccount.name) { alert('⚠️ Firma adı zorunludur!'); return; }
      handleAddAccount(editingAccount);
      setView('list');
      setEditingAccount({ name: '', type: 'Müşteri', contact: '', phone: '' });
    };

    const filteredAccounts = accounts.filter(a => {
      if (filterType && a.type !== filterType) return false;
      return true;
    });

    const typeOptions = [...new Set(accounts.map(a => a.type))];

    if (view === 'form') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">{editingAccount.id ? '✏️ Düzenle' : '➕ Yeni Cari'}</h2>
            <button onClick={() => { setView('list'); setEditingAccount({ name: '', type: 'Müşteri', contact: '', phone: '' }); }} className="text-slate-500">İptal</button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Firma Adı *</label>
                <input type="text" className="w-full border-2 p-3 rounded-lg" value={editingAccount.name} onChange={e => setEditingAccount({...editingAccount, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Tip</label>
                <select className="w-full border-2 p-3 rounded-lg" value={editingAccount.type} onChange={e => setEditingAccount({...editingAccount, type: e.target.value})}>
                  <option>Müşteri</option><option>Tedarikçi</option><option>Her İkisi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Yetkili</label>
                <input type="text" className="w-full border-2 p-3 rounded-lg" value={editingAccount.contact} onChange={e => setEditingAccount({...editingAccount, contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Telefon</label>
                <input type="text" className="w-full border-2 p-3 rounded-lg" value={editingAccount.phone} onChange={e => setEditingAccount({...editingAccount, phone: e.target.value})} />
              </div>
              <button onClick={saveAccount} className="w-full bg-indigo-600 text-white p-4 rounded-lg font-bold">💾 Kaydet</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📒 Cari Hesaplar</h2>
          <button onClick={() => setView('form')} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5" /> Yeni Cari
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b-2">
              <tr>
                <th className="p-4 text-left font-bold">Firma Adı</th>
                <th className="p-4 text-left font-bold">
                  Tip
                  <FilterDropdown column="type" options={typeOptions} value={filterType} onChange={setFilterType} label="Tip" />
                </th>
                <th className="p-4 text-left font-bold">Yetkili</th>
                <th className="p-4 text-left font-bold">Telefon</th>
                <th className="p-4 text-right font-bold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? filteredAccounts.map(account => (
                <tr key={account.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-bold">{account.name}</td>
                  <td className="p-4">
                    <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (account.type === 'Müşteri' ? 'bg-green-100 text-green-700' : account.type === 'Tedarikçi' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
                      {account.type}
                    </span>
                  </td>
                  <td className="p-4">{account.contact || '-'}</td>
                  <td className="p-4">{account.phone || '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingAccount(account); setView('form'); }} className="text-blue-600 p-2 hover:bg-blue-50 rounded">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDeleteAccount(account.id)} className="text-red-600 p-2 hover:bg-red-50 rounded">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-12 text-center text-slate-400">📭 Henüz cari yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const PurchasingModule = () => {
    const [form, setForm] = useState({
      supplierId: '', itemId: '', qty: '', price: '', currency: 'USD', lotNo: '', termDays: 30,
      isNewItem: false, newItemName: '', newItemType: 'Hammadde', newItemUnit: 'kg', newItemTare: 0
    });

    const resetForm = () => {
      setForm({ supplierId: '', itemId: '', qty: '', price: '', currency: 'USD', lotNo: '', termDays: 30, isNewItem: false, newItemName: '', newItemType: 'Hammadde', newItemUnit: 'kg', newItemTare: 0 });
    };

    const submitPurchase = async () => {
      const success = await handlePurchase(form);
      if (success) resetForm();
    };

    const suppliers = accounts.filter(a => a.type === 'Tedarikçi' || a.type === 'Her İkisi');
    const materials = inventory.filter(i => i.type !== 'Mamul');

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">🛒 Satınalma</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="font-bold text-lg mb-4">➕ Yeni Alım</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2">Tedarikçi *</label>
              <select className="w-full border-2 p-3 rounded-lg" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
                <option value="">Seçin...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">Malzeme *</label>
              <select className="w-full border-2 p-3 rounded-lg" value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})}>
                <option value="">Seçin...</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">Miktar *</label>
              <input type="number" className="w-full border-2 p-3 rounded-lg" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">Birim Fiyat *</label>
              <input type="number" step="0.01" className="w-full border-2 p-3 rounded-lg" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
          </div>
          <button onClick={submitPurchase} className="w-full mt-4 bg-purple-600 text-white p-4 rounded-lg font-bold">💾 Kaydet</button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-100 border-b font-bold">📋 Alım Geçmişi</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3 text-left font-bold">Tarih</th>
                <th className="p-3 text-left font-bold">Tedarikçi</th>
                <th className="p-3 text-left font-bold">Malzeme</th>
                <th className="p-3 text-right font-bold">Miktar</th>
                <th className="p-3 text-right font-bold">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length > 0 ? purchases.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{formatDate(p.created_at)}</td>
                  <td className="p-3 font-medium">{getAccountName(p.supplier_id)}</td>
                  <td className="p-3">{p.item_name}</td>
                  <td className="p-3 text-right">{p.qty}</td>
                  <td className="p-3 text-right font-bold">{formatMoney(p.price, p.currency)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-12 text-center text-slate-400">📭 Henüz alım yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RecipesModule = () => {
    const [view, setView] = useState('list');
    const [editingRecipe, setEditingRecipe] = useState({
      productId: '', isNewProduct: false, newProductName: '', customerId: '',
      ingredients: [{ itemId: '', percentage: '' }]
    });

    const addIngredient = () => {
      setEditingRecipe({
        ...editingRecipe,
        ingredients: [...editingRecipe.ingredients, { itemId: '', percentage: '' }]
      });
    };

    const updateIngredient = (index, field, value) => {
      const newIngredients = [...editingRecipe.ingredients];
      newIngredients[index][field] = value;
      setEditingRecipe({ ...editingRecipe, ingredients: newIngredients });
    };

    const submitRecipe = async () => {
      const totalPercentage = editingRecipe.ingredients.reduce((sum, ing) => sum + parseInputFloat(ing.percentage), 0);
      
      if (Math.abs(totalPercentage - 100) > 0.5) {
        alert('⚠️ Toplam %100 olmalı! Şu an: %' + totalPercentage.toFixed(2));
        return;
      }

      const success = await handleSaveRecipe(editingRecipe, editingRecipe.isNewProduct, editingRecipe.newProductName);
      if (success) {
        setView('list');
        setEditingRecipe({ productId: '', isNewProduct: false, newProductName: '', customerId: '', ingredients: [{ itemId: '', percentage: '' }] });
      }
    };

    const customers = accounts.filter(a => a.type === 'Müşteri' || a.type === 'Her İkisi');
    const products = inventory.filter(i => i.type === 'Mamul');
    const materials = inventory.filter(i => i.type !== 'Mamul');

    const totalPercentage = editingRecipe.ingredients.reduce((sum, ing) => sum + parseInputFloat(ing.percentage), 0);

    if (view === 'form') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🧪 Yeni Reçete</h2>
            <button onClick={() => setView('list')} className="text-slate-500">İptal</button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2">Ürün *</label>
                <select className="w-full border-2 p-3 rounded-lg" value={editingRecipe.productId} onChange={e => setEditingRecipe({...editingRecipe, productId: e.target.value})}>
                  <option value="">Seçin...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Müşteri *</label>
                <select className="w-full border-2 p-3 rounded-lg" value={editingRecipe.customerId} onChange={e => setEditingRecipe({...editingRecipe, customerId: e.target.value})}>
                  <option value="">Seçin...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t pt-6">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Bileşenler</h3>
                <button onClick={addIngredient} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold">
                  <Plus className="h-4 w-4 inline" /> Ekle
                </button>
              </div>
              <div className="space-y-3">
                {editingRecipe.ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-3">
                    <select className="flex-1 border-2 p-3 rounded-lg" value={ing.itemId} onChange={e => updateIngredient(index, 'itemId', e.target.value)}>
                      <option value="">Hammadde seçin...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" step="0.1" className="w-32 border-2 p-3 rounded-lg" placeholder="%" value={ing.percentage} onChange={e => updateIngredient(index, 'percentage', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div className="flex justify-between">
                <span className="font-bold">Toplam:</span>
                <span className={'text-2xl font-black ' + (Math.abs(totalPercentage - 100) < 0.5 ? 'text-green-600' : 'text-red-600')}>
                  %{totalPercentage.toFixed(2)}
                </span>
              </div>
            </div>
            <button onClick={submitRecipe} className="w-full mt-6 bg-purple-600 text-white p-4 rounded-lg font-bold">💾 Kaydet</button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">🧪 Reçeteler</h2>
          <button onClick={() => setView('form')} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5" /> Yeni Reçete
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-left font-bold">Ürün</th>
                <th className="p-4 text-left font-bold">Müşteri</th>
                <th className="p-4 text-right font-bold">Bileşen</th>
                <th className="p-4 text-right font-bold">Maliyet</th>
              </tr>
            </thead>
            <tbody>
              {recipes.length > 0 ? recipes.map(recipe => (
                <tr key={recipe.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-bold">{getInventoryName(recipe.product_id)}</td>
                  <td className="p-4">{getAccountName(recipe.customer_id)}</td>
                  <td className="p-4 text-right">{recipe.ingredients.length}</td>
                  <td className="p-4 text-right font-bold text-purple-700">{formatMoney(calculateRawMaterialCost(recipe.ingredients), 'USD')}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-12 text-center text-slate-400">📭 Henüz reçete yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

// PART 2 FULL ENDS
