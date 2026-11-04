import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Languages,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  ShieldAlert,
  Radio,
  Globe2,
} from 'lucide-react';
import { Incident } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectIncident?: (id: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  lang: string;
  translatedFrom?: string;
  timestamp: string;
  actionTaken?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string; // BCP 47 tag for SpeechSynthesis
  flag: string;
}

export const WORLD_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechCode: 'fr-FR', flag: '🇫🇷' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-PK', flag: '🇵🇰' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechCode: 'ar-SA', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', speechCode: 'zh-CN', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', speechCode: 'ja-JP', flag: '🇯🇵' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', speechCode: 'de-DE', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', speechCode: 'pt-BR', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', speechCode: 'ru-RU', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', speechCode: 'it-IT', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', speechCode: 'ko-KR', flag: '🇰🇷' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', speechCode: 'tr-TR', flag: '🇹🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', speechCode: 'vi-VN', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', speechCode: 'id-ID', flag: '🇮🇩' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN', flag: '🇮🇳' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', speechCode: 'sw-KE', flag: '🇰🇪' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', speechCode: 'nl-NL', flag: '🇳🇱' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', speechCode: 'th-TH', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', speechCode: 'pl-PL', flag: '🇵🇱' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(WORLD_LANGUAGES[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am CrisisLens Voice AI Assistant. You can speak or type to me in any world language. Ask me about ongoing disasters, evacuation advice, flood depths, or emergency dispatch.',
      lang: 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLang.speechCode;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleUserMessage(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedLang]);

  // Cancel speech on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Speak a text in the selected language
  const speakText = (text: string, langCode: string) => {
    if (!autoSpeak || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[#*_`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 300); // Friendly conversational length

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(langCode.slice(0, 2)));
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your question in any language!');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try {
        recognitionRef.current.lang = selectedLang.speechCode;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Multilingual Knowledge & Response Generator
  const generateResponse = (query: string, lang: LanguageOption): { text: string; action?: string } => {
    const q = query.toLowerCase();
    const targetCode = lang.code;

    // Multilingual Disaster Knowledge Responses dictionary
    const responses: Record<string, Record<string, string>> = {
      flood_status: {
        en: 'Active Flood Alert: At Bayside Estuary Sector 4, water levels have crested at 4.82 meters (+1.32m above danger threshold). The masonry riverwall suffered a 45-meter scour. The causeway is cordoned off with flow velocity at 1.8 m/s.',
        hi: 'बाढ़ चेतावनी: बेसाइड एस्टुरी सेक्टर 4 में जलस्तर 4.82 मीटर तक पहुंच गया है (खतरे के निशान से +1.32 मीटर ऊपर)। 45 मीटर की नदी दीवार क्षतिग्रस्त हो गई है। कॉजवे पर 1.8 मीटर/सेकंड के बहाव के कारण आवागमन पूरी तरह बंद कर दिया गया है।',
        es: 'Alerta de Inundación: En Bayside Estuary Sector 4, los niveles de agua alcanzaron 4.82 metros (+1.32m sobre el umbral de peligro). El muro de contención sufrió una fractura de 45 metros. La calzada está acordonada con una corriente de 1.8 m/s.',
        fr: 'Alerte Crue: À Bayside Estuary Secteur 4, les eaux ont atteint 4,82 mètres (+1,32m au-dessus du seuil de danger). Le mur en maçonnerie a subi une rupture de 45 mètres. La chaussée est bouclée avec une vitesse de courant de 1,8 m/s.',
        te: 'వరద హెచ్చరిక: బేసైడ్ ఎస్ట్యురీ సెక్టార్ 4 లో నీటి మట్టం 4.82 మీటర్లకు చేరింది (ప్రమాద స్థాయి కంటే 1.32 మీటర్లు ఎక్కువ). 45 మీటర్ల రక్షణ గోడ దెబ్బతింది. రోడ్డుపై నీటి వేగం 1.8 మీ/సెకను ఉన్నందున రాకపోకలు నిలిపివేయబడ్డాయి.',
        ta: 'வெள்ள அபாயம்: பேசைட் எஸ்டுவரி செக்டார் 4-ல் நீர்மட்டம் 4.82 மீட்டராக உயர்ந்துள்ளது (அபாய அளவை விட +1.32 மீ அதிகம்). 45 மீட்டர் தடுப்புச் சுவர் சேதமடைந்துள்ளது. 1.8 மீ/வி வேகத்தில் வெள்ளம் பாய்வதால் போக்குவரத்து முற்றிலும் நிறுத்தப்பட்டுள்ளது.',
        ar: 'تنبيه فيضان نشط: في قطاع بايسايد 4، وصل منسوب المياه إلى 4.82 متر (+1.32 م فوق عتبة الخطر). تعرض الجدار الحجري لانهيار بطول 45 مترًا. الطريق مغلق تمامًا بسرعة تدفق 1.8 م/ث.',
        zh: '洪灾警报：在贝赛德河口4区，水位已达4.82米（超警戒水位1.32米）。45米护岸石墙发生淘刷溃口。跨海堤道水流速度达1.8米/秒，现已全面封锁。',
        de: 'Hochwasserwarnung: In Bayside Estuary Sektor 4 hat der Wasserstand 4,82 Meter erreicht (+1,32 m über der Gefahrenschwelle). Die Ufermauer erlitt einen 45-Meter-Bruch. Der Straßendamm ist gesperrt.',
      },
      evacuation: {
        en: 'Evacuation Protocol (FEMA P-259 / NDMA): Evacuate downstream residents within 500 meters of the breach immediately. Prioritize vertical evacuation to reinforced upper floors. Do not drive across submerged roadways.',
        hi: 'निकासी प्रोटोकॉल (NDMA): तटबंध टूटने वाले स्थान से 500 मीटर के भीतर के निवासियों को तुरंत सुरक्षित स्थानों पर पहुंचाएं। पक्की इमारतों की ऊपरी मंजिलों पर शरण लें। जलमग्न सड़कों पर वाहन न चलाएं।',
        es: 'Protocolo de Evacuación (FEMA): Evacue inmediatamente a los residentes río abajo dentro de un radio de 500 metros. Priorice la evacuación vertical hacia pisos superiores reforzados. No intente cruzar carreteras sumergidas.',
        fr: "Protocole d'Évacuation: Évacuez immédiatement les résidents à moins de 500 mètres en aval de la brèche. Privilégiez l'évacuation verticale vers les étages supérieurs. Ne traversez jamais les voies inondées.",
        te: 'తరలింపు మార్గదర్శకాలు: గండి పడిన ప్రదేశం నుండి 500 మీటర్ల పరిధిలోని ప్రజలను వెంటనే సురక్షిత ప్రాంతాలకు తరలించండి. ఎత్తైన అంతస్తులలో ఆశ్రయం పొందండి. వరద నీటిలో వాహనాలు నడపవద్దు.',
        ta: 'வெளியேற்ற நெறிமுறை: உடைப்பு ஏற்பட்ட இடத்திலிருந்து 500 மீட்டர் சுற்றளவில் உள்ள மக்களை உடனடியாக வெளியேற்றவும். உயரமான மாடிகளுக்கு செல்லவும். வெள்ள நீரில் வாகனங்களை இயக்க வேண்டாம்.',
        ar: 'بروتوكول الإخلاء: قم بإخلاء السكان في اتجاه مجرى النهر ضمن مسافة 500 متر على الفور. أعطِ الأولوية للإخلاء العمودي إلى الطوابق العليا المقواة. لا تقد المركبات عبر الطرق المغمورة.',
        zh: '疏散指南（FEMA / NDMA）：立即疏散决口下游500米范围内的居民。优先向坚固建筑的高层进行纵向疏散。严禁驾车通过积水路段。',
        de: 'Evakuierungsprotokoll: Evakuieren Sie sofort alle Bewohner im Umkreis von 500 Metern flussabwärts. Bevorzugen Sie die vertikale Evakuierung in obere Stockwerke. Befahren Sie keine überfluteten Straßen.',
      },
      dispatch: {
        en: 'Emergency Dispatch Confirmed: Alerting NDRF 04 Battalion (45 personnel, inflatable Gemini boats) and City Police Control Room (Dial 100/112). Rescue staging area set at High Ridge Apron.',
        hi: 'आपातकालीन राहत दल रवाना: एनडीआरएफ चौथी बटालियन (45 जवान, जेमिनी मोटर बोट्स) और पुलिस नियंत्रण कक्ष (100/112) को अलर्ट कर दिया गया है। बचाव केंद्र हाई रिज एप्रन पर स्थापित है।',
        es: 'Despacho de Emergencia Confirmado: Alertando al batallón de rescate fluvial NDRF (45 especialistas con lanchas neumáticas) y Sala de Control Policial (100/112). Punto de concentración: High Ridge Apron.',
        fr: "Déploiement d'Urgence Confirmé: Alerte transmise au bataillon de sauvetage aquatique (45 secouristes, canots pneumatiques) et au centre de commandement (100/112). Zone de rassemblement: High Ridge Apron.",
        te: 'అత్యవసర రక్షణ బృందం తరలింపు: ఎన్డీఆర్ఎఫ్ 04 బెటాలియన్ (45 మంది సిబ్బంది, మోటార్ బోట్లు) మరియు పోలీస్ కంట్రోల్ రూమ్ (100/112) అప్రమత్తం చేయబడ్డాయి.',
        ta: 'அவசர மீட்புப் படை அனுப்பப்பட்டது: என்.டி.ஆர்.எஃப் மீட்புப் படை (45 வீரர்கள், மோட்டார் படகுகள்) மற்றும் காவல் கட்டுப்பாட்டு அறை (100/112) உஷார்படுத்தப்பட்டுள்ளன.',
        ar: 'تم تأكيد إرسال فرق الطوارئ: تم إخطار كتيبة الإنقاذ من الفيضانات وغرفة عمليات الشرطة (100/112). تم تحديد منطقة التجمع في High Ridge Apron.',
        zh: '紧急救援响应已下达：已通知国家防汛救援营（45名专业人员，充气冲锋舟）和市指挥调度中心（100/112）。救援集结地点：High Ridge Apron。',
        de: 'Notfalleinsatz bestätigt: NDRF-Wasserrettungsbataillon (45 Einsatzkräfte, Schlauchboote) und Notrufzentrale (100/112) wurden alarmiert. Sammelpunkt: High Ridge Apron.',
      },
      first_aid: {
        en: 'Medical Guidance: For hypothermia or floodwater contamination, remove wet clothing, wrap in thermal blankets, and elevate extremities. City General Hospital has 25 surge ICU beds prepared.',
        hi: 'प्राथमिक चिकित्सा: बाढ़ के पानी के संक्रमण या हाइपोथर्मिया के लिए, गीले कपड़े हटाएं, गर्म कंबल लपेटें। सिटी जनरल अस्पताल में 25 आपातकालीन आईसीयू बेड तैयार हैं।',
        es: 'Guía de Primeros Auxilios: Para hipotermia o exposición a aguas contaminadas, retire ropa mojada y use mantas térmicas. El Hospital General dispone de 25 camas de cuidados intensivos preparadas.',
        fr: "Secourisme d'Urgence: Pour l'hypothermie, retirez les vêtements mouillés et couvrez la victime d'une couverture de survie. L'Hôpital Général dispose de 25 lits de réanimation prêts.",
        te: 'ప్రథమ చికిత్స సలహా: చలి తీవ్రత మరియు కలుషిత నీటి నుండి కాపాడటానికి తడి బట్టలు తీసివేసి వెచ్చని దుప్పట్లు కప్పండి. సిటీ జనరల్ హాస్పిటల్ లో 25 ఐసీయూ బెడ్లు సిద్ధంగా ఉన్నాయి.',
        ta: 'முதலுதவி வழிகாட்டுதல்: பாதிக்கப்பட்டவர்களின் ஈரமான ஆடைகளை அகற்றி கம்பளிகளை போர்த்தவும். அரசு பொது மருத்துவமனையில் 25 அவசர சிகிச்சை படுக்கைகள் தயார் நிலையில் உள்ளன.',
        ar: 'إرشادات الإسعافات الأولية: للتعامل مع انخفاض حرارة الجسم، انزع الملابس المبللة واستخدم البطانيات الحرارية. مستشفى المدينة العام جهز 25 سرير عناية مركزة للطوارئ.',
        zh: '急救指引：针对失温或污水浸泡人员，请立即脱除湿衣物并包裹保温毯。市中心医院已备好25张急救重症监护病床。',
        de: 'Erste-Hilfe-Hinweis: Bei Unterkühlung nasse Kleidung sofort entfernen und Wärmedecken anlegen. Das Städtische Klinikum hat 25 Intensivbetten vorbereitet.',
      },
    };

    // Keyword detection
    let category = 'general';
    if (q.includes('flood') || q.includes('water') || q.includes('depth') || q.includes('river') || q.includes('level') || q.includes('बाढ़') || q.includes('నీరు') || q.includes('வெள்ளம்') || q.includes('agua') || q.includes('inondation')) {
      category = 'flood_status';
    } else if (q.includes('evacuat') || q.includes('shelter') || q.includes('safe') || q.includes('where to go') || q.includes('बचाव') || q.includes('తరలింపు') || q.includes('வெளியேற்றம்') || q.includes('evacuar')) {
      category = 'evacuation';
    } else if (q.includes('call') || q.includes('dispatch') || q.includes('help') || q.includes('police') || q.includes('ndrf') || q.includes('rescue') || q.includes('पुलिस') || q.includes('సహాయం') || q.includes('உதவி') || q.includes('ayuda') || q.includes('secours')) {
      category = 'dispatch';
    } else if (q.includes('medical') || q.includes('hospital') || q.includes('doctor') || q.includes('aid') || q.includes('injured') || q.includes('अस्पताल') || q.includes('ఆసుపత్రి') || q.includes('மருத்துவமனை') || q.includes('médico')) {
      category = 'first_aid';
    }

    if (category !== 'general' && responses[category]) {
      const match = responses[category][targetCode] || responses[category]['en'];
      return { text: match, action: category === 'dispatch' ? 'Dispatched NDRF Battalion 04' : undefined };
    }

    // Default conversational response tailored to target language
    const defaultGreetings: Record<string, string> = {
      en: `I am monitoring ${incidents.length} active emergency disaster incidents. Meta Muse Spark indicates highest priority at Bayside Estuary. You can ask me to call emergency services, check flood depths, or give evacuation advice.`,
      hi: `मैं वर्तमान में ${incidents.length} सक्रिय आपदा क्षेत्रों की निगरानी कर रहा हूं। मेटा म्यूज़ स्पार्क बेसाइड एस्टुरी को सर्वोच्च प्राथमिकता बताता है। आप मुझसे आपातकालीन सेवाओं को बुलाने या सुरक्षित मार्गों की जानकारी ले सकते हैं।`,
      es: `Estoy monitoreando ${incidents.length} incidentes de desastre activos. Meta Muse Spark reporta máxima prioridad en Bayside Estuary. Puede pedirme que alerte a los servicios de rescate o verifique rutas de evacuación.`,
      fr: `Je surveille ${incidents.length} incidents de crise en cours. Meta Muse Spark indique une priorité maximale à Bayside Estuary. Vous pouvez me demander de contacter les secours ou de vérifier les zones de sécurité.`,
      te: `ప్రస్తుతం ${incidents.length} విపత్తు ప్రాంతాలను పర్యవేక్షిస్తున్నాను. బేసైడ్ ఎస్ట్యురీ వద్ద అత్యంత ప్రమాదకర పరిస్థితి ఉంది. మీరు నన్ను అత్యవసర సహాయం కోరవచ్చు లేదా రక్షణ మార్గాలను అడగవచ్చు.`,
      ta: `தற்போது ${incidents.length} பேரிடர் பகுதிகளை கண்காணித்து வருகிறேன். பேசைட் எஸ்டுவரியில் அதிக அபாயம் நிலவுகிறது. அவசர சேவைகளை அழைக்க அல்லது பாதுகாப்பு வழிகளை அறிய நீங்கள் என்னிடம் கேட்கலாம்.`,
      ar: `أنا أراقب حاليًا ${incidents.length} من حالات الطوارئ النشطة. يشير Meta Muse Spark إلى أولوية قصوى في بايسايد إستواري. يمكنك أن تطلب مني تنبيه خدمات الإنقاذ أو التحقق من مناطق الإخلاء الآمنة.`,
      zh: `我正在实时监控 ${incidents.length} 起进行中的灾害事件。Meta Muse Spark 判定贝赛德河口处于最高危警戒级别。您可以指令我调度应急救援、查询水深或获取避难所路线。`,
      de: `Ich überwache derzeit ${incidents.length} aktive Katastrophenereignisse. Meta Muse Spark meldet höchste Priorität für Bayside Estuary. Sie können mich beauftragen, Rettungskräfte zu alarmieren oder Evakuierungsrouten zu prüfen.`,
    };

    const text = defaultGreetings[targetCode] || defaultGreetings['en'];
    return { text };
  };

  const handleUserMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: text.trim(),
      lang: selectedLang.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate assistant response
    setTimeout(() => {
      const response = generateResponse(text, selectedLang);
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: response.text,
        lang: selectedLang.code,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken: response.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically speak response in selected language
      if (autoSpeak) {
        speakText(response.text, selectedLang.speechCode);
      }
    }, 400);
  };

  const handleLanguageChange = (lang: LanguageOption) => {
    setSelectedLang(lang);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const welcome = generateResponse('hello', lang);
    const switchMsg: Message = {
      id: `msg-${Date.now()}-lang`,
      sender: 'assistant',
      text: `🌐 Language switched to ${lang.name} (${lang.nativeName}). ${welcome.text}`,
      lang: lang.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, switchMsg]);
    if (autoSpeak) {
      speakText(welcome.text, lang.speechCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1222] border border-sky-500/40 rounded-2xl max-w-2xl w-full h-[620px] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <Bot className="w-5 h-5" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>CrisisLens Voice AI</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    Multilingual Voice Core
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Speaks & understands any world language with real-time audio synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-Speak Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) window.speechSynthesis.cancel();
                setAutoSpeak(!autoSpeak);
              }}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-all ${
                autoSpeak
                  ? 'bg-sky-950/60 border-sky-600 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={autoSpeak ? 'Voice output enabled' : 'Voice output muted'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Globe2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="font-semibold text-slate-300">Target Voice & Language:</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedLang.code}
              onChange={(e) => {
                const found = WORLD_LANGUAGES.find((l) => l.code === e.target.value);
                if (found) handleLanguageChange(found);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {WORLD_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Audio Visualizer Ring */}
        {(isListening || isSpeaking) && (
          <div className="py-2.5 px-4 bg-sky-950/40 border-b border-sky-800/40 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-semibold">
                {isListening ? `Listening in ${selectedLang.name}... Speak now!` : `Speaking in ${selectedLang.name} (${selectedLang.nativeName})...`}
              </span>
            </div>
            {isSpeaking && (
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900"
              >
                Stop Voice
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line text-[13px]">{m.text}</p>

                {m.actionTaken && (
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-400 pt-1 border-t border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{m.actionTaken}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1 px-1 text-[10px] text-slate-500">
                <span>{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => speakText(m.text, selectedLang.speechCode)}
                    className="hover:text-sky-400 flex items-center space-x-0.5"
                    title="Repeat voice"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/60 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex-shrink-0 font-medium">Quick Prompts:</span>
          <button
            onClick={() => handleUserMessage('What is the flood water depth at Bayside Estuary?')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            🌊 Flood Depth
          </button>
          <button
            onClick={() => handleUserMessage('What is the evacuation protocol?')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            🏃 Evacuation Guidance
          </button>
          <button
            onClick={() => handleUserMessage('Dispatch nearest rescue boats and police team')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            🚨 Dispatch Rescue
          </button>
          <button
            onClick={() => handleUserMessage('First aid guidance for contaminated floodwater')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            🩹 First Aid
          </button>
        </div>

        {/* Input Bar with Glowing Mic */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
          {/* Push to talk Microphone button */}
          <button
            onClick={toggleListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/40'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
            }`}
            title={isListening ? 'Click to stop listening' : `Click to speak in ${selectedLang.name}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserMessage(inputText)}
            placeholder={`Speak or type in ${selectedLang.name} (${selectedLang.nativeName})...`}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <button
            onClick={() => handleUserMessage(inputText)}
            disabled={!inputText.trim()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-400 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
