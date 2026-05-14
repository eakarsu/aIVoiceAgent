"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Plus,
  Settings,
  FileText,
  MessageSquare,
  GitBranch,
  Phone,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  voiceName: string;
  personalityType: string;
  _count: {
    scripts: number;
    responses: number;
    callFlows: number;
    phoneNumbers: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const { toast } = useToast();

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents?pageSize=100");
      if (response.ok) {
        const json = await response.json();
        // Backwards-compat: handle both paginated and bare-array responses.
        setAgents(Array.isArray(json) ? json : json.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleToggleActive = async (agent: Agent) => {
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agent, isActive: !agent.isActive }),
      });

      if (response.ok) {
        setAgents(agents.map((a) =>
          a.id === agent.id ? { ...a, isActive: !a.isActive } : a
        ));
        toast({
          title: "Success",
          description: `Agent ${!agent.isActive ? "activated" : "deactivated"}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!agentToDelete) return;

    try {
      const response = await fetch(`/api/agents/${agentToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAgents(agents.filter((a) => a.id !== agentToDelete.id));
        toast({
          title: "Success",
          description: "Agent deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  const personalityColors: Record<string, string> = {
    professional: "bg-blue-100 text-blue-800",
    friendly: "bg-green-100 text-green-800",
    casual: "bg-purple-100 text-purple-800",
    formal: "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-muted-foreground">Manage your AI voice agents</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">Manage your AI voice agents</p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI voice agent to get started
            </p>
            <Link href="/agents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${agent.isActive ? "bg-primary/10" : "bg-muted"}`}>
                      <Bot className={`h-5 w-5 ${agent.isActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {agent.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/agents/${agent.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/agents/${agent.id}?tab=scripts`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Scripts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/agents/${agent.id}?tab=responses`}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Responses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setAgentToDelete(agent);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={personalityColors[agent.personalityType]}>
                      {agent.personalityType}
                    </Badge>
                    <Badge variant="outline">{agent.voiceName}</Badge>
                  </div>
                  <Switch
                    checked={agent.isActive}
                    onCheckedChange={() => handleToggleActive(agent)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-muted rounded">
                    <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{agent._count.scripts}</p>
                    <p className="text-xs text-muted-foreground">Scripts</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{agent._count.responses}</p>
                    <p className="text-xs text-muted-foreground">Responses</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <GitBranch className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{agent._count.callFlows}</p>
                    <p className="text-xs text-muted-foreground">Flows</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <Phone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{agent._count.phoneNumbers}</p>
                    <p className="text-xs text-muted-foreground">Numbers</p>
                  </div>
                </div>

                <Link href={`/agents/${agent.id}`}>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {agentToDelete?.name}? This action cannot be undone.
              All scripts, responses, and call flows associated with this agent will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
