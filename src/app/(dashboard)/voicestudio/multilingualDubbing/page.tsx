"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DubbingJob {
  id: string;
  status: string;
  sourceLanguage: string | null;
  targetLanguage: string | null;
  qualityScore: number | null;
  voicePreservationScore: number | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-blue-100 text-blue-800",
  processing: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function MultilingualDubbingListPage() {
  const [rows, setRows] = useState<DubbingJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/voicestudio/multilingualDubbing?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast({ title: "Error", description: "Failed to load dubbing jobs", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Languages className="h-7 w-7" />Multilingual Dubbing</h1>
          <p className="text-muted-foreground">Manage multilingual dubbing jobs. {total} total jobs.</p>
        </div>
        <Link href="/voicestudio/multilingualDubbing/new"><Button><Plus className="h-4 w-4 mr-2" />New Job</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search dubbing jobs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Languages className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>No dubbing jobs found.</p>
              <Link href="/voicestudio/multilingualDubbing/new"><Button className="mt-3" variant="outline"><Plus className="h-4 w-4 mr-2" />Create First Job</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Voice Preservation</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Badge className={STATUS_COLORS[row.status] || "bg-gray-100 text-gray-800"}>{row.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{row.sourceLanguage || "-"}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{row.targetLanguage || "-"}</Badge></TableCell>
                    <TableCell>{row.qualityScore ?? "-"}</TableCell>
                    <TableCell>{row.voicePreservationScore ?? "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Link href={`/voicestudio/multilingualDubbing/${row.id}`}><Button size="sm" variant="outline">View</Button></Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
