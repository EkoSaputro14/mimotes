"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface ParameterControlsProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  useRAG: boolean;
  topK: number;
  onTemperatureChange: (v: number) => void;
  onTopPChange: (v: number) => void;
  onMaxTokensChange: (v: number) => void;
  onUseRAGChange: (v: boolean) => void;
  onTopKChange: (v: number) => void;
}

export default function ParameterControls({
  temperature,
  topP,
  maxTokens,
  useRAG,
  topK,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
  onUseRAGChange,
  onTopKChange,
}: ParameterControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Parameters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Temperature
            </label>
            <span className="text-xs font-mono text-foreground">
              {temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={([v]) => onTemperatureChange(v)}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        {/* Top P */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Top P
            </label>
            <span className="text-xs font-mono text-foreground">
              {topP.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[topP]}
            onValueChange={([v]) => onTopPChange(v)}
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">
              Max Tokens
            </label>
            <span className="text-xs font-mono text-foreground">
              {maxTokens}
            </span>
          </div>
          <Slider
            value={[maxTokens]}
            onValueChange={([v]) => onMaxTokensChange(v)}
            min={100}
            max={4096}
            step={100}
          />
        </div>

        {/* RAG Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Use RAG Context
          </label>
          <Switch checked={useRAG} onCheckedChange={onUseRAGChange} />
        </div>

        {/* Top K (only when RAG is enabled) */}
        {useRAG && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">
                Top K Results
              </label>
              <span className="text-xs font-mono text-foreground">
                {topK}
              </span>
            </div>
            <Slider
              value={[topK]}
              onValueChange={([v]) => onTopKChange(v)}
              min={1}
              max={20}
              step={1}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
