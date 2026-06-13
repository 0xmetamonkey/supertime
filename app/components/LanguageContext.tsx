'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'te' | 'ta';

export interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Common
    explore: "Explore",
    about: "About",
    roadmap: "Roadmap",
    signIn: "Sign in",
    dashboard: "Dashboard",
    backToSupertime: "Back to supertime",
    wantToSearch: "Want to search instead?",
    exploreHumans: "explore humans",
    
    // Hero Section
    heroTitle: "Intentional time with humans.",
    heroSubtitle: "Supertime is a calm space to connect with creators, thinkers, artists and experts. Real conversations. Not endless content.",
    claimUsername: "username",
    claimBtn: "Claim",
    
    // Features Column
    featHeader: "A better way to connect",
    feat1Title: "100% Focused Presence",
    feat1Desc: "Zero-latency dedicated live stream slots. No scrolling distractions.",
    feat2Title: "Fair Compensation",
    feat2Desc: "Respect creators' expertise with secure, direct micro-consulting micro-payments.",
    feat3Title: "Zero Algorithm bias",
    feat3Desc: "No feed manipulation. You choose when and with whom you want to talk.",
    
    // Grid Section
    meetHumans: "Meet some humans",
    exploreAll: "explore all creators",
    
    // Belief Section
    beliefTitle: "We believe the internet can be calm, intentional and human.",
    beliefDesc: "Supertime was built to rescue digital relationships from the clickbait economy. By providing focused, compensated 1:1 sessions, we unlock authentic human presence without the artificial noise of feeds and alerts.",
    readThoughts: "Read our thoughts",
    
    // Pricing
    pricingTitle: "Simple, straightforward pricing",
    pricingDesc: "We believe in direct relationships. Supertime charging is fully transparent, putting the creator first.",
    pricingFreeTitle: "For Members",
    pricingFreePrice: "Free",
    pricingFreeDesc: "No subscriptions. Explore creators, look up availability, and pay only for the exact live slot you book.",
    pricingProTitle: "For Creators",
    pricingProPrice: "10%",
    pricingProDesc: "Keep 90% of your earnings. We only take a 10% flat platform fee to support ultra-low latency streams and fast global routing.",
    
    // Roadmap Section
    roadmapTitle: "On our roadmap",
    roadmapDesc: "Follow our transparent progress as we build the next generation of borderless human video calling."
  },
  hi: {
    // Nav & Common
    explore: "खोजें",
    about: "हमारे बारे में",
    roadmap: "रोडमैप",
    signIn: "लॉग इन करें",
    dashboard: "डैशबोर्ड",
    backToSupertime: "सुपरटाइम पर वापस जाएं",
    wantToSearch: "क्या आप सर्च करना चाहते हैं?",
    exploreHumans: "लोगों को खोजें",
    
    // Hero Section
    heroTitle: "लोगों के साथ सार्थक समय।",
    heroSubtitle: "सुपरटाइम रचनाकारों, विचारकों, कलाकारों और विशेषज्ञों से जुड़ने का एक शांत स्थान है। वास्तविक बातचीत। कोई अंतहीन सामग्री नहीं।",
    claimUsername: "यूज़रनेम",
    claimBtn: "दावा करें",
    
    // Features Column
    featHeader: "जुड़ने का एक बेहतर तरीका",
    feat1Title: "100% एकाग्र उपस्थिति",
    feat1Desc: "शून्य-विलंबता समर्पित लाइव स्ट्रीम स्लॉट। कोई विचलित करने वाला स्क्रॉलिंग नहीं।",
    feat2Title: "उचित मुआवजा",
    feat2Desc: "सुरक्षित, प्रत्यक्ष सूक्ष्म-परामर्श भुगतानों के साथ रचनाकारों की विशेषज्ञता का सम्मान करें।",
    feat3Title: "शून्य एल्गोरिदम पूर्वाग्रह",
    feat3Desc: "कोई फीड हेरफेर नहीं। आप चुनते हैं कि आप कब और किससे बात करना चाहते हैं।",
    
    // Grid Section
    meetHumans: "सार्थक लोगों से मिलें",
    exploreAll: "सभी रचनाकारों को खोजें",
    
    // Belief Section
    beliefTitle: "हमारा मानना ​​है कि इंटरनेट शांत, सार्थक और मानवीय हो सकता है।",
    beliefDesc: "सुपरटाइम का निर्माण डिजिटल संबंधों को क्लिकबैट अर्थव्यवस्था से बचाने के लिए किया गया था। ध्यान केंद्रित और सीधे भुगतान वाले सत्र प्रदान करके, हम बिना किसी दिखावे या शोर के वास्तविक मानवीय संपर्क स्थापित करते हैं।",
    readThoughts: "हमारे विचार पढ़ें",
    
    // Pricing
    pricingTitle: "सरल और स्पष्ट दरें",
    pricingDesc: "हम प्रत्यक्ष संबंधों में विश्वास करते हैं। सुपरटाइम शुल्क पूरी तरह से पारदर्शी हैं, जिसमें रचनाकारों को सर्वोपरि रखा गया है।",
    pricingFreeTitle: "सदस्यों के लिए",
    pricingFreePrice: "मुफ़्त",
    pricingFreeDesc: "कोई सदस्यता शुल्क नहीं। रचनाकारों को खोजें, उनकी उपलब्धता देखें, और केवल उसी स्लॉट के लिए भुगतान करें जिसे आप बुक करते हैं।",
    pricingProTitle: "रचनाकारों के लिए",
    pricingProPrice: "10%",
    pricingProDesc: "अपनी कमाई का 90% हिस्सा अपने पास रखें। हम केवल 10% मंच शुल्क लेते हैं ताकि कम विलंबता वाली वीडियो कॉलिंग और तेज भुगतान संभव हो सके।",
    
    // Roadmap Section
    roadmapTitle: "हमारे रोडमैप पर",
    roadmapDesc: "हमारी पारदर्शी प्रगति का अनुसरण करें क्योंकि हम बिना सीमाओं के मानव वीडियो कॉलिंग की अगली पीढ़ी का निर्माण कर रहे हैं।"
  },
  es: {
    // Nav & Common
    explore: "Explorar",
    about: "Acerca de",
    roadmap: "Mapa de ruta",
    signIn: "Iniciar sesión",
    dashboard: "Panel",
    backToSupertime: "Volver a supertime",
    wantToSearch: "¿Prefieres buscar?",
    exploreHumans: "explorar humanos",
    
    // Hero Section
    heroTitle: "Tiempo intencional con humanos.",
    heroSubtitle: "Supertime es un espacio tranquilo para conectar con creadores, pensadores, artistas y expertos. Conversaciones reales. No contenido infinito.",
    claimUsername: "usuario",
    claimBtn: "Reclamar",
    
    // Features Column
    featHeader: "Una mejor manera de conectar",
    feat1Title: "Presencia 100% Enfocada",
    feat1Desc: "Transmisiones en vivo dedicadas con cero latencia. Sin distracciones.",
    feat2Title: "Compensación Justa",
    feat2Desc: "Respeta la experiencia de los creadores con micropagos seguros y directos.",
    feat3Title: "Sin Sesgo de Algoritmos",
    feat3Desc: "Sin manipulación de feeds. Tú eliges cuándo y con quién quieres hablar.",
    
    // Grid Section
    meetHumans: "Conoce a algunos humanos",
    exploreAll: "explorar todos los creadores",
    
    // Belief Section
    beliefTitle: "Creemos que el internet puede ser tranquilo, intencional y humano.",
    beliefDesc: "Supertime fue creado para rescatar las relaciones digitales de la economía del clickbait. Al proporcionar sesiones 1:1 enfocadas y compensadas, desbloqueamos la presencia humana auténtica sin el ruido artificial de alertas e interrupciones.",
    readThoughts: "Leer nuestros pensamientos",
    
    // Pricing
    pricingTitle: "Precios simples y transparentes",
    pricingDesc: "Creemos en las relaciones directas. Las tarifas de Supertime son completamente transparentes, priorizando al creador.",
    pricingFreeTitle: "Para Miembros",
    pricingFreePrice: "Gratis",
    pricingFreeDesc: "Sin suscripciones. Explora creadores, consulta disponibilidad y paga solo por la sesión en vivo exacta que reserves.",
    pricingProTitle: "Para Creadores",
    pricingProPrice: "10%",
    pricingProDesc: "Quédate con el 90% de tus ingresos. Solo cobramos una tarifa plana de plataforma del 10% para mantener transmisiones globales estables.",
    
    // Roadmap Section
    roadmapTitle: "En nuestro mapa de ruta",
    roadmapDesc: "Sigue nuestro progreso transparente mientras construimos la próxima generación de videollamadas humanas sin fronteras."
  },
  fr: {
    // Nav & Common
    explore: "Explorer",
    about: "À propos",
    roadmap: "Feuille de route",
    signIn: "Connexion",
    dashboard: "Tableau de bord",
    backToSupertime: "Retour à supertime",
    wantToSearch: "Préférer rechercher ?",
    exploreHumans: "explorer des humains",
    
    // Hero Section
    heroTitle: "Du temps intentionnel avec des humains.",
    heroSubtitle: "Supertime est un espace calme pour se connecter avec des créateurs, des penseurs, des artistes et des experts. Vraies conversations. Pas de contenu infini.",
    claimUsername: "nom d'utilisateur",
    claimBtn: "Réclamer",
    
    // Features Column
    featHeader: "Une meilleure façon de se connecter",
    feat1Title: "Présence 100% Focalisée",
    feat1Desc: "Créneaux de diffusion dédiés sans latence. Aucune distraction de défilement.",
    feat2Title: "Rémunération Équitable",
    feat2Desc: "Respectez l'expertise des créateurs avec des micro-paiements directs et sécurisés.",
    feat3Title: "Sans biais d'algorithme",
    feat3Desc: "Aucune manipulation de flux. Vous choisissez quand et avec qui vous voulez parler.",
    
    // Grid Section
    meetHumans: "Rencontrer des humains",
    exploreAll: "explorer tous les créateurs",
    
    // Belief Section
    beliefTitle: "Nous croyons que l'internet peut être calme, intentionnel et humain.",
    beliefDesc: "Supertime a été conçu pour sauver les relations numériques de l'économie du clic. En proposant des sessions 1:1 ciblées et rémunérées, nous libérons une présence humaine authentique sans le bruit artificiel des flux et des alertes.",
    readThoughts: "Lire nos pensées",
    
    // Pricing
    pricingTitle: "Des tarifs simples et transparents",
    pricingDesc: "Nous croyons aux relations directes. Les frais de Supertime sont totalement transparents, mettant le créateur au premier plan.",
    pricingFreeTitle: "Pour les Membres",
    pricingFreePrice: "Gratuit",
    pricingFreeDesc: "Pas d'abonnement. Explorez les créateurs, vérifiez la disponibilité et payez uniquement pour le créneau en direct réservé.",
    pricingProTitle: "Pour les Créateurs",
    pricingProPrice: "10%",
    pricingProDesc: "Gardez 90% de vos gains. Nous ne prenons qu'une commission fixe de 10% pour soutenir la faible latence des flux mondiaux.",
    
    // Roadmap Section
    roadmapTitle: "Sur notre feuille de route",
    roadmapDesc: "Suivez nos progrès en toute transparence alors que nous construisons la prochaine génération de visioconférences humaines sans frontières."
  },
  te: {
    // Nav & Common
    explore: "అన్వేషించు",
    about: "గురించి",
    roadmap: "రోడ్‌మ్యాప్",
    signIn: "లాగిన్",
    dashboard: "డాష్‌బోర్డ్",
    backToSupertime: "సూపర్‌టైమ్‌కు తిరిగి వెళ్ళు",
    wantToSearch: "వెతకాలనుకుంటున్నారా?",
    exploreHumans: "మనుషులను అన్వేషించండి",
    
    // Hero Section
    heroTitle: "మనుషులతో విలువైన సమయం.",
    heroSubtitle: "సూపర్‌టైమ్ అనేది సృష్టికర్తలు, ఆలోచనాపరులు, కళాకారులు మరియు నిపుణులతో కనెక్ట్ కావడానికి ఒక ప్రశాंतమైన స్థలం. నిజమైన సంభాషణలు. అంతులేని కంటెంట్ కాదు.",
    claimUsername: "వినియోగదారు పేరు",
    claimBtn: "క్లెయిమ్",
    
    // Features Column
    featHeader: "కనెక్ట్ కావడానికి ఒక అద్భుతమైన మార్గం",
    feat1Title: "100% కేంద్రీకృత సమక్షం",
    feat1Desc: "సున్నా-ఆలస్యం ప్రత్యేక లైవ్ స్ట్రీమ్ సమయాలు. ఎటువంటి అపసవ్యాలు లేవు.",
    feat2Title: "సముచితమైన పరిహారం",
    feat2Desc: "భద్రమైన, ప్రత్యక్ష మైక్రో-పేమెంట్ల ద్వారా సృష్టికర్తల నైపుణ్యాన్ని గౌరవించండి.",
    feat3Title: "ఎటువంటి అల్గోరిథం పక్షపాతం లేదు",
    feat3Desc: "ఫీడ్ లతో సంబంధం లేదు. మీరు ఎప్పుడు, ఎవరితో మాట్లాడాలనేది మీరే నిర్ణయించుకుంటారు.",
    
    // Grid Section
    meetHumans: "కొంతమంది మనుషులను కలవండి",
    exploreAll: "సృష్టికర్తలందరినీ అన్వేషించండి",
    
    // Belief Section
    beliefTitle: "ఇంటర్నెట్ ప్రశాంతంగా, సముచితంగా మరియు మానవీయంగా ఉంటుందని మేము నమ్ముతున్నాము.",
    beliefDesc: "క్లిక్‌బైట్ మార్కెట్ నుండి డిజిటల్ సంబంధాలను రక్షించడానికి సూపర్‌టైమ్ నిర్మించబడింది. ప్రశాంతమైన 1:1 లైవ్ సెషన్లను అందించడం ద్వారా, మేము ఎటువంటి అవాంతరాలు లేని సహజమైన మానవ బంధాలను ప్రోత్సహిస్తాము.",
    readThoughts: "మా ఆలోచనలను చదవండి",
    
    // Pricing
    pricingTitle: "సరళమైన, స్పష్టమైన ధరలు",
    pricingDesc: "మేము ప్రత్యక్ష సంబంధాలను నమ్ముతాము. సూపర్‌టైమ్ లావాదేవీలు పూర్తిగా పారదర్శకంగా ఉంటాయి, ఎల్లప్పుడూ సృష్టికర్తలకే ప్రాధాన్యత ఇస్తాయి.",
    pricingFreeTitle: "సభ్యుల కోసం",
    pricingFreePrice: "ఉచితం",
    pricingFreeDesc: "ఎటువంటి సబ్‌స్క్రిప్షన్లు లేవు. సృష్టికర్తలను వెతకండి, అందుబాటులో ఉన్న సమయాలను చూసి, కేవలం మీరు బుక్ చేసే సెషన్ కి మాత్రమే చెల్లించండి.",
    pricingProTitle: "సృష్టికర్తల కోసం",
    pricingProPrice: "10%",
    pricingProDesc: "మీ సంపాదనలో 90% మీ వద్దే ఉంచుకోండి. వేగవంతమైన కాలింగ్ మరియు సురక్షితమైన చెల్లింపుల కోసం మేము కేవలం 10% స్థిర రుసుమును మాత్రమే తీసుకుంటాము.",
    
    // Roadmap Section
    roadmapTitle: "మా రోడ్‌మ్యాప్‌లో",
    roadmapDesc: "ప్రపంచవ్యాప్తంగా అద్భుతమైన మానవ సంభాషణల వేదికను నిర్మించడంలో మా పురోగతిని పారదర్శకంగా పర్యవేక్షించండి."
  },
  ta: {
    // Nav & Common
    explore: "ஆராய்க",
    about: "பற்றி",
    roadmap: "திட்டவரைபடம்",
    signIn: "உள்நுழைக",
    dashboard: "டாஷ்போர்டு",
    backToSupertime: "சூப்பர்டைமிற்கு திரும்பவும்",
    wantToSearch: "தேட விரும்புகிறீர்களா?",
    exploreHumans: "மனிதர்களை ஆராயுங்கள்",
    
    // Hero Section
    heroTitle: "மனிதர்களுடன் பயனுள்ள நேரம்.",
    heroSubtitle: "சூப்பர்டைம் என்பது படைப்பாளிகள், சிந்தனையாளர்கள், கலைஞர்கள் மற்றும் நிபுணர்களுடன் இணைவதற்கான ஒரு அமைதியான இடமாகும். உண்மையான உரையாடல்கள். அம்துலாடி உள்ளடக்கங்கள் இல்லை.",
    claimUsername: "பயனர் பெயர்",
    claimBtn: "கோரு",
    
    // Features Column
    featHeader: "இணைவதற்கான சிறந்த வழி",
    feat1Title: "100% முழுமையான கவனம்",
    feat1Desc: "தாமதமற்ற பிரத்யேக நேரடி ஒளிபரப்பு நேரங்கள். கவனச்சிதறல் தரும் ஸ்க்ரோலிங் இல்லை.",
    feat2Title: "நியாயமான ஊதியம்",
    feat2Desc: "பாதுகாப்பான நேரடி குறுஞ்செலுத்துகைகள் மூலம் படைப்பாளர்களின் திறமைக்கு மதிப்பளிக்கவும்.",
    feat3Title: "அல்காரிதம் சார்பற்றது",
    feat3Desc: "ஃபீட் கையாளுதல் இல்லை. நீங்கள் எப்போது யாருடன் பேச வேண்டும் என்பதை நீங்களே தேர்வு செய்யுங்கள்.",
    
    // Grid Section
    meetHumans: "சில மனிதர்களைச் சந்தியுங்கள்",
    exploreAll: "அனைத்து படைப்பாளர்களையும் ஆராய்க",
    
    // Belief Section
    beliefTitle: "இணையம் அமைதியாகவும், பயனுள்ளதாகவும், மனிதாபிமானத்துடனும் இருக்க முடியும் என்று நம்புகிறோம்.",
    beliefDesc: "கிளிக்பைட் வர்த்தகத்திலிருந்து டிஜிடல் உறவுகளைக் காப்பதற்காகவே சூப்பர்டைம் உருவாக்கப்பட்டது. பிரத்யேக 1:1 உரையாடல்களை வழங்குவதன் மூலம், எவ்வித விளம்பர ஆரவாரமும் இல்லாமல் உண்மையான மனித இணைப்பை நாங்கள் சாத்தியமாக்குகிறோம்.",
    readThoughts: "எங்கள் கருத்துக்களைப் படிக்கவும்",
    
    // Pricing
    pricingTitle: "எளிய, நேரடியான கட்டணங்கள்",
    pricingDesc: "நேரடி உறவுகளை நாங்கள் நம்புகிறோம். சூப்பர்டைம் கட்டணங்கள் முற்றிலும் வெளிப்படையானவை, படைப்பாளர்களுக்கே முன்னுரிமை.",
    pricingFreeTitle: "உறுப்பினர்களுக்கு",
    pricingFreePrice: "இலவசம்",
    pricingFreeDesc: "எவ்வித சந்தாக்களும் இல்லை. படைப்பாளர்களை ஆராய்ந்து, கிடைக்கும் நேரத்தைக் கண்டு, நீங்கள் முன்பதிவு செய்யும் நேரத்திற்கு மட்டுமே பணம் செலுத்துங்கள்.",
    pricingProTitle: "படைப்பாளர்களுக்கு",
    pricingProPrice: "10%",
    pricingProDesc: "உங்களது வருவாயில் 90%-ஐ நீங்களே வைத்துக் கொள்ளுங்கள். தாமதமற்ற வீடியோ அழைப்புகள் மற்றும் விரைவான சேவைகளுக்காக 10% மட்டுமே நாங்கள் பெறுகிறோம்.",
    
    // Roadmap Section
    roadmapTitle: "எங்கள் திட்ட வரைபடத்தில்",
    roadmapDesc: "மனித உரையாடல்களுக்கான புதிய தலைமுறை தளத்தை உருவாக்குவதில் எங்கள் வெளிப்படையான முன்னேற்றத்தைக் கண்காணியுங்கள்."
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language preference if set previously
    const savedLang = localStorage.getItem('supertime_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('supertime_lang', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
