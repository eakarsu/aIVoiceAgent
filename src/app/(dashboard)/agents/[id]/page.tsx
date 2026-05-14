"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgePanel } from "@/components/agents/knowledge-panel";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Bot,
  Mic,
  Brain,
  MessageSquare,
  FileText,
  GitBranch,
  Plus,
  Trash2,
  Edit,
  Save,
} from "lucide-react";
import Link from "next/link";

interface Voice {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: string;
}

interface Script {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  isActive: boolean;
}

interface Response {
  id: string;
  trigger: string;
  response: string;
  category: string | null;
  priority: number;
  isActive: boolean;
}

interface Agent {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  voiceId: string | null;
  voiceName: string;
  voiceProvider: string;
  voiceSpeed: number;
  voicePitch: number;
  personalityType: string;
  greeting: string;
  fallbackMessage: string;
  transferMessage: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  primaryLanguage: string;
  supportedLanguages: string[];
  scripts: Script[];
  responses: Response[];
}

const personalityTypes = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

const aiModels = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "settings");

  // Script dialog state
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [scriptForm, setScriptForm] = useState({ name: "", description: "", content: "", category: "" });

  // Response dialog state
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<Response | null>(null);
  const [responseForm, setResponseForm] = useState({ trigger: "", response: "", category: "", priority: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentRes, voicesRes] = await Promise.all([
          fetch(`/api/agents/${params.id}`),
          fetch("/api/voices"),
        ]);

        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setAgent(agentData);
        } else {
          router.push("/agents");
        }

        if (voicesRes.ok) {
          const voicesData = await voicesRes.json();
          setVoices(voicesData);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Agent updated successfully" });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update agent", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId);
    if (voice && agent) {
      setAgent({
        ...agent,
        voiceId: voice.id,
        voiceName: voice.name,
        voiceProvider: voice.provider,
      });
    }
  };

  // Script handlers
  const handleSaveScript = async () => {
    if (!agent) return;

    try {
      const url = editingScript ? `/api/scripts/${editingScript.id}` : "/api/scripts";
      const method = editingScript ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scriptForm, agentId: agent.id }),
      });

      if (response.ok) {
        const script = await response.json();
        if (editingScript) {
          setAgent({
            ...agent,
            scripts: agent.scripts.map((s) => (s.id === script.id ? script : s)),
          });
        } else {
          setAgent({ ...agent, scripts: [...agent.scripts, script] });
        }
        toast({ title: "Success", description: `Script ${editingScript ? "updated" : "created"}` });
        setScriptDialogOpen(false);
        setEditingScript(null);
        setScriptForm({ name: "", description: "", content: "", category: "" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save script", variant: "destructive" });
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!agent) return;

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
      if (response.ok) {
        setAgent({ ...agent, scripts: agent.scripts.filter((s) => s.id !== scriptId) });
        toast({ title: "Success", description: "Script deleted" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete script", variant: "destructive" });
    }
  };

  // Response handlers
  const handleSaveResponse = async () => {
    if (!agent) return;

    try {
      const url = editingResponse ? `/api/responses/${editingResponse.id}` : "/api/responses";
      const method = editingResponse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...responseForm, agentId: agent.id }),
      });

      if (response.ok) {
        const resp = await response.json();
        if (editingResponse) {
          setAgent({
            ...agent,
            responses: agent.responses.map((r) => (r.id === resp.id ? resp : r)),
          });
        } else {
          setAgent({ ...agent, responses: [...agent.responses, resp] });
        }
        toast({ title: "Success", description: `Response ${editingResponse ? "updated" : "created"}` });
        setResponseDialogOpen(false);
        setEditingResponse(null);
        setResponseForm({ trigger: "", response: "", category: "", priority: 0 });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save response", variant: "destructive" });
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!agent) return;

    try {
      const response = await fetch(`/api/responses/${responseId}`, { method: "DELETE" });
      if (response.ok) {
        setAgent({ ...agent, responses: agent.responses.filter((r) => r.id !== responseId) });
        toast({ title: "Success", description: "Response deleted" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete response", variant: "destructive" });
    }
  };

  if (loading || !agent) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description || "Configure your agent"}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch
              checked={agent.isActive}
              onCheckedChange={(checked) => setAgent({ ...agent, isActive: checked })}
            />
          </div>
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">
            <Bot className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="h-4 w-4 mr-2" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="scripts">
            <FileText className="h-4 w-4 mr-2" />
            Scripts ({agent.scripts.length})
          </TabsTrigger>
          <TabsTrigger value="responses">
            <MessageSquare className="h-4 w-4 mr-2" />
            Responses ({agent.responses.length})
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <FileText className="h-4 w-4 mr-2" />
            Knowledge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={agent.name}
                    onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Language</Label>
                  <Select
                    value={agent.primaryLanguage}
                    onValueChange={(value) => setAgent({ ...agent, primaryLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={agent.description || ""}
                  onChange={(e) => setAgent({ ...agent, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Personality</Label>
                <Select
                  value={agent.personalityType}
                  onValueChange={(value) => setAgent({ ...agent, personalityType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Greeting</Label>
                <Textarea
                  value={agent.greeting}
                  onChange={(e) => setAgent({ ...agent, greeting: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fallback Message</Label>
                <Textarea
                  value={agent.fallbackMessage}
                  onChange={(e) => setAgent({ ...agent, fallbackMessage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Transfer Message</Label>
                <Textarea
                  value={agent.transferMessage}
                  onChange={(e) => setAgent({ ...agent, transferMessage: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={agent.voiceId || ""} onValueChange={handleVoiceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Speed: {agent.voiceSpeed.toFixed(1)}x</Label>
                <Slider
                  value={agent.voiceSpeed}
                  onChange={(value) => setAgent({ ...agent, voiceSpeed: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label>Pitch: {agent.voicePitch.toFixed(1)}</Label>
                <Slider
                  value={agent.voicePitch}
                  onChange={(value) => setAgent({ ...agent, voicePitch: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scripts</CardTitle>
                <CardDescription>Pre-written responses for your agent</CardDescription>
              </div>
              <Button onClick={() => { setEditingScript(null); setScriptForm({ name: "", description: "", content: "", category: "" }); setScriptDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Script
              </Button>
            </CardHeader>
            <CardContent>
              {agent.scripts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scripts yet. Add your first script.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agent.scripts.map((script) => (
                      <TableRow key={script.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{script.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{script.content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {script.category && <Badge variant="outline">{script.category}</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={script.isActive ? "success" : "secondary"}>
                            {script.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingScript(script);
                                setScriptForm({
                                  name: script.name,
                                  description: script.description || "",
                                  content: script.content,
                                  category: script.category || "",
                                });
                                setScriptDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteScript(script.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Response Library</CardTitle>
                <CardDescription>Quick responses triggered by keywords</CardDescription>
              </div>
              <Button onClick={() => { setEditingResponse(null); setResponseForm({ trigger: "", response: "", category: "", priority: 0 }); setResponseDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Response
              </Button>
            </CardHeader>
            <CardContent>
              {agent.responses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No responses yet. Add your first response.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agent.responses.map((resp) => (
                      <TableRow key={resp.id}>
                        <TableCell className="font-medium">{resp.trigger}</TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2">{resp.response}</p>
                        </TableCell>
                        <TableCell>
                          {resp.category && <Badge variant="outline">{resp.category}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingResponse(resp);
                                setResponseForm({
                                  trigger: resp.trigger,
                                  response: resp.response,
                                  category: resp.category || "",
                                  priority: resp.priority,
                                });
                                setResponseDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteResponse(resp.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  value={agent.aiModel}
                  onValueChange={(value) => setAgent({ ...agent, aiModel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Temperature: {agent.temperature.toFixed(1)}</Label>
                <Slider
                  value={agent.temperature}
                  onChange={(value) => setAgent({ ...agent, temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Tokens: {agent.maxTokens}</Label>
                <Slider
                  value={agent.maxTokens}
                  onChange={(value) => setAgent({ ...agent, maxTokens: Math.round(value) })}
                  min={50}
                  max={500}
                  step={10}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <KnowledgePanel agentId={agent.id} />
        </TabsContent>
      </Tabs>

      {/* Script Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScript ? "Edit Script" : "Add Script"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={scriptForm.name}
                onChange={(e) => setScriptForm({ ...scriptForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={scriptForm.category}
                onChange={(e) => setScriptForm({ ...scriptForm, category: e.target.value })}
                placeholder="e.g., Greeting, Support, Sales"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={scriptForm.content}
                onChange={(e) => setScriptForm({ ...scriptForm, content: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveScript}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResponse ? "Edit Response" : "Add Response"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Keyword</Label>
              <Input
                value={responseForm.trigger}
                onChange={(e) => setResponseForm({ ...responseForm, trigger: e.target.value })}
                placeholder="e.g., hours, pricing, support"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={responseForm.category}
                onChange={(e) => setResponseForm({ ...responseForm, category: e.target.value })}
                placeholder="e.g., General, Sales"
              />
            </div>
            <div className="space-y-2">
              <Label>Response</Label>
              <Textarea
                value={responseForm.response}
                onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveResponse}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
