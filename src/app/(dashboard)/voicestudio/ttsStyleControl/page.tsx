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
import { Plus, Search, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TtsStyle {
  id: string;
  name: string;
  emotion: string | null;
  pace: string | null;
  pitch: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function TtsStyleControlListPage() {
  const [rows, setRows] = useState<TtsStyle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/voicestudio/ttsStyleControl?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast({ title: "Error", description: "Failed to load TTS styles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Volume2 className="h-7 w-7" /> TTS Style Control
          </h1>
          <p className="text-muted-foreground">Manage text-to-speech style configurations. {total} total styles.</p>
        </div>
        <Link href="/voicestudio/ttsStyleControl/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Style</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search styles..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Volume2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No TTS styles found.</p>
              <Link href="/voicestudio/ttsStyleControl/new">
                <Button className="mt-3" variant="outline"><Plus className="h-4 w-4 mr-2" />Create First Style</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Emotion</TableHead>
                  <TableHead>Pace</TableHead>
                  <TableHead>Pitch</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.emotion || "-"}</TableCell>
                    <TableCell>{row.pace || "-"}</TableCell>
                    <TableCell>{row.pitch || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link href={`/voicestudio/ttsStyleControl/${row.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </TableCell>
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
