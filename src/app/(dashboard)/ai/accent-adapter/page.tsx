"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mic,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIResponseDisplay } from "@/components/ai/ai-response-display";

interface AccentAdaptation {
  id: string;
  title: string;
  description: string | null;
  originalText: string;
  adaptedText: string | null;
  sourceAccent: string;
  targetAccent: string;
  status: string;
  aiResponse: any;
  createdAt: string;
}

const ACCENTS = [
  { value: "neutral", label: "Neutral" },
  { value: "american", label: "American" },
  { value: "british", label: "British" },
  { value: "australian", label: "Australian" },
  { value: "indian", label: "Indian" },
  { value: "irish", label: "Irish" },
  { value: "scottish", label: "Scottish" },
  { value: "southern-us", label: "Southern US" },
  { value: "new-york", label: "New York" },
  { value: "canadian", label: "Canadian" },
];

export default function AccentAdapterPage() {
  const [items, setItems] = useState<AccentAdaptation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<AccentAdaptation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    originalText: "",
    sourceAccent: "neutral",
    targetAccent: "american",
  });
  const [processing, setProcessing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.originalText.toLowerCase().includes(searchTerm.toLowerCase())
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
          fetch(`/api/ai/accent-adapter/${id}`, { method: "DELETE" })
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
          fetch(`/api/ai/accent-adapter/${id}/process`, { method: "POST" }).then(r => r.ok ? r.json() : null)
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
    window.open("/api/export/csv?model=accent-adapter", "_blank");
  };

  const handleExportPDF = () => {
    window.open("/api/export/pdf?model=accent-adapter", "_blank");
  };

  const loadSampleData = async () => {
    setLoadingSample(true);
    const samples = [
      {
        title: "British to American Greeting",
        description: "Adapt a British greeting for American audience",
        originalText: "Good afternoon, I reckon we ought to have a proper chat about the quarterly figures. Shall we pop round to the meeting room? I'll put the kettle on and we can sort it all out straightaway.",
        sourceAccent: "british",
        targetAccent: "american",
      },
      {
        title: "American to Australian Casual",
        description: "Adapt American speech for Australian style",
        originalText: "Hey buddy, wanna grab some lunch? I'm totally starving. There's this awesome new burger joint downtown that everyone's been talking about. We could swing by after the meeting.",
        sourceAccent: "american",
        targetAccent: "australian",
      },
      {
        title: "Neutral to Southern US Style",
        description: "Add Southern US charm to neutral speech",
        originalText: "Welcome to our store. How can I help you today? We have some great deals on our new products. Please let me know if you need any assistance finding what you are looking for.",
        sourceAccent: "neutral",
        targetAccent: "southern-us",
      },
    ];
    try {
      const results = await Promise.all(
        samples.map((sample) =>
          fetch("/api/ai/accent-adapter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sample),
          }).then((res) => (res.ok ? res.json() : null))
        )
      );
      const newItems = results.filter(Boolean) as AccentAdaptation[];
      setItems((prev) => [...newItems.reverse(), ...prev]);
      toast({ title: "Success", description: "Sample data loaded and processing started", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load sample data", variant: "destructive" });
    } finally {
      setLoadingSample(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/ai/accent-adapter");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
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
        const response = await fetch("/api/ai/accent-adapter");
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          if (selectedItem) {
            const updated = data.find((d: AccentAdaptation) => d.id === selectedItem.id);
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
    if (!formData.title || !formData.originalText) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/ai/accent-adapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems([newItem, ...items]);
        setShowNew(false);
        setFormData({ title: "", description: "", originalText: "", sourceAccent: "neutral", targetAccent: "american" });
        toast({ title: "Success", description: "Accent adaptation created", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/ai/accent-adapter/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(i => i.id === selectedItem.id ? updatedItem : i));
        setShowEdit(false);
        toast({ title: "Success", description: "Item updated", variant: "success" });
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
      const response = await fetch(`/api/ai/accent-adapter/${id}`, { method: "DELETE" });
      if (response.ok) {
        setItems(items.filter(i => i.id !== id));
        setShowDetail(false);
        toast({ title: "Success", description: "Item deleted", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/accent-adapter/${id}/process`, { method: "POST" });
      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(i => i.id === id ? updatedItem : i));
        if (selectedItem?.id === id) setSelectedItem(updatedItem);
        toast({ title: "Success", description: "Reprocessing started", variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reprocess", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Accent Adapter</h1>
          <p className="text-muted-foreground">Adapt speech patterns between different accents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSampleData} disabled={loadingSample}>
            {loadingSample ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
            Load Sample Data
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Adaptation
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search adaptations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Mic className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No accent adaptations yet</h3>
            <Button className="mt-4" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Create Adaptation</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Select All row */}
          <div className="flex items-center gap-3 px-4 py-2">
            <Checkbox
              checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${filteredItems.length} selected`
                : "Select all"}
            </span>
          </div>
          {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setSelectedItem(item); setShowDetail(true); }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${item.title}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.originalText.substring(0, 100)}...</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{item.sourceAccent} → {item.targetAccent}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
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
            <DialogTitle>Create Accent Adaptation</DialogTitle>
            <DialogDescription>Adapt text between different accent styles</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="E.g., Customer Greeting" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Accent</Label>
                <Select value={formData.sourceAccent} onValueChange={(v) => setFormData({ ...formData, sourceAccent: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Accent</Label>
                <Select value={formData.targetAccent} onValueChange={(v) => setFormData({ ...formData, targetAccent: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Original Text *</Label>
              <Textarea value={formData.originalText} onChange={(e) => setFormData({ ...formData, originalText: e.target.value })} placeholder="Enter text..." rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={processing}>{processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create & Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedItem.title}</DialogTitle>
                  {getStatusBadge(selectedItem.status)}
                </div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Badge variant="outline">{selectedItem.sourceAccent} → {selectedItem.targetAccent}</Badge>
                  <span className="text-sm text-muted-foreground">{new Date(selectedItem.createdAt).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <Label>Original Text</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">{selectedItem.originalText}</div>
                </div>
                {selectedItem.adaptedText && (
                  <div className="space-y-2">
                    <Label>Adapted Text</Label>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">{selectedItem.adaptedText}</div>
                  </div>
                )}
                <AIResponseDisplay status={selectedItem.status} aiResponse={selectedItem.aiResponse} type="accent" />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleReprocess(selectedItem.id)}><Mic className="h-4 w-4 mr-2" />Reprocess</Button>
                <Button variant="outline" onClick={() => { setFormData({ title: selectedItem.title, description: selectedItem.description || "", originalText: selectedItem.originalText, sourceAccent: selectedItem.sourceAccent, targetAccent: selectedItem.targetAccent }); setShowDetail(false); setShowEdit(true); }}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedItem.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Accent Adaptation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Source Accent</Label><Select value={formData.sourceAccent} onValueChange={(v) => setFormData({ ...formData, sourceAccent: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Target Accent</Label><Select value={formData.targetAccent} onValueChange={(v) => setFormData({ ...formData, targetAccent: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCENTS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Original Text *</Label><Textarea value={formData.originalText} onChange={(e) => setFormData({ ...formData, originalText: e.target.value })} rows={6} /></div>
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
