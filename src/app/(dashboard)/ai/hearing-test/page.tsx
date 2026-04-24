"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Plus,
  Search,
  Trash2,
  Edit,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIResponseDisplay } from "@/components/ai/ai-response-display";

interface HearingTest {
  id: string;
  title: string;
  description: string | null;
  patientName: string | null;
  patientAge: number | null;
  testType: string;
  frequencies: any;
  results: any;
  recommendations: string | null;
  status: string;
  aiResponse: any;
  createdAt: string;
}

const TEST_TYPES = [
  { value: "pure-tone", label: "Pure Tone Audiometry" },
  { value: "speech", label: "Speech Audiometry" },
  { value: "tympanometry", label: "Tympanometry" },
  { value: "otoacoustic", label: "Otoacoustic Emissions" },
  { value: "brainstem", label: "Auditory Brainstem Response" },
];

const DEFAULT_FREQUENCIES = [
  { frequency: 250, leftEar: "", rightEar: "" },
  { frequency: 500, leftEar: "", rightEar: "" },
  { frequency: 1000, leftEar: "", rightEar: "" },
  { frequency: 2000, leftEar: "", rightEar: "" },
  { frequency: 4000, leftEar: "", rightEar: "" },
  { frequency: 8000, leftEar: "", rightEar: "" },
];

