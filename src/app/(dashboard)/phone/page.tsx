"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone,
  Plus,
  Settings,
  Trash2,
  MoreVertical,
  PhoneIncoming,
  PhoneOutgoing,
  Bot,
  Voicemail,
  Mic,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhoneNumber } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

interface PhoneNumber {
  id: string;
  number: string;
  displayName: string | null;
  country: string;
  type: string;
  provider: string;
  status: string;
  callHandling: string;
  forwardTo: string | null;
  voicemailEnabled: boolean;
  recordingEnabled: boolean;
  agent: Agent | null;
  _count: { calls: number };
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
  const [formData, setFormData] = useState({
    number: "",
    displayName: "",
    type: "local",
    callHandling: "agent",
    forwardTo: "",
    voicemailEnabled: true,
    recordingEnabled: true,
    agentId: "",
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [numbersRes, agentsRes] = await Promise.all([
        fetch("/api/phone-numbers"),
        fetch("/api/agents"),
      ]);

      if (numbersRes.ok) {
        setPhoneNumbers(await numbersRes.json());
      }
      if (agentsRes.ok) {
        setAgents(await agentsRes.json());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const url = selectedNumber
        ? `/api/phone-numbers/${selectedNumber.id}`
        : "/api/phone-numbers";
      const method = selectedNumber ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Phone number ${selectedNumber ? "updated" : "added"} successfully`,
        });
        fetchData();
        setDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNumber) return;

    try {
      const response = await fetch(`/api/phone-numbers/${selectedNumber.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Success", description: "Phone number deleted" });
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete phone number",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedNumber(null);
    }
  };

  const resetForm = () => {
    setFormData({
      number: "",
      displayName: "",
      type: "local",
      callHandling: "agent",
      forwardTo: "",
      voicemailEnabled: true,
      recordingEnabled: true,
      agentId: "",
    });
    setSelectedNumber(null);
  };

  const openEditDialog = (phoneNumber: PhoneNumber) => {
    setSelectedNumber(phoneNumber);
    setFormData({
      number: phoneNumber.number,
      displayName: phoneNumber.displayName || "",
      type: phoneNumber.type,
      callHandling: phoneNumber.callHandling,
      forwardTo: phoneNumber.forwardTo || "",
      voicemailEnabled: phoneNumber.voicemailEnabled,
      recordingEnabled: phoneNumber.recordingEnabled,
      agentId: phoneNumber.agent?.id || "",
    });
    setDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Phone Numbers</h1>
            <p className="text-muted-foreground">Manage your phone numbers</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Phone Numbers</h1>
          <p className="text-muted-foreground">Manage your phone numbers and call routing</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Number
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No phone numbers</h3>
              <p className="text-muted-foreground mb-4">
                Add a phone number to start receiving calls
              </p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phoneNumbers.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatPhoneNumber(phone.number)}</p>
                        {phone.displayName && (
                          <p className="text-sm text-muted-foreground">{phone.displayName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {phone.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {phone.agent ? (
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span>{phone.agent.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{phone.callHandling}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {phone.voicemailEnabled && (
                          <span title="Voicemail enabled">
                            <Voicemail className="h-4 w-4 text-muted-foreground" />
                          </span>
                        )}
                        {phone.recordingEnabled && (
                          <span title="Recording enabled">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{phone._count.calls}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[phone.status]}>
                        {phone.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(phone)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedNumber(phone);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNumber ? "Configure" : "Add"} Phone Number</DialogTitle>
            <DialogDescription>
              {selectedNumber ? "Update the phone number settings" : "Add a new phone number to your account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="+1234567890"
                disabled={!!selectedNumber}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Main Support Line"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={!!selectedNumber}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="tollfree">Toll-Free</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Call Handling</Label>
              <Select
                value={formData.callHandling}
                onValueChange={(value) => setFormData({ ...formData, callHandling: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">AI Agent</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.callHandling === "agent" && (
              <div className="space-y-2">
                <Label>Assign Agent</Label>
                <Select
                  value={formData.agentId}
                  onValueChange={(value) => setFormData({ ...formData, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.callHandling === "forward" && (
              <div className="space-y-2">
                <Label>Forward To</Label>
                <Input
                  value={formData.forwardTo}
                  onChange={(e) => setFormData({ ...formData, forwardTo: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Voicemail</Label>
              <Switch
                checked={formData.voicemailEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, voicemailEnabled: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Call Recording</Label>
              <Switch
                checked={formData.recordingEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, recordingEnabled: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Phone Number</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedNumber?.displayName || formatPhoneNumber(selectedNumber?.number || "")}?
              This action cannot be undone.
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
