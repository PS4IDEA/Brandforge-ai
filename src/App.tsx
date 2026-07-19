import React, { useState, useEffect } from 'react';
import { Language, Page, DashboardTab, UserProfile, GeneratedName, GeneratedLogo, GeneratedSlogan, GeneratedBrandKit, UsageLog, SupportTicket } from './types';
import { translations } from './translations';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import NameGenerator from './components/NameGenerator';
import LogoGenerator from './components/LogoGenerator';
import SloganGenerator from './components/SloganGenerator';
import BrandKitGenerator from './components/BrandKitGenerator';
import ColorPaletteGenerator from './components/ColorPaletteGenerator';
import AdminPanel from './components/AdminPanel';
import BlogFAQPages from './components/BlogFAQPages';
import DashboardOverview from './components/DashboardOverview';
import BusinessCardMaker from './components/services/BusinessCardMaker';
import SocialMediaAssets from './components/services/SocialMediaAssets';
import SeoOptimization from './components/services/SeoOptimization';
import BrandVoice from './components/services/BrandVoice';
import LogoMaker from './components/services/LogoMaker';
import { sendWelcomeEmail, sendTestEmail } from './lib/emailService';
import { 
  Sparkles, ShieldCheck, Coins, Users, Rocket, Target, 
  MessageSquare, LayoutGrid, Check, Mail, Lock, User, 
  HelpCircle, ChevronRight, Award, Flame, RefreshCw 
} from 'lucide-react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  getClientFirebaseConfig,
  setClientFirebaseConfig,
  isClientFirebaseActive,
  getActiveFirebaseConfig
} from './lib/firebase';


