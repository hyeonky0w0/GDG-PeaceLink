import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/CommPage.css";
import { BottomNav } from "../components/BottomNav";
import logoSvg from "../images/Peacelink.svg";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
};

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult;
  length: number;
};

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = {
  new (): SpeechRecognitionInstance;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type LangOption = {
  label: string;
  code: string;
  region: string;
};

type SourceGuide = {
  empty: string;
  listening: string;
  placeholder: string;
};

type SpeakingBlock = "source" | "target" | null;

type ExpertTerm = {
  term: string;
  desc: string;
};

type TranslationApiResponse = {
  translatedText?: string;
  translated_text?: string;
  translation?: string;
  result?: string;
  text?: string;
  message?: string;
  data?: {
    translatedText?: string;
    translated_text?: string;
    translation?: string;
    result?: string;
    text?: string;
  };
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://peacelinkbe.up.railway.app";

const LANGUAGES: LangOption[] = [
  {
    label: "한국어",
    code: "ko-KR",
    region: "KR",
  },
  {
    label: "日本語",
    code: "ja-JP",
    region: "JP",
  },
  {
    label: "中文",
    code: "zh-CN",
    region: "CN",
  },
  {
    label: "Español",
    code: "es-ES",
    region: "ES",
  },
  {
    label: "Français",
    code: "fr-FR",
    region: "FR",
  },
  {
    label: "English",
    code: "en-US",
    region: "US",
  },
];

const SOURCE_GUIDES: Record<string, SourceGuide> = {
  "ko-KR": {
    empty: "텍스트를 입력하거나 마이크 버튼을 눌러 말해보세요.",
    listening: "음성을 듣고 있습니다...",
    placeholder: "번역할 문장을 입력하세요.",
  },
  "ja-JP": {
    empty: "テキストを入力するか、マイクボタンを押して話してください。",
    listening: "音声を聞き取っています...",
    placeholder: "翻訳する文章を入力してください。",
  },
  "zh-CN": {
    empty: "请输入文本，或点击麦克风按钮说话。",
    listening: "正在听取语音...",
    placeholder: "请输入要翻译的句子。",
  },
  "es-ES": {
    empty: "Escribe un texto o pulsa el botón del micrófono para hablar.",
    listening: "Escuchando...",
    placeholder: "Escribe una frase para traducir.",
  },
  "fr-FR": {
    empty: "Saisissez un texte ou appuyez sur le micro pour parler.",
    listening: "Écoute en cours...",
    placeholder: "Saisissez une phrase à traduire.",
  },
  "en-US": {
    empty: "Type text or tap the microphone button to speak.",
    listening: "Listening...",
    placeholder: "Enter a sentence to translate.",
  },
};

const ENGLISH = {
  label: "English",
  code: "en-US",
  region: "US",
};

const TARGET_EMPTY_GUIDE = "Translation result will appear here.";

const FALLBACK_TRANSLATIONS: Record<string, string> = {
  "도움이 필요합니다. 여기 부상자가 있습니다.":
    "I need help. There is an injured person here.",
  "助けが必要です。ここにけが人がいます。":
    "I need help. There is an injured person here.",
  "我需要帮助。这里有人受伤了。":
    "I need help. There is an injured person here.",
  "Necesito ayuda. Hay una persona herida aquí.":
    "I need help. There is an injured person here.",
  "J'ai besoin d'aide. Il y a une personne blessée ici.":
    "I need help. There is an injured person here.",
};

const MEDICAL_TERMS: ExpertTerm[] = [
  {
    term: "injured person",
    desc: "부상자, 다친 사람",
  },
  {
    term: "vital signs",
    desc: "활력 징후 (심박수, 혈압, 호흡수, 체온 등)",
  },
  {
    term: "unstable",
    desc: "불안정한, 변동이 심한 상태",
  },
  {
    term: "bleeding",
    desc: "출혈",
  },
  {
    term: "unconscious",
    desc: "의식이 없는 상태",
  },
  {
    term: "emergency",
    desc: "응급 상황",
  },
  {
    term: "fracture",
    desc: "골절",
  },
  {
    term: "CPR",
    desc: "심폐소생술",
  },
];

function SpeakerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ToastCheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function shortLangCode(code: string) {
  return code.split("-")[0];
}

function cleanTranslatedText(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/localhost:\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTranslatedTextFromResponse(data: TranslationApiResponse) {
  return (
    data.translatedText ||
    data.translated_text ||
    data.translation ||
    data.result ||
    data.text ||
    data.data?.translatedText ||
    data.data?.translated_text ||
    data.data?.translation ||
    data.data?.result ||
    data.data?.text ||
    ""
  );
}

async function translateToEnglish(text: string, sourceCode: string) {
  const trimmedText = text.trim();

  if (!trimmedText) return "";

  if (sourceCode.startsWith("en")) {
    return cleanTranslatedText(trimmedText);
  }

  if (FALLBACK_TRANSLATIONS[trimmedText]) {
    return FALLBACK_TRANSLATIONS[trimmedText];
  }

  const sourceLang = shortLangCode(sourceCode);

  const response = await fetch(
    `${API_BASE_URL}/api/translation/interpret/text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      /*
      백엔드 request body 필드명이 정확히 확정되지 않은 상태를 대비해서
      자주 쓰는 필드명을 같이 보냄.
      백엔드 명세가 확정되면 text/sourceLang/targetLang만 남겨도 됨.
    */
      body: JSON.stringify({
        text: trimmedText,
        inputText: trimmedText,
        sentence: trimmedText,
        message: trimmedText,
        sourceLang,
        sourceLanguage: sourceLang,
        from: sourceLang,
        targetLang: "en",
        targetLanguage: "en",
        to: "en",
      }),
    },
  );

  const rawText = await response.text();

  if (!response.ok) {
    console.error("번역 API 실패");
    console.error("status:", response.status);
    console.error("response:", rawText);
    throw new Error(`Translation API request failed: ${response.status}`);
  }

  let data: TranslationApiResponse;

  try {
    data = JSON.parse(rawText) as TranslationApiResponse;
  } catch {
    console.error("번역 API 응답이 JSON이 아님:", rawText);
    throw new Error("Translation API response is not JSON");
  }

  console.log("번역 API 응답:", data);

  const translated = getTranslatedTextFromResponse(data);

  if (!translated) {
    console.error("번역 결과 필드를 찾지 못함:", data);
    throw new Error("Translated text not found");
  }

  return cleanTranslatedText(translated);
}

function detectMedicalTerms(text: string) {
  const lowerText = text.toLowerCase();

  return MEDICAL_TERMS.filter((item) =>
    lowerText.includes(item.term.toLowerCase()),
  );
}

function getBoundaryRange(
  text: string,
  charIndex: number,
  charLength?: number,
) {
  const start = Math.max(0, charIndex);

  if (charLength && charLength > 0) {
    return {
      start,
      end: Math.min(text.length, start + charLength),
    };
  }

  const rest = text.slice(start);
  const match = rest.match(/^[^\s,.!?，。！？]+/);

  return {
    start,
    end: Math.min(text.length, start + (match?.[0]?.length || 1)),
  };
}

function HighlightedText({
  text,
  className,
  isActive,
  range,
}: {
  text: string;
  className: string;
  isActive: boolean;
  range: { start: number; end: number } | null;
}) {
  if (!isActive || !range) {
    return <p className={className}>{text}</p>;
  }

  const before = text.slice(0, range.start);
  const active = text.slice(range.start, range.end);
  const after = text.slice(range.end);

  return (
    <p className={className}>
      {before}
      <span className="speakingHighlight">{active}</span>
      {after}
    </p>
  );
}

export default function CommPage() {
  const [sourceLang, setSourceLang] = useState<LangOption>(LANGUAGES[0]);
  const sourceGuide = SOURCE_GUIDES[sourceLang.code] ?? SOURCE_GUIDES["ko-KR"];

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSourceFirst, setIsSourceFirst] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isEditingSource, setIsEditingSource] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  const [speakingBlock, setSpeakingBlock] = useState<SpeakingBlock>(null);
  const [highlightRange, setHighlightRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sourceTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const detectedMedicalTerms = useMemo(() => {
    if (!hasUserInput || isTranslating) return [];

    return detectMedicalTerms(translatedText);
  }, [translatedText, isTranslating, hasUserInput]);

  const hasMedicalTerms = detectedMedicalTerms.length > 0;

  useEffect(() => {
    if (!isEditingSource) return;

    sourceTextareaRef.current?.focus();

    const length = sourceTextareaRef.current?.value.length ?? 0;
    sourceTextareaRef.current?.setSelectionRange(length, length);
  }, [isEditingSource]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      const trimmedText = sourceText.trim();

      if (!trimmedText) {
        setTranslatedText("");
        setIsTranslating(false);
        return;
      }

      try {
        setIsTranslating(true);
        const result = await translateToEnglish(trimmedText, sourceLang.code);

        if (!cancelled) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error("번역 처리 실패:", error);

        if (!cancelled) {
          setTranslatedText("번역에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sourceText, sourceLang.code]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const handleLanguageChange = (code: string) => {
    const selected = LANGUAGES.find((lang) => lang.code === code);

    if (!selected) return;

    setHasUserInput(false);
    setSourceLang(selected);
    setSourceText("");
    setTranslatedText("");
    setHighlightRange(null);
    setSpeakingBlock(null);
    setIsEditingSource(false);
    window.speechSynthesis?.cancel();
  };

  const getPreferredVoice = (langCode: string): SpeechSynthesisVoice | null => {
    if (!("speechSynthesis" in window)) return null;

    const availableVoices = window.speechSynthesis.getVoices();

    if (!availableVoices.length) return null;

    if (langCode.startsWith("en")) {
      return (
        availableVoices.find(
          (voice) =>
            voice.lang === "en-US" &&
            /google|microsoft|samantha|alex|english/i.test(voice.name),
        ) ||
        availableVoices.find((voice) => voice.lang === "en-US") ||
        availableVoices.find((voice) => voice.lang.startsWith("en")) ||
        null
      );
    }

    if (langCode.startsWith("ko")) {
      return (
        availableVoices.find((voice) => voice.lang === "ko-KR") ||
        availableVoices.find((voice) => voice.lang.startsWith("ko")) ||
        null
      );
    }

    return (
      availableVoices.find((voice) => voice.lang === langCode) ||
      availableVoices.find((voice) =>
        voice.lang.startsWith(langCode.split("-")[0]),
      ) ||
      null
    );
  };

  const speakText = (text: string, langCode: string, block: SpeakingBlock) => {
    if (!text.trim()) return;

    if (!("speechSynthesis" in window)) {
      alert("이 브라우저에서는 음성 읽기 기능을 지원하지 않습니다.");
      return;
    }

    setIsEditingSource(false);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = getPreferredVoice(langCode);

    utterance.lang = langCode;
    utterance.rate = langCode.startsWith("en") ? 0.9 : 0.95;
    utterance.pitch = 1;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    setSpeakingBlock(block);
    setHighlightRange({ start: 0, end: 1 });

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (typeof event.charIndex === "number") {
        setHighlightRange(
          getBoundaryRange(text, event.charIndex, event.charLength),
        );
      }
    };

    utterance.onend = () => {
      setSpeakingBlock(null);
      setHighlightRange(null);
    };

    utterance.onerror = () => {
      setSpeakingBlock(null);
      setHighlightRange(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "마이크 음성 입력은 Chrome 또는 Edge 브라우저에서 사용하는 것이 좋습니다.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeakingBlock(null);
    setHighlightRange(null);
    setIsEditingSource(false);

    const recognition = new SpeechRecognition();

    recognition.lang = sourceLang.code;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setSourceText("");
      setTranslatedText("");
      setHasUserInput(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setSourceText(transcript.trim());
      setHasUserInput(true);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const copyTranslatedText = async () => {
    if (!translatedText.trim()) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const renderEditableSourceText = () => {
    if (isEditingSource) {
      return (
        <textarea
          ref={sourceTextareaRef}
          className="sourceText sourceTextarea"
          value={sourceText}
          placeholder={sourceGuide.placeholder}
          rows={2}
          onChange={(event) => {
            setSourceText(event.target.value);
            setHasUserInput(true);
          }}
          onBlur={() => setIsEditingSource(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsEditingSource(false);
            }
          }}
        />
      );
    }

    return (
      <div
        className="editableTextWrap"
        role="button"
        tabIndex={0}
        onClick={() => {
          window.speechSynthesis?.cancel();
          setSpeakingBlock(null);
          setHighlightRange(null);
          setIsEditingSource(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setIsEditingSource(true);
          }
        }}
      >
        <HighlightedText
          text={
            sourceText ||
            (isListening ? sourceGuide.listening : sourceGuide.empty)
          }
          className={sourceText ? "sourceText" : "sourceText sourceGuideText"}
          isActive={speakingBlock === "source"}
          range={highlightRange}
        />
      </div>
    );
  };

  const renderSourceSection = () => (
    <div className="section" key="source">
      <div className="langRow">
        <div className="customLangDropdown">
          <button
            type="button"
            className="customLangBtn"
            onClick={() => setIsLangOpen((prev) => !prev)}
          >
            <span>{sourceLang.label}</span>
            <span className="customArrow">⌄</span>
          </button>

          {isLangOpen && (
            <div className="customLangMenu">
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  className={`customLangItem ${
                    sourceLang.code === lang.code ? "selected" : ""
                  }`}
                  onClick={() => {
                    handleLanguageChange(lang.code);
                    setIsLangOpen(false);
                  }}
                >
                  <span>{lang.label}</span>
                  <span className="customRegion">{lang.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="region">{sourceLang.region}</span>
      </div>

      {renderEditableSourceText()}

      {isListening && <p className="statusText">{sourceGuide.listening}</p>}

      <div className="iconRowRight">
        <button
          className={`iconBtn ${
            speakingBlock === "source" ? "sourceIconActive" : ""
          }`}
          aria-label="원문 음성 재생"
          onClick={() => speakText(sourceText, sourceLang.code, "source")}
          disabled={!sourceText.trim()}
        >
          <SpeakerIcon />
        </button>

        <button
          className={`iconBtn ${
            isListening ? "sourceIconActive recordingIcon" : ""
          }`}
          aria-label="음성 입력"
          onClick={startSpeechRecognition}
        >
          <MicIcon />
        </button>
      </div>
    </div>
  );

  const renderTargetSection = () => (
    <div className="section" key="target">
      <div className="langRow">
        <button className="langBtn langBtnActive" disabled>
          {ENGLISH.label}
        </button>

        <span className="region">{ENGLISH.region}</span>
      </div>

      <HighlightedText
        text={
          isTranslating
            ? "Translating..."
            : translatedText || TARGET_EMPTY_GUIDE
        }
        className={
          translatedText ? "translatedText" : "translatedText targetGuideText"
        }
        isActive={speakingBlock === "target"}
        range={highlightRange}
      />

      {hasMedicalTerms && (
        <div className="medOptRow">
          <span className="medOptBtn medOptBtnActive">의료 용어 최적화</span>
        </div>
      )}

      <div className="iconRowRight">
        <button
          className={`iconBtn ${
            speakingBlock === "target" ? "targetIconActive" : ""
          }`}
          aria-label="영어 음성 재생"
          onClick={() => speakText(translatedText, ENGLISH.code, "target")}
          disabled={isTranslating || !translatedText.trim()}
        >
          <SpeakerIcon />
        </button>

        <button
          className={`iconBtn ${copied ? "targetIconActive" : ""}`}
          aria-label="복사"
          onClick={copyTranslatedText}
          disabled={isTranslating || !translatedText.trim()}
        >
          <CopyIcon />
        </button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <header className="header">
        <a href="/" className="commLogo" aria-label="PeaceLink 홈으로 이동">
          <img src={logoSvg} alt="PeaceLink" />
        </a>
      </header>

      <main className="content">
        <section className="card">
          {isSourceFirst ? renderSourceSection() : renderTargetSection()}

          <div className="dividerWrap">
            <div className="dividerLine" />
            <button
              className="swapBtn"
              aria-label="언어 위치 전환"
              onClick={() => {
                setIsEditingSource(false);
                setIsSourceFirst((prev) => !prev);
              }}
            >
              <SwapIcon />
            </button>
            <div className="dividerLine" />
          </div>

          {isSourceFirst ? renderTargetSection() : renderSourceSection()}
        </section>

        <section className="glossaryCard popCard">
          <h3 className="glossaryTitle">전문 용어 설명</h3>

          <div className="glossaryDivider" />

          {hasMedicalTerms ? (
            <>
              {detectedMedicalTerms.map((item) => (
                <div className="glossaryItem" key={item.term}>
                  <div className="glossaryTerm">{item.term}</div>
                  <div className="glossaryDesc">{item.desc}</div>
                </div>
              ))}

              <div className="glossarySource">출처: WHO 의료 용어 사전</div>
            </>
          ) : (
            <p className="glossaryEmpty">전문 용어가 없습니다</p>
          )}
        </section>
      </main>

      {copied && (
        <div className="copyToast" role="status" aria-live="polite">
          <span>복사되었습니다</span>
          <ToastCheckIcon />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
