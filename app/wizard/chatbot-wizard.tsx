"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Bot,
  Palette,
  MessageSquare,
  Eye,
  Code,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface WizardData {
  documents: File[];
  botName: string;
  primaryColor: string;
  welcomeMessage: string;
  publicKey: string;
  secretKey: string;
}

const STEPS = [
  { id: 1, title: "Upload Dokumen", icon: Upload },
  { id: 2, title: "Nama Bot", icon: Bot },
  { id: 3, title: "Warna Brand", icon: Palette },
  { id: 4, title: "Pesan Selamat Datang", icon: MessageSquare },
  { id: 5, title: "Preview", icon: Eye },
  { id: 6, title: "Generate Widget", icon: Code },
];

const COLOR_PRESETS = [
  { name: "Biru", value: "#3B82F6" },
  { name: "Ungu", value: "#8B5CF6" },
  { name: "Hijau", value: "#10B981" },
  { name: "Merah", value: "#EF4444" },
  { name: "Oranye", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
];

// ─── Main Component ─────────────────────────────────────────────

export default function ChatbotWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<WizardData>({
    documents: [],
    botName: "",
    primaryColor: "#3B82F6",
    welcomeMessage: "Halo! Ada yang bisa saya bantu?",
    publicKey: "",
    secretKey: "",
  });

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.documents.length > 0;
      case 2:
        return data.botName.trim().length >= 2;
      case 3:
        return data.primaryColor.length > 0;
      case 4:
        return data.welcomeMessage.trim().length > 0;
      case 5:
        return true;
      case 6:
        return data.publicKey.length > 0;
      default:
        return false;
    }
  }, [currentStep, data]);

  const handleNext = useCallback(async () => {
    if (currentStep === 5) {
      // Create widget via API
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("botName", data.botName);
        formData.append("primaryColor", data.primaryColor);
        formData.append("welcomeMessage", data.welcomeMessage);
        data.documents.forEach((file) => {
          formData.append("documents", file);
        });

        const res = await fetch("/api/wizard/create", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to create widget");

        const result = await res.json();
        updateData({
          publicKey: result.publicKey,
          secretKey: result.secretKey,
        });
        setCurrentStep(6);
      } catch (error) {
        console.error("Wizard error:", error);
        alert("Gagal membuat chatbot. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    } else if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, data, updateData]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleCopy = useCallback(() => {
    const script = `<script src="${window.location.origin}/widget.js" data-key="${data.publicKey}"><\/script>`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data.publicKey]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Buat Chatbot Anda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ikuti langkah-langkah berikut untuk membuat chatbot AI untuk bisnis
            Anda
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                      isActive && "bg-primary/10 text-primary",
                      isCompleted && "text-success",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-success/10 text-success",
                        !isActive &&
                          !isCompleted &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-8 h-px mx-1",
                        isCompleted ? "bg-success/30" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {currentStep === 1 && (
          <StepUpload
            files={data.documents}
            onChange={(files) => updateData({ documents: files })}
          />
        )}
        {currentStep === 2 && (
          <StepBotName
            value={data.botName}
            onChange={(botName) => updateData({ botName })}
          />
        )}
        {currentStep === 3 && (
          <StepColor
            value={data.primaryColor}
            onChange={(primaryColor) => updateData({ primaryColor })}
          />
        )}
        {currentStep === 4 && (
          <StepWelcome
            value={data.welcomeMessage}
            onChange={(welcomeMessage) => updateData({ welcomeMessage })}
          />
        )}
        {currentStep === 5 && (
          <StepPreview
            botName={data.botName}
            primaryColor={data.primaryColor}
            welcomeMessage={data.welcomeMessage}
          />
        )}
        {currentStep === 6 && (
          <StepGenerate
            publicKey={data.publicKey}
            onCopy={handleCopy}
            copied={copied}
          />
        )}
      </div>

      {/* Footer */}
      {currentStep < 6 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
          <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                currentStep === 1
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                canProceed() && !loading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat...
                </>
              ) : currentStep === 5 ? (
                <>
                  Buat Chatbot
                  <Code className="w-4 h-4" />
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────

function StepUpload({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const newFiles = Array.from(e.dataTransfer.files);
      onChange([...files, ...newFiles]);
    },
    [files, onChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        onChange([...files, ...newFiles]);
      }
    },
    [files, onChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index));
    },
    [files, onChange]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Upload Dokumen
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload dokumen yang akan digunakan chatbot untuk menjawab pertanyaan
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop file di sini
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          atau klik untuk memilih file
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, DOCX, TXT, CSV, XLSX (max 10MB per file)
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {files.length} file dipilih:
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {file.name.endsWith(".pdf")
                    ? "📕"
                    : file.name.endsWith(".docx")
                    ? "📘"
                    : file.name.endsWith(".csv")
                    ? "📊"
                    : "📄"}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepBotName({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Beri Nama Chatbot Anda
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Nama ini akan ditampilkan di header chat widget
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nama Bot
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Contoh: Customer Service, Asisten Toko, dll"
          className="w-full px-4 py-3 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {value.length}/50 karakter
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-foreground">
          💡 <strong>Tips:</strong> Gunakan nama yang mudah diingat dan
          relevan dengan bisnis Anda
        </p>
      </div>
    </div>
  );
}

function StepColor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Pilih Warna Brand
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Warna ini akan digunakan pada header chat widget
        </p>
      </div>

      {/* Color presets */}
      <div className="grid grid-cols-4 gap-3">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color.value}
            onClick={() => onChange(color.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
              value === color.value
                ? "border-primary shadow-md"
                : "border-transparent hover:border-border"
            )}
          >
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: color.value }}
            />
            <span className="text-xs text-muted-foreground">
              {color.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Atau pilih warna custom:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono bg-background"
            placeholder="#3B82F6"
          />
        </div>
      </div>
    </div>
  );
}

