/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Trash2,
  Plus,
  Settings as SettingsIcon,
  ArrowLeft,
  Volume2,
  Moon,
  Sun,
  Check,
  Copy,
  FileText,
  Download,
  Code,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  FileCode,
  Cpu,
  Terminal,
  BookOpen,
  Clock,
  Loader2,
  Sliders,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { androidCodebase, AndroidFile } from "./androidCodebase";

interface DocumentItem {
  id: string;
  title: string;
  fileSize: number;
  dateAdded: string;
  fullText: string;
  lastPositionParagraph: number; // Sentence index pointer
}

export default function App() {
  // Global settings
  const [appTheme, setAppTheme] = useState<"light" | "dark">("light");
  
  // Simulator states
  const [simulatorScreen, setSimulatorScreen] = useState<"library" | "reader" | "settings">("library");
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem("vocalpaper_docs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      {
        id: "1",
        title: "Welcome to Vocal Paper.txt",
        fileSize: 1048,
        dateAdded: "Jun 15, 2026",
        fullText: "Vocal Paper is a mobile companion designed to turn any PDF or text document into an engaging audiobook-like experience. Our layout allows you to read and follow along with absolute focus.\n\nBeautiful sentence highlighting scrolls smoothly to keep everything matching the narrator's voice. Tap on any part of the text here to let the reader skip to that location instantly.\n\nTry clicking on other sentences in this paragraph to see how the playhead updates, or use the bottom control deck to pause, play, scroll, and change narration speeds.",
        lastPositionParagraph: 0
      },
      {
        id: "2",
        title: "The Art of Listening (Short Essay).txt",
        fileSize: 840,
        dateAdded: "Jun 12, 2026",
        fullText: "Listening is a form of deep concentration that has been largely forgotten in our fast-paced visual culture. By merging both auditory and visual pathways, we unlock a deeper plane of comprehension.\n\nStudies show that multimodal reading dramatically improves retainment and cognitive structure. Vocal Paper aims to reclaim this ancient practice.\n\nPut on your headphones, set your speed to alternative settings, and explore text files with ease.",
        lastPositionParagraph: 0
      },
      {
        id: "3",
        title: "Vocal Paper Android Integration.pdf",
        fileSize: 16400,
        dateAdded: "Jun 10, 2026",
        fullText: "This developer workspace contains the full native Android Kotlin codebase to build Vocal Paper in Android Studio. The native target uses Room for lightweight local caching of your PDF content. Dagger Hilt supplies clean dependencies of database objects.\n\nJetpack Compose layouts offer fluid Material 3 structures. The native Text-To-Speech engine tracks progress via character range callbacks.\n\nExplore the files listed on the right side of this screen, copy any segment, or refer to the build instructions to compile Vocal Paper directly.",
        lastPositionParagraph: 0
      }
    ];
  });

  const [activeDocId, setActiveDocId] = useState<string>("1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // TTS voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  // Extracted sentences cache
  const activeDoc = useMemo(() => {
    return documents.find(d => d.id === activeDocId) || documents[0];
  }, [documents, activeDocId]);

  const sentences = useMemo(() => {
    if (!activeDoc) return [];
    // Split text into readable semantic sentences
    return activeDoc.fullText
      .split(/(?<=[.!?])\s+|\n\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }, [activeDoc]);

  // Code Explorer states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeFile, setActiveFile] = useState<AndroidFile>(androidCodebase[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // References
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF.js from Cloudflare CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      // @ts-ignore
      const pdfjsLib = window["pdfjs-dist/build/pdf"];
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      }
    };
    document.body.appendChild(script);
  }, []);

  // Sync Documents to LocalStorage
  useEffect(() => {
    localStorage.setItem("vocalpaper_docs", JSON.stringify(documents));
  }, [documents]);

  // Load voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const loadAllVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        // Default to a natural-sounding English voice if available
        const defaultVoice = availableVoices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || 
                             availableVoices.find(v => v.lang.startsWith("en")) || 
                             availableVoices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };
      loadAllVoices();
      window.speechSynthesis.onvoiceschanged = loadAllVoices;
    }
  }, []);

  // Update voice configuration on voice change
  const activeVoice = useMemo(() => {
    return voices.find(v => v.name === selectedVoiceName) || null;
  }, [voices, selectedVoiceName]);

  // Handle active speech play
  const speakSentence = (index: number) => {
    if (!synthRef.current || sentences.length === 0) return;
    synthRef.current.cancel();

    const idx = Math.max(0, Math.min(index, sentences.length - 1));
    setCurrentSentenceIndex(idx);
    
    // Save current reader location
    setDocuments(prev => prev.map(doc => {
      if (doc.id === activeDocId) {
        return { ...doc, lastPositionParagraph: idx };
      }
      return doc;
    }));

    const textToSpeak = sentences[idx];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    if (activeVoice) {
      utterance.voice = activeVoice;
    }
    utterance.rate = playbackRate;

    utterance.onend = () => {
      if (idx + 1 < sentences.length) {
        speakSentence(idx + 1);
      } else {
        setIsPlaying(false);
        setCurrentSentenceIndex(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    setIsPlaying(true);
    synthRef.current.speak(utterance);
  };

  // Pause speech
  const pauseSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };

  // Skip or play selected sentence
  const handleSentenceClick = (idx: number) => {
    setCurrentSentenceIndex(idx);
    if (isPlaying) {
      speakSentence(idx);
    } else {
      speakSentence(idx);
    }
  };

  // Auto scroll focused sentence inside the reader screen
  useEffect(() => {
    if (simulatorScreen === "reader") {
      const activeEl = document.getElementById(`sentence-${currentSentenceIndex}`);
      if (activeEl && textScrollContainerRef.current) {
        const parent = textScrollContainerRef.current;
        const rect = activeEl.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const offset = rect.top - parentRect.top - (parentRect.height / 2) + (rect.height / 2);
        
        parent.scrollBy({
          top: offset,
          behavior: "smooth"
        });
      }
    }
  }, [currentSentenceIndex, simulatorScreen]);

  // File import decoder
  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await processUploadedFile(file);
      }
    };
    input.click();
  };

  const processUploadedFile = async (file: File) => {
    setIsPdfLoading(true);
    setUploadError(null);
    try {
      let textContent = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        // @ts-ignore
        const pdfjsLib = window["pdfjs-dist/build/pdf"];
        if (!pdfjsLib) {
          throw new Error("PDF Parser is loading. Please try again in a few seconds.");
        }
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          try {
            const arrayBuffer = fileReader.result as ArrayBuffer;
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let extracted = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map((item: any) => item.str).join(" ");
              extracted += pageText + "\n\n";
            }
            if (!extracted.trim()) {
              throw new Error("No readable text found in PDF. Make sure it contains text rather than pure images.");
            }
            addNewDocToLibrary(file.name, file.size, extracted);
          } catch (err: any) {
            setUploadError(err.message || "Failed to parse PDF.");
            setIsPdfLoading(false);
          }
        };
        fileReader.readAsArrayBuffer(file);
      } else {
        // Read text file
        const fileReader = new FileReader();
        fileReader.onload = () => {
          textContent = fileReader.result as string;
          if (!textContent.trim()) {
            setUploadError("The uploaded file is empty.");
            setIsPdfLoading(false);
            return;
          }
          addNewDocToLibrary(file.name, file.size, textContent);
        };
        fileReader.readAsText(file);
      }
    } catch (e: any) {
      setUploadError(e.message || "Something went wrong importing details.");
      setIsPdfLoading(false);
    }
  };

  const addNewDocToLibrary = (name: string, size: number, text: string) => {
    const newDoc: DocumentItem = {
      id: Date.now().toString(),
      title: name,
      fileSize: size,
      dateAdded: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      fullText: text,
      lastPositionParagraph: 0
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setCurrentSentenceIndex(0);
    setIsPdfLoading(false);
    setSimulatorScreen("reader");
  };

  const deleteDocument = (id: string, e: any) => {
    e.stopPropagation();
    if (activeDocId === id && isPlaying) {
      pauseSpeech();
    }
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Categories of Android files
  const categories = ["All", "Gradle", "Manifest", "Data", "DI", "PDF", "TTS", "Presentation", "Ui", "Guide"];

  // Filter Android code tree
  const filteredFileList = useMemo(() => {
    return androidCodebase.filter(file => {
      const matchCat = selectedCategory === "All" || file.category === selectedCategory;
      const matchSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          file.path.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Copy code helper
  const handleCopyCode = (content: string, filename: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => {
      setCopiedFile(null);
    }, 2000);
  };

  // Exporter of Entire Codebase
  const generateCodebaseZip = () => {
    // Show download prompt with clear output instructions
    alert("In this workspace, we have generated the full functional source code files in your local workspace under `/android-project/`. You can export the workspace into a ZIP or a GitHub repository via the upper-right 'Settings' or 'Export' menu in AI Studio! This is the most reliable way to obtain the ready-to-run Android Studio project.");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      appTheme === "dark" 
        ? "bg-[#131211] text-[#FAF8F5] selection:bg-[#C4A484]/40 selection:text-white" 
        : "bg-[#F7F3EE] text-[#1A1A1A] selection:bg-[#E7DFD5] selection:text-[#1A1A1A]"
    }`}>
      
      {/* Upper Navigation Center Bar */}
      <nav className={`border-b px-6 py-4 flex items-center justify-between transition-colors duration-200 ${
        appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18]" : "border-[#E7DFD5] bg-[#FAF8F5] shadow-xs"
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#4A443E] rounded-lg text-[#F7F3EE] shadow-md">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-serif font-bold italic text-2xl tracking-tight text-[#1A1A1A] dark:text-[#FAF8F5]">
                Vocal Paper
              </span>
              <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold ${
                appTheme === "dark" ? "bg-[#2D2A26] text-[#C4A484] border border-[#3D3A36]" : "bg-[#E7DFD5] text-[#4A443E]"
              }`}>
                Android Dev Studio
              </span>
            </div>
            <p className={`text-xs font-serif ${appTheme === "dark" ? "text-[#8C8479]" : "text-[#8C8479]"} italic`}>
              Every Page Has a Voice
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 p-1 rounded-md bg-[#8C8479]/10">
            <button
              onClick={() => setAppTheme("light")}
              className={`p-1.5 rounded-md transition cursor-pointer ${appTheme === "light" ? "bg-[#FAF8F5] text-[#4A443E] shadow-xs font-semibold" : "text-[#8C8479] hover:text-[#1A1A1A]"}`}
              title="Editorial Light (Parchment)"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAppTheme("dark")}
              className={`p-1.5 rounded-md transition cursor-pointer ${appTheme === "dark" ? "bg-[#2D2A26] text-[#FAF8F5] shadow-xs" : "text-[#8C8479] hover:text-[#FAF8F5]"}`}
              title="Editorial Dark (Ink)"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={generateCodebaseZip}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#1A1A1A] rounded-md text-sm font-semibold hover:opacity-90 transition cursor-pointer font-sans border border-[#C4A484]/30 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Code Map</span>
          </button>
        </div>
      </nav>

      {/* Main Studio Core Dashboard Workspace */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Mobile Simulator Viewport */}
        <section className="lg:col-span-12 xl:col-span-4 flex flex-col items-center">
          
          <div className="text-center mb-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-[#8C8479] flex items-center justify-center gap-2 font-sans">
              <Smartphone className="w-3.5 h-3.5" />
              Dynamic Live Emulator
            </h2>
            <p className={`text-xs font-serif italic ${appTheme === "dark" ? "text-[#8C8479]" : "text-[#8C8479]"}`}>
              Test TTS Sync, PDF Extraction & Hearing below
            </p>
          </div>

          {/* Physical Phone Frame Container */}
          <div className={`relative w-80 h-[640px] rounded-[48px] p-3.5 shadow-xl transition-all border-4 ${
            appTheme === "dark" 
              ? "bg-[#1C1A18] border-[#2D2A26] shadow-black/60" 
              : "bg-[#FAF8F5] border-[#E7DFD5] shadow-[#8C8479]/15"
          }`}>
            {/* Phone Bezel Interior */}
            <div className={`relative h-full w-full rounded-[36px] overflow-hidden flex flex-col justify-between ${
              appTheme === "dark" ? "bg-[#131211]" : "bg-[#FAF8F5]"
            }`}>
              
              {/* Device Notch & Status bar */}
              <div className={`px-5 pt-3 pb-1 flex justify-between items-center text-[10px] font-sans font-medium ${
                appTheme === "dark" ? "bg-[#1C1A18] text-[#8C8479]" : "bg-[#FAF8F5] text-[#8C8479]"
              }`}>
                <span>08:08 AM</span>
                {/* Simulated Camera Notch */}
                <span className="w-16 h-4 bg-[#4A443E] rounded-full absolute left-1/2 -translate-x-1/2 top-1.5"></span>
                <div className="flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#C4A484]" />
                  <span className="bg-[#8C8479]/20 px-1 py-0.2 rounded text-[8px] text-[#4A443E] dark:text-[#FAF8F5]">82%</span>
                </div>
              </div>

              {/* Dynamic Content Switching Screen Panel */}
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <AnimatePresence mode="wait">
                  
                  {/* SCREEN 1: Library View Screen */}
                  {simulatorScreen === "library" && (
                    <motion.div
                      key="library"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute inset-0 flex flex-col p-4 overflow-y-auto"
                    >
                      {/* Top App Header */}
                      <div className="flex items-center justify-between mb-4 border-b pb-2.5 dark:border-[#2D2A26] border-[#E7DFD5]">
                        <span className="text-base font-serif font-bold italic tracking-wide text-[#1A1A1A] dark:text-[#FAF8F5]">vocalpaper</span>
                        <button 
                          onClick={() => setSimulatorScreen("settings")}
                          className="p-1 rounded-full text-[#8C8479] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5]"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* App Tagline Banner */}
                      <div className="p-3 mb-4 rounded-lg bg-[#E7DFD5]/40 border border-[#C4A484]/35 flex items-start space-x-2.5">
                        <Sparkles className="w-4.5 h-4.5 text-[#4A443E] dark:text-[#C4A484] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#4A443E] dark:text-[#FAF8F5]">Convert PDF / Text</h4>
                          <p className="text-[10px] leading-relaxed text-[#4A443E] dark:text-[#8C8479] font-serif">
                            Voice synthesizers will highlight sentences as they speak. Download Compose models on the right!
                          </p>
                        </div>
                      </div>

                      {/* Search/Upload File Hub */}
                      <button
                        onClick={triggerFileInput}
                        disabled={isPdfLoading}
                        className={`w-full py-4 mb-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                          appTheme === "dark"
                            ? "border-[#2D2A26] bg-[#1C1A18] hover:border-[#C4A484]"
                            : "border-[#C4A484]/40 bg-[#FAF8F5] hover:border-[#1A1A1A]"
                        }`}
                      >
                        {isPdfLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 text-[#C4A484] animate-spin" />
                            <span className="text-[10px] mt-2 text-[#C4A484] font-sans font-semibold">Parsing Document...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4.5 h-4.5 text-[#C4A484] mb-1" />
                            <span className="text-[11px] font-serif font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Import PDF or TXT</span>
                            <span className="text-[9px] text-[#8C8479] mt-0.5 font-sans uppercase tracking-wider">Device Storage File Storage</span>
                          </>
                        )}
                      </button>

                      {uploadError && (
                        <div className="mb-3 px-3 py-1.5 bg-red-900/10 text-red-500 border border-red-900/20 text-[10px] rounded-lg">
                          {uploadError}
                        </div>
                      )}

                      {/* Documents Collection List */}
                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8479] mb-2">
                        Recent Documents
                      </h4>

                      <div className="space-y-2.5 flex-1 pb-16">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setActiveDocId(doc.id);
                              setCurrentSentenceIndex(doc.lastPositionParagraph);
                              setSimulatorScreen("reader");
                            }}
                            className={`p-3 rounded-lg border transition cursor-pointer relative group ${
                              activeDocId === doc.id
                                ? "border-[#C4A484] bg-[#E7DFD5]/40"
                                : appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18]/60 hover:bg-[#1C1A18]" : "border-[#E7DFD5] bg-[#FAF8F5] hover:bg-[#EBE5DC]"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${doc.title.endsWith(".pdf") ? "text-red-500/80" : "text-[#8C8479]"}`} />
                                <div className="min-w-0">
                                  <h5 className="text-xs font-serif font-bold text-[#1A1A1A] dark:text-[#FAF8F5] truncate" title={doc.title}>
                                    {doc.title}
                                  </h5>
                                  <p className="text-[9px] text-[#8C8479] mt-0.5 font-sans">
                                    {(doc.fileSize / 1024).toFixed(1)} KB • {doc.dateAdded}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={(e) => deleteDocument(doc.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#8C8479] hover:text-red-500 transition cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {doc.lastPositionParagraph > 0 && (
                              <div className="mt-2 flex items-center space-x-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A484] animate-pulse"></span>
                                <span className="text-[9px] font-sans font-medium text-[#4A443E] dark:text-[#C4A484]">
                                  Resume reading - sentence #{doc.lastPositionParagraph + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 2: Reader Screen Visual State */}
                  {simulatorScreen === "reader" && (
                    <motion.div
                      key="reader"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {/* Reader Topbar Header */}
                      <div className={`px-4 py-3.5 border-b flex items-center space-x-2.5 ${
                        appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18]" : "border-[#E7DFD5] bg-[#FAF8F5]"
                      }`}>
                        <button
                          onClick={() => {
                            pauseSpeech();
                            setSimulatorScreen("library");
                          }}
                          className="p-1 rounded-full text-[#8C8479] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5] transition duration-150"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-serif font-bold text-[#1A1A1A] dark:text-[#FAF8F5] truncate">
                            {activeDoc?.title}
                          </h4>
                          <p className="text-[9px] font-sans text-[#8C8479] uppercase tracking-wider mt-0.5">
                            Sentences {currentSentenceIndex + 1} of {sentences.length}
                          </p>
                        </div>
                      </div>

                      {/* Main Scrollable Highlighting Panel Area */}
                      <div 
                        ref={textScrollContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                        style={{ scrollBehavior: "smooth" }}
                      >
                        {sentences.map((sentence, idx) => {
                          const isActive = idx === currentSentenceIndex;
                          return (
                            <div
                              key={idx}
                              id={`sentence-${idx}`}
                              onClick={() => handleSentenceClick(idx)}
                              className={`p-3 rounded-lg transition-all duration-200 cursor-pointer relative ${
                                isActive
                                  ? appTheme === "dark"
                                    ? "bg-[#2D2A26] border-l-4 border-[#C4A484] shadow-md"
                                    : "bg-[#E7DFD5] border-l-4 border-[#C4A484] shadow-xs"
                                  : "hover:bg-[#8C8479]/10 border-l-4 border-transparent"
                              }`}
                            >
                              <p className={`text-[12px] leading-relaxed font-serif tracking-normal transition-colors ${
                                isActive 
                                  ? "font-bold text-[#1A1A1A] dark:text-[#FAF8F5]" 
                                  : appTheme === "dark" ? "text-[#8C8479]" : "text-[#4A443E]"
                              }`}>
                                {sentence}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Player Dashboard Interface */}
                      <div className={`p-4 border-t ${
                        appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18]" : "border-[#E7DFD5] bg-[#FAF8F5]"
                      }`}>
                        {/* Progress Bar */}
                        <div className="w-full bg-[#8C8479]/10 h-1.5 rounded-full mb-3.5 overflow-hidden">
                          <div
                            className="bg-[#C4A484] h-full transition-all duration-300"
                            style={{ width: `${((currentSentenceIndex + 1) / sentences.length) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Speed Menu trigger */}
                          <div className="flex items-center space-x-1">
                            <Sliders className="w-3.5 h-3.5 text-[#8C8479]" />
                            <select
                              value={playbackRate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPlaybackRate(val);
                                // If playing, reload
                                if (isPlaying) {
                                  speakSentence(currentSentenceIndex);
                                }
                              }}
                              className={`text-[10px] font-bold rounded-md py-1 px-1 bg-transparent border select-none outline-none ${
                                appTheme === "dark" ? "border-[#2D2A26] text-[#FAF8F5]" : "border-[#E7DFD5] text-[#1A1A1A]"
                              }`}
                            >
                              <option value="0.5">0.5x</option>
                              <option value="0.75">0.75x</option>
                              <option value="1">1.0x</option>
                              <option value="1.25">1.25x</option>
                              <option value="1.5">1.5x</option>
                              <option value="2">2.0x</option>
                            </select>
                          </div>

                          {/* Control Audio Deck Buttons */}
                          <div className="flex items-center space-x-2">
                            {isPlaying ? (
                              <button
                                onClick={pauseSpeech}
                                className="p-2.5 bg-[#4A443E] text-[#F7F3EE] rounded-full hover:bg-[#1A1A1A] transition shadow-xs cursor-pointer"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => speakSentence(currentSentenceIndex)}
                                className="p-2.5 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#1A1A1A] rounded-full hover:opacity-95 transition shadow-xs cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (synthRef.current) {
                                  synthRef.current.cancel();
                                }
                                setIsPlaying(false);
                                setCurrentSentenceIndex(0);
                              }}
                              className={`p-2.5 rounded-full transition cursor-pointer ${
                                appTheme === "dark" ? "bg-[#2D2A26] text-[#FAF8F5] hover:bg-[#3D3A36]" : "bg-[#E7DFD5] text-[#4A443E] hover:bg-[#FAF8F5]"
                              }`}
                              title="Stop Audio"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>

                          <span className="text-[10px] font-sans font-bold text-[#8C8479]">
                            {currentSentenceIndex + 1}/{sentences.length}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 3: Settings Screen Option */}
                  {simulatorScreen === "settings" && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="absolute inset-0 flex flex-col p-4 overflow-y-auto"
                    >
                      <div className="flex items-center space-x-2 mb-4 border-b pb-2.5 dark:border-[#2D2A26] border-[#E7DFD5]">
                        <button
                          onClick={() => setSimulatorScreen("library")}
                          className="p-1 rounded-full text-[#8C8479] hover:text-[#1A1A1A] dark:hover:text-[#FAF8F5]"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-sans font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Settings</span>
                      </div>

                      <div className="space-y-4">
                        {/* Audio Pitch/Voice Speed */}
                        <div>
                          <label className="text-[10px] uppercase font-sans font-extrabold text-[#8C8479] block mb-1.5 tracking-wider">
                            Reading Speed Default
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[0.75, 1.0, 1.25, 1.5].map((s) => (
                              <button
                                key={s}
                                onClick={() => setPlaybackRate(s)}
                                className={`py-1 text-xs rounded-md font-bold font-sans border transition-all cursor-pointer ${
                                  playbackRate === s
                                    ? "border-[#C4A484] bg-[#E7DFD5]/40 text-[#4A443E] dark:text-[#FAF8F5]"
                                    : "border-[#E7DFD5] dark:border-[#2D2A26] text-[#8C8479] hover:bg-[#8C8479]/10"
                                }`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voice options selector */}
                        <div>
                          <label className="text-[10px] uppercase font-sans font-extrabold text-[#8C8479] block mb-1.5 tracking-wider">
                            Speech synthesis Actor Voice
                          </label>
                          <select
                            value={selectedVoiceName}
                            onChange={(e) => setSelectedVoiceName(e.target.value)}
                            className="w-full text-xs font-sans p-2.5 rounded-lg text-[#1A1A1A] dark:text-[#FAF8F5] border border-[#E7DFD5] dark:border-[#2D2A26] bg-[#FAF8F5] dark:bg-[#1C1A18] outline-none"
                          >
                            {voices.length === 0 ? (
                              <option>Detecting browser voices...</option>
                            ) : (
                              voices.map((v, i) => (
                                <option key={i} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Android Details Panel */}
                        <div className="p-3.5 bg-[#E7DFD5]/35 border border-[#C4A484]/35 rounded-lg">
                          <h5 className="text-xs font-sans font-bold text-[#4A443E] dark:text-[#FAF8F5] mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-[#C4A484]" />
                            Hardware TTS Integration
                          </h5>
                          <p className="text-[10.5px] font-serif leading-relaxed text-[#8C8479]">
                            The native Android counterpart uses native Android TextToSpeech engine supporting offline language downloads automatically.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Physical Home Indicator Bottom line icon */}
              <div className="py-2.5 flex justify-center">
                <div className="w-24 h-1 bg-[#8C8479]/30 rounded-full"></div>
              </div>

            </div>
          </div>
        </section>

        {/* Right Column: Complete Android Code Tree & Studio */}
        <section className={`lg:col-span-12 xl:col-span-8 p-5 rounded-2xl border transition ${
          appTheme === "dark" 
            ? "bg-[#1C1A18] border-[#2D2A26] shadow-xl" 
            : "bg-[#FAF8F5] border-[#E7DFD5] shadow-sm"
        }`}>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 dark:border-[#2D2A26] border-[#E7DFD5]">
            <div className="flex items-center space-x-2.5 ml-1">
              <Code className="w-5 h-5 text-[#C4A484]" />
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Android Source Explorer</h3>
                <p className="text-xs font-serif text-[#8C8479] italic">Complete architectural map of Room, Hilt, Compose and TTS Sync.</p>
              </div>
            </div>

            <div className="flex items-center mt-3 md:mt-0 space-x-2">
              <Cpu className="w-3.5 h-3.5 text-[#C4A484] animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-[10px] bg-[#E7DFD5]/40 text-[#4A443E] dark:text-[#FAF8F5] border border-[#C4A484]/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest font-sans">
                Production Ready
              </span>
            </div>
          </div>

          {/* Category Filters Tab selectors */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin dark:border-[#2D2A26] border-[#E7DFD5]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap transition-all cursor-pointer font-sans border ${
                  selectedCategory === cat
                    ? "bg-[#4A443E] text-[#FAF8F5] border-[#4A443E] shadow-sm"
                    : appTheme === "dark" 
                      ? "bg-[#2D2A26]/50 border-transparent text-[#8C8479] hover:bg-[#2D2A26]"
                      : "bg-[#FAF8F5] border-[#E7DFD5] text-[#8C8479] hover:bg-[#EBE5DC]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[480px]">
            {/* File List Tree segment */}
            <div className={`md:col-span-4 rounded-lg border p-2 flex flex-col overflow-y-auto ${
              appTheme === "dark" ? "bg-[#131211]/50 border-[#2D2A26]" : "bg-[#F7F3EE]/40 border-[#E7DFD5]"
            }`}>
              <div className="p-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C8479]">
                Directory tree
              </div>
              
              <div className="space-y-1.5 flex-1 select-none">
                {filteredFileList.map((file) => {
                  const isActive = file.path === activeFile.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setActiveFile(file)}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center space-x-2 transition ${
                        isActive
                          ? "bg-[#C4A484]/15 text-[#C4A484] border-l-2 border-[#C4A484] font-bold"
                          : "hover:bg-[#8C8479]/5 text-[#8C8479]"
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#C4A484]" : "text-[#8C8479]/60"}`} />
                      <div className="truncate min-w-0">
                        <div className="truncate text-[11px] font-serif font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">{file.name}</div>
                        <div className="text-[9px] text-[#8C8479] truncate mt-0.5">{file.path}</div>
                      </div>
                    </button>
                  );
                })}

                {filteredFileList.length === 0 && (
                  <div className="p-4 text-center text-xs text-[#8C8479] font-serif italic">
                    No files found in of category.
                  </div>
                )}
              </div>
            </div>

            {/* Code Highlight View segment */}
            <div className={`md:col-span-8 rounded-lg border flex flex-col overflow-hidden ${
              appTheme === "dark" ? "bg-[#131211] border-[#2D2A26]" : "bg-[#FAF8F5] border-[#E7DFD5]"
            }`}>
              {/* Toolbar of Code Viewer */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
                appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18]" : "border-[#E7DFD5] bg-[#FAF8F5]"
              }`}>
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-[#C4A484]" />
                  <span className="font-mono text-[#8C8479] truncate max-w-[200px]" title={activeFile.path}>
                    {activeFile.path}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCode(activeFile.content, activeFile.name)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition cursor-pointer font-sans ${
                    copiedFile === activeFile.name
                      ? "bg-[#C4A484]/20 text-[#1A1A1A] dark:text-[#FAF8F5] border border-[#C4A484]/30"
                      : "bg-[#1A1A1A] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#1A1A1A] hover:opacity-90 font-semibold"
                  }`}
                >
                  {copiedFile === activeFile.name ? (
                    <>
                      <Check className="w-3 h-3 text-[#C4A484]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Block */}
              <div className="flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed bg-[#131211] border-none text-[#F1EDE4] scrollbar-thin">
                <pre>
                  <code>
                    {activeFile.content.split("\n").map((line, idx) => (
                      <div key={idx} className="table-row">
                        <span className="table-cell text-right text-[#8C8479]/50 select-none pr-4 w-8 text-xs font-mono">
                          {idx + 1}
                        </span>
                        <span className="table-cell break-all">
                          {line || " "}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Setup steps / Architecture review card */}
          <div className={`mt-6 p-4 rounded-xl border ${
            appTheme === "dark" ? "bg-[#1C1A18]/50 border-[#2D2A26]" : "bg-[#FAF8F5] border-[#E7DFD5]"
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#4A443E] dark:text-[#C4A484] mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C4A484]" />
              Engine Deep-Dive: Real-Time TTS & Highlights Sync
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-serif">
              <div className="p-3.5 rounded bg-[#FAF8F5] dark:bg-[#131211] border border-[#E7DFD5] dark:border-[#2D2A26]">
                <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5] tracking-wide block mb-1">
                  1. Layout Sentence Extraction
                </span>
                <p className="text-[#8C8479] leading-relaxed text-[11px]">
                  When importing documents, Vocal Paper extracts raw content chunking into clean arrays. The Android app relies on Room Database to hold extracted structures seamlessly.
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF8F5] dark:bg-[#131211] border border-[#E7DFD5] dark:border-[#2D2A26]">
                <span className="font-bold text-[#4A443E] dark:text-[#C4A484] tracking-wide block mb-1">
                  2. Native Utterance callbacks
                </span>
                <p className="text-[#8C8479] leading-relaxed text-[11px]">
                  TTS Manager overrides <code className="text-[#C4A484] font-mono">onRangeStart()</code> to capture character ranges and index markers dynamically as words are being spoken by the synthesizer engine.
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#FAF8F5] dark:bg-[#131211] border border-[#E7DFD5] dark:border-[#2D2A26]">
                <span className="font-bold text-[#C4A484] tracking-wide block mb-1">
                  3. State-Driven Scroll Sync
                </span>
                <p className="text-[#8C8479] leading-relaxed text-[11px]">
                  StateFlow posts index changes down to Jetpack Compose’s list state. Triggering <code className="text-[#C4A484] font-mono">animateScrollToItem()</code> centers reading progress without latency.
                </p>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Footer credits content */}
      <footer className={`mt-16 text-center py-8 border-t ${
        appTheme === "dark" ? "border-[#2D2A26] bg-[#1C1A18] text-[#8C8479]" : "border-[#E7DFD5] bg-[#FAF8F5] text-[#8C8479]"
      }`}>
        <p className="text-xs font-serif font-medium">
          Vocal Paper Developer Studio v1.0.0
        </p>
        <p className="text-[10px] font-sans text-[#8C8479]/80 mt-1 uppercase tracking-wider">
          Designed and compiled for full Dagger Hilt, Android TTS API, and Jetpack Compose 1.5 architectures.
        </p>
      </footer>
    </div>
  );
}
