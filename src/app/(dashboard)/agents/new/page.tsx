"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bot, Mic, Brain, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Voice {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: string;
  description: string;
}

interface ConfigOption {
  value: string;
  label: string;
  description?: string;
}

interface SystemConfig {
  personalityTypes: ConfigOption[];
  aiModels: ConfigOption[];
  languages: ConfigOption[];
}

export default function NewAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    personalityTypes: [],
    aiModels: [],
    languages: [],
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    voiceId: "",
    voiceName: "Default",
    voiceProvider: "system",
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    personalityType: "professional",
    greeting: "Hello! How can I help you today?",
    fallbackMessage: "I'm sorry, I didn't understand that. Could you please repeat?",
    transferMessage: "Let me transfer you to a human agent.",
    aiModel: "gpt-4",
    temperature: 0.7,
    maxTokens: 150,
    primaryLanguage: "en",
    supportedLanguages: ["en"],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voicesRes, configRes] = await Promise.all([
          fetch("/api/voices"),
          fetch("/api/settings/config"),
        ]);

        if (voicesRes.ok) {
          const voicesData = await voicesRes.json();
          setVoices(voicesData);
        }

        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig({
            personalityTypes: configData.personalityTypes || [],
            aiModels: configData.aiModels || [],
            languages: configData.languages || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const agent = await response.json();
        toast({
          title: "Success",
          description: "Agent created successfully",
          variant: "success",
        });
        router.push(`/agents/${agent.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId);
    if (voice) {
      setFormData({
        ...formData,
        voiceId: voice.id,
        voiceName: voice.name,
        voiceProvider: voice.provider,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Agent</h1>
          <p className="text-muted-foreground">Configure your new AI voice agent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic" className="flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              AI Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the basic details for your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Customer Support Agent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this agent does..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Select
                    value={formData.primaryLanguage}
                    onValueChange={(value) => setFormData({ ...formData, primaryLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>Choose a voice for your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={formData.voiceId} onValueChange={handleVoiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{voice.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {voice.provider} - {voice.gender}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Voice Speed: {formData.voiceSpeed.toFixed(1)}x</Label>
                  <Slider
                    value={formData.voiceSpeed}
                    onChange={(value) => setFormData({ ...formData, voiceSpeed: value })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust how fast or slow the agent speaks
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Voice Pitch: {formData.voicePitch.toFixed(1)}</Label>
                  <Slider
                    value={formData.voicePitch}
                    onChange={(value) => setFormData({ ...formData, voicePitch: value })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust the pitch of the voice
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality">
            <Card>
              <CardHeader>
                <CardTitle>Personality Settings</CardTitle>
                <CardDescription>Define how your agent communicates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Personality Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {config.personalityTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.personalityType === type.value
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setFormData({ ...formData, personalityType: type.value })}
                      >
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    placeholder="Hello! How can I help you today?"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    The first message your agent says when answering a call
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fallback">Fallback Message</Label>
                  <Textarea
                    id="fallback"
                    value={formData.fallbackMessage}
                    onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
                    placeholder="I'm sorry, I didn't understand that. Could you please repeat?"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    What to say when the agent does not understand
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer">Transfer Message</Label>
                  <Textarea
                    id="transfer"
                    value={formData.transferMessage}
                    onChange={(e) => setFormData({ ...formData, transferMessage: e.target.value })}
                    placeholder="Let me transfer you to a human agent."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    What to say before transferring to a human
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>Configure the AI model behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select
                    value={formData.aiModel}
                    onValueChange={(value) => setFormData({ ...formData, aiModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div>
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              - {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature: {formData.temperature.toFixed(1)}</Label>
                  <Slider
                    value={formData.temperature}
                    onChange={(value) => setFormData({ ...formData, temperature: value })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make responses more creative, lower values more focused
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Response Tokens: {formData.maxTokens}</Label>
                  <Slider
                    value={formData.maxTokens}
                    onChange={(value) => setFormData({ ...formData, maxTokens: Math.round(value) })}
                    min={50}
                    max={500}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum length of AI responses
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 mt-6">
          <Link href="/agents">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Create Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