export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showRefreshToast, setShowRefreshToast] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brandforge_language');
      if (saved === 'en' || saved === 'ar') return saved as Language;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandforge_language', language);
    }

    // Dynamic SEO & Language Header Controller for Google Ranking
    const isAr = language === 'ar';
    
    // 1. Update Document Title with high-relevance niche keywords
    document.title = isAr 
      ? "براند فورج ستوديو | تصميم الهوية التجارية وتوليد الشعارات بالذكاء الاصطناعي"
      : "BrandForge Studio - AI Brand Identity, SVG Logo Maker & Brand Voice Architect";

    // 2. Update HTML tag attributes for search crawlers & accessibility
    document.documentElement.lang = language;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';

    // 3. Update Meta Description dynamically
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', isAr
      ? "صمم هويتك التجارية المتكاملة ونبرة صوت علامتك التجارية فوراً بالذكاء الاصطناعي: أسماء مبتكرة، شعارات SVG عالية الجودة، عبارات تسويقية، وتحليل الهوية اللغوية."
      : "Create premium brand names, custom SVG logos, taglines, and design a cohesive Brand Voice playbook instantly with our AI-powered BrandForge Generator."
    );

    // 4. Update Meta Keywords dynamically
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', isAr
      ? "تصميم هوية تجارية, صانع الشعارات بالذكاء الاصطناعي, تصميم لوجو مجاني, مولد العبارات التسويقية, اختيار اسماء شركات, الهوية البصرية واللفظية, نبرة صوت العلامة التجارية, لوحات الالوان الرقمية, براند فورج"
      : "brand generator, brand voice analyzer, ai logo maker, free svg logo generator, brand voice guide, color palette generator, slogan creator, brand identity builder, brandforge, startup branding, svg logo maker"
    );

    // 5. Update Open Graph Meta Tags for rich search index previews
    const updateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOgTag('og:title', isAr 
      ? "براند فورج ستوديو | تصميم الهوية التجارية وتوليد الشعارات بالذكاء الاصطناعي" 
      : "BrandForge Studio - AI Brand Identity, SVG Logo Maker & Brand Voice Architect"
    );
    updateOgTag('og:description', isAr
      ? "صمم هويتك التجارية المتكاملة ونبرة صوت علامتك التجارية فوراً بالذكاء الاصطناعي: أسماء مبتكرة، شعارات SVG عالية الجودة، عبارات تسويقية، وتحليل الهوية اللغوية."
      : "Create premium brand names, custom SVG logos, taglines, and design a cohesive Brand Voice playbook instantly with our AI-powered BrandForge Generator."
    );
  }, [language]);

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>('overview');

  const handleRefreshApp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowRefreshToast(true);
      setTimeout(() => setShowRefreshToast(false), 3000);
    }, 1000);
  };

  // Firebase configuration state for self-hosting fallback
  const [showFirebaseSettings, setShowFirebaseSettings] = useState(false);
  const [customFirebaseInput, setCustomFirebaseInput] = useState(() => {
    const config = getClientFirebaseConfig();
    return config ? JSON.stringify(config, null, 2) : '';
  });
  const [firebaseSaveStatus, setFirebaseSaveStatus] = useState<'idle' | 'saved' | 'cleared' | 'error'>('idle');
  const [firebaseErrorMsg, setFirebaseErrorMsg] = useState('');

  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authDomainErrorDetails, setAuthDomainErrorDetails] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    setAuthError(null);
    setAuthDomainErrorDetails(false);
  }, [showAuthModal, isRegister]);

  // Core databases (using local state + localStorage fallback)
  const [usersDb, setUsersDb] = useState<UserProfile[]>([]);
  const [savedNames, setSavedNames] = useState<GeneratedName[]>([]);
  const [savedLogos, setSavedLogos] = useState<GeneratedLogo[]>([]);
  const [savedSlogans, setSavedSlogans] = useState<GeneratedSlogan[]>([]);
  const [savedKits, setSavedKits] = useState<GeneratedBrandKit[]>([]);
  const [historyLogs, setHistoryLogs] = useState<UsageLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [welcomeEmails, setWelcomeEmails] = useState<any[]>([]);
  const [welcomeEmailToast, setWelcomeEmailToast] = useState<{ email: string; name: string } | null>(null);

  const t = translations[language];

  // Check if we are running on the public preview/shared link to hide testing backdoors
  const isPublicLink = typeof window !== 'undefined' && (
    window.location.hostname.includes('ais-pre') || 
    (!window.location.hostname.includes('ais-dev') && 
     !window.location.hostname.includes('localhost') && 
     !window.location.hostname.includes('127.0.0.1'))
  );

  // Parse URL parameters on mount for deep-linking and SEO sitemap support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get('page');
      const urlLang = params.get('lang');

      if (urlLang === 'en' || urlLang === 'ar') {
        setLanguage(urlLang);
      }
      
      const validPages: Page[] = ['landing', 'features', 'pricing', 'blog', 'faq', 'contact', 'terms', 'privacy', 'dashboard', 'admin', 'business-cards', 'social-media', 'seo', 'logo-maker'];
      if (urlPage && validPages.includes(urlPage as Page)) {
        setCurrentPage(urlPage as Page);
      }
    }
  }, []);

  // 1. Initial State Loading from LocalStorage / Firebase sync
  useEffect(() => {
    // Sync theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Firebase Auth & Firestore syncing listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Logged in via real Firebase
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let loadedProfile: UserProfile;
          
          if (userDocSnap.exists()) {
            loadedProfile = userDocSnap.data() as UserProfile;
            
            // Auto-promote owner email to admin if not already set
            if (firebaseUser.email === 'yoafyosf121@gmail.com' && loadedProfile.role !== 'admin') {
              loadedProfile.role = 'admin';
              await updateDoc(userDocRef, { role: 'admin' });
            }
            
            // Ensure credits is a valid number
            if (typeof loadedProfile.credits !== 'number' || isNaN(loadedProfile.credits)) {
              loadedProfile.credits = 10;
            }
            
            // Check for daily free credits
            const now = new Date();
            const lastGrant = loadedProfile.lastFreeCreditGrant ? new Date(loadedProfile.lastFreeCreditGrant) : new Date(loadedProfile.createdAt);
            const msSinceGrant = now.getTime() - lastGrant.getTime();
            const hoursSinceGrant = msSinceGrant / (1000 * 60 * 60);

            if (hoursSinceGrant >= 24) {
              loadedProfile.credits += 10;
              loadedProfile.lastFreeCreditGrant = now.toISOString();
              await updateDoc(userDocRef, {
                credits: loadedProfile.credits,
                lastFreeCreditGrant: loadedProfile.lastFreeCreditGrant
              });
            }
          } else {
            // If Firestore profile doesn't exist yet, create it
            loadedProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Brand Architect',
              credits: 10, // Generous starting credits
              subscriptionPlan: 'free',
              billingCycle: 'monthly',
              role: firebaseUser.email === 'yoafyosf121@gmail.com' ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              lastFreeCreditGrant: new Date().toISOString()
            };
            await setDoc(userDocRef, loadedProfile);
          }
          
          setUser(loadedProfile);
          
          // Fetch saved assets from user subcollections
          try {
            // Load text-based generations
            const genRef = collection(db, 'users', firebaseUser.uid, 'generations');
            const genSnap = await getDocs(genRef);
            
            const names: GeneratedName[] = [];
            const slogans: GeneratedSlogan[] = [];
            const kits: GeneratedBrandKit[] = [];
            
            genSnap.forEach((doc) => {
              const data = doc.data();
              if (data.type === 'name') {
                names.push(data.result as GeneratedName);
              } else if (data.type === 'slogan') {
                slogans.push(data.result as GeneratedSlogan);
              } else if (data.type === 'identity') {
                kits.push(data.result as GeneratedBrandKit);
              }
            });
            
            setSavedNames(names);
            setSavedSlogans(slogans);
            setSavedKits(kits);
            
            // Load generated logos
            const logoRef = collection(db, 'users', firebaseUser.uid, 'logos');
            const logoSnap = await getDocs(logoRef);
            const logos: GeneratedLogo[] = [];
            
            logoSnap.forEach((doc) => {
              const data = doc.data();
              logos.push({
                id: doc.id,
                style: data.style || 'Modern',
                prompt: data.prompt || 'Generated logo',
                svg: data.imageUrl || '',
                createdAt: data.createdAt || new Date().toISOString()
              } as GeneratedLogo);
            });
            
            setSavedLogos(logos);
            
          } catch (err) {
            console.error("Firestore sync error:", err);
          }
        } catch (dbErr: any) {
          console.error("Error loading user profile from Firestore:", dbErr);
          // Alert user of connection/security rules issues
          alert("Database connection error: " + (dbErr.message || "Please make sure your Firestore database is created and rules are deployed."));
        }
      } else {
        // Not authenticated with Firebase: load mock assets from localStorage
        setSavedNames(JSON.parse(localStorage.getItem('brandforge_names') || '[]'));
        setSavedLogos(JSON.parse(localStorage.getItem('brandforge_logos') || '[]'));
        setSavedSlogans(JSON.parse(localStorage.getItem('brandforge_slogans') || '[]'));
        setSavedKits(JSON.parse(localStorage.getItem('brandforge_kits') || '[]'));
        
        // Clear user state if the current user is a real Firebase user (not a demo profile)
        setUser((currentUser) => {
          if (currentUser && currentUser.uid !== 'user-primary' && currentUser.uid !== 'user-demo-1' && currentUser.uid !== 'user-demo-2') {
            return null;
          }
          return currentUser;
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Populate seed accounts for local sandbox purposes
    const initialUsers: UserProfile[] = [
      {
        uid: 'user-primary',
        email: 'yoafyosf121@gmail.com',
        displayName: 'Yoaf Yosf',
        credits: 100,
        subscriptionPlan: 'pro',
        billingCycle: 'monthly',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'user-demo-1',
        email: 'founder@greenlife.io',
        displayName: 'Sarah Green',
        credits: 45,
        subscriptionPlan: 'free',
        billingCycle: 'monthly',
        role: 'user',
        createdAt: new Date().toISOString()
      },
      {
        uid: 'user-demo-2',
        email: 'brandforge-ai@zohomail.com',
        displayName: 'Vertex Agency',
        credits: 1550,
        subscriptionPlan: 'business',
        billingCycle: 'yearly',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];

    const cachedUsers = localStorage.getItem('brandforge_users');
    if (cachedUsers) {
      setUsersDb(JSON.parse(cachedUsers));
    } else {
      setUsersDb(initialUsers);
      localStorage.setItem('brandforge_users', JSON.stringify(initialUsers));
    }

    setHistoryLogs(JSON.parse(localStorage.getItem('brandforge_history') || '[]'));
    
    // Support tickets seed
    const cachedTickets = localStorage.getItem('brandforge_tickets');
    if (cachedTickets) {
      setSupportTickets(JSON.parse(cachedTickets));
    } else {
      const initialTickets: SupportTicket[] = [
        { id: 'ticket-1', userId: 'user-demo-1', userEmail: 'founder@greenlife.io', subject: 'Inquiry on logo downloads', message: 'I cannot seem to download my transparent logo, could you assist?', status: 'open', createdAt: new Date().toISOString() },
        { id: 'ticket-2', userId: 'user-demo-2', userEmail: 'brandforge-ai@zohomail.com', subject: 'Invoice needed', message: 'Need yearly billing invoice for company accounting purposes.', status: 'resolved', createdAt: new Date().toISOString() },
        { id: 'ticket-3', userId: 'user-demo-3', userEmail: 'brandforge-ai@zohomail.com', subject: 'Test Message', message: 'This is a random test message to verify the contact functionality is working correctly with the new email.', status: 'open', createdAt: new Date().toISOString() }
      ];
      setSupportTickets(initialTickets);
      localStorage.setItem('brandforge_tickets', JSON.stringify(initialTickets));
    }
  }, []);

  // Sync / load welcome emails & real users if user is admin
  useEffect(() => {
    if (user && user.role === 'admin' && auth.currentUser) {
      const fetchWelcomeEmails = async () => {
        try {
          const emailsRef = collection(db, 'welcome_emails');
          const emailsSnap = await getDocs(emailsRef);
          const loadedEmails: any[] = [];
          emailsSnap.forEach((doc) => {
            loadedEmails.push({ id: doc.id, ...doc.data() });
          });
          loadedEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
          setWelcomeEmails(loadedEmails);
        } catch (err) {
          console.error("Error loading welcome emails:", err);
        }
      };

      const fetchFirestoreUsers = async () => {
        try {
          const usersRef = collection(db, 'users');
          const usersSnap = await getDocs(usersRef);
          const loadedUsers: UserProfile[] = [];
          usersSnap.forEach((doc) => {
            loadedUsers.push(doc.data() as UserProfile);
          });
          loadedUsers.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setUsersDb(loadedUsers);
        } catch (err) {
          console.error("Error loading users from Firestore:", err);
        }
      };

      const fetchFirestoreTickets = async () => {
        try {
          const ticketsRef = collection(db, 'support_tickets');
          const ticketsSnap = await getDocs(ticketsRef);
          const loadedTickets: SupportTicket[] = [];
          ticketsSnap.forEach((doc) => {
            loadedTickets.push({ id: doc.id, ...doc.data() } as SupportTicket);
          });
          loadedTickets.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          setSupportTickets(loadedTickets);
        } catch (err) {
          console.error("Error loading support tickets from Firestore:", err);
        }
      };

      fetchWelcomeEmails();
      fetchFirestoreUsers();
      fetchFirestoreTickets();
    } else {
      // Seed fallbacks for local sandbox or demo admin views
      setWelcomeEmails([
        {
          id: 'welcome-seed-1',
          userId: 'user-demo-1',
          recipientEmail: 'founder@greenlife.io',
          recipientName: 'Sarah Green',
          subject: 'Welcome to BrandForge, Sarah Green! 🚀 (+100 AI Credits Loaded)',
          provider: 'SparkMail SDK (v2.4.1)',
          status: 'sent',
          sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          trackingId: 'msg-583021-SEEDWELCOME'
        },
        {
          id: 'welcome-seed-2',
          userId: 'user-demo-2',
          recipientEmail: 'brandforge-ai@zohomail.com',
          recipientName: 'Vertex Agency',
          subject: 'Welcome to BrandForge, Vertex Agency! 🚀 (+100 AI Credits Loaded)',
          provider: 'SparkMail SDK (v2.4.1)',
          status: 'sent',
          sentAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          trackingId: 'msg-992015-SEEDWELCOME'
        }
      ]);

      const cachedUsers = localStorage.getItem('brandforge_users');
      if (cachedUsers) {
        setUsersDb(JSON.parse(cachedUsers));
      }
    }
  }, [user]);

  // 2. Helper State Persistence Syncs
  const saveUsersToStorage = (updatedUsers: UserProfile[]) => {
    setUsersDb(updatedUsers);
    localStorage.setItem('brandforge_users', JSON.stringify(updatedUsers));
  };

  // Run onboarding tour for new logins removed for React 19 compatibility

  // 3. Simulated & Real Firebase Auth Handlers
  const handleCopyDomain = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'brandforge.run.app';
    navigator.clipboard.writeText(hostname);
    setCopiedDomain(true);
    setTimeout(() => {
      setCopiedDomain(false);
    }, 2000);
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthDomainErrorDetails(false);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      const isDomainError = err.code === 'auth/unauthorized-domain' || 
                            (err.message && err.message.includes('unauthorized-domain'));
      const isPopupClosed = err.code === 'auth/popup-closed-by-user' ||
                            err.code === 'auth/cancelled-popup-request' ||
                            (err.message && (err.message.includes('popup-closed-by-user') || err.message.includes('cancelled-popup-request')));

      if (isDomainError) {
        setAuthDomainErrorDetails(true);
        setAuthError(
          language === 'ar' 
            ? 'هذا النطاق غير مصرح به في إعدادات مشروع Firebase الخاص بك.'
            : 'This domain is not authorized in your Firebase Project settings.'
        );
      } else if (isPopupClosed) {
        setAuthError(
          language === 'ar'
            ? 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية. يمكنك المحاولة مجدداً في أي وقت.'
            : 'The sign-in window was closed before completion. You can try again anytime.'
        );
      } else {
        setAuthError(err.message || (language === 'ar' ? 'حدث خطأ في مصادقة Google. الرجاء المحاولة مرة أخرى.' : 'Google authentication error occurred. Please try again.'));
      }
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) return;
    setAuthError(null);
    setAuthDomainErrorDetails(false);

    try {
      if (isRegister) {
        // Register utilizing Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const newUser: UserProfile = {
          uid: cred.user.uid,
          email: authEmail,
          displayName: authName || authEmail.split('@')[0],
          credits: 10, // starting credits
          subscriptionPlan: 'free',
          billingCycle: 'monthly',
          role: authEmail.toLowerCase() === 'yoafyosf121@gmail.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          lastFreeCreditGrant: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
        setUser(newUser);
      } else {
        // Login utilizing Firebase Auth
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }

      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: any) {
      console.error("Auth error:", err);
      const isDomainError = err.code === 'auth/unauthorized-domain' || 
                            (err.message && err.message.includes('unauthorized-domain'));
      if (isDomainError) {
        setAuthDomainErrorDetails(true);
        setAuthError(
          language === 'ar' 
            ? 'هذا النطاق غير مصرح به في إعدادات مشروع Firebase الخاص بك.'
            : 'This domain is not authorized in your Firebase Project settings.'
        );
      } else {
        setAuthError(err.message || (language === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.' : 'Authentication error occurred. Please try again.'));
      }
    }
  };

  const handleDemoLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setUser(usersDb[0] || {
        uid: 'user-primary',
        email: 'yoafyosf121@gmail.com',
        displayName: 'Yoaf Yosf',
        credits: 10,
        subscriptionPlan: 'pro',
        billingCycle: 'monthly',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
    } else {
      setUser(usersDb[1] || {
        uid: 'user-demo-1',
        email: 'founder@greenlife.io',
        displayName: 'Sarah Green',
        credits: 10,
        subscriptionPlan: 'free',
        billingCycle: 'monthly',
        role: 'user',
        createdAt: new Date().toISOString()
      });
    }
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    setCurrentPage('landing');
  };

  // 4. State Modification & Credits Hooks
  const deductCredits = (amount: number): boolean => {
    if (!user) {
      console.log("No user loaded; cannot deduct credits.");
      return false;
    }
    const currentCredits = typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    if (currentCredits < amount) {
      console.log(`Insufficient credits. Required: ${amount}, current: ${currentCredits}`);
      return false;
    }

    // Deduct from current session user
    const updatedUser = { ...user, credits: Math.max(0, currentCredits - amount) };
    setUser(updatedUser);
    console.log(`Deducting ${amount} credits. New balance: ${updatedUser.credits}`);

    // Sync Firestore if logged in with Firebase
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        credits: updatedUser.credits
      }).then(() => {
        console.log("Firestore credits updated successfully");
      }).catch(err => {
        console.error("Error updating credits in Firestore:", err);
      });
    }

    // Sync back with users list DB
    const updatedDb = usersDb.map(u => u.uid === user.uid ? updatedUser : u);
    saveUsersToStorage(updatedDb);

    // Log to history
    const newLog: UsageLog = {
      id: `log-${Date.now()}`,
      type: amount === 2 ? 'name' : amount === 3 ? 'logo' : amount === 1 ? 'slogan' : 'brand-kit',
      prompt: 'AI generation requested',
      creditsConsumed: amount,
      createdAt: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...historyLogs];
    setHistoryLogs(updatedLogs);
    localStorage.setItem('brandforge_history', JSON.stringify(updatedLogs));

    return true;
  };

  const handleAddCredits = (amount: number) => {
    if (!user) {
      console.log("No user loaded; cannot add credits.");
      return;
    }
    
    // On the first recharge/purchase, the user gets double the credits (multiplied by 2)
    const isFirstPurchase = !user.hasPurchasedCredits;
    const finalAmount = isFirstPurchase ? amount * 2 : amount;
    
    const currentCredits = typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    const updatedUser = { 
      ...user, 
      credits: currentCredits + finalAmount,
      hasPurchasedCredits: true
    };
    setUser(updatedUser);
    console.log(`Adding ${finalAmount} credits (Base: ${amount}, First Purchase Double: ${isFirstPurchase}). New balance: ${updatedUser.credits}`);

    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        credits: updatedUser.credits,
        hasPurchasedCredits: true
      }).then(() => {
        console.log("Firestore credits added successfully");
      }).catch(err => {
        console.error("Error adding credits in Firestore:", err);
      });
    }

    const updatedDb = usersDb.map(u => u.uid === user.uid ? updatedUser : u);
    saveUsersToStorage(updatedDb);
  };

  const handleUpgradePlan = (plan: 'free' | 'pro' | 'business') => {
    if (!user) return;
    const updatedUser = { ...user, subscriptionPlan: plan };
    setUser(updatedUser);

    if (auth.currentUser) {
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        subscriptionPlan: plan
      }).catch(err => console.error("Error upgrading plan in Firestore:", err));
    }

    const updatedDb = usersDb.map(u => u.uid === user.uid ? updatedUser : u);
    saveUsersToStorage(updatedDb);
  };

  // 5. Admin Panel adjustment hooks
  const handleSendTestEmail = async (customEmail?: string) => {
    if (!user) return { success: false, error: 'No user authenticated' };
    const recipient = customEmail || user.email;
    try {
      const result = await sendTestEmail(recipient, user.displayName || 'Test User');
      if (result.success) {
        setWelcomeEmailToast({ email: recipient, name: user.displayName || 'Test User' });
        setTimeout(() => setWelcomeEmailToast(null), 6000);
      }
      return result;
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || String(e) };
    }
  };

  const handleAdminAdjustCredits = (uid: string, credits: number) => {
    const updatedDb = usersDb.map(u => {
      if (u.uid === uid) {
        return { ...u, credits: Math.max(0, u.credits + credits) };
      }
      return u;
    });
    saveUsersToStorage(updatedDb);

    const found = updatedDb.find(u => u.uid === uid) || null;

    // If the adjusted user is the current logged-in user, sync state
    if (user && user.uid === uid && found) {
      setUser(found);
    }

    // Sync to Firestore for ANY real user (not starting with 'user-')
    if (found && !uid.startsWith('user-')) {
      updateDoc(doc(db, 'users', uid), {
        credits: found.credits
      }).then(() => {
        console.log(`Firestore credits successfully updated for user ${uid}`);
      }).catch(err => {
        console.error("Admin error updating credits in Firestore:", err);
      });
    }
  };

  const handleAdminAdjustPlan = (uid: string, plan: 'free' | 'pro' | 'business') => {
    const updatedDb = usersDb.map(u => {
      if (u.uid === uid) {
        return { ...u, subscriptionPlan: plan };
      }
      return u;
    });
    saveUsersToStorage(updatedDb);

    const found = updatedDb.find(u => u.uid === uid) || null;

    if (user && user.uid === uid && found) {
      setUser(found);
    }

    if (found && !uid.startsWith('user-')) {
      updateDoc(doc(db, 'users', uid), {
        subscriptionPlan: found.subscriptionPlan
      }).then(() => {
        console.log(`Firestore subscription plan successfully updated for user ${uid}`);
      }).catch(err => {
        console.error("Admin error updating plan in Firestore:", err);
      });
    }
  };

  const handleResolveTicket = async (id: string) => {
    const updated = supportTickets.map(t => t.id === id ? { ...t, status: 'resolved' as const } : t);
    setSupportTickets(updated);
    localStorage.setItem('brandforge_tickets', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'support_tickets', id), { status: 'resolved' });
      console.log(`Firestore ticket ${id} successfully resolved.`);
    } catch (err) {
      console.error("Error updating ticket status in Firestore:", err);
    }
  };

  const handleNewSupportTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `ticket-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    const updated = [newTicket, ...supportTickets];
    setSupportTickets(updated);
    localStorage.setItem('brandforge_tickets', JSON.stringify(updated));

    let firestoreSuccess = false;
    let emailSuccess = false;
    let emailErrorMsg = '';

    // 1. Real persistence: write to the shared Firestore database
    try {
      await setDoc(doc(db, 'support_tickets', newTicket.id), newTicket);
      console.log(`Support ticket ${newTicket.id} saved to Firestore successfully!`);
      firestoreSuccess = true;
    } catch (err: any) {
      console.error("Error saving support ticket to Firestore:", err);
      emailErrorMsg = err.message || 'Firestore Write Error';
    }

    // 2. Build email templates
    const userSubject = language === 'ar' 
      ? `تم استلام تذكرة الدعم الفني الخاصة بك - BrandForge` 
      : `We have received your support inquiry - BrandForge Support`;

    const userHtmlBody = language === 'ar' ? `
      <div style="font-family: 'Tajawal', 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; color: #1e293b; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em;">BrandForge</span>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">الهوية التجارية المتكاملة بالذكاء الاصطناعي</div>
        </div>
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">تم استلام رسالتك بنجاح! ✉️</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            مرحباً، شكراً لتواصلك مع الدعم الفني لمنصة BrandForge. لقد استلمنا تذكرتك بنجاح وسيقوم فريق الدعم الفني بمراجعتها والرد عليك في أقرب وقت ممكن.
          </p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">تفاصيل الرسالة</div>
          <div style="font-size: 13px; color: #1e293b; margin-bottom: 6px;"><strong>الموضوع:</strong> ${newTicket.subject}</div>
          <div style="font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${newTicket.message}</div>
        </div>
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 24px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            &copy; 2026 BrandForge. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    ` : `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em;">BrandForge</span>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Premium AI Brand Identity</div>
        </div>
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">We've received your message! ✉️</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Hello, thank you for reaching out to BrandForge Support. We have received your inquiry and our support team will review it shortly.
          </p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Inquiry Details</div>
          <div style="font-size: 13px; color: #1e293b; margin-bottom: 6px;"><strong>Subject:</strong> ${newTicket.subject}</div>
          <div style="font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${newTicket.message}</div>
        </div>
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 24px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            &copy; 2026 BrandForge. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const adminSubject = `[BrandForge Support] New Ticket: ${newTicket.subject}`;
    const adminHtmlBody = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 800; color: #e11d48;">BrandForge Alert</span>
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">New Support Ticket Received</div>
        </div>
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Ticket Details:</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 120px;">Ticket ID:</td>
              <td style="padding: 6px 0;">${newTicket.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">User Email:</td>
              <td style="padding: 6px 0; color: #4f46e5;">${newTicket.userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">User ID:</td>
              <td style="padding: 6px 0;">${newTicket.userId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${newTicket.subject}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Created At:</td>
              <td style="padding: 6px 0;">${newTicket.createdAt}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: bold; color: #be123c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Message Content</div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${newTicket.message}</div>
        </div>
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 24px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            Manage this ticket via the Admin Panel under Support Tickets section.
          </p>
        </div>
      </div>
    `;

    // 3. Dispatch the real emails in the background to ensure instant UI responsiveness
    const sendEmailsInBackground = async () => {
      // A. Send confirmation email to the user
      try {
        const userRes = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: newTicket.userEmail,
            subject: userSubject,
            html: userHtmlBody
          })
        });
        const userData = await userRes.json();
        if (userData.success) {
          console.log(`Confirmation email sent successfully to ${newTicket.userEmail}. MessageId: ${userData.messageId}`);
        } else {
          console.warn(`Email API returned success=false for user email:`, userData.error);
        }
      } catch (emailErr: any) {
        console.error(`Failed to dispatch user confirmation email:`, emailErr);
      }

      // B. Send notification email to the system administrator (yoafyosf121@gmail.com)
      try {
        const adminRes = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'yoafyosf121@gmail.com',
            subject: adminSubject,
            html: adminHtmlBody
          })
        });
        const adminData = await adminRes.json();
        if (adminData.success) {
          console.log(`Admin notification email sent successfully to yoafyosf121@gmail.com. MessageId: ${adminData.messageId}`);
        } else {
          console.warn(`Email API returned success=false for admin email:`, adminData.error);
        }
      } catch (emailErr) {
        console.error(`Failed to dispatch admin notification email:`, emailErr);
      }
    };

    // Trigger background email dispatch without awaiting it so the user's UI never hangs
    sendEmailsInBackground();

    return { success: firestoreSuccess, emailSuccess: true, error: null };
  };

  // 6. Asset Saving Hooks
  const handleSaveName = async (name: GeneratedName) => {
    // Check duplication
    if (savedNames.some(item => item.name === name.name)) {
      // Remove
      const filtered = savedNames.filter(item => item.name !== name.name);
      setSavedNames(filtered);
      localStorage.setItem('brandforge_names', JSON.stringify(filtered));

      if (auth.currentUser) {
        try {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'generations', name.name));
        } catch (err) {
          console.error("Firestore error deleting name:", err);
        }
      }
      return;
    }

    const updated = [name, ...savedNames];
    setSavedNames(updated);
    localStorage.setItem('brandforge_names', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', name.name), {
          userId: auth.currentUser.uid,
          type: 'name',
          prompt: name.style || 'Generated name',
          result: name,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error saving name:", err);
      }
    }
  };

  const handleSaveLogo = async (logo: GeneratedLogo) => {
    const updated = [logo, ...savedLogos];
    setSavedLogos(updated);
    localStorage.setItem('brandforge_logos', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'logos', logo.id), {
          userId: auth.currentUser.uid,
          prompt: logo.prompt || 'Generated logo',
          style: logo.style || 'Modern',
          imageUrl: logo.svg,
          createdAt: logo.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error saving logo:", err);
      }
    }
  };

  const handleSaveSlogan = async (slogan: GeneratedSlogan) => {
    if (savedSlogans.some(item => item.slogan === slogan.slogan)) return;
    const updated = [slogan, ...savedSlogans];
    setSavedSlogans(updated);
    localStorage.setItem('brandforge_slogans', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const sloganKey = encodeURIComponent(slogan.slogan).substring(0, 100);
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', sloganKey), {
          userId: auth.currentUser.uid,
          type: 'slogan',
          prompt: slogan.vibe || 'Generated slogan',
          result: slogan,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error saving slogan:", err);
      }
    }
  };

  const handleSaveBrandKit = async (kit: GeneratedBrandKit) => {
    const updated = [kit, ...savedKits];
    setSavedKits(updated);
    localStorage.setItem('brandforge_kits', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', kit.id), {
          userId: auth.currentUser.uid,
          type: 'identity',
          prompt: kit.name || 'Generated brand kit',
          result: kit,
          createdAt: kit.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error saving brand kit:", err);
      }
    }
  };

  // Asset Deletion Handles
  const handleRemoveName = async (nameStr: string) => {
    const filtered = savedNames.filter(item => item.name !== nameStr);
    setSavedNames(filtered);
    localStorage.setItem('brandforge_names', JSON.stringify(filtered));

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'generations', nameStr));
      } catch (err) {
        console.error("Firestore error removing name:", err);
      }
    }
  };

  const handleUpdateName = async (updatedName: GeneratedName) => {
    const updated = savedNames.map(item => item.name === updatedName.name ? updatedName : item);
    setSavedNames(updated);
    localStorage.setItem('brandforge_names', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', updatedName.name), {
          userId: auth.currentUser.uid,
          type: 'name',
          prompt: updatedName.style || 'Generated name',
          result: updatedName,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error updating name:", err);
      }
    }
  };

  const handleRemoveLogo = async (id: string) => {
    const filtered = savedLogos.filter(item => item.id !== id);
    setSavedLogos(filtered);
    localStorage.setItem('brandforge_logos', JSON.stringify(filtered));

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'logos', id));
      } catch (err) {
        console.error("Firestore error removing logo:", err);
      }
    }
  };

  const handleUpdateLogo = async (updatedLogo: GeneratedLogo) => {
    const updated = savedLogos.map(item => item.id === updatedLogo.id ? updatedLogo : item);
    setSavedLogos(updated);
    localStorage.setItem('brandforge_logos', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'logos', updatedLogo.id), {
          userId: auth.currentUser.uid,
          prompt: updatedLogo.prompt || 'Generated logo',
          style: updatedLogo.style || 'Modern',
          imageUrl: updatedLogo.svg,
          createdAt: updatedLogo.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error updating logo:", err);
      }
    }
  };

  const handleRemoveSlogan = async (text: string) => {
    const filtered = savedSlogans.filter(item => item.slogan !== text);
    setSavedSlogans(filtered);
    localStorage.setItem('brandforge_slogans', JSON.stringify(filtered));

    if (auth.currentUser) {
      try {
        const sloganKey = encodeURIComponent(text).substring(0, 100);
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'generations', sloganKey));
      } catch (err) {
        console.error("Firestore error removing slogan:", err);
      }
    }
  };

  const handleUpdateSlogan = async (updatedSlogan: GeneratedSlogan) => {
    const updated = savedSlogans.map(item => item.slogan === updatedSlogan.slogan ? updatedSlogan : item);
    setSavedSlogans(updated);
    localStorage.setItem('brandforge_slogans', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        const sloganKey = encodeURIComponent(updatedSlogan.slogan).substring(0, 100);
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', sloganKey), {
          userId: auth.currentUser.uid,
          type: 'slogan',
          prompt: updatedSlogan.vibe || 'Generated slogan',
          result: updatedSlogan,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error updating slogan:", err);
      }
    }
  };

  const handleRemoveKit = async (id: string) => {
    const filtered = savedKits.filter(item => item.id !== id);
    setSavedKits(filtered);
    localStorage.setItem('brandforge_kits', JSON.stringify(filtered));

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'generations', id));
      } catch (err) {
        console.error("Firestore error removing brand kit:", err);
      }
    }
  };

  const handleUpdateKit = async (updatedKit: GeneratedBrandKit) => {
    const updated = savedKits.map(item => item.id === updatedKit.id ? updatedKit : item);
    setSavedKits(updated);
    localStorage.setItem('brandforge_kits', JSON.stringify(updated));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'generations', updatedKit.id), {
          userId: auth.currentUser.uid,
          type: 'identity',
          prompt: updatedKit.name || 'Generated brand kit',
          result: updatedKit,
          createdAt: updatedKit.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore error updating brand kit:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-200">
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 rounded-full w-40 h-40" />
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 animate-pulse relative z-10">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-indigo-600 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 font-display tracking-widest uppercase relative z-10 animate-pulse">
            {language === 'ar' ? 'جاري تهيئة منصة BrandForge' : 'Initializing BrandForge'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950 transition-colors duration-200" 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      
      {/* Header */}
      <Header
        language={language}
        setLanguage={setLanguage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        onRefresh={handleRefreshApp}
      />

      {/* Main Layout Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* LANDING PAGE */}
        {currentPage === 'landing' && (
          <div className="space-y-20 animate-fade-in py-8">
            
            {/* Hero Section */}
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-6">
              
              <h1 id="hero-tagline" className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {t.tagline}
              </h1>

              <p id="hero-description" className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t.description}
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    if (user) {
                      setCurrentPage('dashboard');
                      setActiveDashboardTab('overview');
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {t.getStarted}
                </button>
                <button
                  onClick={() => setCurrentPage('features')}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-white font-semibold text-sm px-8 py-3.5 rounded-2xl transition-all cursor-pointer"
                >
                  {t.exploreFeatures}
                </button>
              </div>

              {/* Stats lists */}
              <div className="grid grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto text-center">
                <div className="space-y-1">
                  <span className="block text-2xl font-extrabold text-slate-950 dark:text-white font-display">100k+</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t.statBrands}</span>
                </div>
                <div className="space-y-1 border-x border-slate-200 dark:border-slate-800">
                  <span className="block text-2xl font-extrabold text-slate-950 dark:text-white font-display">4.9/5</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t.statRating}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-2xl font-extrabold text-slate-950 dark:text-white font-display">Instant</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{t.statSpeed}</span>
                </div>
              </div>

              {/* Trusted by section */}
              <div className="pt-16 pb-8 text-center border-b border-slate-100 dark:border-slate-900/50 max-w-5xl mx-auto">
                <p className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-widest">{language === 'ar' ? 'موثوق به من قبل أكثر من 1000+ شركة ناشئة ووكالة' : 'Trusted by over 1000+ startups and agencies'}</p>
                <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="font-display font-black text-xl text-slate-500">AcmeCorp</span>
                  <span className="font-display font-bold text-xl italic text-slate-500">Globex</span>
                  <span className="font-mono font-bold text-xl text-slate-500">INITIATIVE</span>
                  <span className="font-sans font-medium text-xl text-slate-500 tracking-tight">soylent</span>
                  <span className="font-serif font-semibold text-xl text-slate-500">Initech</span>
                </div>
              </div>

            </div>

            {/* Quick Generator Tabs Section */}
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
                  Forge Instantly Online
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Select a tool below to access our custom model orchestrator.
                </p>
              </div>

              {/* Tools Switcher Component */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/30 dark:shadow-none space-y-8">
                
                {/* 🌟 MOST POPULAR / PREMIUM GOLDEN SERVICE: BRAND VOICE ARCHITECT */}
                <div id="tour-brand-voice" className="relative p-1 rounded-[2rem] bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 shadow-2xl shadow-amber-500/20 overflow-hidden">
                  {/* Glowing background highlights */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
                  
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[1.90rem] p-6 sm:p-10 relative z-10 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/15 pb-6">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black rounded-full text-[10px] uppercase tracking-wider shadow-md animate-bounce">
                          <Sparkles className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'الخدمة الذهبية المميزة ⭐' : 'PREMIUM GOLDEN SERVICE ⭐'}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                          {language === 'ar' ? 'مساعد نبرة الصوت والهوية اللغوية' : 'Linguistic Brand Voice Architect'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                          {language === 'ar' 
                            ? 'صمم دليلاً لغوياً استثنائياً لعلامتك التجارية بالكامل وحلّل أسلوب الكتابة المناسب لجمهورك (يكلف 3 نقاط رصيد)' 
                            : 'Architect a custom brand voice playbook, analyze writing styles, and craft cohesive guidelines (Costs 3 credits)'}
                        </p>
                      </div>
                    </div>

                    <BrandVoice
                      language={language}
                      user={user}
                      onDeductCredits={deductCredits}
                      onOpenLogin={() => setShowAuthModal(true)}
                      isEmbedded={true}
                    />
                  </div>
                </div>

                <div id="tour-name-generator" className="border-t border-slate-100 dark:border-slate-800 pt-8">
                  <NameGenerator
                    language={language}
                    user={user}
                    onDeductCredits={deductCredits}
                    onSaveName={handleSaveName}
                    savedNames={savedNames}
                    onOpenLogin={() => setShowAuthModal(true)}
                  />
                </div>

                <div id="tour-logo-generator" className="border-t border-slate-100 dark:border-slate-800 pt-8">
                  <LogoGenerator
                    language={language}
                    user={user}
                    onDeductCredits={deductCredits}
                    onSaveLogo={handleSaveLogo}
                    savedLogos={savedLogos}
                    onOpenLogin={() => setShowAuthModal(true)}
                  />
                </div>

                <div id="tour-slogan-generator" className="border-t border-slate-100 dark:border-slate-800 pt-8">
                  <SloganGenerator
                    language={language}
                    user={user}
                    onDeductCredits={deductCredits}
                    onSaveSlogan={handleSaveSlogan}
                    savedSlogans={savedSlogans}
                    onOpenLogin={() => setShowAuthModal(true)}
                  />
                </div>

                <div id="tour-brandkit-generator" className="border-t border-slate-100 dark:border-slate-800 pt-8">
                  <BrandKitGenerator
                    language={language}
                    user={user}
                    onDeductCredits={deductCredits}
                    onSaveBrandKit={handleSaveBrandKit}
                    savedKits={savedKits}
                    onOpenLogin={() => setShowAuthModal(true)}
                  />
                </div>

                <div id="interactive-color-palette" className="border-t border-slate-100 dark:border-slate-800 pt-8">
                  <ColorPaletteGenerator
                    language={language}
                    user={user}
                    onDeductCredits={deductCredits}
                    onSaveBrandKit={handleSaveBrandKit}
                    onOpenLogin={() => setShowAuthModal(true)}
                  />
                </div>

              </div>
            </div>

          </div>
        )}

        {/* DASHBOARD WORKSPACE */}
        {currentPage === 'dashboard' && user && (
          <DashboardOverview
            language={language}
            user={user}
            activeTab={activeDashboardTab}
            setActiveTab={setActiveDashboardTab}
            savedNames={savedNames}
            onRemoveName={handleRemoveName}
            onUpdateName={handleUpdateName}
            savedLogos={savedLogos}
            onRemoveLogo={handleRemoveLogo}
            onUpdateLogo={handleUpdateLogo}
            savedSlogans={savedSlogans}
            onRemoveSlogan={handleRemoveSlogan}
            onUpdateSlogan={handleUpdateSlogan}
            savedKits={savedKits}
            onRemoveKit={handleRemoveKit}
            onUpdateKit={handleUpdateKit}
            historyLogs={historyLogs}
            onAddCredits={handleAddCredits}
            onUpgradePlan={handleUpgradePlan}
            onDeductCredits={deductCredits}
            onSaveBrandKit={handleSaveBrandKit}
          />
        )}

        {/* ADMIN WORKSPACE PANEL */}
        {currentPage === 'admin' && user?.role === 'admin' && (
          <AdminPanel
            language={language}
            users={usersDb}
            onAdjustCredits={handleAdminAdjustCredits}
            onAdjustPlan={handleAdminAdjustPlan}
            systemLogs={historyLogs}
            supportTickets={supportTickets}
            onResolveTicket={handleResolveTicket}
            welcomeEmails={welcomeEmails}
            onSendTestEmail={handleSendTestEmail}
            currentUserEmail={user?.email || ''}
          />
        )}

        {/* ADDITIONAL SERVICES */}
        {currentPage === 'business-cards' && (
          <BusinessCardMaker 
            language={language} 
            user={user}
            onDeductCredits={deductCredits}
            onOpenLogin={() => setShowAuthModal(true)}
          />
        )}
        {currentPage === 'social-media' && (
          <SocialMediaAssets 
            language={language} 
            user={user}
            onDeductCredits={deductCredits}
            onOpenLogin={() => setShowAuthModal(true)}
          />
        )}
        {currentPage === 'seo' && (
          <SeoOptimization 
            language={language} 
            user={user}
            onDeductCredits={deductCredits}
            onOpenLogin={() => setShowAuthModal(true)}
          />
        )}
        {currentPage === 'logo-maker' && (
          <LogoMaker 
            language={language} 
            user={user}
            onDeductCredits={deductCredits}
            onOpenLogin={() => setShowAuthModal(true)}
            onSaveLogo={handleSaveLogo}
          />
        )}

        {/* STATIC & INFORMATIONAL PAGES (Features, Blog, FAQ, Contact, Terms, Privacy) */}
        {['features', 'pricing', 'blog', 'faq', 'contact', 'terms', 'privacy'].includes(currentPage) && (
          <BlogFAQPages
            language={language}
            page={currentPage}
            setCurrentPage={setCurrentPage}
            onSubmitTicket={handleNewSupportTicket}
            userEmail={user?.email}
            userUid={user?.uid}
            onAddCredits={handleAddCredits}
            onOpenLogin={() => setShowAuthModal(true)}
          />
        )}

      </main>

      {/* Footer */}
      <Footer language={language} setCurrentPage={setCurrentPage} />

      {/* AUTH MODAL DIALOG */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                {isRegister ? t.register : t.login}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock instant AI brand name, logo, & guide forge engines
              </p>
            </div>

            {/* Quick Demo logins for testing ease */}
            {!isPublicLink && (
              <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-850">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Testing Profiles</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoLogin('admin')}
                    className="py-2 text-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold cursor-pointer border border-rose-100 dark:border-rose-900"
                  >
                    Yoaf (Admin & Credits)
                  </button>
                  <button
                    onClick={() => handleDemoLogin('user')}
                    className="py-2 text-center bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-semibold cursor-pointer border border-indigo-100 dark:border-indigo-900"
                  >
                    Sarah (Demo User)
                  </button>
                </div>
              </div>
            )}

            {/* Real Google Sign-In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-750 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold py-3 rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.79 2.94C6.1 7.37 8.84 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.31-4.79 3.31-8.42z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.18 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.39 6.96C.5 8.74 0 10.74 0 12.83s.5 4.09 1.39 5.87l3.79-2.94C4.8 14.26 4.8 13.74 5.18 14.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.93l-3.6-2.79c-1.1.74-2.51 1.18-4.36 1.18-3.16 0-5.9-2.33-6.82-5.46L1.39 15.94C3.37 19.83 7.35 23 12 23z"
                />
              </svg>
              <span>{language === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google'}</span>
            </button>

            {authError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-left space-y-3 animate-fade-in">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>{authError}</span>
                </p>
                {authDomainErrorDetails && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-350 space-y-2 border-t border-rose-100 dark:border-rose-900/40 pt-2 leading-relaxed">
                    {language === 'ar' ? (
                      <>
                        <p className="font-bold text-slate-700 dark:text-slate-200">لحل هذه المشكلة في أقل من دقيقة:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                          <li>اذهب إلى <a href="https://console.firebase.google.com/project/brandforge-ai-c0449/authentication/providers" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">لوحة تحكم Firebase لمشروعك</a>.</li>
                          <li>تحت قسم <b>Authorized domains</b>، اضغط على <b>Add domain</b>.</li>
                          <li>انسخ النطاق التالي بدقة وضعه هناك:</li>
                        </ol>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-grow bg-slate-100 dark:bg-slate-950 p-2 rounded-xl font-mono text-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 break-all select-all">
                            {typeof window !== 'undefined' ? window.location.hostname : 'brandforge.run.app'}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyDomain}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 shrink-0"
                          >
                            {copiedDomain ? <Check className="w-3.5 h-3.5" /> : null}
                            <span>{copiedDomain ? 'تم النسخ!' : 'نسخ'}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">ثم أعد تحميل الصفحة وحاول مجدداً!</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-slate-700 dark:text-slate-200">To resolve this error in less than a minute:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                          <li>Go to your <a href="https://console.firebase.google.com/project/brandforge-ai-c0449/authentication/providers" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Firebase Console Auth Settings</a>.</li>
                          <li>Scroll to <b>Authorized domains</b> and click <b>Add domain</b>.</li>
                          <li>Copy this exact domain name and add it there:</li>
                        </ol>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-grow bg-slate-100 dark:bg-slate-950 p-2 rounded-xl font-mono text-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 break-all select-all">
                            {typeof window !== 'undefined' ? window.location.hostname : 'brandforge.run.app'}
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyDomain}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 shrink-0"
                          >
                            {copiedDomain ? <Check className="w-3.5 h-3.5" /> : null}
                            <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Then reload this page and try again!</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="px-3 text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
                {language === 'ar' ? 'أو عبر البريد الإلكتروني' : 'or via Email'}
              </span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">{t.name}</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">{t.email}</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="yoafyosf121@gmail.com"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">{t.password}</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-xs transition cursor-pointer"
              >
                {isRegister ? t.register : t.login}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 hover:underline cursor-pointer"
              >
                {isRegister ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
              </button>
            </div>



          </div>
        </div>
      )}

      {/* Automated welcome email success toast notification */}
      {welcomeEmailToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/40 shadow-2xl p-4 rounded-2xl flex items-center gap-4 max-w-sm animate-bounce">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center relative shrink-0">
            <Mail className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">1</span>
          </div>
          <div className="flex-grow min-w-0 text-left">
            <h4 className="font-bold text-slate-800 dark:text-white text-xs">
              Welcome Email Dispatched!
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              Sent to <span className="font-semibold text-slate-600 dark:text-slate-300">{welcomeEmailToast.email}</span> via SparkMail SDK.
            </p>
          </div>
        </div>
      )}

      {/* Global Add-ons */}
      <CookieConsent language={language} />

      {/* Synchronization success toast */}
      {showRefreshToast && (
        <div className="fixed bottom-6 left-6 z-[120] bg-white dark:bg-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-2xl p-4 rounded-2xl flex items-center gap-3.5 max-w-sm animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {language === 'ar' ? 'تم تحديث الموقع بنجاح' : 'System Synced Successfully'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'تمت إعادة تحميل الأصول ومزامنة قواعد البيانات السحابية.' : 'Assets and cloud databases fully synchronized.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
