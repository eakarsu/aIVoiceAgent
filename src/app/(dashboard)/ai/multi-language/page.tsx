"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Plus,
  Search,
  Trash2,
  Edit,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AIResponseDisplay } from "@/components/ai/ai-response-display";

interface MultiLanguageSupport {
  id: string;
  title: string;
  description: string | null;
  inputText: string;
  detectedLanguage: string | null;
  languageName: string | null;
  confidence: number | null;
  supportedLanguages: any;
  status: string;
  aiResponse: any;
  createdAt: string;
}

const languageFlags: Record<string, string> = {
  en: "🇺🇸", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹",
  zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷", ar: "🇸🇦", hi: "🇮🇳", ru: "🇷🇺"
};

export default function MultiLanguagePage() {
  const [items, setItems] = useState<MultiLanguageSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<MultiLanguageSupport | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", inputText: "" });
  const [processing, setProcessing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inputText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected items?`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/ai/multi-language/${id}`, { method: "DELETE" })
        )
      );
      setItems(items.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      toast({ title: "Success", description: `${selectedIds.size} items deleted`, variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to delete some items", variant: "destructive" });
    }
  };

  const handleBulkReprocess = async () => {
    if (selectedIds.size === 0) return;
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/ai/multi-language/${id}/process`, { method: "POST" }).then(r => r.ok ? r.json() : null)
        )
      );
      const updated = results.filter(Boolean);
      setItems(items.map(i => {
        const u = updated.find((r: any) => r.id === i.id);
        return u || i;
      }));
      setSelectedIds(new Set());
      toast({ title: "Success", description: `${updated.length} items queued for reprocessing`, variant: "success" });
    } catch {
      toast({ title: "Error", description: "Failed to reprocess some items", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    window.open("/api/export/csv?model=multi-language", "_blank");
  };

  const handleExportPDF = () => {
    window.open("/api/export/pdf?model=multi-language", "_blank");
  };

  const loadSampleData = async () => {
    setLoadingSample(true);
    const samples = [
      {
        title: "Spanish Customer Message",
        description: "Detect language of a Spanish message",
        inputText: "Hola, me gustaría saber más sobre sus servicios. Estamos interesados en implementar su plataforma para nuestro equipo de atención al cliente. ¿Podrían enviarme más información sobre los precios y las características disponibles?",
      },
      {
        title: "French Business Email",
        description: "Detect language of a French email",
        inputText: "Bonjour, je vous écris pour vous informer que notre entreprise souhaite renouveler le contrat pour l'année prochaine. Nous sommes très satisfaits de la qualité de vos services et nous aimerions discuter des nouvelles conditions.",
      },
      {
        title: "Japanese Support Request",
        description: "Detect language of a Japanese message",
        inputText: "こんにちは、先日購入した製品について質問があります。マニュアルに記載されている手順通りに設定しましたが、正常に動作しません。サポートチームに確認していただけますか？",
      },
    ];
    try {
      const results = await Promise.all(
        samples.map((sample) =>
          fetch("/api/ai/multi-language", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sample),
          }).then((res) => (res.ok ? res.json() : null))
        )
      );
      const newItems = results.filter(Boolean) as MultiLanguageSupport[];
      setItems((prev) => [...newItems.reverse(), ...prev]);
      toast({ title: "Success", description: "Sample data loaded and processing started", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load sample data", variant: "destructive" });
    } finally {
      setLoadingSample(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/ai/multi-language");
      if (response.ok) setItems(await response.json());
    } catch (error) {
      toast({ title: "Error", description: "Failed to load items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates when any items are still processing
  const hasProcessing = items.some((item) => item.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/ai/multi-language");
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          if (selectedItem) {
            const updated = data.find((d: MultiLanguageSupport) => d.id === selectedItem.id);
            if (updated && updated.status !== selectedItem.status) {
              setSelectedItem(updated);
            }
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing, selectedItem]);

  const handleCreate = async () => {
    if (!formData.title || !formData.inputText) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch("/api/ai/multi-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setItems([await response.json(), ...items]);
        setShowNew(false);
        setFormData({ title: "", description: "", inputText: "" });
        toast({ title: "Success", description: "Created successfully", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/ai/multi-language/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const updated = await response.json();
        setItems(items.map(i => i.id === selectedItem.id ? updated : i));
        setShowEdit(false);
        toast({ title: "Success", description: "Updated", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const response = await fetch(`/api/ai/multi-language/${id}`, { method: "DELETE" });
      if (response.ok) {
        setItems(items.filter(i => i.id !== id));
        setShowDetail(false);
        toast({ title: "Success", description: "Deleted", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/multi-language/${id}/process`, { method: "POST" });
      if (response.ok) {
        const updated = await response.json();
        setItems(items.map(i => i.id === id ? updated : i));
        if (selectedItem?.id === id) setSelectedItem(updated);
        toast({ title: "Success", description: "Reprocessing started", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reprocess", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/10 text-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Multi-Language Support</h1>
          <p className="text-muted-foreground">Detect and analyze languages in text</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSampleData} disabled={loadingSample}>
            {loadingSample ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
            Load Sample Data
          </Button>
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />New Detection</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 ml-auto">
          {selectedIds.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkReprocess}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reprocess ({selectedIds.size})
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedIds.size})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredItems.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No language detections yet</h3>
          <Button className="mt-4" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Create Detection</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} of ${filteredItems.length} selected`
                  : "Select all"}
              </span>
            </div>
          )}
          {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50" onClick={() => { setSelectedItem(item); setShowDetail(true); }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 mr-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    {getStatusBadge(item.status)}
                    {item.detectedLanguage && <span className="text-xl">{languageFlags[item.detectedLanguage] || "🌍"}</span>}
                    {item.languageName && <Badge variant="outline">{item.languageName}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.inputText.substring(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {item.confidence && <span>Confidence: {Math.round(item.confidence * 100)}%</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Language Detection</DialogTitle>
            <DialogDescription>Analyze text to detect the language</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="E.g., Customer Message Analysis" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional" /></div>
            <div className="space-y-2"><Label>Input Text *</Label><Textarea value={formData.inputText} onChange={(e) => setFormData({ ...formData, inputText: e.target.value })} placeholder="Enter the text to analyze..." rows={6} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={processing}>{processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create & Detect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between"><DialogTitle>{selectedItem.title}</DialogTitle>{getStatusBadge(selectedItem.status)}</div>
              </DialogHeader>
              <div className="space-y-6">
                {selectedItem.detectedLanguage && (
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                    <span className="text-4xl">{languageFlags[selectedItem.detectedLanguage] || "🌍"}</span>
                    <div>
                      <p className="text-sm text-muted-foreground">Detected Language</p>
                      <p className="text-xl font-semibold">{selectedItem.languageName || selectedItem.detectedLanguage}</p>
                    </div>
                    {selectedItem.confidence && <Badge className="ml-auto">{Math.round(selectedItem.confidence * 100)}% confident</Badge>}
                  </div>
                )}
                <div className="space-y-2"><Label>Input Text</Label><div className="p-3 bg-muted rounded-lg text-sm">{selectedItem.inputText}</div></div>
                <AIResponseDisplay status={selectedItem.status} aiResponse={selectedItem.aiResponse} type="language" />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleReprocess(selectedItem.id)}><Globe className="h-4 w-4 mr-2" />Reprocess</Button>
                <Button variant="outline" onClick={() => { setFormData({ title: selectedItem.title, description: selectedItem.description || "", inputText: selectedItem.inputText }); setShowDetail(false); setShowEdit(true); }}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedItem.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Language Detection</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Input Text *</Label><Textarea value={formData.inputText} onChange={(e) => setFormData({ ...formData, inputText: e.target.value })} rows={6} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={processing}>{processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
