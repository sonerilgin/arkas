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
import { Search, Plus, Edit3, Trash2, Truck, Package, Calendar, TrendingUp, User, X, ChevronRight } from "lucide-react";

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
  const [nakliyeList, setNakliyeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [monthDialogOpen, setMonthDialogOpen] = useState(false);
  const [userEditDialogOpen, setUserEditDialogOpen] = useState(false);
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

  const { toast } = useToast();

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
      fetchNakliyeList();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API}/nakliye/search/${searchTerm}`);
      setNakliyeList(response.data);
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
    } catch (error) {
      console.error("Silme işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "Silme işlemi sırasında bir hata oluştu",
        variant: "destructive"
      });
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
    
    setFormData(prev => ({ ...prev, toplam: total, sistem: total }));
  };

  const thisMonthRecords = filteredNakliyeList.filter(item => {
    const itemDate = new Date(item.tarih);
    const now = new Date();
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  });

  const thisMonthTotal = thisMonthRecords.reduce((sum, item) => sum + (item.toplam || 0), 0);
  const totalAmount = filteredNakliyeList.reduce((sum, item) => sum + (item.toplam || 0), 0);

  const showMonthSelector = () => {
    setMonthDialogOpen(true);
  };

  const handleMonthFilter = async (month, year) => {
    try {
      setLoading(true);
      const filteredData = nakliyeList.filter(item => {
        const itemDate = new Date(item.tarih);
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });
      setFilteredNakliyeList(filteredData);
      setCurrentFilter({ type: 'month', month, year });
      setMonthDialogOpen(false);
      
      toast({
        title: "Filtre Uygulandı",
        description: `${monthNames[month]} ${year} ayına göre ${filteredData.length} kayıt gösteriliyor`
      });
    } catch (error) {
      console.error("Ay filtresi uygulanırken hata:", error);
      toast({
        title: "Hata",
        description: "Ay filtresi uygulanırken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setFilteredNakliyeList(nakliyeList);
    setCurrentFilter({ type: 'all', month: null, year: null });
    toast({
      title: "Filtre Temizlendi",
      description: "Tüm kayıtlar gösteriliyor"
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

  const showDetails = (type) => {
    let data = [];
    let title = "";
    
    switch(type) {
      case 'month':
        showMonthSelector();
        return;
      case 'amount':
        data = filteredNakliyeList.map(item => ({
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
    fetchNakliyeList();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [formData.bos_tasima, formData.reefer, formData.bekleme, formData.geceleme, formData.pazar, formData.harcirah]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 arkas-brand-text">
                  <span className="text-slate-800" style={{color: '#1e2563'}}>ARKAS</span>{' '}
                  <span className="text-blue-500" style={{color: '#3b82f6'}}>LOJİSTİK</span>
                </h1>
                <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium">Nakliye Takip ve Yönetim Sistemi</p>
              </div>
            </div>
            
            {/* User Info - Aligned with Arkas Lojistik */}
            <div className="bg-white rounded-lg shadow-md px-4 py-3 cursor-pointer hover:shadow-lg transition-all duration-200 border border-slate-200 flex-shrink-0" onClick={openUserEditDialog}>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-600" />
                <div className="hidden sm:block">
                  <div className="font-medium text-slate-800">{userInfo.name}</div>
                  <div className="text-xs text-slate-500">Sicil: {userInfo.sicil}</div>
                </div>
                <div className="sm:hidden">
                  <div className="font-medium text-slate-800 text-xs">
                    {userInfo.name.split(' ').map(n => n[0]).join('. ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {currentFilter.type === 'month' && (
          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                {monthNames[currentFilter.month]} {currentFilter.year} ayı gösteriliyor ({filteredNakliyeList.length} kayıt)
              </span>
            </div>
            <Button 
              onClick={clearFilter} 
              variant="outline" 
              size="sm" 
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Filtreyi Temizle
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Toplam Kayıt</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{filteredNakliyeList.length}</div>
              <p className="text-xs text-slate-500">
                {currentFilter.type === 'month' 
                  ? `${monthNames[currentFilter.month]} ${currentFilter.year} kayıtları`
                  : 'Toplam nakliye kaydı'
                }
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105" 
            onClick={() => showDetails('month')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {currentFilter.type === 'month' 
                  ? `${monthNames[currentFilter.month]} ${currentFilter.year}`
                  : `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`
                }
              </CardTitle>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-green-600" />
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{thisMonthRecords.length}</div>
              <p className="text-xs text-slate-500">
                {currentFilter.type === 'month' 
                  ? `${monthNames[currentFilter.month]} ${currentFilter.year} kayıt • ${formatCurrency(thisMonthTotal)}`
                  : `Bu ayki kayıt • ${formatCurrency(thisMonthTotal)}`
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Toplam Tutar</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{totalAmount > 0 ? formatCurrency(totalAmount) : formatCurrency(0)}</div>
              <p className="text-xs text-slate-500">
                {currentFilter.type === 'month' 
                  ? `${monthNames[currentFilter.month]} ${currentFilter.year} tutarı`
                  : 'Toplam nakliye tutarı'
                }
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
                    {[2023, 2024, 2025, 2026].map((year) => (
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
              <Button onClick={() => handleMonthFilter(selectedMonth, selectedYear)}>
                Filtrele
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

        {/* Search and Add Section */}
        <Card className="mb-6 lg:mb-8 bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl text-slate-800">Nakliye Kayıtları</CardTitle>
            <CardDescription className="text-sm lg:text-base">Nakliye işlemlerinizi görüntüleyin, arayın ve yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 items-stretch lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 flex-1 max-w-full lg:max-w-md">
                <Input
                  placeholder="Müşteri, sıra no, kod veya irsaliye no ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-slate-200 text-sm lg:text-base"
                />
                <Button onClick={handleSearch} variant="outline" size="icon" className="flex-shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewRecord} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 w-full lg:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Tarih</TableHead>
                    <TableHead className="font-semibold text-slate-700">Sıra No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Kod</TableHead>
                    <TableHead className="font-semibold text-slate-700">Müşteri</TableHead>
                    <TableHead className="font-semibold text-slate-700">İrsaliye No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tür</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Toplam</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : nakliyeList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Nakliye kaydı bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNakliyeList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
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
                        <TableCell className="text-right font-semibold">{formatCurrency(item.toplam)}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">
                  Yükleniyor...
                </div>
              ) : nakliyeList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nakliye kaydı bulunamadı
                </div>
              ) : (
                filteredNakliyeList.map((item) => (
                  <Card key={item.id} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-slate-800">{item.musteri}</div>
                          <div className="text-sm text-slate-500">Sıra: {item.sira_no} {item.kod && `• Kod: ${item.kod}`} • İrsaliye: {item.irsaliye_no}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-slate-800">{formatCurrency(item.toplam)}</div>
                          <div className="text-xs text-slate-500">{formatDate(item.tarih)}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1 flex-wrap">
                          {item.ithalat && <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">İthalat</Badge>}
                          {item.ihracat && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">İhracat</Badge>}
                          {item.bos && <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">Boş</Badge>}
                          {!item.ithalat && !item.ihracat && !item.bos && <Badge variant="outline" className="text-xs">-</Badge>}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

export default App;