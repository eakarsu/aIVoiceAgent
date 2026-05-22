"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  subjectId: string;
  subjectName: string;
  displayName: string | null;
  status: string;
  consentGrantedAt: string | null;
  qualityScore: number | null;
  fidelityScore: number | null;
  isArchived: boolean;
  createdAt: string;
  _count?: { samples: number };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  revoked: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
};

export default function VoiceCloneEnrollListPage() {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/voicestudio/voiceCloneEnroll?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast({ title: "Error", description: "Failed to load enrollments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mic className="h-7 w-7" /> Voice Clone Enrollment
          </h1>
          <p className="text-muted-foreground">
            Manage voice clone enrollment records. {total} total enrollments.
          </p>
        </div>
        <Link href="/voicestudio/voiceCloneEnroll/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Enrollment</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or subject ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="revoked">Revoked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mic className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No enrollments found.</p>
              <Link href="/voicestudio/voiceCloneEnroll/new">
                <Button className="mt-3" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />Create First Enrollment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <div>{row.subjectName}</div>
                      <div className="text-xs text-muted-foreground">{row.subjectId}</div>
                    </TableCell>
                    <TableCell>{row.displayName || "-"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[row.status] || "bg-gray-100 text-gray-800"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.consentGrantedAt
                        ? new Date(row.consentGrantedAt).toLocaleDateString()
                        : <span className="text-red-500 text-xs">No consent</span>}
                    </TableCell>
                    <TableCell>{row.qualityScore ?? "-"}</TableCell>
                    <TableCell>{row._count?.samples ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/voicestudio/voiceCloneEnroll/${row.id}`}>
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
