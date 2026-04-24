"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
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

interface SpeechEnhancement {
  id: string;
  title: string;
  description: string | null;
  originalText: string;
  enhancedText: string | null;
  enhancementType: string;
  status: string;
  aiResponse: any;
  createdAt: string;
}

export default function SpeechEnhancerPage() {
  const [items, setItems] = useState<SpeechEnhancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SpeechEnhancement | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    originalText: "",
    enhancementType: "clarity",
  });
  const [processing, setProcessing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
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
          fetch(`/api/ai/speech-enhancer/${id}`, { method: "DELETE" })
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
          fetch(`/api/ai/speech-enhancer/${id}/process`, { method: "POST" }).then(r => r.ok ? r.json() : null)
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
    window.open("/api/export/csv?model=speech-enhancer", "_blank");
  };

  const handleExportPDF = () => {
    window.open("/api/export/pdf?model=speech-enhancer", "_blank");
  };

  const loadSampleData = async () => {
    setLoadingSample(true);
    const samples = [
      {
        title: "Customer Support Script",
        description: "Enhance a support call script for clarity",
        originalText: "Um, hi there, so like I was wondering if you could maybe help me with, you know, my account? I think there might be a problem with it or something. I tried to log in but it didnt work and I dont know what to do about it honestly.",
        enhancementType: "clarity",
      },
      {
        title: "Sales Pitch Improvement",
        description: "Make a sales pitch more professional",
        originalText: "Hey so we got this really cool product that does like a bunch of stuff. Its gonna save you money and time and all that good stuff. You should totally buy it because its way better than what the other guys are selling.",
        enhancementType: "professional",
      },
      {
        title: "Grammar Fix - Email Draft",
        description: "Fix grammar issues in an email",
        originalText: "Dear team, I wanted to let you all know that their will be a meeting tomorrow at 10am. Everyone should of prepared there reports by then. Me and the manager will be presenting the new policys that effects all departments.",
        enhancementType: "grammar",
      },
    ];
    try {
      const results = await Promise.all(
        samples.map((sample) =>
          fetch("/api/ai/speech-enhancer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sample),
          }).then((res) => (res.ok ? res.json() : null))
        )
      );
      const newItems = results.filter(Boolean) as SpeechEnhancement[];
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
      const response = await fetch("/api/ai/speech-enhancer");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load speech enhancements",
        variant: "destructive",
      });
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
        const response = await fetch("/api/ai/speech-enhancer");
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          // Also update selectedItem if it was processing
          if (selectedItem) {
            const updated = data.find((d: SpeechEnhancement) => d.id === selectedItem.id);
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
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/ai/speech-enhancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems([newItem, ...items]);
        setShowNew(false);
        setFormData({ title: "", description: "", originalText: "", enhancementType: "clarity" });
        toast({
          title: "Success",
          description: "Speech enhancement created and processing started",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create speech enhancement",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/ai/speech-enhancer/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(i => i.id === selectedItem.id ? updatedItem : i));
        setShowEdit(false);
        toast({
          title: "Success",
          description: "Speech enhancement updated",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update speech enhancement",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/ai/speech-enhancer/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems(items.filter(i => i.id !== id));
        setShowDetail(false);
        toast({
          title: "Success",
          description: "Speech enhancement deleted",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete speech enhancement",
        variant: "destructive",
      });
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/speech-enhancer/${id}/process`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(items.map(i => i.id === id ? updatedItem : i));
        if (selectedItem?.id === id) {
          setSelectedItem(updatedItem);
        }
        toast({
          title: "Success",
          description: "Reprocessing started",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reprocess",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Speech Enhancer</h1>
          <p className="text-muted-foreground">Enhance speech clarity, grammar, and fluency with AI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSampleData} disabled={loadingSample}>
            {loadingSample ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Load Sample Data
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Enhancement
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enhancements..."
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No speech enhancements yet</h3>
            <p className="text-muted-foreground text-center mt-2">
              Create your first speech enhancement to get started
            </p>
            <Button className="mt-4" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Enhancement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedItem(item);
                setShowDetail(true);
              }}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.originalText.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Type: {item.enhancementType}</span>
                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Enhancement Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Speech Enhancement</DialogTitle>
            <DialogDescription>
              Enter text to enhance with AI-powered speech optimization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., Customer Support Script"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Enhancement Type</Label>
              <Select
                value={formData.enhancementType}
                onValueChange={(value) => setFormData({ ...formData, enhancementType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clarity">Clarity</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="fluency">Fluency</SelectItem>
                  <SelectItem value="professional">Professional Tone</SelectItem>
                  <SelectItem value="casual">Casual Tone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalText">Original Text *</Label>
              <Textarea
                id="originalText"
                value={formData.originalText}
                onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
                placeholder="Enter the text you want to enhance..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedItem.title}</DialogTitle>
                  {getStatusBadge(selectedItem.status)}
                </div>
                {selectedItem.description && (
                  <DialogDescription>{selectedItem.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Enhancement Type</Label>
                    <Badge variant="outline" className="capitalize">{selectedItem.enhancementType}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <p className="text-sm">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Original Text</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">{selectedItem.originalText}</div>
                </div>

                {selectedItem.enhancedText && (
                  <div className="space-y-2">
                    <Label>Enhanced Text</Label>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                      {selectedItem.enhancedText}
                    </div>
                  </div>
                )}

                <AIResponseDisplay
                  status={selectedItem.status}
                  aiResponse={selectedItem.aiResponse}
                  type="speech"
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReprocess(selectedItem.id)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Reprocess
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      title: selectedItem.title,
                      description: selectedItem.description || "",
                      originalText: selectedItem.originalText,
                      enhancementType: selectedItem.enhancementType,
                    });
                    setShowDetail(false);
                    setShowEdit(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Speech Enhancement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Enhancement Type</Label>
              <Select
                value={formData.enhancementType}
                onValueChange={(value) => setFormData({ ...formData, enhancementType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clarity">Clarity</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="fluency">Fluency</SelectItem>
                  <SelectItem value="professional">Professional Tone</SelectItem>
                  <SelectItem value="casual">Casual Tone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-originalText">Original Text *</Label>
              <Textarea
                id="edit-originalText"
                value={formData.originalText}
                onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update & Reprocess
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
