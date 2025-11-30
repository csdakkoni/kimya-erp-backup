import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import { 
  LayoutDashboard, Briefcase, Edit, Trash2, Plus, LogOut, FlaskConical,
  ShoppingBag, ArrowLeft, Calendar, Beaker,
  Download, Printer, FileSpreadsheet, Filter, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const parseInputFloat = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleanStr = val.toString().replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

const formatMoney = (amount, currency = 'USD') => {
  const safeAmount = parseInputFloat(amount);
  try { 
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(safeAmount); 
  } catch (e) { 
    return safeAmount + ' ' + currency; 
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return day + '.' + month + '.' + year;
  } catch (e) { return '-'; }
};

const exportToExcel = (data, fileName) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName + '.xlsx');
};

const exportToPDF = (title, headers, data, fileName) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text('Tarih: ' + new Date().toLocaleDateString('tr-TR'), 14, 30);
  
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: data,
    styles: { font: 'helvetica', fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }
  });
  
  doc.save(fileName + '.pdf');
};

const handlePrint = (title, content) => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>' + title + '</title>');
  printWindow.document.write('<style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#4F46E5;color:white;}</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h2>' + title + '</h2>');
  printWindow.document.write('<p>Tarih: ' + new Date().toLocaleDateString('tr-TR') + '</p>');
  printWindow.document.write(content);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};

const FilterDropdown = ({ column, options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 text-slate-400 hover:text-slate-600"
        title={'Filtrele: ' + label}
      >
        <Filter className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-slate-200">
            <div className="p-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm"
              >
                Tümü
              </button>
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={'w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm ' + (value === opt ? 'bg-indigo-50 text-indigo-700 font-bold' : '')}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [accounts, setAccounts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = async () => {
    if (!user) return;
    try {
      const { data: accountsData } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setAccounts(accountsData || []);

      const { data: inventoryData } = await supabase.from('inventory').select('*, lots (*)').eq('user_id', user.id).order('created_at', { ascending: false });
      const formatted = (inventoryData || []).map(item => ({ ...item, lots: item.lots || [] }));
      setInventory(formatted);

      const { data: purchasesData } = await supabase.from('purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setPurchases(purchasesData || []);

      const { data: recipesData } = await supabase.from('recipes').select('*, recipe_ingredients (*)').eq('user_id', user.id).order('created_at', { ascending: false });
      const formattedRecipes = (recipesData || []).map(recipe => ({
        ...recipe,
        ingredients: (recipe.recipe_ingredients || []).map(ing => ({
          itemId: ing.item_id,
          percentage: ing.percentage
        }))
      }));
      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === parseInt(id));
    return acc ? acc.name : 'Bilinmiyor';
  };

  const getInventoryName = (id) => {
    const item = inventory.find(i => i.id === parseInt(id));
    return item ? item.name : 'Bilinmiyor';
  };

  const calculateRawMaterialCost = (ingredients) => {
    let totalCost = 0;
    ingredients.forEach(ing => {
      const item = inventory.find(i => i.id === parseInt(ing.itemId));
      if (item) {
        const costPerKg = parseInputFloat(item.cost);
        const percentage = parseInputFloat(ing.percentage);
        totalCost += (costPerKg * percentage) / 100;
      }
    });
    return totalCost;
  };

  // Dashboard component will be in Part 2
  const Dashboard = () => {
    const totalPurchases = purchases.reduce((sum, p) => sum + parseInputFloat(p.total), 0);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">📊 Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-indigo-500">
            <div className="text-slate-500 text-sm font-bold uppercase">Cari Hesaplar</div>
            <div className="text-4xl font-black text-indigo-700 mt-2">{accounts.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <div className="text-slate-500 text-sm font-bold uppercase">Toplam Alım</div>
            <div className="text-4xl font-black text-purple-700 mt-2">{purchases.length}</div>
            <div className="text-xs text-slate-500 mt-1">{formatMoney(totalPurchases, 'TRY')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-pink-500">
            <div className="text-slate-500 text-sm font-bold uppercase">Reçeteler</div>
            <div className="text-4xl font-black text-pink-700 mt-2">{recipes.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <div className="text-slate-500 text-sm font-bold uppercase">Stok</div>
            <div className="text-4xl font-black text-blue-700 mt-2">{inventory.length}</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-2">✅ Sistem Hazır!</h3>
          <p className="text-indigo-100">Excel • PDF • Print • Filtreleme</p>
        </div>
      </div>
    );
  };

  // PART 1 ENDS HERE - Continue to Part 2
