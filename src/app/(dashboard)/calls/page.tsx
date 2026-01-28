"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Download,
  MessageSquare,
  Clock,
  User,
  Bot,
  Search,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import { formatDuration, formatPhoneNumber, formatDateTime } from "@/lib/utils";

interface Call {
  id: string;
  direction: string;
  status: string;
  from: string;
  to: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  recordingUrl: string | null;
  transcription: string | null;
  sentiment: string | null;
  sentimentScore: number | null;
  intent: string | null;
  summary: string | null;
  outcome: string | null;
  wasTransferred: boolean;
  hasVoicemail: boolean;
  agent: { id: string; name: string } | null;
  phoneNumber: { id: string; number: string; displayName: string } | null;
  messages?: { id: string; role: string; content: string; timestamp: string }[];
}

interface CallsResponse {
  calls: Call[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CallsPage() {
  const [data, setData] = useState<CallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    direction: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (filters.status) params.set("status", filters.status);
      if (filters.direction) params.set("direction", filters.direction);

      const response = await fetch(`/api/calls?${params.toString()}`);
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCallDetails = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}`);
      if (response.ok) {
        setSelectedCall(await response.json());
        setDetailDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch call details",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [page, filters.status, filters.direction]);

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    "no-answer": "bg-yellow-100 text-yellow-800",
    busy: "bg-orange-100 text-orange-800",
  };

  const sentimentIcons: Record<string, React.ReactNode> = {
    positive: <ThumbsUp className="h-4 w-4 text-green-600" />,
    negative: <ThumbsDown className="h-4 w-4 text-red-600" />,
    neutral: <Minus className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call History</h1>
        <p className="text-muted-foreground">View and analyze your call history</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="no-answer">No Answer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.direction || "all"}
          onValueChange={(value) => setFilters({ ...filters, direction: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calls Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : data?.calls.length === 0 ? (
            <div className="text-center py-12">
              <PhoneCall className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
              <p className="text-muted-foreground">
                Calls will appear here once your agents start receiving them
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>From / To</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.calls.map((call) => (
                  <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      {call.direction === "inbound" ? (
                        <div className="flex items-center space-x-2">
                          <PhoneIncoming className="h-4 w-4 text-green-600" />
                          <span>Inbound</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                          <span>Outbound</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatPhoneNumber(call.from)}</p>
                        <p className="text-sm text-muted-foreground">
                          to {formatPhoneNumber(call.to)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.agent ? (
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>{call.agent.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {call.duration ? formatDuration(call.duration) : "-"}
                    </TableCell>
                    <TableCell>
                      {call.sentiment ? (
                        <div className="flex items-center space-x-2">
                          {sentimentIcons[call.sentiment]}
                          <span className="capitalize">{call.sentiment}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[call.status] || "bg-gray-100"}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(call.startTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchCallDetails(call.id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {call.recordingUrl && (
                          <Button variant="ghost" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(page * data.pagination.limit, data.pagination.total)} of{" "}
            {data.pagination.total} calls
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Call Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                {selectedCall.recordingUrl && (
                  <TabsTrigger value="recording">Recording</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">{formatPhoneNumber(selectedCall.from)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{formatPhoneNumber(selectedCall.to)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {selectedCall.duration ? formatDuration(selectedCall.duration) : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[selectedCall.status]}>
                      {selectedCall.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Agent</p>
                    <p className="font-medium">{selectedCall.agent?.name || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sentiment</p>
                    <p className="font-medium capitalize">{selectedCall.sentiment || "-"}</p>
                  </div>
                </div>
                {selectedCall.summary && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Summary</p>
                    <p>{selectedCall.summary}</p>
                  </div>
                )}
                {selectedCall.intent && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Intent</p>
                    <Badge variant="outline">{selectedCall.intent}</Badge>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="transcript">
                {selectedCall.transcription ? (
                  <div className="space-y-4 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedCall.transcription}</p>
                  </div>
                ) : selectedCall.messages?.length ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedCall.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === "assistant"
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No transcript available
                  </p>
                )}
              </TabsContent>
              {selectedCall.recordingUrl && (
                <TabsContent value="recording">
                  <div className="space-y-4">
                    <audio controls className="w-full">
                      <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <Button variant="outline" asChild>
                      <a href={selectedCall.recordingUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Recording
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
