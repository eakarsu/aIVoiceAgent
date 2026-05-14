"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, BookOpen } from "lucide-react";

interface KnowledgeRow {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function KnowledgePanel({ agentId }: { agentId: string }) {
  const [rows, setRows] = useState<KnowledgeRow[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  async function load(p: number = page) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agents/${agentId}/knowledge?page=${p}&pageSize=10`
      );
      if (res.ok) {
        const json = await res.json();
        setRows(json.data || []);
        setPagination(json.pagination || null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  async function add() {
    if (!title || !content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, sourceUrl }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setSourceUrl("");
        load(1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="w-4 h-4" />
          Agent Knowledge Base
        </div>

        <div className="space-y-2 border rounded-md p-3">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Refund policy"
          />
          <Label>Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste policy text, FAQ, or pricing details…"
            rows={5}
          />
          <Label>Source URL (optional)</Label>
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/policy"
          />
          <Button onClick={add} disabled={submitting || !title || !content}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Knowledge
          </Button>
        </div>

        <div className="space-y-2">
          {loading && <div className="text-sm">Loading…</div>}
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No knowledge entries yet. The agent will rely on its system prompt only.
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="border rounded-md p-3">
              <div className="font-medium text-sm">{r.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {r.content}
              </div>
              {r.sourceUrl && (
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline"
                >
                  source
                </a>
              )}
            </div>
          ))}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                load(p);
              }}
            >
              Prev
            </Button>
            <span>
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                load(p);
              }}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
