"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Brain,
  Zap,
  Stethoscope,
} from "lucide-react";

interface AIResponseDisplayProps {
  status: string;
  aiResponse?: any;
  type: "speech" | "accent" | "intent" | "emotion" | "language" | "translation" | "hearing";
  className?: string;
}

export function AIResponseDisplay({ status, aiResponse, type, className }: AIResponseDisplayProps) {
  if (status === "pending") {
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Waiting for AI analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "processing") {
    return (
      <Card className={cn("bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary mx-auto animate-pulse" />
              <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="text-primary font-medium">AI is analyzing...</p>
            <Loader2 className="h-5 w-5 mx-auto animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card className={cn("bg-destructive/5 border-destructive/20", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-destructive">Analysis failed. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiResponse) {
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No AI response available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-gradient-to-br from-green-500/5 to-emerald-500/10 border-green-500/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            AI Analysis Complete
          </CardTitle>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "speech" && <SpeechResponse data={aiResponse} />}
        {type === "accent" && <AccentResponse data={aiResponse} />}
        {type === "intent" && <IntentResponse data={aiResponse} />}
        {type === "emotion" && <EmotionResponse data={aiResponse} />}
        {type === "language" && <LanguageResponse data={aiResponse} />}
        {type === "translation" && <TranslationResponse data={aiResponse} />}
        {type === "hearing" && <HearingResponse data={aiResponse} />}
      </CardContent>
    </Card>
  );
}

function SpeechResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.enhancements && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Enhancements Applied:</h4>
          <div className="flex flex-wrap gap-2">
            {data.enhancements.map((e: string, i: number) => (
              <Badge key={i} variant="secondary">{e}</Badge>
            ))}
          </div>
        </div>
      )}
      {data.improvements && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data.improvements).map(([key, value]: [string, any]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{key}</span>
                <span className="font-medium">{value}%</span>
              </div>
              <Progress value={value as number} className="h-2" />
            </div>
          ))}
        </div>
      )}
      {data.suggestions && (
        <div className="p-3 bg-background/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Suggestions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {data.suggestions.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AccentResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.adaptations && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Accent Adaptations:</h4>
          <div className="grid gap-2">
            {data.adaptations.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">{a.original}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-sm font-medium text-primary">{a.adapted}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.confidence && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Adaptation Confidence</span>
            <span className="font-medium">{Math.round(data.confidence * 100)}%</span>
          </div>
          <Progress value={data.confidence * 100} className="h-2" />
        </div>
      )}
    </div>
  );
}

function IntentResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.intent && (
        <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Detected Intent</p>
            <p className="text-xl font-semibold">{data.intent}</p>
          </div>
          {data.confidence && (
            <Badge className="ml-auto" variant={data.confidence > 0.8 ? "default" : "secondary"}>
              {Math.round(data.confidence * 100)}% confident
            </Badge>
          )}
        </div>
      )}
      {data.entities && data.entities.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Extracted Entities:</h4>
          <div className="flex flex-wrap gap-2">
            {data.entities.map((e: any, i: number) => (
              <Badge key={i} variant="outline" className="py-1">
                <span className="text-muted-foreground mr-1">{e.type}:</span>
                <span className="font-medium">{e.value}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
      {data.suggestedActions && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
          <h4 className="font-medium text-sm mb-2">Suggested Actions:</h4>
          <ul className="text-sm space-y-1">
            {data.suggestedActions.map((action: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmotionResponse({ data }: { data: any }) {
  const emotionColors: Record<string, string> = {
    joy: "bg-yellow-500",
    sadness: "bg-blue-500",
    anger: "bg-red-500",
    fear: "bg-purple-500",
    surprise: "bg-orange-500",
    disgust: "bg-green-500",
    neutral: "bg-gray-500",
    love: "bg-pink-500",
    anticipation: "bg-cyan-500",
  };

  return (
    <div className="space-y-4">
      {data.primaryEmotion && (
        <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center text-white text-2xl",
            emotionColors[data.primaryEmotion.toLowerCase()] || "bg-gray-500"
          )}>
            {getEmotionEmoji(data.primaryEmotion)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Primary Emotion</p>
            <p className="text-xl font-semibold capitalize">{data.primaryEmotion}</p>
          </div>
        </div>
      )}
      {data.emotions && data.emotions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Emotion Breakdown:</h4>
          {data.emotions.map((e: any, i: number) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize flex items-center gap-2">
                  <span>{getEmotionEmoji(e.emotion)}</span>
                  {e.emotion}
                </span>
                <span className="font-medium">{Math.round(e.score * 100)}%</span>
              </div>
              <Progress
                value={e.score * 100}
                className={cn("h-2", e.score > 0.5 ? "[&>div]:bg-primary" : "")}
              />
            </div>
          ))}
        </div>
      )}
      {data.sentiment && (
        <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
          <span className="text-sm">Overall Sentiment:</span>
          <Badge variant={
            data.sentiment === "positive" ? "default" :
            data.sentiment === "negative" ? "destructive" : "secondary"
          }>
            {data.sentiment}
          </Badge>
        </div>
      )}
    </div>
  );
}

function LanguageResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.detectedLanguage && (
        <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {getLanguageFlag(data.detectedLanguage)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Detected Language</p>
            <p className="text-xl font-semibold">{data.languageName || data.detectedLanguage}</p>
          </div>
          {data.confidence && (
            <Badge className="ml-auto">
              {Math.round(data.confidence * 100)}% confident
            </Badge>
          )}
        </div>
      )}
      {data.characteristics && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Language Characteristics:</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.characteristics).map(([key, value]: [string, any]) => (
              <div key={key} className="p-2 bg-background/50 rounded text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                <span className="ml-2 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TranslationResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.translation && (
        <div className="p-4 bg-background/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Translation:</h4>
          <p className="text-lg">{data.translation}</p>
        </div>
      )}
      {data.alternatives && data.alternatives.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Alternative Translations:</h4>
          <div className="space-y-2">
            {data.alternatives.map((alt: any, i: number) => (
              <div key={i} className="p-2 bg-background/50 rounded text-sm flex items-center justify-between">
                <span>{alt.text}</span>
                <Badge variant="outline" className="text-xs">{alt.style}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.notes && (
        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <h4 className="font-medium text-sm mb-1">Translation Notes:</h4>
          <p className="text-sm text-muted-foreground">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

function HearingResponse({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.overallResult && (
        <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            data.overallResult === "Normal" ? "bg-green-500/20 text-green-600" :
            data.overallResult === "Mild" ? "bg-yellow-500/20 text-yellow-600" :
            "bg-red-500/20 text-red-600"
          )}>
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Result</p>
            <p className="text-xl font-semibold">{data.overallResult}</p>
          </div>
        </div>
      )}
      {data.frequencyResults && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Frequency Response:</h4>
          <div className="grid grid-cols-4 gap-2">
            {data.frequencyResults.map((f: any, i: number) => (
              <div key={i} className="p-2 bg-background/50 rounded text-center">
                <p className="text-xs text-muted-foreground">{f.frequency}Hz</p>
                <p className={cn(
                  "text-lg font-semibold",
                  f.threshold <= 25 ? "text-green-600" :
                  f.threshold <= 40 ? "text-yellow-600" : "text-red-600"
                )}>{f.threshold}dB</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.recommendations && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
          <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
          <ul className="text-sm space-y-1">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    joy: "😊",
    happiness: "😊",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    surprise: "😲",
    disgust: "🤢",
    neutral: "😐",
    love: "😍",
    anticipation: "🤔",
    trust: "🤝",
    confusion: "😕",
    excitement: "🤩",
  };
  return emojis[emotion.toLowerCase()] || "😐";
}

function getLanguageFlag(langCode: string): string {
  const flags: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷",
    ar: "🇸🇦",
    hi: "🇮🇳",
    ru: "🇷🇺",
  };
  return flags[langCode] || "🌍";
}
