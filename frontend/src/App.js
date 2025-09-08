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
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/toaster";
import { Search, Plus, Edit3, Trash2, Truck, Package, Calendar, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('tr-TR');
};

function App() {
  const [nakliyeList, setNakliyeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    sira_no: "",
    musteri: "",
    irsaliye_no: "",
    ithalat: false,
    ihracat: false,
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
      musteri: item.musteri,
      irsaliye_no: item.irsaliye_no,
      ithalat: item.ithalat,
      ihracat: item.ihracat,
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
      musteri: "",
      irsaliye_no: "",
      ithalat: false,
      ihracat: false,
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

  useEffect(() => {
    fetchNakliyeList();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [formData.bos_tasima, formData.reefer, formData.bekleme, formData.geceleme, formData.pazar, formData.harcirah]);

  const totalAmount = nakliyeList.reduce((sum, item) => sum + (item.toplam || 0), 0);
  const thisMonthRecords = nakliyeList.filter(item => {
    const itemDate = new Date(item.tarih);
    const now = new Date();
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Nakliye Kontrol Sistemi</h1>
              <p className="text-slate-600 text-lg">Nakliye işlemlerinizi takip edin ve yönetin</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Toplam Kayıt</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{nakliyeList.length}</div>
              <p className="text-xs text-slate-500">Toplam nakliye kaydı</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Bu Ay</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{thisMonthRecords}</div>
              <p className="text-xs text-slate-500">Bu ayki kayıt sayısı</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Toplam Tutar</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-slate-500">Toplam nakliye tutarı</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Section */}
        <Card className="mb-8 bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Nakliye Kayıtları</CardTitle>
            <CardDescription>Nakliye işlemlerinizi görüntüleyin, arayın ve yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 flex-1 max-w-md">
                <Input
                  placeholder="Müşteri, sıra no veya irsaliye no ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-slate-200"
                />
                <Button onClick={handleSearch} variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewRecord} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
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
                            <Label htmlFor="musteri">Müşteri</Label>
                            <Input
                              id="musteri"
                              value={formData.musteri}
                              onChange={(e) => setFormData(prev => ({ ...prev, musteri: e.target.value }))}
                              placeholder="Müşteri adı"
                              required
                            />
                          </div>
                          <div className="space-y-2">
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
                        
                        <div className="flex gap-6">
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
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Tarih</TableHead>
                    <TableHead className="font-semibold text-slate-700">Sıra No</TableHead>
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
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : nakliyeList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nakliye kaydı bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    nakliyeList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">{formatDate(item.tarih)}</TableCell>
                        <TableCell>{item.sira_no}</TableCell>
                        <TableCell>{item.musteri}</TableCell>
                        <TableCell>{item.irsaliye_no}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.ithalat && <Badge variant="secondary" className="bg-blue-100 text-blue-800">İthalat</Badge>}
                            {item.ihracat && <Badge variant="secondary" className="bg-green-100 text-green-800">İhracat</Badge>}
                            {!item.ithalat && !item.ihracat && <Badge variant="outline">-</Badge>}
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
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

export default App;