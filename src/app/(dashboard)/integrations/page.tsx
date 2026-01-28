"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plug,
  Plus,
  Trash2,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  Webhook,
  Key,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { WEBHOOK_EVENTS } from "@/types";

interface Integration {
  id: string;
  type: string;
  provider: string;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface WebhookType {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  key?: string;
}

const integrationTypes = [
  { type: "calendar", label: "Calendar", icon: Calendar, providers: ["google-calendar", "outlook"] },
  { type: "crm", label: "CRM", icon: Users, providers: ["salesforce", "hubspot"] },
  { type: "payment", label: "Payment", icon: CreditCard, providers: ["stripe"] },
  { type: "sms", label: "SMS", icon: MessageSquare, providers: ["twilio-sms"] },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Integration dialog
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [integrationForm, setIntegrationForm] = useState({
    type: "",
    provider: "",
    name: "",
  });

  // Webhook dialog
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  // API Key dialog
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
    scopes: ["read"],
  });

  const fetchData = async () => {
    try {
      const [intRes, webhookRes, apiKeyRes] = await Promise.all([
        fetch("/api/integrations"),
        fetch("/api/webhooks"),
        fetch("/api/api-keys"),
      ]);

      if (intRes.ok) setIntegrations(await intRes.json());
      if (webhookRes.ok) setWebhooks(await webhookRes.json());
      if (apiKeyRes.ok) setApiKeys(await apiKeyRes.json());
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIntegration = async () => {
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(integrationForm),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Integration created" });
        fetchData();
        setIntegrationDialogOpen(false);
        setIntegrationForm({ type: "", provider: "", name: "" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create integration", variant: "destructive" });
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      setIntegrations(integrations.filter((i) => i.id !== id));
      toast({ title: "Success", description: "Integration deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookForm),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Webhook created" });
        fetchData();
        setWebhookDialogOpen(false);
        setWebhookForm({ name: "", url: "", events: [] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create webhook", variant: "destructive" });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast({ title: "Success", description: "Webhook deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKeyForm),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.key);
        toast({ title: "Success", description: "API key created" });
        fetchData();
        setApiKeyForm({ name: "", scopes: ["read"] });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create API key", variant: "destructive" });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter((k) => k.id !== id));
      toast({ title: "Success", description: "API key deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const selectedType = integrationTypes.find((t) => t.type === integrationForm.type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect external services and manage API access</p>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIntegrationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>

          {integrations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No integrations</h3>
                <p className="text-muted-foreground mb-4">
                  Connect external services like calendars, CRMs, and more
                </p>
                <Button onClick={() => setIntegrationDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const typeInfo = integrationTypes.find((t) => t.type === integration.type);
                const Icon = typeInfo?.icon || Plug;
                return (
                  <Card key={integration.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="capitalize">{integration.provider}</CardDescription>
                        </div>
                      </div>
                      <Switch checked={integration.isActive} />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant={integration.isActive ? "success" : "secondary"}>
                          {integration.isActive ? "Connected" : "Disconnected"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setWebhookDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {webhooks.length === 0 ? (
                <div className="text-center py-12">
                  <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No webhooks</h3>
                  <p className="text-muted-foreground">
                    Webhooks notify your systems when events occur
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell className="font-medium">{webhook.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setApiKeyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No API keys</h3>
                  <p className="text-muted-foreground">
                    Create API keys to access the platform programmatically
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Scopes</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {apiKey.prefix}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {apiKey.scopes.map((scope) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {apiKey.lastUsedAt ? formatDateTime(apiKey.lastUsedAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(apiKey.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Dialog */}
      <Dialog open={integrationDialogOpen} onOpenChange={setIntegrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect an external service</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={integrationForm.type}
                onValueChange={(value) => setIntegrationForm({ ...integrationForm, type: value, provider: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {integrationTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType && (
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={integrationForm.provider}
                  onValueChange={(value) => setIntegrationForm({ ...integrationForm, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType.providers.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider.replace("-", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={integrationForm.name}
                onChange={(e) => setIntegrationForm({ ...integrationForm, name: e.target.value })}
                placeholder="My Integration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntegrationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateIntegration}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Dialog */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={webhookForm.name}
                onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                placeholder="My Webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={webhookForm.url}
                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event.type} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={webhookForm.events.includes(event.type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookForm({ ...webhookForm, events: [...webhookForm.events, event.type] });
                        } else {
                          setWebhookForm({
                            ...webhookForm,
                            events: webhookForm.events.filter((e) => e !== event.type),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={(open) => { setApiKeyDialogOpen(open); if (!open) setNewApiKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newApiKey ? "API Key Created" : "Create API Key"}</DialogTitle>
          </DialogHeader>
          {newApiKey ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Make sure to copy your API key now. You will not be able to see it again.
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-3 bg-muted rounded text-sm break-all">{newApiKey}</code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(newApiKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                  placeholder="My API Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="flex space-x-4">
                  {["read", "write", "admin"].map((scope) => (
                    <label key={scope} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={apiKeyForm.scopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiKeyForm({ ...apiKeyForm, scopes: [...apiKeyForm.scopes, scope] });
                          } else {
                            setApiKeyForm({
                              ...apiKeyForm,
                              scopes: apiKeyForm.scopes.filter((s) => s !== scope),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="capitalize">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {newApiKey ? (
              <Button onClick={() => { setApiKeyDialogOpen(false); setNewApiKey(null); }}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateApiKey}>Create</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
