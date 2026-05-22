"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsentEntry {
  id: string;
  enrollmentId: string | null;
  subjectId: string | null;
  eventType: string;
  scope: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  witnessId: string | null;
  createdAt: string;
}

export default function ConsentLedgerListPage() {
  const [rows, setRows] = useState<ConsentEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/voicestudio/consentLedger?${params}`);
      const json = await res.json();
      setRows(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast({ title: "Error", description: "Failed to load consent ledger", variant: "destructive" });
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
            <ShieldCheck className="h-7 w-7" /> Consent Ledger
          </h1>
          <p className="text-muted-foreground">{total} total entries</p>
        </div>
        <Link href="/voicestudio/consentLedger/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Consent Entry</Button>
        </Link>
      </div>

      <div className="flex items-start gap-3 border border-blue-400 bg-blue-50 text-blue-900 rounded-lg p-4">
        <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Append-only — entries cannot be edited or deleted.</strong> The consent ledger is an immutable audit trail. The backend returns 405 on PUT/DELETE requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search consent entries..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No consent entries found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Subject ID</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Granted At</TableHead>
                  <TableHead>Revoked At</TableHead>
                  <TableHead>Witness</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="outline">{row.eventType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.subjectId || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.scope || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {row.grantedAt ? new Date(row.grantedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.revokedAt ? (
                        <span className="text-red-600">{new Date(row.revokedAt).toLocaleDateString()}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.witnessId || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/voicestudio/consentLedger/${row.id}`}>
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
