// PART 3 - FINAL - Main Return

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">⏳ Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
        <div className="p-6 bg-indigo-900 text-white font-bold flex items-center gap-3 border-b border-indigo-800">
          <FlaskConical className="text-yellow-400 h-8 w-8" />
          <div>
            <div className="text-lg">ChemPro</div>
            <div className="text-xs text-indigo-300">ERP v2.1</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={'w-full flex gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ' + (activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800')}>
            <LayoutDashboard className="h-5 w-5"/> Dashboard
          </button>
          <button onClick={() => setActiveTab('accounts')} className={'w-full flex gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ' + (activeTab === 'accounts' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800')}>
            <Briefcase className="h-5 w-5"/> Cari Hesaplar
          </button>
          <button onClick={() => setActiveTab('purchasing')} className={'w-full flex gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ' + (activeTab === 'purchasing' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800')}>
            <ShoppingBag className="h-5 w-5"/> Satınalma
          </button>
          <button onClick={() => setActiveTab('recipes')} className={'w-full flex gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ' + (activeTab === 'recipes' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800')}>
            <Beaker className="h-5 w-5"/> Reçeteler
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="text-xs text-slate-400 mb-3 truncate" title={user?.email}>👤 {user?.email}</div>
          <button onClick={handleSignOut} className="w-full flex gap-2 items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
            <LogOut className="h-4 w-4" /> Çıkış Yap
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'accounts' && <CurrentAccountsModule />}
        {activeTab === 'purchasing' && <PurchasingModule />}
        {activeTab === 'recipes' && <RecipesModule />}
      </div>
    </div>
  );
}

// END OF APP.JS
