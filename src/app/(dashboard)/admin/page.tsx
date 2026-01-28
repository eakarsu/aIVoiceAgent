"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Building2,
  Users,
  Bot,
  Phone,
  PhoneCall,
  Search,
  MoreVertical,
  Settings,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  industry: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    agents: number;
    phoneNumbers: number;
    calls: number;
  };
  subscriptions: { plan: string; status: string }[];
}

export default function AdminPortalPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/admin/businesses");
      if (response.ok) {
        setBusinesses(await response.json());
      } else if (response.status === 401) {
        toast({
          title: "Unauthorized",
          description: "You do not have access to the admin portal",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = businesses.reduce((sum, b) => sum + b._count.users, 0);
  const totalAgents = businesses.reduce((sum, b) => sum + b._count.agents, 0);
  const totalCalls = businesses.reduce((sum, b) => sum + b._count.calls, 0);

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800",
    starter: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    enterprise: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <p className="text-muted-foreground">Manage all businesses and users</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Businesses</p>
                <p className="text-2xl font-bold">{businesses.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{totalAgents}</p>
              </div>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">{totalCalls}</p>
              </div>
              <PhoneCall className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Businesses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No businesses found</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Phone Numbers</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{business.name}</p>
                        <p className="text-sm text-muted-foreground">{business.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[business.subscriptions[0]?.plan || "free"]}>
                        {business.subscriptions[0]?.plan || "free"}
                      </Badge>
                    </TableCell>
                    <TableCell>{business._count.users}</TableCell>
                    <TableCell>{business._count.agents}</TableCell>
                    <TableCell>{business._count.phoneNumbers}</TableCell>
                    <TableCell>{business._count.calls}</TableCell>
                    <TableCell>
                      <Badge variant={business.isActive ? "success" : "destructive"}>
                        {business.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(business.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
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
    </div>
  );
}
