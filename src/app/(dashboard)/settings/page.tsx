"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Bell, Shield, CreditCard, Save, Loader2, Lock } from "lucide-react";
import { validatePasswordStrength, type PasswordStrength } from "@/lib/password-validation";

interface Timezone {
  value: string;
  label: string;
}

interface BillingData {
  subscription: {
    plan: string;
    status: string;
    price: number;
    startDate: string | null;
    endDate: string | null;
    features: string[];
  };
  usage: {
    callMinutes: number;
    callMinutesLimit: number;
    agents: number;
    agentsLimit: number;
    totalCalls: number;
    aiTokens: number;
    smsCount: number;
  };
  billing: {
    currentAmount: number;
    isPaid: boolean;
    paymentMethod: {
      type: string;
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
    };
  };
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [billingData, setBillingData] = useState<BillingData | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [businessForm, setBusinessForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    industry: "",
    timezone: "UTC",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    emailCalls: true,
    emailVoicemail: true,
    emailReports: false,
    emailAlerts: true,
  });

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [configRes, profileRes, businessRes, billingRes] = await Promise.all([
          fetch("/api/settings/config"),
          fetch("/api/settings/profile"),
          fetch("/api/settings/business"),
          fetch("/api/settings/billing"),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          setTimezones(configData.timezones || []);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileForm({
            name: profileData.name || "",
            email: profileData.email || "",
          });
        }

        if (businessRes.ok) {
          const businessData = await businessRes.json();
          setBusinessForm({
            name: businessData.name || "",
            email: businessData.email || "",
            phone: businessData.phone || "",
            address: businessData.address || "",
            website: businessData.website || "",
            industry: businessData.industry || "",
            timezone: businessData.timezone || "UTC",
          });
        }

        if (billingRes.ok) {
          const billingInfo = await billingRes.json();
          setBillingData(billingInfo);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
        await update(); // Refresh session
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessForm),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Business settings updated" });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // In production, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({ title: "Success", description: "Notification preferences updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const planColors: Record<string, string> = {
    starter: "text-blue-600",
    professional: "text-purple-600",
    enterprise: "text-amber-600",
    free: "text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Update your business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Email</Label>
                  <Input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={businessForm.industry}
                    onChange={(e) => setBusinessForm({ ...businessForm, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={businessForm.timezone}
                    onValueChange={(value) => setBusinessForm({ ...businessForm, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveBusiness} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Call Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when calls are completed</p>
                  </div>
                  <Switch
                    checked={notifications.emailCalls}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailCalls: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Voicemail Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when voicemails are received</p>
                  </div>
                  <Switch
                    checked={notifications.emailVoicemail}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailVoicemail: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">Receive weekly analytics reports</p>
                  </div>
                  <Switch
                    checked={notifications.emailReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailReports: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified about system issues</p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailAlerts: checked })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPasswordForm({ ...passwordForm, newPassword: value });
                      setPasswordStrength(value ? validatePasswordStrength(value) : null);
                    }}
                  />
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${
                              i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <Button
                disabled={changingPassword}
                onClick={async () => {
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
                    return;
                  }
                  setChangingPassword(true);
                  try {
                    const res = await fetch("/api/auth/change-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast({ title: "Success", description: "Password changed successfully", variant: "success" });
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setPasswordStrength(null);
                    } else {
                      toast({ title: "Error", description: data.error || "Failed to change password", variant: "destructive" });
                    }
                  } catch {
                    toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
                  } finally {
                    setChangingPassword(false);
                  }
                }}
              >
                {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {billingData ? (
                <>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Plan</p>
                        <p className={`text-2xl font-bold mt-1 capitalize ${planColors[billingData.subscription.plan] || ""}`}>
                          {billingData.subscription.plan}
                        </p>
                        <p className="text-sm text-muted-foreground">${billingData.subscription.price}/month</p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Usage This Month</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">Call Minutes</span>
                          <span className="font-medium">
                            {billingData.usage.callMinutes.toLocaleString()} / {billingData.usage.callMinutesLimit.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={(billingData.usage.callMinutes / billingData.usage.callMinutesLimit) * 100}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">Active Agents</span>
                          <span className="font-medium">
                            {billingData.usage.agents} / {billingData.usage.agentsLimit}
                          </span>
                        </div>
                        <Progress
                          value={(billingData.usage.agents / billingData.usage.agentsLimit) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Calls</span>
                        <span className="font-medium">{billingData.usage.totalCalls.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">AI Tokens Used</span>
                        <span className="font-medium">{billingData.usage.aiTokens.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Payment Method</h4>
                    <div className="p-4 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {billingData.billing.paymentMethod.brand} ending in {billingData.billing.paymentMethod.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {billingData.billing.paymentMethod.expiryMonth}/{billingData.billing.paymentMethod.expiryYear}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Unable to load billing information
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