function StepWelcome({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Pesan Selamat Datang
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pesan ini akan ditampilkan saat pertama kali chat dibuka
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Pesan Selamat Datang
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis pesan selamat datang..."
          className="w-full px-4 py-3 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          {value.length}/200 karakter
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg space-y-2">
        <p className="text-sm font-medium text-foreground">
          Contoh pesan yang baik:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• &quot;Halo! Ada yang bisa saya bantu?&quot;</li>
          <li>• &quot;Selamat datang! Tanyakan apa saja tentang produk kami.&quot;</li>
          <li>
            • &quot;Hi! Saya siap membantu Anda hari ini.&quot;
          </li>
        </ul>
      </div>
    </div>
  );
}

function StepPreview({
  botName,
  primaryColor,
  welcomeMessage,
}: {
  botName: string;
  primaryColor: string;
  welcomeMessage: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Preview Chatbot
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ini adalah tampilan chatbot yang akan Anda buat
        </p>
      </div>

      {/* Preview Card */}
      <div className="border rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-medium text-sm">
              {botName || "Chatbot"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-muted p-4 min-h-[200px]">
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              AI
            </div>
            <div className="bg-card rounded-lg px-3 py-2 shadow-sm max-w-[80%]">
              <p className="text-sm text-foreground">
                {welcomeMessage || "Halo! Ada yang bisa saya bantu?"}
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-3 bg-card">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-muted"
              disabled
            />
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
              disabled
            >
              Kirim
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-foreground">
          ✅ Preview terlihat bagus! Klik <strong>&quot;Buat Chatbot&quot;</strong> untuk
          melanjutkan.
        </p>
      </div>
    </div>
  );
}

function StepGenerate({
  publicKey,
  onCopy,
  copied,
}: {
  publicKey: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const scriptCode = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://mimotes.ekohomelab.online"}/widget.js" data-key="${publicKey}"><\/script>`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Chatbot Berhasil Dibuat! 🎉
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copy script di bawah dan paste ke website Anda
        </p>
      </div>

      {/* Success card */}
      <div className="p-6 bg-success/10 border border-success/20 rounded-xl text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-success">
          Chatbot Siap Digunakan!
        </h3>
        <p className="text-sm text-success mt-1">
          Script widget sudah siap untuk diinstall
        </p>
      </div>

      {/* Script code */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Script Widget:
        </label>
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
            {scriptCode}
          </pre>
          <button
            onClick={onCopy}
            className={cn(
              "absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
              copied
                ? "bg-success text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 inline mr-1" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 inline mr-1" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h4 className="font-medium text-foreground">
          Cara Install di Website:
        </h4>
        <ol className="text-sm text-muted-foreground space-y-2">
          <li className="flex gap-2">
            <span className="font-medium text-foreground">1.</span>
            Copy script di atas
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">2.</span>
            Buka editor website Anda (HTML)
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">3.</span>
            Paste script sebelum tag{" "}
            <code className="bg-muted px-1 rounded text-xs">
              &lt;/body&gt;
            </code>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">4.</span>
            Simpan dan publish website Anda
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.open("/dashboard", "_self")}
          className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Ke Dashboard
        </button>
        <button
          onClick={() => window.open("/settings/widget", "_self")}
          className="flex-1 px-4 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Pengaturan Widget
        </button>
      </div>
    </div>
  );
}
