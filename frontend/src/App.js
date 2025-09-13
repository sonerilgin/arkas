import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Checkbox } from "./components/ui/checkbox";
import { Separator } from "./components/ui/separator";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { Search, Plus, Edit3, Trash2, Truck, Package, Calendar, TrendingUp, User, X, ChevronRight, FileDown, Download, Upload, Moon, Sun, LogOut } from "lucide-react";
import html2pdf from 'html2pdf.js';
import LoginScreen from './components/LoginScreen';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    weekday: 'long'
  };
  const formatted = date.toLocaleDateString('tr-TR', options);
  const parts = formatted.split(' ');
  const datePart = parts[0]; // DD.MM.YYYY
  const dayName = parts[1]; // Gün ismi
  return `${datePart} ${dayName}`;
};

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Otomatik giriş kontrolü - parolayı hatırla seçiliyse
    const savedCredentials = localStorage.getItem('arkas_login_credentials');
    return !!savedCredentials;
  });
  const [nakliyeList, setNakliyeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [monthDialogOpen, setMonthDialogOpen] = useState(false);
  const [userEditDialogOpen, setUserEditDialogOpen] = useState(false);
  const [pdfYearDialogOpen, setPdfYearDialogOpen] = useState(false);
  const [selectedPdfYear, setSelectedPdfYear] = useState(new Date().getFullYear());
  const [selectedPdfMonth, setSelectedPdfMonth] = useState(new Date().getMonth());
  const [pdfReportType, setPdfReportType] = useState('yearly'); // 'yearly' or 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [detailType, setDetailType] = useState("");
  const [detailData, setDetailData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    const savedUserInfo = localStorage.getItem('arkas_user_info');
    return savedUserInfo ? JSON.parse(savedUserInfo) : {
      name: "Mehmet Yılmaz",
      sicil: "12345"
    };
  });
  const [tempUserInfo, setTempUserInfo] = useState(() => {
    const savedUserInfo = localStorage.getItem('arkas_user_info');
    return savedUserInfo ? JSON.parse(savedUserInfo) : {
      name: "Mehmet Yılmaz",
      sicil: "12345"
    };
  });
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    sira_no: "",
    kod: "",
    musteri: "",
    irsaliye_no: "",
    ithalat: false,
    ihracat: false,
    bos: false,
    bos_tasima: 0,
    reefer: 0,
    bekleme: 0,
    geceleme: 0,
    pazar: 0,
    harcirah: 0,
    toplam: 0,
    sistem: 0
  });
  
  // Çoklu seçim için state'ler
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('arkas_theme');
    return savedTheme === 'dark';
  });
  
  // Yatan Tutar management states
  const [yatulanTutarList, setYatulanTutarList] = useState([]);
  const [yatulanTutarDialogOpen, setYatulanTutarDialogOpen] = useState(false);
  const [yatulanTutarFormData, setYatulanTutarFormData] = useState({
    tutar: 0,
    yatan_tarih: new Date().toISOString().split('T')[0],
    baslangic_tarih: new Date().toISOString().split('T')[0],
    bitis_tarih: new Date().toISOString().split('T')[0],
    aciklama: ""
  });
  const [editingYatulanTutar, setEditingYatulanTutar] = useState(null);

  const { toast } = useToast();

  // Displayed records değiştiğinde seçimi sıfırla
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [displayMonth, displayYear, searchTerm]);

  // Theme yönetimi
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('arkas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('arkas_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('arkas_login_credentials');
    setIsLoggedIn(false);
  };

  // Yatan Tutar CRUD Functions
  const fetchYatulanTutarList = async () => {
    try {
      const response = await axios.get(`${API}/yatan-tutar`);
      setYatulanTutarList(response.data);
    } catch (error) {
      console.error("Yatan tutar listesi yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Yatan tutar listesi yüklenemedi",
        variant: "destructive"
      });
    }
  };

  const openYatulanTutarDialog = (item = null) => {
    if (item) {
      setYatulanTutarFormData({
        tutar: item.tutar,
        yatan_tarih: item.yatan_tarih,
        baslangic_tarih: item.baslangic_tarih,
        bitis_tarih: item.bitis_tarih,
        aciklama: item.aciklama || ""
      });
      setEditingYatulanTutar(item);
    } else {
      setYatulanTutarFormData({
        tutar: 0,
        yatan_tarih: new Date().toISOString().split('T')[0],
        baslangic_tarih: new Date().toISOString().split('T')[0],
        bitis_tarih: new Date().toISOString().split('T')[0],
        aciklama: ""
      });
      setEditingYatulanTutar(null);
    }
    setYatulanTutarDialogOpen(true);
  };

  const submitYatulanTutar = async () => {
    try {
      setLoading(true);
      
      const data = {
        tutar: parseFloat(yatulanTutarFormData.tutar) || 0,
        yatan_tarih: yatulanTutarFormData.yatan_tarih,
        baslangic_tarih: yatulanTutarFormData.baslangic_tarih,
        bitis_tarih: yatulanTutarFormData.bitis_tarih,
        aciklama: yatulanTutarFormData.aciklama
      };

      if (editingYatulanTutar) {
        await axios.put(`${API}/yatan-tutar/${editingYatulanTutar.id}`, data);
        toast({
          title: "Başarılı",
          description: "Yatan tutar kaydı güncellendi"
        });
      } else {
        await axios.post(`${API}/yatan-tutar`, data);
        toast({
          title: "Başarılı",
          description: "Yeni yatan tutar kaydı eklendi"
        });
      }

      await fetchYatulanTutarList();
      setYatulanTutarDialogOpen(false);
    } catch (error) {
      console.error("Yatan tutar kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: "Yatan tutar kaydedilemedi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteYatulanTutar = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API}/yatan-tutar/${id}`);
      await fetchYatulanTutarList();
      toast({
        title: "Başarılı",
        description: "Yatan tutar kaydı silindi"
      });
    } catch (error) {
      console.error("Yatan tutar silme hatası:", error);
      toast({
        title: "Hata",
        description: "Yatan tutar kaydı silinemedi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNakliyeList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/nakliye`);
      setNakliyeList(response.data);
    } catch (error) {
      console.error("Nakliye listesi getirilirken hata:", error);
      toast({
        title: "Hata",
        description: "Nakliye listesi yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Arama temizlendiğinde tüm verileri getir
      fetchNakliyeList();
      return;
    }

    try {
      setLoading(true);
      // Arama yapıldığında backend'den tüm sonuçları getir
      const response = await axios.get(`${API}/nakliye/search/${searchTerm}`);
      setNakliyeList(response.data);
      
      toast({
        title: "Arama Tamamlandı",
        description: `${response.data.length} sonuç bulundu (tüm kayıtlarda)`
      });
    } catch (error) {
      console.error("Arama yapılırken hata:", error);
      toast({
        title: "Hata",
        description: "Arama yapılırken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        tarih: new Date(formData.tarih).toISOString(),
        bos_tasima: parseFloat(formData.bos_tasima) || 0,
        reefer: parseFloat(formData.reefer) || 0,
        bekleme: parseFloat(formData.bekleme) || 0,
        geceleme: parseFloat(formData.geceleme) || 0,
        pazar: parseFloat(formData.pazar) || 0,
        harcirah: parseFloat(formData.harcirah) || 0,
        toplam: parseFloat(formData.toplam) || 0,
        sistem: parseFloat(formData.sistem) || 0
      };

      if (editingItem) {
        await axios.put(`${API}/nakliye/${editingItem.id}`, submitData);
        toast({
          title: "Başarılı",
          description: "Nakliye kaydı güncellendi"
        });
      } else {
        await axios.post(`${API}/nakliye`, submitData);
        toast({
          title: "Başarılı",
          description: "Yeni nakliye kaydı eklendi"
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchNakliyeList();
    } catch (error) {
      console.error("Kayıt işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Kayıt işlemi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      tarih: new Date(item.tarih).toISOString().split('T')[0],
      sira_no: item.sira_no,
      kod: item.kod || "",
      musteri: item.musteri,
      irsaliye_no: item.irsaliye_no,
      ithalat: item.ithalat,
      ihracat: item.ihracat,
      bos: item.bos || false,
      bos_tasima: item.bos_tasima || 0,
      reefer: item.reefer || 0,
      bekleme: item.bekleme || 0,
      geceleme: item.geceleme || 0,
      pazar: item.pazar || 0,
      harcirah: item.harcirah || 0,
      toplam: item.toplam || 0,
      sistem: item.sistem || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu nakliye kaydını silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await axios.delete(`${API}/nakliye/${id}`);
      toast({
        title: "Başarılı",
        description: "Nakliye kaydı silindi"
      });
      fetchNakliyeList();
      // Seçili listeden de kaldır
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      console.error("Silme işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Silme işlemi sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Çoklu seçim fonksiyonları
  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const currentPageIds = displayedRecords.map(item => item.id);
      setSelectedItems(currentPageIds);
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Uyarı",
        description: "Silinecek kayıt seçmediniz",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`${selectedItems.length} kayıtı silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedItems) {
        try {
          await axios.delete(`${API}/nakliye/${id}`);
          successCount++;
        } catch (error) {
          console.error(`Kayıt silme hatası (${id}):`, error);
          errorCount++;
        }
      }

      toast({
        title: "Silme İşlemi Tamamlandı",
        description: `${successCount} kayıt silindi${errorCount > 0 ? `, ${errorCount} kayıt silinemedi` : ''}`
      });

      setSelectedItems([]);
      setSelectAll(false);
      fetchNakliyeList();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Toplu silme işlemi sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      sira_no: "",
      kod: "",
      musteri: "",
      irsaliye_no: "",
      ithalat: false,
      ihracat: false,
      bos: false,
      bos_tasima: 0,
      reefer: 0,
      bekleme: 0,
      geceleme: 0,
      pazar: 0,
      harcirah: 0,
      toplam: 0,
      sistem: 0
    });
  };

  const handleNewRecord = () => {
    setEditingItem(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const calculateTotal = () => {
    const total = (parseFloat(formData.bos_tasima) || 0) +
                  (parseFloat(formData.reefer) || 0) +
                  (parseFloat(formData.bekleme) || 0) +
                  (parseFloat(formData.geceleme) || 0) +
                  (parseFloat(formData.pazar) || 0) +
                  (parseFloat(formData.harcirah) || 0);
    
    setFormData(prev => ({ ...prev, toplam: total }));
  };

  const thisMonthRecords = nakliyeList.filter(item => {
    const itemDate = new Date(item.tarih);
    const now = new Date();
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  });

  const displayedRecords = nakliyeList.filter(item => {
    // Eğer arama terimi varsa, tüm kayıtlarda ara (ay/yıl filtresi uygulama)
    if (searchTerm.trim()) {
      return true; // Tüm kayıtları dahil et, filtreleme backend'de yapılıyor
    }
    
    // Arama terimi yoksa, ay/yıl filtresini uygula
    const itemDate = new Date(item.tarih);
    return itemDate.getMonth() === displayMonth && itemDate.getFullYear() === displayYear;
  });

  // Yatan tutar kayıtlarını da aynı ay/yıl filtresine tabi tut
  const displayedYatulanTutar = yatulanTutarList.filter(item => {
    // Eğer arama terimi varsa, tüm yatan tutar kayıtlarını göster
    if (searchTerm.trim()) {
      return true;
    }
    
    // Yatan tarihine göre filtrele
    const yatanDate = new Date(item.yatan_tarih);
    return yatanDate.getMonth() === displayMonth && yatanDate.getFullYear() === displayYear;
  });

  const displayedTotal = displayedRecords.reduce((sum, item) => sum + (item.toplam || 0), 0);
  const displayedYatulanTotal = displayedYatulanTutar.reduce((sum, item) => sum + (item.tutar || 0), 0);

  const thisMonthTotal = thisMonthRecords.reduce((sum, item) => sum + (item.toplam || 0), 0);
  const totalAmount = nakliyeList.reduce((sum, item) => sum + (item.toplam || 0), 0);

  const showMonthSelector = () => {
    setMonthDialogOpen(true);
  };

  const handleMonthSelect = (month, year) => {
    setDisplayMonth(month);
    setDisplayYear(year);
    setMonthDialogOpen(false);
    
    const filteredCount = nakliyeList.filter(item => {
      const itemDate = new Date(item.tarih);
      return itemDate.getMonth() === month && itemDate.getFullYear() === year;
    }).length;
    
    toast({
      title: "Ay Seçildi",
      description: `${monthNames[month]} ${year} - ${filteredCount} kayıt tabloda gösteriliyor`
    });
  };

  const handleUserEdit = (updatedUser) => {
    console.log('handleUserEdit called with:', updatedUser);
    setUserInfo(updatedUser);
    // Kalıcı olarak localStorage'a kaydet
    localStorage.setItem('arkas_user_info', JSON.stringify(updatedUser));
    setUserEditDialogOpen(false);
    toast({
      title: "Başarılı",
      description: "Kullanıcı bilgileri kalıcı olarak kaydedildi"
    });
    console.log('User info saved to localStorage:', updatedUser);
  };

  const openUserEditDialog = () => {
    setTempUserInfo({ ...userInfo });
    setUserEditDialogOpen(true);
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      
      // Seçilen tarih aralığına göre verileri al
      const response = await axios.get(`${API}/nakliye`);
      const yatulanResponse = await axios.get(`${API}/yatan-tutar`);
      
      let filteredData = response.data;
      let filteredYatulanData = yatulanResponse.data;
      let reportTitle = "";
      let reportPeriod = "";

      if (pdfReportType === 'yearly') {
        filteredData = response.data.filter(item => {
          const itemDate = new Date(item.tarih);
          return itemDate.getFullYear() === selectedPdfYear;
        });
        filteredYatulanData = yatulanResponse.data.filter(item => {
          const yatanDate = new Date(item.yatan_tarih);
          return yatanDate.getFullYear() === selectedPdfYear;
        });
        reportTitle = `${selectedPdfYear} YILI NAKLİYE VE YATAN TUTAR RAPORU`;
        reportPeriod = `${selectedPdfYear} Yılı Tümü`;
      } else {
        filteredData = response.data.filter(item => {
          const itemDate = new Date(item.tarih);
          return itemDate.getFullYear() === selectedPdfYear && itemDate.getMonth() === selectedPdfMonth;
        });
        filteredYatulanData = yatulanResponse.data.filter(item => {
          const yatanDate = new Date(item.yatan_tarih);
          return yatanDate.getFullYear() === selectedPdfYear && yatanDate.getMonth() === selectedPdfMonth;
        });
        reportTitle = `${monthNames[selectedPdfMonth]} ${selectedPdfYear} NAKLİYE VE YATAN TUTAR RAPORU`;
        reportPeriod = `${monthNames[selectedPdfMonth]} ${selectedPdfYear}`;
      }

      if (filteredData.length === 0 && filteredYatulanData.length === 0) {
        toast({
          title: "Uyarı",
          description: `${reportPeriod} döneminde kayıt bulunamadı`,
          variant: "destructive"
        });
        return;
      }

      // Yatan tutar analizi
      const toplamYatulanTutar = filteredYatulanData.reduce((sum, item) => sum + (item.tutar || 0), 0);
      
      // Tarih aralığı hesaplama
      const tarihler = filteredData.map(item => new Date(item.tarih)).sort((a, b) => a - b);
      const enEskiTarih = tarihler.length > 0 ? tarihler[0] : new Date();
      const enYeniTarih = tarihler.length > 0 ? tarihler[tarihler.length - 1] : new Date();

      // HTML tablo oluştur
      const tableHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e3a8a; margin-bottom: 5px;">ARKAS LOJİSTİK</h1>
            <h2 style="color: #3b82f6; margin-bottom: 10px;">${reportTitle}</h2>
            <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
            <p><strong>Kapsanan Dönem:</strong> ${formatDate(enEskiTarih.toISOString())} - ${formatDate(enYeniTarih.toISOString())}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #3b82f6; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tarih</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Sıra No</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Kod</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Müşteri</th>
                <th style="border: 1px solid #ddd; padding: 8px;">İrsaliye No</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Tür</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Toplam</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #22c55e;">Sistem</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Karşılaştırma</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => {
                const toplam = item.toplam || 0;
                const sistem = item.sistem || 0;
                const fark = sistem - toplam;
                const turu = [];
                if (item.ithalat) turu.push('İthalat');
                if (item.ihracat) turu.push('İhracat');
                if (item.bos) turu.push('Boş');
                const farkText = fark === 0 ? 'Eşit' : (fark > 0 ? `+${formatCurrency(Math.abs(fark))}` : `-${formatCurrency(Math.abs(fark))}`);
                const farkColor = fark === 0 ? '#6b7280' : (fark > 0 ? '#22c55e' : '#ef4444');
                
                return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="border: 1px solid #ddd; padding: 8px;">${formatDate(item.tarih)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.sira_no}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.kod || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.musteri}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.irsaliye_no}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${turu.join(', ') || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(toplam)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; color: #22c55e;">${formatCurrency(sistem)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: ${farkColor};">${farkText}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="display: flex; flex-wrap: wrap; gap: 20px; background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div><strong>Toplam Kayıt:</strong> ${filteredData.length} adet</div>
            <div><strong>Toplam Tutar:</strong> ${formatCurrency(filteredData.reduce((sum, item) => sum + (item.toplam || 0), 0))}</div>
            <div><strong>Toplam Sistem:</strong> <span style="color: #22c55e;">${formatCurrency(filteredData.reduce((sum, item) => sum + (item.sistem || 0), 0))}</span></div>
            <div><strong>Toplam Yatan:</strong> <span style="color: #8b5cf6;">${formatCurrency(toplamYatulanTutar)}</span></div>
          </div>

          ${filteredYatulanData.length > 0 ? `
          <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 20px;">
            <h3 style="color: #8b5cf6; margin-bottom: 15px;">💰 YATAN TUTAR DETAYLARI</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <thead>
                <tr style="background-color: #8b5cf6; color: white;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Tutar</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Yatış Tarihi</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Çalışma Başlangıç</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Çalışma Bitiş</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                ${filteredYatulanData.map(item => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; color: #8b5cf6;">${formatCurrency(item.tutar)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(item.yatan_tarih).toLocaleDateString('tr-TR')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(item.baslangic_tarih).toLocaleDateString('tr-TR')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(item.bitis_tarih).toLocaleDateString('tr-TR')}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.aciklama || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 10px;">
              <div><strong>Yatan İşlem Sayısı:</strong> ${filteredYatulanData.length} adet</div>
              <div><strong>Toplam Yatan Tutar:</strong> <span style="color: #8b5cf6;">${formatCurrency(toplamYatulanTutar)}</span></div>
              <div><strong>Ortalama Yatan Tutar:</strong> ${formatCurrency(toplamYatulanTutar / filteredYatulanData.length)}</div>
            </div>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">
              <strong>Dönem Analizi:</strong> ${formatDate(enEskiTarih.toISOString())} - ${formatDate(enYeniTarih.toISOString())} 
              (${Math.ceil((enYeniTarih - enEskiTarih) / (1000 * 60 * 60 * 24))} gün)
            </p>
          </div>
          ` : ''}
        </div>
      `;

      // HTML2PDF ile dönüştür
      const element = document.createElement('div');
      element.innerHTML = tableHTML;
      document.body.appendChild(element);

      const fileName = pdfReportType === 'yearly' 
        ? `Arkas_Lojistik_${selectedPdfYear}_Yillik_Raporu.pdf`
        : `Arkas_Lojistik_${monthNames[selectedPdfMonth]}_${selectedPdfYear}_Raporu.pdf`;

      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      // Android uyumlu PDF indirme
      try {
        const pdf = await html2pdf().set(opt).from(element).outputPdf('blob');
        
        // Mobil uyumlu indirme fonksiyonu
        const downloadPdfBlob = (blob, filename) => {
          try {
            // Modern Web Share API denemesi (Android'de çok iyi çalışır)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'application/pdf' })] })) {
              const file = new File([blob], filename, { type: 'application/pdf' });
              navigator.share({
                title: 'Arkas Lojistik PDF Raporu',
                files: [file]
              }).catch(err => {
                console.log('PDF paylaşım iptal edildi:', err);
                traditionalPdfDownload();
              });
              return;
            }
            
            // Geleneksel indirme yöntemi
            traditionalPdfDownload();
            
            function traditionalPdfDownload() {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.style.display = 'none';
              link.href = url;
              link.download = filename;
              link.target = '_blank';
              
              // Mobil uyumluluk için body'ye ekle
              document.body.appendChild(link);
              
              setTimeout(() => {
                link.click();
                
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }, 150);
              }, 100);
            }
          } catch (error) {
            console.error('PDF indirme hatası:', error);
            
            // Son çare - yeni sekmede aç
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
              toast({
                title: "PDF İndirme Sorunu",
                description: "PDF açılamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.",
                variant: "destructive"
              });
            }
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }
        };

        downloadPdfBlob(pdf, fileName);
      } catch (error) {
        // Eski yöntemle dene
        console.warn('Blob PDF oluşturulamadı, geleneksel yöntem deneniyor:', error);
        await html2pdf().set(opt).from(element).save();
      }
      
      // Geçici elementi kaldır
      document.body.removeChild(element);
      
      toast({
        title: "Başarılı",
        description: `${reportPeriod} raporu PDF olarak indirildi (${filteredData.length} kayıt)`
      });

    } catch (error) {
      console.error("PDF export hatası:", error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfExport = () => {
    setPdfYearDialogOpen(true);
  };

  const confirmPdfExport = () => {
    exportToPDF();
    setPdfYearDialogOpen(false);
  };

  // Yedekleme fonksiyonları
  const exportBackup = async () => {
    try {
      const response = await axios.get(`${API}/nakliye`);
      const yatulanResponse = await axios.get(`${API}/yatan-tutar`);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "2.0",
        userInfo: userInfo,
        nakliyeData: response.data,
        yatulanTutarData: yatulanResponse.data
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      
      // Improved download function for better mobile compatibility
      const downloadBlob = (blob, filename) => {
        try {
          // Try modern approach first
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })) {
            const file = new File([blob], filename, { type: blob.type });
            navigator.share({
              title: 'Arkas Lojistik Yedek Dosyası',
              files: [file]
            }).catch(err => {
              console.log('Paylaşım iptal edildi:', err);
              // Fallback to traditional download
              traditionalDownload();
            });
            return;
          }
          
          // Traditional download method
          traditionalDownload();
          
          function traditionalDownload() {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = filename;
            link.target = '_blank'; // Android compatibility
            
            // Append to body for mobile compatibility
            document.body.appendChild(link);
            
            // Trigger download
            setTimeout(() => {
              link.click();
              
              // Cleanup
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }, 100);
            }, 100);
          }
        } catch (error) {
          console.error('Download error:', error);
          
          // Final fallback - open in new tab
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          if (!newWindow) {
            // If popup blocked, copy to clipboard as fallback
            navigator.clipboard.writeText(dataStr).then(() => {
              toast({
                title: "İndirme Sorunu",
                description: "Dosya pano'ya kopyalandı. Bir metin editöründe yapıştırarak kaydedebilirsiniz.",
                variant: "destructive"
              });
            }).catch(() => {
              toast({
                title: "İndirme Hatası",
                description: "Dosya indirilemedi. Lütfen farklı bir tarayıcı deneyin.",
                variant: "destructive"
              });
            });
          }
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      };

      const filename = `Arkas_Yedek_${new Date().toISOString().split('T')[0]}.json`;
      downloadBlob(dataBlob, filename);

      toast({
        title: "Yedekleme Başarılı",
        description: `${response.data.length} nakliye + ${yatulanResponse.data.length} yatan tutar kaydı yedeklendi`
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Hata",
        description: "Yedekleme sırasında hata oluştu",
        variant: "destructive"
      });
    }
  };

  const importBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (!backupData.nakliyeData || !Array.isArray(backupData.nakliyeData)) {
          throw new Error('Geçersiz yedek dosyası');
        }

        // Mevcut kayıtları al
        const existingResponse = await axios.get(`${API}/nakliye`);
        const existingData = existingResponse.data;
        
        let addedCount = 0;
        let skippedCount = 0;

        // Verileri geri yükle - duplicate kontrolü ile
        for (const item of backupData.nakliyeData) {
          try {
            // Aynı sıra_no, musteri ve irsaliye_no kombinasyonu var mı kontrol et
            const isDuplicate = existingData.some(existing => 
              existing.sira_no === item.sira_no && 
              existing.musteri === item.musteri && 
              existing.irsaliye_no === item.irsaliye_no
            );

            if (!isDuplicate) {
              await axios.post(`${API}/nakliye`, item);
              addedCount++;
            } else {
              skippedCount++;
              console.log(`Duplicate kayıt atlandı: ${item.sira_no} - ${item.musteri} - ${item.irsaliye_no}`);
            }
          } catch (err) {
            console.warn('Kayıt yüklenirken hata:', err);
            skippedCount++;
          }
        }

        // Kullanıcı bilgilerini geri yükle
        if (backupData.userInfo) {
          setUserInfo(backupData.userInfo);
          localStorage.setItem('arkas_user_info', JSON.stringify(backupData.userInfo));
        }

        fetchNakliyeList();
        toast({
          title: "Geri Yükleme Tamamlandı",
          description: `${addedCount} yeni kayıt eklendi${skippedCount > 0 ? `, ${skippedCount} duplicate kayıt atlandı` : ''}`
        });
      } catch (error) {
        toast({
          title: "Hata",
          description: "Geri yükleme sırasında hata oluştu",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const showDetails = (type) => {
    let data = [];
    let title = "";
    
    switch(type) {
      case 'month':
        showMonthSelector();
        return;
      case 'amount':
        data = nakliyeList.map(item => ({
          ...item,
          breakdown: {
            bosTaskima: item.bos_tasima || 0,
            reefer: item.reefer || 0,
            bekleme: item.bekleme || 0,
            geceleme: item.geceleme || 0,
            pazar: item.pazar || 0,
            harcirah: item.harcirah || 0
          }
        }));
        title = "Tutar Detayları";
        break;
    }
    
    setDetailData(data);
    setDetailType(type);
    setDetailDialogOpen(true);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNakliyeList();
      fetchYatulanTutarList();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    calculateTotal();
  }, [formData.bos_tasima, formData.reefer, formData.bekleme, formData.geceleme, formData.pazar, formData.harcirah]);

  // Login screen göster
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* User Edit Dialog */}
      <Dialog open={userEditDialogOpen} onOpenChange={setUserEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              Adınızı ve sicil numaranızı güncelleyin
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('Form submitted with tempUserInfo:', tempUserInfo);
            handleUserEdit(tempUserInfo);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                name="name"
                value={tempUserInfo.name}
                onChange={(e) => setTempUserInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ad Soyad"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sicil">Sicil Numarası</Label>
              <Input
                id="sicil"
                name="sicil"
                value={tempUserInfo.sicil}
                onChange={(e) => setTempUserInfo(prev => ({ ...prev, sicil: e.target.value }))}
                placeholder="Sicil numarası"
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserEditDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">
                Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 lg:gap-4 mb-2">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex-shrink-0">
                <img 
                  src="/arkas-logo-new.jpg" 
                  alt="Arkas Lojistik Logo" 
                  className="h-16 w-16 sm:h-18 sm:w-18 lg:h-20 lg:w-20 object-contain rounded-xl shadow-lg arkas-logo"
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 dark:text-gray-100 arkas-brand-text">
                  <span className="text-slate-800 dark:text-gray-100" style={{color: isDarkMode ? '#f1f5f9' : '#1e2563'}}>ARKAS</span>{' '}
                  <span className="text-blue-500 dark:text-blue-400" style={{color: isDarkMode ? '#60a5fa' : '#3b82f6'}}>LOJİSTİK</span>
                </h1>
                <p className="text-slate-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg font-medium">Nakliye Takip ve Yönetim Sistemi</p>
              </div>
            </div>
            
            {/* User Info & Theme Toggle */}
            <div className="flex items-center gap-2">
              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900 border-slate-200 dark:border-gray-600 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Çıkış
              </Button>
              
              {/* Theme Toggle Button */}
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" />
                )}
              </Button>
              
              {/* User Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-4 py-3 cursor-pointer hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-gray-600 flex-shrink-0" onClick={openUserEditDialog}>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-600 dark:text-gray-300" />
                  <div>
                    <div className="font-medium text-slate-800 dark:text-gray-200">{userInfo.name}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">Sicil: {userInfo.sicil}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-gray-300">Toplam Kayıt</CardTitle>
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 dark:text-gray-100">{displayedRecords.length}</div>
              <p className="text-xs text-slate-500 dark:text-gray-400">{monthNames[displayMonth]} {displayYear} kayıt sayısı</p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white dark:bg-gray-800 shadow-lg border-0 dark:border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105" 
            onClick={() => showDetails('month')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
                {monthNames[displayMonth]} {displayYear}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                <ChevronRight className="h-3 w-3 text-slate-400 dark:text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <span className="text-lg font-medium text-slate-600 dark:text-gray-300">Seçili Ay</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-gray-300">Toplam Tutar</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 dark:text-gray-100">{formatCurrency(displayedTotal)}</div>
              <p className="text-xs text-slate-500 dark:text-gray-400">{monthNames[displayMonth]} {displayYear} toplam tutarı</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg border-0 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => openYatulanTutarDialog()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Yatan Tutar</CardTitle>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <ChevronRight className="h-3 w-3 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(displayedYatulanTotal)}
              </div>
              <p className="text-xs text-purple-500 dark:text-purple-400">
                {displayedYatulanTutar.length} kayıt • {monthNames[displayMonth]} {displayYear}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Month Selector Dialog */}
        <Dialog open={monthDialogOpen} onOpenChange={setMonthDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ay Seçin</DialogTitle>
              <DialogDescription>
                Görüntülemek istediğiniz ayı ve yılı seçin
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ay</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Yıl</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => 2023 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setMonthDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={() => handleMonthSelect(selectedMonth, selectedYear)}>
                Seç
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {detailType === 'total' && "Tüm Nakliye Kayıtları"}
                  {detailType === 'month' && `${monthNames[selectedMonth]} ${selectedYear} Kayıtları`}
                  {detailType === 'amount' && "Tutar Detayları"}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDetailDialogOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {detailType === 'amount' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Boş Taşıma</TableHead>
                        <TableHead>Reefer</TableHead>
                        <TableHead>Bekleme</TableHead>
                        <TableHead>Geceleme</TableHead>
                        <TableHead>Pazar</TableHead>
                        <TableHead>Harcirah</TableHead>
                        <TableHead className="text-right">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.musteri}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.bosTaskima)}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.reefer)}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.bekleme)}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.geceleme)}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.pazar)}</TableCell>
                          <TableCell>{formatCurrency(item.breakdown.harcirah)}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(item.toplam)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Sıra No</TableHead>
                        <TableHead>Kod</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>İrsaliye No</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead className="text-right">Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.tarih)}</TableCell>
                          <TableCell>{item.sira_no}</TableCell>
                          <TableCell>{item.kod || '-'}</TableCell>
                          <TableCell>{item.musteri}</TableCell>
                          <TableCell>{item.irsaliye_no}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {item.ithalat && <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">İthalat</Badge>}
                              {item.ihracat && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">İhracat</Badge>}
                              {item.bos && <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">Boş</Badge>}
                              {!item.ithalat && !item.ihracat && !item.bos && <Badge variant="outline" className="text-xs">-</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(item.toplam)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Report Selection Dialog */}
        <Dialog open={pdfYearDialogOpen} onOpenChange={setPdfYearDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>📊 Nakliye Raporu Oluştur</DialogTitle>
              <DialogDescription>
                Hangi dönemin nakliye raporunu PDF olarak indirmek istiyorsunuz?<br/>
                Yatan tutar detayları ve tarih aralığı bilgileri dahil edilecektir.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Rapor Türü Seçimi */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rapor Türü</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      pdfReportType === 'yearly' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setPdfReportType('yearly')}
                  >
                    <div className="text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium text-sm">Yıllık Rapor</div>
                      <div className="text-xs text-gray-500">Tüm yıl</div>
                    </div>
                  </div>
                  <div 
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      pdfReportType === 'monthly' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setPdfReportType('monthly')}
                  >
                    <div className="text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="font-medium text-sm">Aylık Rapor</div>
                      <div className="text-xs text-gray-500">Belirli ay</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yıl Seçimi */}
              <div className="space-y-2">
                <Label>Yıl</Label>
                <Select value={selectedPdfYear.toString()} onValueChange={(value) => setSelectedPdfYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => 2023 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ay Seçimi (Sadece aylık rapor için) */}
              {pdfReportType === 'monthly' && (
                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Select value={selectedPdfMonth.toString()} onValueChange={(value) => setSelectedPdfMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rapor Önizleme */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📄 Oluşturulacak Rapor:
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {pdfReportType === 'yearly' 
                    ? `${selectedPdfYear} Yılı Tüm Kayıtlar` 
                    : `${monthNames[selectedPdfMonth]} ${selectedPdfYear} Aylık Rapor`
                  }
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  ✨ Yatan tutar detayları ve tarih aralığı bilgileri dahil
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPdfYearDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={confirmPdfExport} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white">
                <FileDown className="mr-2 h-4 w-4" />
                PDF Raporu İndir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Month Filter Status */}
        <div className="mb-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                  {searchTerm.trim() 
                    ? `"${searchTerm}" arama sonuçları (tüm kayıtlarda)` 
                    : `Tabloda ${monthNames[displayMonth]} ${displayYear} kayıtları gösteriliyor`
                  }
                </span>
              </div>
              
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">{displayedRecords.length} kayıt</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">{formatCurrency(displayedTotal)}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                setDisplayMonth(new Date().getMonth());
                setDisplayYear(new Date().getFullYear());
                toast({
                  title: "Geçerli Ay",
                  description: "Bu ay kayıtları gösteriliyor"
                });
              }} 
              variant="outline" 
              size="sm" 
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Bu Aya Dön
            </Button>
          </div>
        </div>

        {/* Search and Add Section */}
        <Card className="mb-6 lg:mb-8 bg-white dark:bg-gray-800 shadow-lg border-0 dark:border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl text-slate-800 dark:text-gray-100">Nakliye Kayıtları</CardTitle>
            <CardDescription className="text-sm lg:text-base text-slate-600 dark:text-gray-300">Nakliye işlemlerinizi görüntüleyin, arayın ve yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-stretch lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 flex-1 max-w-full lg:max-w-md">
                <div className="relative flex-1">
                  <Input
                    placeholder="Arama yap..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 text-sm lg:text-base pr-8"
                  />
                  {searchTerm && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        fetchNakliyeList();
                      }}
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button onClick={handleSearch} variant="outline" size="icon" className="flex-shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                {/* İlk satır: PDF ve Yedek butonları */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handlePdfExport} 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-green-300 text-green-600 hover:bg-green-50 text-xs sm:text-sm"
                    disabled={loading}
                  >
                    <FileDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{loading ? 'PDF Hazırlanıyor...' : 'PDF İndir'}</span>
                    <span className="xs:hidden">PDF</span>
                  </Button>
                  
                  <Button 
                    onClick={exportBackup} 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-orange-300 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm"
                    disabled={loading}
                  >
                    <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Yedek Al</span>
                    <span className="xs:hidden">Yedek</span>
                  </Button>
                </div>
                
                {/* İkinci satır: Yükleme ve Yeni Kayıt butonları */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => document.getElementById('backup-file-input').click()} 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-purple-300 text-purple-600 hover:bg-purple-50 text-xs sm:text-sm"
                    disabled={loading}
                  >
                    <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Yedek Yükle</span>
                    <span className="xs:hidden">Yükle</span>
                  </Button>
                  
                  {selectedItems.length > 0 && (
                    <Button 
                      onClick={handleDeleteSelected} 
                      variant="outline" 
                      className="flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
                      disabled={loading}
                    >
                      <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Seçilenleri Sil ({selectedItems.length})</span>
                      <span className="xs:hidden">Sil ({selectedItems.length})</span>
                    </Button>
                  )}
                </div>
                
                <input
                  id="backup-file-input"
                  type="file"
                  accept=".json"
                  onChange={importBackup}
                  style={{ display: 'none' }}
                />
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewRecord} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                      <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Yeni Kayıt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-slate-800">
                      {editingItem ? "Nakliye Kaydını Düzenle" : "Yeni Nakliye Kaydı"}
                    </DialogTitle>
                    <DialogDescription>
                      Nakliye bilgilerini girin ve kaydedin
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="general" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
                        <TabsTrigger value="amounts">Tutarlar</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="general" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tarih">Tarih</Label>
                            <Input
                              id="tarih"
                              type="date"
                              value={formData.tarih}
                              onChange={(e) => setFormData(prev => ({ ...prev, tarih: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sira_no">Sıra No</Label>
                            <Input
                              id="sira_no"
                              value={formData.sira_no}
                              onChange={(e) => setFormData(prev => ({ ...prev, sira_no: e.target.value }))}
                              placeholder="Sıra numarası"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="kod">Kod</Label>
                            <Input
                              id="kod"
                              value={formData.kod}
                              onChange={(e) => setFormData(prev => ({ ...prev, kod: e.target.value }))}
                              placeholder="Kod (opsiyonel)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="musteri">Müşteri</Label>
                            <Input
                              id="musteri"
                              value={formData.musteri}
                              onChange={(e) => setFormData(prev => ({ ...prev, musteri: e.target.value }))}
                              placeholder="Müşteri adı"
                              required
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="irsaliye_no">İrsaliye No</Label>
                            <Input
                              id="irsaliye_no"
                              value={formData.irsaliye_no}
                              onChange={(e) => setFormData(prev => ({ ...prev, irsaliye_no: e.target.value }))}
                              placeholder="İrsaliye numarası"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-6 flex-wrap">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="ithalat"
                              checked={formData.ithalat}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ithalat: checked }))}
                            />
                            <Label htmlFor="ithalat">İthalat</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="ihracat"
                              checked={formData.ihracat}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ihracat: checked }))}
                            />
                            <Label htmlFor="ihracat">İhracat</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="bos"
                              checked={formData.bos}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, bos: checked }))}
                            />
                            <Label htmlFor="bos">Boş</Label>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="amounts" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: 'bos_tasima', label: 'Boş Taşıma', placeholder: '0.00' },
                            { key: 'reefer', label: 'Reefer', placeholder: '0.00' },
                            { key: 'bekleme', label: 'Bekleme', placeholder: '0.00' },
                            { key: 'geceleme', label: 'Geceleme', placeholder: '0.00' },
                            { key: 'pazar', label: 'Pazar', placeholder: '0.00' },
                            { key: 'harcirah', label: 'Harcirah', placeholder: '0.00' }
                          ].map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-2">
                              <Label htmlFor={key}>{label}</Label>
                              <Input
                                id={key}
                                type="number"
                                step="0.01"
                                value={formData[key]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={placeholder}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="toplam">Toplam</Label>
                            <Input
                              id="toplam"
                              type="number"
                              step="0.01"
                              value={formData.toplam}
                              onChange={(e) => setFormData(prev => ({ ...prev, toplam: e.target.value }))}
                              placeholder="0.00"
                              className="bg-slate-50"
                              readOnly
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sistem">Sistem</Label>
                            <Input
                              id="sistem"
                              type="number"
                              step="0.01"
                              value={formData.sistem}
                              onChange={(e) => setFormData(prev => ({ ...prev, sistem: e.target.value }))}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                        {editingItem ? "Güncelle" : "Kaydet"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 dark:border-gray-700">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-gray-700">
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200 w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Tümünü seç"
                        className="border-2 border-slate-400"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">Tarih</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">Sıra No</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">Kod</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">Müşteri</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">İrsaliye No</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200">Tür</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200 text-right">Toplam</TableHead>
                    <TableHead className="font-semibold text-green-600 dark:text-green-400 text-right">Sistem</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200 text-center">Karşılaştırma</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-gray-200 text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : displayedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        {monthNames[displayMonth]} {displayYear} ayında nakliye kaydı bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedRecords.map((item) => {
                      const toplam = item.toplam || 0;
                      const sistem = item.sistem || 0;
                      const fark = sistem - toplam; // Sistem referanslı hesaplama
                      const farkYuzdesi = toplam > 0 ? ((Math.abs(fark) / toplam) * 100).toFixed(1) : 0;
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => handleSelectItem(item.id)}
                              aria-label={`Select ${item.musteri}`}
                              className="border-2 border-slate-400"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{formatDate(item.tarih)}</TableCell>
                          <TableCell>{item.sira_no}</TableCell>
                          <TableCell>{item.kod || '-'}</TableCell>
                          <TableCell>{item.musteri}</TableCell>
                          <TableCell>{item.irsaliye_no}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.ithalat && <Badge variant="secondary" className="bg-blue-100 text-blue-800">İthalat</Badge>}
                              {item.ihracat && <Badge variant="secondary" className="bg-green-100 text-green-800">İhracat</Badge>}
                              {item.bos && <Badge variant="secondary" className="bg-gray-100 text-gray-800">Boş</Badge>}
                              {!item.ithalat && !item.ihracat && !item.bos && <Badge variant="outline">-</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(toplam)}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(sistem)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs font-medium ${fark === 0 ? 'text-gray-500' : fark > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {fark === 0 ? 'Eşit' : fark > 0 ? `+${formatCurrency(Math.abs(fark))}` : `-${formatCurrency(Math.abs(fark))}`}
                              </span>
                              <span className={`text-xs ${fark === 0 ? 'text-gray-400' : fark > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {farkYuzdesi}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Edit3 className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              
              {/* Toplam Bilgileri - Desktop */}
              {!loading && displayedRecords.length > 0 && (
                <div className="border-t bg-slate-50 dark:bg-gray-700 p-4">
                  <div className="flex justify-end gap-8 text-sm font-medium">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-600 dark:text-gray-300">Toplam:</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-gray-100">
                        {formatCurrency(displayedRecords.reduce((sum, item) => sum + (item.toplam || 0), 0))}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-green-600 dark:text-green-400">Sistem:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(displayedRecords.reduce((sum, item) => sum + (item.sistem || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">
                  Yükleniyor...
                </div>
              ) : displayedRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {monthNames[displayMonth]} {displayYear} ayında nakliye kaydı bulunamadı
                </div>
              ) : (
                displayedRecords.map((item) => {
                  const toplam = item.toplam || 0;
                  const sistem = item.sistem || 0;
                  const fark = sistem - toplam; // Sistem referanslı hesaplama
                  
                  return (
                    <Card key={item.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-slate-800">{item.musteri}</div>
                            <div className="text-sm text-slate-500">Sıra: {item.sira_no} {item.kod && `• Kod: ${item.kod}`} • İrsaliye: {item.irsaliye_no}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-slate-800">{formatCurrency(toplam)}</div>
                            <div className="font-medium text-sm text-green-600">{formatCurrency(sistem)}</div>
                            <div className="text-xs text-slate-500">{formatDate(item.tarih)}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 flex-wrap">
                            {item.ithalat && <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">İthalat</Badge>}
                            {item.ihracat && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">İhracat</Badge>}
                            {item.bos && <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">Boş</Badge>}
                            {!item.ithalat && !item.ihracat && !item.bos && <Badge variant="outline" className="text-xs">-</Badge>}
                            
                            <Badge variant="outline" className={`text-xs ml-2 ${fark === 0 ? 'text-gray-500' : fark > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fark === 0 ? 'Eşit' : fark > 0 ? `+${formatCurrency(Math.abs(fark))}` : `-${formatCurrency(Math.abs(fark))}`}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                            >
                              <Edit3 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
              
              {/* Toplam Bilgileri - Mobile */}
              {!loading && displayedRecords.length > 0 && (
                <div className="border-t bg-slate-50 dark:bg-gray-700 p-4 mx-4 rounded-b-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-slate-600 dark:text-gray-300 text-xs">Toplam</div>
                      <div className="font-bold text-slate-800 dark:text-gray-100">
                        {formatCurrency(displayedRecords.reduce((sum, item) => sum + (item.toplam || 0), 0))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-600 dark:text-green-400 text-xs">Sistem</div>
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(displayedRecords.reduce((sum, item) => sum + (item.sistem || 0), 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Yatan Tutar Özet Tablosu */}
        {displayedYatulanTutar.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    💰 {monthNames[displayMonth]} {displayYear} - Yatan Tutar Kayıtları
                  </CardTitle>
                  <CardDescription className="text-purple-600 dark:text-purple-400">
                    Bu aya ait para yatış bilgileri ve çalışma dönemleri
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => openYatulanTutarDialog()} 
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Görünüm */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-purple-700 dark:text-purple-300">Tutar</TableHead>
                      <TableHead className="font-semibold text-purple-700 dark:text-purple-300">Yatış Tarihi</TableHead>
                      <TableHead className="font-semibold text-purple-700 dark:text-purple-300">Çalışma Dönemi</TableHead>
                      <TableHead className="font-semibold text-purple-700 dark:text-purple-300">Açıklama</TableHead>
                      <TableHead className="font-semibold text-purple-700 dark:text-purple-300 text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedYatulanTutar.slice(0, 5).map((item) => (
                      <TableRow key={item.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10">
                        <TableCell className="font-semibold text-purple-700 dark:text-purple-300">
                          {formatCurrency(item.tutar)}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-gray-300">
                          {new Date(item.yatan_tarih).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-gray-300">
                          <div className="text-sm">
                            {new Date(item.baslangic_tarih).toLocaleDateString('tr-TR')} - 
                            {new Date(item.bitis_tarih).toLocaleDateString('tr-TR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-gray-300 max-w-32 truncate">
                          {item.aciklama || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openYatulanTutarDialog(item)}
                              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteYatulanTutar(item.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {displayedYatulanTutar.length > 5 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => openYatulanTutarDialog()}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      Bu Ayın Tümünü Görüntüle ({displayedYatulanTutar.length} kayıt)
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile Görünüm */}
              <div className="lg:hidden space-y-3">
                {displayedYatulanTutar.slice(0, 3).map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-lg text-purple-700 dark:text-purple-300">
                        {formatCurrency(item.tutar)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openYatulanTutarDialog(item)}
                          className="h-6 w-6 p-0 text-purple-600"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteYatulanTutar(item.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-gray-300 space-y-1">
                      <div><strong>Yatış:</strong> {new Date(item.yatan_tarih).toLocaleDateString('tr-TR')}</div>
                      <div><strong>Dönem:</strong> {new Date(item.baslangic_tarih).toLocaleDateString('tr-TR')} - {new Date(item.bitis_tarih).toLocaleDateString('tr-TR')}</div>
                      {item.aciklama && <div><strong>Not:</strong> {item.aciklama}</div>}
                    </div>
                  </div>
                ))}
                
                {displayedYatulanTutar.length > 3 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => openYatulanTutarDialog()}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full"
                    >
                      Bu Ayın Tümünü Görüntüle ({displayedYatulanTutar.length} kayıt)
                    </Button>
                  </div>
                )}
              </div>

              {/* Toplam Özet */}
              <div className="border-t border-purple-200 dark:border-purple-700 mt-6 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                    <div className="text-sm text-purple-600 dark:text-purple-400">{monthNames[displayMonth]} Yatan</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(displayedYatulanTotal)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                    <div className="text-sm text-purple-600 dark:text-purple-400">Bu Ay Kayıt</div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {displayedYatulanTutar.length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      <Toaster />

      {/* Yatan Tutar Yönetimi Dialog */}
      <Dialog open={yatulanTutarDialogOpen} onOpenChange={setYatulanTutarDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              💰 Yatan Tutar Yönetimi
              {editingYatulanTutar ? " - Düzenle" : " - Yeni Kayıt"}
            </DialogTitle>
            <DialogDescription>
              Para yatış bilgilerini ve hangi tarihler arasındaki çalışmaya karşılık geldiğini yönetin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Yatan Tutar Formu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yatan_tutar">Yatan Tutar (₺)</Label>
                <Input
                  id="yatan_tutar"
                  type="number"
                  step="0.01"
                  value={yatulanTutarFormData.tutar}
                  onChange={(e) => setYatulanTutarFormData(prev => ({ ...prev, tutar: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yatan_tarih">Para Yatış Tarihi</Label>
                <Input
                  id="yatan_tarih"
                  type="date"
                  value={yatulanTutarFormData.yatan_tarih}
                  onChange={(e) => setYatulanTutarFormData(prev => ({ ...prev, yatan_tarih: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baslangic_tarih">Çalışma Başlangıç Tarihi</Label>
                <Input
                  id="baslangic_tarih"
                  type="date"
                  value={yatulanTutarFormData.baslangic_tarih}
                  onChange={(e) => setYatulanTutarFormData(prev => ({ ...prev, baslangic_tarih: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitis_tarih">Çalışma Bitiş Tarihi</Label>
                <Input
                  id="bitis_tarih"
                  type="date"
                  value={yatulanTutarFormData.bitis_tarih}
                  onChange={(e) => setYatulanTutarFormData(prev => ({ ...prev, bitis_tarih: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aciklama">Açıklama (İsteğe Bağlı)</Label>
                <Textarea
                  id="aciklama"
                  value={yatulanTutarFormData.aciklama}
                  onChange={(e) => setYatulanTutarFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                  placeholder="Ek bilgiler..."
                  rows={2}
                />
              </div>
            </div>

            {/* Mevcut Yatan Tutar Kayıtları */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                📋 {monthNames[displayMonth]} {displayYear} - Yatan Tutar Kayıtları
                <span className="text-sm text-slate-500">({displayedYatulanTutar.length} kayıt)</span>
              </h3>
              
              {displayedYatulanTutar.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {monthNames[displayMonth]} {displayYear} ayında yatan tutar kaydı bulunmuyor
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Yatış Tarihi</TableHead>
                        <TableHead>Çalışma Dönemi</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-center">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedYatulanTutar.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-semibold text-purple-600">
                            {formatCurrency(item.tutar)}
                          </TableCell>
                          <TableCell>
                            {new Date(item.yatan_tarih).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {new Date(item.baslangic_tarih).toLocaleDateString('tr-TR')} - 
                              {new Date(item.bitis_tarih).toLocaleDateString('tr-TR')}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {item.aciklama || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openYatulanTutarDialog(item)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteYatulanTutar(item.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Bu Ay Toplam Özeti */}
              {displayedYatulanTutar.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mt-4">
                  <div className="text-center">
                    <span className="text-purple-600 font-medium">{monthNames[displayMonth]} Yatan Tutar:</span>
                    <div className="text-lg font-bold text-purple-700">
                      {formatCurrency(displayedYatulanTotal)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setYatulanTutarDialogOpen(false)}>
              Kapat
            </Button>
            <Button 
              onClick={submitYatulanTutar} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {loading ? "Kaydediliyor..." : editingYatulanTutar ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;