export default function HearingTestPage() {
  const [items, setItems] = useState<HearingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<HearingTest | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", patientName: "", patientAge: "",
    testType: "pure-tone", frequencies: DEFAULT_FREQUENCIES
  });
  const [processing, setProcessing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.patientName && item.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
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
          fetch(`/api/ai/hearing-test/${id}`, { method: "DELETE" })
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
          fetch(`/api/ai/hearing-test/${id}/process`, { method: "POST" }).then(r => r.ok ? r.json() : null)
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
    window.open("/api/export/csv?model=hearing-test", "_blank");
  };

  const handleExportPDF = () => {
    window.open("/api/export/pdf?model=hearing-test", "_blank");
  };

  const loadSampleData = async () => {
    setLoadingSample(true);
    const samples = [
      {
        title: "Normal Hearing - Annual Checkup",
        description: "Routine annual hearing checkup with normal results",
        patientName: "John Smith",
        patientAge: 35,
        testType: "pure-tone",
        frequencies: [
          { frequency: 250, leftEar: "15", rightEar: "10" },
          { frequency: 500, leftEar: "10", rightEar: "15" },
          { frequency: 1000, leftEar: "10", rightEar: "10" },
          { frequency: 2000, leftEar: "15", rightEar: "15" },
          { frequency: 4000, leftEar: "20", rightEar: "15" },
          { frequency: 8000, leftEar: "20", rightEar: "20" },
        ],
      },
      {
        title: "Mild High-Frequency Loss",
        description: "Patient reporting difficulty hearing in noisy environments",
        patientName: "Sarah Johnson",
        patientAge: 52,
        testType: "pure-tone",
        frequencies: [
          { frequency: 250, leftEar: "15", rightEar: "20" },
          { frequency: 500, leftEar: "20", rightEar: "20" },
          { frequency: 1000, leftEar: "20", rightEar: "25" },
          { frequency: 2000, leftEar: "30", rightEar: "35" },
          { frequency: 4000, leftEar: "40", rightEar: "45" },
          { frequency: 8000, leftEar: "50", rightEar: "55" },
        ],
      },
      {
        title: "Moderate Bilateral Loss",
        description: "Follow-up test for hearing aid fitting",
        patientName: "Robert Davis",
        patientAge: 68,
        testType: "pure-tone",
        frequencies: [
          { frequency: 250, leftEar: "30", rightEar: "25" },
          { frequency: 500, leftEar: "35", rightEar: "35" },
          { frequency: 1000, leftEar: "40", rightEar: "45" },
          { frequency: 2000, leftEar: "50", rightEar: "55" },
          { frequency: 4000, leftEar: "60", rightEar: "65" },
          { frequency: 8000, leftEar: "70", rightEar: "70" },
        ],
      },
    ];
    try {
      const results = await Promise.all(
        samples.map((sample) =>
          fetch("/api/ai/hearing-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sample),
          }).then((res) => (res.ok ? res.json() : null))
        )
      );
      const newItems = results.filter(Boolean) as HearingTest[];
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
      const response = await fetch("/api/ai/hearing-test");
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
        const response = await fetch("/api/ai/hearing-test");
        if (response.ok) {
          const data = await response.json();
          setItems(data);
          if (selectedItem) {
            const updated = data.find((d: HearingTest) => d.id === selectedItem.id);
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
    if (!formData.title) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch("/api/ai/hearing-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        }),
      });
      if (response.ok) {
        setItems([await response.json(), ...items]);
        setShowNew(false);
        setFormData({ title: "", description: "", patientName: "", patientAge: "", testType: "pure-tone", frequencies: DEFAULT_FREQUENCIES });
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
      const response = await fetch(`/api/ai/hearing-test/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        }),
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
      const response = await fetch(`/api/ai/hearing-test/${id}`, { method: "DELETE" });
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
      const response = await fetch(`/api/ai/hearing-test/${id}/process`, { method: "POST" });
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

  const updateFrequency = (index: number, ear: 'leftEar' | 'rightEar', value: string) => {
    const newFreqs = [...formData.frequencies];
    newFreqs[index] = { ...newFreqs[index], [ear]: value };
    setFormData({ ...formData, frequencies: newFreqs });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/10 text-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    const colors: Record<string, string> = {
      Normal: "bg-green-500/10 text-green-600",
      Mild: "bg-yellow-500/10 text-yellow-600",
      Moderate: "bg-orange-500/10 text-orange-600",
      Severe: "bg-red-500/10 text-red-600",
      Profound: "bg-red-600/10 text-red-700"
    };
    return <Badge className={colors[result] || "bg-gray-500/10"}>{result}</Badge>;
  };

  const getTestTypeName = (type: string) => TEST_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            AI Hearing Test
            <Badge variant="outline" className="text-xs"><Activity className="h-3 w-3 mr-1" />Healthcare</Badge>
          </h1>
          <p className="text-muted-foreground">AI-assisted hearing test analysis and recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSampleData} disabled={loadingSample}>
            {loadingSample ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Stethoscope className="h-4 w-4 mr-2" />}
            Load Sample Data
          </Button>
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />New Test</Button>
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
          <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hearing tests yet</h3>
          <Button className="mt-4" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Create Test</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </span>
          </div>
          {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:border-primary/50" onClick={() => { setSelectedItem(item); setShowDetail(true); }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      {getStatusBadge(item.status)}
                      {item.results?.overallResult && getResultBadge(item.results.overallResult)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {item.patientName && <span>Patient: {item.patientName}</span>}
                      {item.patientAge && <span>Age: {item.patientAge}</span>}
                      <span>Type: {getTestTypeName(item.testType)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Hearing Test</DialogTitle>
            <DialogDescription>Enter hearing test data for AI analysis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="E.g., Annual Checkup" /></div>
              <div className="space-y-2"><Label>Test Type</Label><Select value={formData.testType} onValueChange={(v) => setFormData({ ...formData, testType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Patient Age</Label><Input type="number" value={formData.patientAge} onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })} placeholder="Optional" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Notes about the test..." rows={2} /></div>

            <div className="space-y-2">
              <Label>Hearing Thresholds (dB)</Label>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-2 bg-muted text-sm font-medium">
                  <div>Frequency (Hz)</div>
                  <div>Left Ear (dB)</div>
                  <div>Right Ear (dB)</div>
                  <div></div>
                </div>
                {formData.frequencies.map((freq, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 p-2 border-t">
                    <div className="flex items-center font-medium">{freq.frequency}</div>
                    <Input type="number" placeholder="0-120" value={freq.leftEar} onChange={(e) => updateFrequency(idx, 'leftEar', e.target.value)} className="h-8" />
                    <Input type="number" placeholder="0-120" value={freq.rightEar} onChange={(e) => updateFrequency(idx, 'rightEar', e.target.value)} className="h-8" />
                    <div></div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Enter hearing thresholds for each frequency. Normal hearing is typically 0-25 dB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={processing}>{processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create & Analyze</Button>
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
                <div className="flex gap-4 flex-wrap">
                  {selectedItem.results?.overallResult && getResultBadge(selectedItem.results.overallResult)}
                  <Badge variant="outline">{getTestTypeName(selectedItem.testType)}</Badge>
                  {selectedItem.patientName && <Badge variant="secondary">{selectedItem.patientName}</Badge>}
                  {selectedItem.patientAge && <Badge variant="secondary">Age: {selectedItem.patientAge}</Badge>}
                </div>

                {selectedItem.frequencies && (
                  <div className="space-y-2">
                    <Label>Test Results</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 p-2 bg-muted text-sm font-medium">
                        <div>Frequency</div><div>Left Ear</div><div>Right Ear</div>
                      </div>
                      {selectedItem.frequencies.map((freq: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 p-2 border-t text-sm">
                          <div className="font-medium">{freq.frequency} Hz</div>
                          <div className={`${freq.leftEar > 25 ? 'text-red-600' : 'text-green-600'}`}>{freq.leftEar || '-'} dB</div>
                          <div className={`${freq.rightEar > 25 ? 'text-red-600' : 'text-green-600'}`}>{freq.rightEar || '-'} dB</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.recommendations && (
                  <div className="space-y-2"><Label>Recommendations</Label><div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm">{selectedItem.recommendations}</div></div>
                )}

                <AIResponseDisplay status={selectedItem.status} aiResponse={selectedItem.aiResponse} type="hearing" />
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => handleReprocess(selectedItem.id)}><Stethoscope className="h-4 w-4 mr-2" />Reprocess</Button>
                <Button variant="outline" onClick={() => { setFormData({ title: selectedItem.title, description: selectedItem.description || "", patientName: selectedItem.patientName || "", patientAge: selectedItem.patientAge?.toString() || "", testType: selectedItem.testType, frequencies: selectedItem.frequencies || DEFAULT_FREQUENCIES }); setShowDetail(false); setShowEdit(true); }}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedItem.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Hearing Test</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Test Type</Label><Select value={formData.testType} onValueChange={(v) => setFormData({ ...formData, testType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Patient Age</Label><Input type="number" value={formData.patientAge} onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
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
