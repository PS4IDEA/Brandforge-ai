import SocialBrandingTab from "./SocialBrandingTab";
import ColorPaletteGenerator from "./ColorPaletteGenerator";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { translations } from '../translations';
import { Language, UserProfile, GeneratedName, GeneratedLogo, GeneratedSlogan, GeneratedBrandKit, UsageLog, DashboardTab } from '../types';
import { 
  User, Coins, Sparkles, Award, Bookmark, ShieldCheck, 
  Trash2, Copy, Check, Download, History, ShoppingBag, 
  Palette, Type, RefreshCw, Search, X, Tag, Plus, Heart,
  Scale, ArrowLeftRight, MessageSquare, LayoutGrid,
  Key, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { exportToJSON, exportToPDF } from '../lib/exportUtils';
import CheckoutModal from './CheckoutModal';
import { fetchAPI, getClientGeminiKey, setClientGeminiKey, isClientGeminiModeActive } from '../lib/api';

function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

interface AssetTagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function AssetTagsEditor({ tags, onChange }: AssetTagsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tag = newTag.trim();
    if (!tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setNewTag('');
    setIsEditing(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <Tag className="w-3 h-3" />
          {tag}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="hover:text-indigo-900 dark:hover:text-indigo-100 p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      
      {isEditing ? (
        <form onSubmit={handleAddTag} className="flex items-center gap-1 relative">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            autoFocus
            onBlur={() => {
              if (!newTag.trim()) setIsEditing(false);
            }}
            className="text-[10px] py-0.5 px-2 w-20 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </form>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-dashed border-slate-300 dark:border-slate-700"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      )}
    </div>
  );
}

interface DashboardOverviewProps {
  language: Language;
  user: UserProfile;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  savedNames: GeneratedName[];
  onRemoveName: (name: string) => void;
  onUpdateName: (name: GeneratedName) => void;
  savedLogos: GeneratedLogo[];
  onRemoveLogo: (id: string) => void;
  onUpdateLogo: (logo: GeneratedLogo) => void;
  savedSlogans: GeneratedSlogan[];
  onRemoveSlogan: (text: string) => void;
  onUpdateSlogan: (slogan: GeneratedSlogan) => void;
  savedKits: GeneratedBrandKit[];
  onRemoveKit: (id: string) => void;
  onUpdateKit: (kit: GeneratedBrandKit) => void;
  historyLogs: UsageLog[];
  onAddCredits: (amount: number) => void;
  onUpgradePlan: (plan: 'free' | 'pro' | 'business') => void;
  onDeductCredits: (amount: number) => boolean;
  onSaveBrandKit: (kit: GeneratedBrandKit) => void;
}

export default function DashboardOverview({
  language,
  user,
  activeTab,
  setActiveTab,
  savedNames,
  onRemoveName,
  onUpdateName,
  savedLogos,
  onRemoveLogo,
  onUpdateLogo,
  savedSlogans,
  onRemoveSlogan,
  onUpdateSlogan,
  savedKits,
  onRemoveKit,
  onUpdateKit,
  historyLogs,
  onAddCredits,
  onUpgradePlan,
  onDeductCredits,
  onSaveBrandKit,
}: DashboardOverviewProps) {
  const t = translations[language];

  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // PayPal config state
  const [paypalKeyInput, setPaypalKeyInput] = useState(() => {
    return localStorage.getItem('brandforge_paypal_client_id') || '';
  });
  const [paypalSaveStatus, setPaypalSaveStatus] = useState<'idle' | 'saved' | 'cleared'>('idle');

  // Saved Payment Methods state & handlers
  const [savedCards, setSavedCards] = useState<any[]>(() => {
    const local = localStorage.getItem('brandforge_saved_cards');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [
      {
        id: 'card-1',
        cardholderName: user?.displayName || 'Alex Morgan',
        cardNumber: '•••• •••• •••• 4242',
        expiry: '12/28',
        brand: 'visa',
        isDefault: true
      },
      {
        id: 'card-2',
        cardholderName: user?.displayName || 'Alex Morgan',
        cardNumber: '•••• •••• •••• 8899',
        expiry: '09/27',
        brand: 'mastercard',
        isDefault: false
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('brandforge_saved_cards', JSON.stringify(savedCards));
  }, [savedCards]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [addCardError, setAddCardError] = useState('');
  const [addCardSuccess, setAddCardSuccess] = useState('');

  const handleSetDefaultCard = (cardId: string) => {
    setSavedCards(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
  };

  const handleDeleteCard = (cardId: string) => {
    setSavedCards(prev => {
      const filtered = prev.filter(card => card.id !== cardId);
      if (filtered.length > 0 && !filtered.some(c => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setNewCardNumber(formatted);
    setAddCardError('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setNewCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setNewCardExpiry(value);
    }
    setAddCardError('');
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setNewCardCvv(value);
    setAddCardError('');
  };

  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      setAddCardError(language === 'ar' ? 'رقم البطاقة غير مكتمل (يجب أن يتكون من 16 رقماً).' : 'Incomplete card number (must be 16 digits).');
      return;
    }
    if (!newCardName.trim()) {
      setAddCardError(language === 'ar' ? 'يرجى إدخال اسم حامل البطاقة.' : 'Please enter the cardholder name.');
      return;
    }
    if (newCardExpiry.length < 5) {
      setAddCardError(language === 'ar' ? 'تنسيق تاريخ الانتهاء غير صالح (MM/YY).' : 'Invalid expiry format (MM/YY).');
      return;
    }
    if (newCardCvv.length < 3) {
      setAddCardError(language === 'ar' ? 'رمز الأمان (CVV) غير صالح.' : 'Invalid CVV code.');
      return;
    }

    let brand = 'unknown';
    if (cleanNum.startsWith('4')) brand = 'visa';
    else if (/^5[1-5]/.test(cleanNum)) brand = 'mastercard';
    else if (/^3[47]/.test(cleanNum)) brand = 'amex';

    const lastFour = cleanNum.slice(-4);
    const newCard = {
      id: `card-${Date.now()}`,
      cardholderName: newCardName,
      cardNumber: `•••• •••• •••• ${lastFour}`,
      expiry: newCardExpiry,
      brand,
      isDefault: savedCards.length === 0
    };

    setSavedCards(prev => [...prev, newCard]);
    setAddCardSuccess(language === 'ar' ? 'تمت إضافة بطاقة الدفع الجديدة بنجاح!' : 'New payment method added successfully!');
    setNewCardNumber('');
    setNewCardName('');
    setNewCardExpiry('');
    setNewCardCvv('');
    setAddCardError('');
    
    setTimeout(() => {
      setAddCardSuccess('');
      setIsAddingCard(false);
    }, 1500);
  };
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    itemName: string;
    price: number;
    onSuccess: () => void;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedNamesToCompare, setSelectedNamesToCompare] = useState<GeneratedName[]>([]);
  const [selectedSlogansToCompare, setSelectedSlogansToCompare] = useState<GeneratedSlogan[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparingAI, setIsComparingAI] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Multi-select & Bulk actions states
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [showBulkTagField, setShowBulkTagField] = useState(false);

  // Clear search and compare on tab switch
  useEffect(() => {
    setSearchQuery('');
    setSelectedTagFilter('All');
    setShowFavoritesOnly(false);
    setCompareMode(false);
    setSelectedNamesToCompare([]);
    setSelectedSlogansToCompare([]);
    setComparisonResult(null);
    setSelectedItemKeys([]);
    setBulkTagInput('');
    setShowBulkTagField(false);
  }, [activeTab]);

  const isFilterableTab = ['names', 'logos', 'slogans', 'brand-kits'].includes(activeTab);

  // Extract all unique tags for the current tab
  const getUniqueTags = () => {
    const tags = new Set<string>();
    if (activeTab === 'names') savedNames.forEach(i => i.tags?.forEach(t => tags.add(t)));
    if (activeTab === 'logos') savedLogos.forEach(i => i.tags?.forEach(t => tags.add(t)));
    if (activeTab === 'slogans') savedSlogans.forEach(i => i.tags?.forEach(t => tags.add(t)));
    if (activeTab === 'brand-kits') savedKits.forEach(i => i.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  };
  const availableTags = getUniqueTags();

  const getRecentAssets = () => {
    const assets: {
      type: 'name' | 'logo' | 'slogan' | 'brand-kit';
      title: string;
      subtitle: string;
      detail?: string;
      createdAtTime: number;
      targetTab: DashboardTab;
      original: any;
    }[] = [];

    savedNames.forEach((item, index) => {
      const time = (item as any).createdAt 
        ? new Date((item as any).createdAt).getTime() 
        : Date.now() - (index * 1000 * 60 * 5) - 2000;
      assets.push({
        type: 'name',
        title: item.name,
        subtitle: item.meaning,
        createdAtTime: time,
        targetTab: 'names',
        original: item
      });
    });

    savedSlogans.forEach((item, index) => {
      const time = (item as any).createdAt 
        ? new Date((item as any).createdAt).getTime() 
        : Date.now() - (index * 1000 * 60 * 5) - 3000;
      assets.push({
        type: 'slogan',
        title: item.slogan,
        subtitle: item.vibe || 'Slogan',
        createdAtTime: time,
        targetTab: 'slogans',
        original: item
      });
    });

    savedLogos.forEach((item, index) => {
      const time = item.createdAt ? new Date(item.createdAt).getTime() : Date.now() - (index * 1000 * 60 * 5) - 4000;
      assets.push({
        type: 'logo',
        title: item.style || 'AI Logo',
        subtitle: item.prompt,
        detail: item.svg,
        createdAtTime: time,
        targetTab: 'logos',
        original: item
      });
    });

    savedKits.forEach((item, index) => {
      const time = item.createdAt ? new Date(item.createdAt).getTime() : Date.now() - (index * 1000 * 60 * 5) - 1000;
      assets.push({
        type: 'brand-kit',
        title: item.name,
        subtitle: item.slogan || 'Brand Kit',
        detail: item.logoSvg,
        createdAtTime: time,
        targetTab: 'brand-kits',
        original: item
      });
    });

    return assets.sort((a, b) => b.createdAtTime - a.createdAtTime).slice(0, 5);
  };

  const filterByTag = (tags?: string[]) => {
    if (selectedTagFilter === 'All') return true;
    if (!tags || tags.length === 0) return selectedTagFilter === 'Untagged';
    return tags.includes(selectedTagFilter);
  };

  const filterByFavorite = (isFavorite?: boolean) => {
    if (!showFavoritesOnly) return true;
    return !!isFavorite;
  };

  const filteredNames = savedNames.filter(item => 
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.style.toLowerCase().includes(searchQuery.toLowerCase())) &&
    filterByTag(item.tags) &&
    filterByFavorite(item.isFavorite)
  );

  const filteredLogos = savedLogos.filter(item => 
    (item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.style.toLowerCase().includes(searchQuery.toLowerCase())) &&
    filterByTag(item.tags) &&
    filterByFavorite(item.isFavorite)
  );

  const filteredSlogans = savedSlogans.filter(item => 
    (item.slogan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.vibe.toLowerCase().includes(searchQuery.toLowerCase())) &&
    filterByTag(item.tags) &&
    filterByFavorite(item.isFavorite)
  );

  const filteredKits = savedKits.filter(kit => 
    (kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kit.typography.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kit.typography.body.toLowerCase().includes(searchQuery.toLowerCase())) &&
    filterByTag(kit.tags) &&
    filterByFavorite(kit.isFavorite)
  );

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const simulateBuyCredits = (amount: number, cost: number) => {
    setCheckoutModal({
      isOpen: true,
      itemName: language === 'ar' ? `شحن ${amount} رصيد ذكاء اصطناعي` : `${amount} AI Generation Credits`,
      price: cost,
      onSuccess: () => {
        onAddCredits(amount);
        setPurchaseSuccess(language === 'ar' ? `تم شراء ${amount} رصيد بنجاح!` : `Successfully purchased ${amount} credits!`);
        setTimeout(() => setPurchaseSuccess(null), 4000);
      }
    });
  };

  const simulateUpgradePlan = (plan: 'pro' | 'business', cost: number) => {
    setCheckoutModal({
      isOpen: true,
      itemName: language === 'ar' ? `اشتراك الباقة ${plan === 'pro' ? 'الاحترافية Pro' : 'المتقدمة Business'}` : `${plan.toUpperCase()} Plan Subscription`,
      price: cost,
      onSuccess: () => {
        onUpgradePlan(plan);
        onAddCredits(plan === 'business' ? 2000 : 500);
        setPurchaseSuccess(language === 'ar' ? `تم الترقية إلى الباقة ${plan === 'pro' ? 'الاحترافية' : 'المتقدمة'} بنجاح!` : `Upgraded to ${plan.toUpperCase()} Plan!`);
        setTimeout(() => setPurchaseSuccess(null), 4000);
      }
    });
  };

  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const handleAutoTag = async () => {
    let itemsToTag: any[] = [];
    let itemsType = '';

    if (activeTab === 'names') {
      itemsToTag = savedNames.map(item => ({ name: item.name, meaning: item.meaning }));
      itemsType = 'brand names';
    } else if (activeTab === 'logos') {
      itemsToTag = savedLogos.map(item => ({ prompt: item.prompt, style: item.style }));
      itemsType = 'logos';
    } else if (activeTab === 'slogans') {
      itemsToTag = savedSlogans.map(item => ({ slogan: item.slogan, vibe: item.vibe }));
      itemsType = 'slogans';
    } else if (activeTab === 'brand-kits') {
      itemsToTag = savedKits.map(item => ({ name: item.name, typography: item.typography }));
      itemsType = 'brand kits';
    }

    if (itemsToTag.length === 0) return;

    setIsAutoTagging(true);
    try {
      const data = await fetchAPI('/api/auto-tag', {
        method: 'POST',
        body: JSON.stringify({ items: itemsToTag, type: itemsType })
      });
      if (data.success && data.tags) {
        if (activeTab === 'names') {
          savedNames.forEach((item, idx) => {
            const newTags = Array.from(new Set([...(item.tags || []), ...(data.tags[idx] || [])]));
            onUpdateName({ ...item, tags: newTags });
          });
        } else if (activeTab === 'logos') {
          savedLogos.forEach((item, idx) => {
            const newTags = Array.from(new Set([...(item.tags || []), ...(data.tags[idx] || [])]));
            onUpdateLogo({ ...item, tags: newTags });
          });
        } else if (activeTab === 'slogans') {
          savedSlogans.forEach((item, idx) => {
            const newTags = Array.from(new Set([...(item.tags || []), ...(data.tags[idx] || [])]));
            onUpdateSlogan({ ...item, tags: newTags });
          });
        } else if (activeTab === 'brand-kits') {
          savedKits.forEach((item, idx) => {
            const newTags = Array.from(new Set([...(item.tags || []), ...(data.tags[idx] || [])]));
            onUpdateKit({ ...item, tags: newTags });
          });
        }
      }
    } catch (err) {
      console.error('Failed to auto-tag', err);
    }
    setIsAutoTagging(false);
  };

  const handleAICompare = async () => {
    const items = activeTab === 'names' ? selectedNamesToCompare : selectedSlogansToCompare;
    if (items.length < 2) return;
    
    setIsComparingAI(true);
    setComparisonResult(null);
    try {
      const payload = {
        items: activeTab === 'names' 
          ? items.map((n: any) => ({ name: n.name, meaning: n.meaning, style: n.style, tags: n.tags }))
          : items.map((s: any) => ({ slogan: s.slogan, vibe: s.vibe, tags: s.tags })),
        type: activeTab,
        language
      };
      
      const data = await fetchAPI('/api/compare-assets', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data.success && data.comparison) {
        setComparisonResult(data.comparison);
      }
    } catch (err) {
      console.error('Failed to compare assets with AI', err);
    }
    setIsComparingAI(false);
  };

  const downloadLogoSVG = (svgStr: string, id: string) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brandforge-saved-logo-${id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadName = (item: GeneratedName) => {
    const content = `Brand Name: ${item.name}\nStyle: ${item.style}\nMeaning: ${item.meaning}\nDomain Idea: ${item.domainSuggestions?.[0] || `${item.name.toLowerCase()}.com`}`;
    downloadTextFile(content, `brand-name-${item.name.toLowerCase().replace(/\s+/g, '-')}.txt`);
  };

  const downloadSlogan = (item: GeneratedSlogan) => {
    const content = `Slogan: ${item.slogan}\nVibe: ${item.vibe}`;
    downloadTextFile(content, `slogan-${item.slogan.substring(0, 15).toLowerCase().replace(/\s+/g, '-')}.txt`);
  };

  const downloadBrandKit = (kit: GeneratedBrandKit) => {
    const content = `Brand Identity: ${kit.name}\n\nColors:\nPrimary: ${kit.colors.primary}\nSecondary: ${kit.colors.secondary}\nAccent: ${kit.colors.accent}\nBackground: ${kit.colors.background}\nText: ${kit.colors.text}\n\nTypography:\nHeading: ${kit.typography.heading}\nBody: ${kit.typography.body}`;
    downloadTextFile(content, `brand-kit-${kit.name.toLowerCase().replace(/\s+/g, '-')}.txt`);
  };

  const handleToggleSelectItem = (key: string) => {
    setSelectedItemKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFiltered = () => {
    let keys: string[] = [];
    if (activeTab === 'names') keys = filteredNames.map(i => i.name);
    if (activeTab === 'logos') keys = filteredLogos.map(i => i.id);
    if (activeTab === 'slogans') keys = filteredSlogans.map(i => i.slogan);
    if (activeTab === 'brand-kits') keys = filteredKits.map(i => i.id);

    const allSelected = keys.length > 0 && keys.every(k => selectedItemKeys.includes(k));
    if (allSelected) {
      setSelectedItemKeys([]);
    } else {
      setSelectedItemKeys(keys);
    }
  };

  const handleBulkDelete = () => {
    const confirmDelete = window.confirm(
      language === 'ar' 
        ? `هل أنت متأكد من حذف ${selectedItemKeys.length} من العناصر المحددة؟` 
        : `Are you sure you want to delete the ${selectedItemKeys.length} selected items?`
    );
    if (!confirmDelete) return;

    if (activeTab === 'names') {
      selectedItemKeys.forEach(key => onRemoveName(key));
    } else if (activeTab === 'logos') {
      selectedItemKeys.forEach(key => onRemoveLogo(key));
    } else if (activeTab === 'slogans') {
      selectedItemKeys.forEach(key => onRemoveSlogan(key));
    } else if (activeTab === 'brand-kits') {
      selectedItemKeys.forEach(key => onRemoveKit(key));
    }
    setSelectedItemKeys([]);
  };

  const handleBulkTag = (tag: string) => {
    if (!tag.trim()) return;
    const trimmedTag = tag.trim();
    if (activeTab === 'names') {
      filteredNames.forEach(item => {
        if (selectedItemKeys.includes(item.name)) {
          const existing = item.tags || [];
          if (!existing.includes(trimmedTag)) {
            onUpdateName({ ...item, tags: [...existing, trimmedTag] });
          }
        }
      });
    } else if (activeTab === 'logos') {
      filteredLogos.forEach(item => {
        if (selectedItemKeys.includes(item.id)) {
          const existing = item.tags || [];
          if (!existing.includes(trimmedTag)) {
            onUpdateLogo({ ...item, tags: [...existing, trimmedTag] });
          }
        }
      });
    } else if (activeTab === 'slogans') {
      filteredSlogans.forEach(item => {
        if (selectedItemKeys.includes(item.slogan)) {
          const existing = item.tags || [];
          if (!existing.includes(trimmedTag)) {
            onUpdateSlogan({ ...item, tags: [...existing, trimmedTag] });
          }
        }
      });
    } else if (activeTab === 'brand-kits') {
      filteredKits.forEach(item => {
        if (selectedItemKeys.includes(item.id)) {
          const existing = item.tags || [];
          if (!existing.includes(trimmedTag)) {
            onUpdateKit({ ...item, tags: [...existing, trimmedTag] });
          }
        }
      });
    }
    setSelectedItemKeys([]);
    setBulkTagInput('');
    setShowBulkTagField(false);
  };

  const handleBulkDownload = () => {
    if (activeTab === 'names') {
      const selected = filteredNames.filter(i => selectedItemKeys.includes(i.name));
      const content = selected.map(item => {
        return `=== ${item.name} ===\nStyle: ${item.style}\nMeaning: ${item.meaning}\nDomain Idea: ${item.domainSuggestions?.[0] || `${item.name.toLowerCase()}.com`}\nTags: ${item.tags?.join(', ') || 'None'}\n`;
      }).join('\n\n');
      downloadTextFile(content, `brandforge-selected-names.txt`);
    } else if (activeTab === 'logos') {
      const selected = filteredLogos.filter(i => selectedItemKeys.includes(i.id));
      let itemsHtml = '';
      selected.forEach(item => {
        itemsHtml += `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between shadow-sm" style="background: white; border-radius: 1rem; border: 1px solid #e2e8f0; padding: 1rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
          <div class="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center p-4 mb-4" style="width: 100%; aspect-ratio: 1/1; background-color: #f1f5f9; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; padding: 1rem; margin-bottom: 1rem; max-height: 200px; overflow: hidden;">
            ${item.svg}
          </div>
          <div class="w-full text-center" style="width: 100%; text-align: center;">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1" style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #94a3b8; display: block; margin-bottom: 0.25rem;">${item.style}</span>
            <p class="text-xs text-slate-600 font-medium px-2" style="font-size: 12px; color: #475569; font-weight: 500; padding: 0 0.5rem; margin: 0;">${item.prompt}</p>
          </div>
        </div>`;
      });
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrandForge Saved Logos Archive</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 2rem; margin: 0; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 2rem; }
    h1 { color: #0f172a; margin-bottom: 0.5rem; }
    p { color: #64748b; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Saved Logos Archive</h1>
      <p>Your exported brand logos from BrandForge AI</p>
    </header>
    <div class="grid">
      ${itemsHtml}
    </div>
  </div>
</body>
</html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'brandforge-logos-gallery.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (activeTab === 'slogans') {
      const selected = filteredSlogans.filter(i => selectedItemKeys.includes(i.slogan));
      const content = selected.map(item => {
        return `Slogan: "${item.slogan}"\nVibe: ${item.vibe}\nTags: ${item.tags?.join(', ') || 'None'}\n`;
      }).join('\n\n');
      downloadTextFile(content, `brandforge-selected-slogans.txt`);
    } else if (activeTab === 'brand-kits') {
      const selected = filteredKits.filter(i => selectedItemKeys.includes(i.id));
      const content = selected.map(kit => {
        return `=== Brand Identity: ${kit.name} ===\nSlogan: ${kit.slogan}\n\nColors:\nPrimary: ${kit.colors.primary}\nSecondary: ${kit.colors.secondary}\nAccent: ${kit.colors.accent}\nBackground: ${kit.colors.background}\nText: ${kit.colors.text}\n\nTypography:\nHeading: ${kit.typography.heading}\nBody: ${kit.typography.body}\nRationale: ${kit.typography.rationale}\n\nSocial Kit Bio:\n${kit.socialKit.bio}\n`;
      }).join('\n' + '='.repeat(40) + '\n\n');
      downloadTextFile(content, `brandforge-selected-brandkits.txt`);
    }
  };

  // Subsections
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Workspace Dashboard</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">
            {t.welcomeBack} {user.displayName}!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md">
            Manage your saved branding assets, purchase additional credits, or review usage statistics.
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">{t.creditsLeft}</span>
            <div className="flex items-center gap-1.5 justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-bold font-mono">{user.credits}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Active Plan</span>
            <span className="text-sm font-bold uppercase tracking-wider text-indigo-300">
              {user.subscriptionPlan === 'free' ? t.freePlan : user.subscriptionPlan === 'pro' ? t.proPlan : t.businessPlan}
            </span>
          </div>
        </div>

        {/* Ambient backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {/* Navigation tabs for Dashboard subsections and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: 'overview', label: t.overview },
            { id: 'names', label: t.nameGen },
            { id: 'logos', label: t.logoGen },
            { id: 'slogans', label: t.sloganGen },
            { id: 'brand-kits', label: t.brandKit },
            { id: 'colors', label: language === 'ar' ? 'منشئ الألوان' : 'Color Palette' },
            { id: 'social-branding', label: language === 'ar' ? 'منصات التواصل' : 'Social Media' },
            { id: 'billing', label: t.billingTab },
            { id: 'history', label: t.history },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer border-b-2 -mb-[3px] ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isFilterableTab && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mb-1 animate-fade-in">
            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {selectedItemKeys.length > 0 ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All') : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
            </button>
            <button
              onClick={handleAutoTag}
              disabled={isAutoTagging}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isAutoTagging ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isAutoTagging ? t.tagging : t.autoTag}
            </button>
            {['names', 'slogans'].includes(activeTab) && (
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedNamesToCompare([]);
                  setSelectedSlogansToCompare([]);
                  setComparisonResult(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-sm cursor-pointer ${
                  compareMode 
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                     : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                title="Compare items side-by-side"
              >
                <Scale className="w-3.5 h-3.5" />
                {compareMode ? (language === 'ar' ? 'إلغاء المقارنة' : 'Compare: ON') : (language === 'ar' ? 'مقارنة' : 'Compare')}
              </button>
            )}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shadow-sm ${
                showFavoritesOnly 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800/50 dark:text-rose-400' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {t.favorites}
            </button>
            {availableTags.length > 0 && (
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="w-full sm:w-auto py-1.5 px-3 pr-8 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="All">{t.allTags}</option>
                <option value="Untagged">{t.untagged}</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search saved ${activeTab === 'brand-kits' ? 'brand kits' : activeTab === 'names' ? 'names' : activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Switch Contents */}

      {/* A. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Names</span>
              <span className="block text-3xl font-display font-bold text-slate-800 dark:text-white mt-1">{savedNames.length}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Logos</span>
              <span className="block text-3xl font-display font-bold text-slate-800 dark:text-white mt-1">{savedLogos.length}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Brand Guidelines</span>
              <span className="block text-3xl font-display font-bold text-slate-800 dark:text-white mt-1">{savedKits.length}</span>
            </div>
          </div>

          {/* Integrated Brand Export Hub */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'مركز تصدير الهوية المتكاملة' : 'Integrated Brand Export Hub'}
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-bold">
                  {language === 'ar' ? 'تنزيل أصول هوية مشروعك' : 'Download Your Curated Brand Package'}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {language === 'ar' 
                    ? 'قم بتنزيل تقرير تصميم احترافي بصيغة PDF يحتوي على جميع الأسماء المقترحة والشعارات اللفظية والبصرية التي حفظتها، أو احتفظ بنسخة احتياطية مهيكلة بصيغة JSON لسهولة النقل والتكامل.'
                    : 'Compile your saved brand names, core taglines, generated logos, and style guidelines into a single high-fidelity designer PDF report, or extract a fully-structured JSON archive for developer integration.'}
                </p>
              </div>

              {/* Asset counts grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">{language === 'ar' ? 'الأسماء المحفوظة' : 'Saved Names'}</span>
                  <span className="text-lg font-bold font-mono text-indigo-300">{savedNames.length}</span>
                </div>
                <div className="border-l border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">{language === 'ar' ? 'الشعارات اللفظية' : 'Saved Slogans'}</span>
                  <span className="text-lg font-bold font-mono text-indigo-300">{savedSlogans.length}</span>
                </div>
                <div className="border-l border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">{language === 'ar' ? 'الشعارات البصرية' : 'Saved Logos'}</span>
                  <span className="text-lg font-bold font-mono text-indigo-300">{savedLogos.length}</span>
                </div>
                <div className="border-l border-white/10">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">{language === 'ar' ? 'الأدلة المتكاملة' : 'Brand Guides'}</span>
                  <span className="text-lg font-bold font-mono text-indigo-300">{savedKits.length}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={async () => {
                    if (isGeneratingPDF) return;
                    setIsGeneratingPDF(true);
                    try {
                      await exportToPDF(language, user, savedNames, savedSlogans, savedLogos, savedKits);
                    } catch (err) {
                      console.error("Failed to generate PDF:", err);
                    }
                    setIsGeneratingPDF(false);
                  }}
                  disabled={isGeneratingPDF || (savedNames.length === 0 && savedSlogans.length === 0 && savedLogos.length === 0 && savedKits.length === 0)}
                  className="flex-1 bg-white hover:bg-slate-100 text-indigo-950 px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {language === 'ar' ? 'جاري تصدير التقرير الفني...' : 'Compiling PDF Report...'}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {language === 'ar' ? 'تنزيل تقرير التصميم (PDF)' : 'Download Design Report (PDF)'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => exportToJSON(user, savedNames, savedSlogans, savedLogos, savedKits)}
                  disabled={savedNames.length === 0 && savedSlogans.length === 0 && savedLogos.length === 0 && savedKits.length === 0}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white border border-white/25 px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 text-indigo-300" />
                  {language === 'ar' ? 'تنزيل حزمة البيانات (JSON)' : 'Download Data Package (JSON)'}
                </button>
              </div>
            </div>

            {/* Decorative glows */}
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl"></div>
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
              <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                {language === 'ar' ? 'شراء رصيد سريع' : 'Purchase Credits'}
              </h3>
              {!user?.hasPurchasedCredits && (
                <span className="text-xs font-black text-amber-700 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full animate-pulse inline-flex items-center gap-1">
                  <span>🎁</span> {language === 'ar' ? 'أول شحن يمنحك الضعف (الرصيد × 2)!' : 'First recharge grants DOUBLE (Credits × 2)!'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button 
                onClick={() => simulateBuyCredits(100, 3)}
                className="p-4 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-850 bg-indigo-50/10 hover:bg-indigo-50/30 text-center space-y-1.5 cursor-pointer relative overflow-hidden"
              >
                <span className="absolute top-0.5 right-1 text-[7px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded select-none">
                  {language === 'ar' ? 'باي بال' : 'PayPal'}
                </span>
                <Coins className="w-5 h-5 text-indigo-500 mx-auto" />
                <span className="block text-xs font-semibold text-indigo-700 dark:text-indigo-400">{language === 'ar' ? 'شراء 100 رصيد' : 'Buy 100 Credits'}</span>
                <span className="block text-[10px] text-indigo-500">$3</span>
              </button>
              <button 
                onClick={() => simulateBuyCredits(500, 12)}
                className="p-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-850 bg-amber-50/10 hover:bg-amber-50/30 text-center space-y-1.5 cursor-pointer"
              >
                <Coins className="w-5 h-5 text-amber-500 mx-auto" />
                <span className="block text-xs font-semibold text-amber-700 dark:text-amber-400">{language === 'ar' ? 'شراء 500 رصيد' : 'Buy 500 Credits'}</span>
                <span className="block text-[10px] text-amber-500">$12</span>
              </button>
              <button 
                onClick={() => simulateBuyCredits(1500, 30)}
                className="p-4 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-850 bg-emerald-50/10 hover:bg-emerald-50/30 text-center space-y-1.5 cursor-pointer"
              >
                <Coins className="w-5 h-5 text-emerald-500 mx-auto" />
                <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400">{language === 'ar' ? 'شراء 1500 رصيد' : 'Buy 1500 Credits'}</span>
                <span className="block text-[10px] text-emerald-500">$30</span>
              </button>
              <button 
                onClick={() => simulateBuyCredits(4000, 60)}
                className="p-4 rounded-xl border border-dashed border-purple-200 dark:border-purple-850 bg-purple-50/10 hover:bg-purple-50/30 text-center space-y-1.5 cursor-pointer"
              >
                <Coins className="w-5 h-5 text-purple-500 mx-auto" />
                <span className="block text-xs font-semibold text-purple-700 dark:text-purple-400">{language === 'ar' ? 'شراء 4000 رصيد' : 'Buy 4000 Credits'}</span>
                <span className="block text-[10px] text-purple-500">$60</span>
              </button>
            </div>
            {purchaseSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs font-semibold animate-fade-in">
                {purchaseSuccess}
              </div>
            )}
          </div>

          {/* Recent Activity Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="font-display font-bold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                  {t.recentHistory}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {language === 'ar' ? 'آخر 5 عناصر' : 'Last 5 items'}
              </span>
            </div>

            {getRecentAssets().length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {language === 'ar' ? 'لا يوجد نشاط توليد حتى الآن.' : 'No generated assets found yet.'}
                </p>
                <button
                  onClick={() => setActiveTab('names')}
                  className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {language === 'ar' ? 'ابدأ بالتوليد الآن' : 'Start generating now'}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {getRecentAssets().map((asset, idx) => {
                  let IconComponent = Type;
                  let typeLabel = 'Name';
                  let typeColorClass = 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
                  
                  if (asset.type === 'logo') {
                    IconComponent = Palette;
                    typeLabel = language === 'ar' ? 'شعار' : 'Logo';
                    typeColorClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
                  } else if (asset.type === 'slogan') {
                    IconComponent = MessageSquare;
                    typeLabel = language === 'ar' ? 'شعار لفظي' : 'Slogan';
                    typeColorClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
                  } else if (asset.type === 'brand-kit') {
                    IconComponent = LayoutGrid;
                    typeLabel = language === 'ar' ? 'هوية متكاملة' : 'Brand Kit';
                    typeColorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                  } else {
                    typeLabel = language === 'ar' ? 'اسم تجاري' : 'Name';
                  }

                  return (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl ${typeColorClass} border border-current/10 shrink-0`}>
                          {asset.type === 'logo' && asset.detail ? (
                            <div 
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: asset.detail }}
                            />
                          ) : asset.type === 'brand-kit' && asset.detail ? (
                            <div 
                              className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-0.5 overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: asset.detail }}
                            />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display font-bold text-slate-800 dark:text-white text-sm truncate max-w-xs sm:max-w-md">
                              {asset.title}
                            </h4>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColorClass}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 max-w-xl">
                            {asset.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTab(asset.targetTab)}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          {language === 'ar' ? 'عرض بالتفصيل' : 'View Detail'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. SAVED NAMES TAB */}
      {activeTab === 'names' && (
        <div className="space-y-4 animate-fade-in">
          {compareMode && (
            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/10 dark:via-slate-900/40 dark:to-slate-900/10 border border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 mb-6 animate-fade-in shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-100/60 dark:border-indigo-950">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'مساحة المقارنة جنبًا إلى جنب' : 'Side-by-Side Comparison Workspace'}
                    </h3>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    {language === 'ar' 
                      ? 'حدد اسمين أو أكثر من القائمة أدناه لعرضهما ومقارنتهما والحصول على تحليل ذكي من الذكاء الاصطناعي.' 
                      : 'Select two or more items from below to view them side-by-side, analyze differences, and get smart AI advice.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedNamesToCompare.length >= 2 && (
                    <button
                      onClick={handleAICompare}
                      disabled={isComparingAI}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {isComparingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ar' ? 'جاري التحليل...' : 'Analyzing Choice...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'اسأل الذكاء الاصطناعي للتحليل والمقارنة' : 'Ask AI for Recommendation'}</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedNamesToCompare([]);
                      setComparisonResult(null);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                  >
                    {language === 'ar' ? 'إعادة تعيين الاختيارات' : 'Clear Selection'}
                  </button>
                </div>
              </div>

              {/* Selection status */}
              {selectedNamesToCompare.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                  <ArrowLeftRight className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
                    {language === 'ar' ? 'لم يتم تحديد أي عناصر بعد. حدد العناصر من الأسفل للبدء.' : 'No items selected. Click the check circle on any item card below to add it here.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Side-by-Side grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-2">
                    {selectedNamesToCompare.map((item, idx) => {
                      const aiAnalysis = comparisonResult?.analysis?.find((a: any) => a.nameOrSlogan === item.name);
                      return (
                        <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 relative flex flex-col justify-between shadow-sm animate-fade-in hover:shadow-md transition-all">
                          <button 
                            onClick={() => setSelectedNamesToCompare(selectedNamesToCompare.filter(n => n.name !== item.name))}
                            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                              {item.style}
                            </span>
                            
                            <h4 className="font-display font-bold text-2xl text-indigo-600 dark:text-indigo-400 mt-3 mb-2">
                              {item.name}
                            </h4>
                            
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[50px]">
                              {item.meaning}
                            </p>

                            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Domain idea:</span>
                              <span className="text-xs text-emerald-600 font-semibold font-mono">{item.domainSuggestions?.[0] || `${item.name.toLowerCase()}.com`}</span>
                            </div>

                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {item.tags.map(t => (
                                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Critique in the card itself if available */}
                          {aiAnalysis && (
                            <div className="mt-4 pt-4 border-t border-dashed border-indigo-100 dark:border-indigo-900 space-y-3 bg-indigo-50/20 dark:bg-indigo-950/10 p-3 rounded-xl">
                              <div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">🎯 {language === 'ar' ? 'الملائمة للعلامة التجارية' : 'Brand Fit'}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">{aiAnalysis.brandFit}</p>
                              </div>
                              
                              {aiAnalysis.pros && aiAnalysis.pros.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">✅ {language === 'ar' ? 'الإيجابيات' : 'Pros'}</span>
                                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5 mt-0.5 pl-1">
                                    {aiAnalysis.pros.map((pro: string, i: number) => (
                                      <li key={i}>{pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {aiAnalysis.cons && aiAnalysis.cons.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">❌ {language === 'ar' ? 'السلبيات' : 'Cons'}</span>
                                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5 mt-0.5 pl-1">
                                    {aiAnalysis.cons.map((con: string, i: number) => (
                                      <li key={i}>{con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Choice recommendation section */}
                  {comparisonResult && (
                    <div className="bg-indigo-600 text-white rounded-2xl p-5 md:p-6 shadow-lg border border-indigo-500 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/10 rounded-xl mt-1">
                          <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                            {language === 'ar' ? '🏆 التوصية الإستراتيجية للذكاء الاصطناعي' : '🏆 Smart AI Strategic Recommendation'}
                          </h4>
                          <p className="text-lg font-bold">
                            {comparisonResult.recommendation}
                          </p>
                          <p className="text-xs text-indigo-100 leading-relaxed border-t border-indigo-500/50 pt-3 mt-3">
                            <span className="font-semibold block text-white mb-1">📝 {language === 'ar' ? 'الحكم الإستراتيجي:' : 'Strategic Verdict:'}</span>
                            {comparisonResult.verdict}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {savedNames.length > 0 ? (
            filteredNames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNames.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: "easeOut" }}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 relative flex flex-col justify-between transition-all ${
                      selectedItemKeys.includes(item.name)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5'
                        : compareMode && selectedNamesToCompare.some(n => n.name === item.name)
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedItemKeys.includes(item.name)}
                            onChange={() => handleToggleSelectItem(item.name)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            title="Select name"
                          />
                          {compareMode && (
                            <button
                              onClick={() => {
                                const isSelected = selectedNamesToCompare.some(n => n.name === item.name);
                                if (isSelected) {
                                  setSelectedNamesToCompare(selectedNamesToCompare.filter(n => n.name !== item.name));
                                } else {
                                  setSelectedNamesToCompare([...selectedNamesToCompare, item]);
                                }
                              }}
                              className={`p-1 rounded-full border transition-all cursor-pointer ${
                                selectedNamesToCompare.some(n => n.name === item.name)
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-500'
                              }`}
                              title={selectedNamesToCompare.some(n => n.name === item.name) ? "Deselect from comparison" : "Select for comparison"}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                            {item.style}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onUpdateName({ ...item, isFavorite: !item.isFavorite })}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              item.isFavorite
                                ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500'
                            }`}
                            title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => downloadName(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                            title="Download Details"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemoveName(item.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-display font-bold text-xl text-indigo-600 dark:text-indigo-400 mb-2">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.meaning}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-4 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Domain ideas:</span>
                      <span className="text-xs text-emerald-600 font-semibold">{item.domainSuggestions?.[0] || `${item.name.toLowerCase()}.com`}</span>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2 mt-2">
                      <AssetTagsEditor
                        tags={item.tags || []}
                        onChange={(newTags) => onUpdateName({ ...item, tags: newTags })}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 bg-white dark:bg-slate-900">
                No matching names found for "{searchQuery}".
              </div>
            )
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
              No business names saved. Save them in the Generator to view here!
            </div>
          )}
        </div>
      )}

      {/* C. SAVED LOGOS TAB */}
      {activeTab === 'logos' && (
        <div className="space-y-4 animate-fade-in">
          {savedLogos.length > 0 ? (
            filteredLogos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredLogos.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: "easeOut" }}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 flex flex-col items-center justify-between shadow-sm relative group transition-all ${
                      selectedItemKeys.includes(item.id)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItemKeys.includes(item.id)}
                        onChange={() => handleToggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Select logo"
                      />
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onUpdateLogo({ ...item, isFavorite: !item.isFavorite })}
                        className={`p-1.5 border rounded-lg shadow cursor-pointer transition-colors ${
                          item.isFavorite
                            ? 'bg-rose-50 border-rose-100 text-rose-500'
                            : 'bg-white border-slate-150 text-slate-500 hover:text-rose-500'
                        }`}
                        title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => downloadLogoSVG(item.svg, item.id)}
                        className="p-1.5 bg-white border border-slate-150 rounded-lg text-slate-500 hover:text-indigo-600 shadow cursor-pointer"
                        title="Download SVG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveLogo(item.id)}
                        className="p-1.5 bg-white border border-slate-150 rounded-lg text-slate-500 hover:text-red-500 shadow cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div 
                      className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center p-4 border border-slate-100 dark:border-slate-850 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: item.svg }}
                    />

                    <div className="w-full mt-3 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.style}</span>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-full px-1">{item.prompt}</span>
                      {item.createdAt && (
                        <span className="block text-[10px] text-slate-400 mt-1">{formatTimeAgo(item.createdAt)}</span>
                      )}
                    </div>

                    <div className="w-full mt-2 border-t border-slate-100 dark:border-slate-850 pt-2 flex justify-start text-left">
                      <AssetTagsEditor
                        tags={item.tags || []}
                        onChange={(newTags) => onUpdateLogo({ ...item, tags: newTags })}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 bg-white dark:bg-slate-900">
                No matching logos found for "{searchQuery}".
              </div>
            )
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
              No saved logos. Design logos in the Logo Forge to view them here!
            </div>
          )}
        </div>
      )}

      {/* D. SAVED SLOGANS TAB */}
      {activeTab === 'slogans' && (
        <div className="space-y-4 animate-fade-in">
          {compareMode && (
            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/10 dark:via-slate-900/40 dark:to-slate-900/10 border border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 mb-6 animate-fade-in shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-indigo-100/60 dark:border-indigo-950">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white">
                      {language === 'ar' ? 'مساحة مقارنة الشعارات جنبًا إلى جنب' : 'Slogan Side-by-Side Comparison Workspace'}
                    </h3>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                    {language === 'ar' 
                      ? 'حدد شعارين أو أكثر من القائمة أدناه لعرضهما ومقارنتهما والحصول على تحليل ذكي من الذكاء الاصطناعي.' 
                      : 'Select two or more slogans from below to view them side-by-side, analyze differences, and get smart AI advice.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedSlogansToCompare.length >= 2 && (
                    <button
                      onClick={handleAICompare}
                      disabled={isComparingAI}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 disabled:opacity-50 cursor-pointer transition-all"
                    >
                      {isComparingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ar' ? 'جاري التحليل...' : 'Analyzing Choice...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'اسأل الذكاء الاصطناعي للتحليل والمقارنة' : 'Ask AI for Recommendation'}</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedSlogansToCompare([]);
                      setComparisonResult(null);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors"
                  >
                    {language === 'ar' ? 'إعادة تعيين الاختيارات' : 'Clear Selection'}
                  </button>
                </div>
              </div>

              {/* Selection status */}
              {selectedSlogansToCompare.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                  <ArrowLeftRight className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
                    {language === 'ar' ? 'لم يتم تحديد أي عناصر بعد. حدد العناصر من الأسفل للبدء.' : 'No slogans selected. Click the check circle on any slogan below to add it here.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Side-by-Side grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-2">
                    {selectedSlogansToCompare.map((item, idx) => {
                      const aiAnalysis = comparisonResult?.analysis?.find((a: any) => a.nameOrSlogan === item.slogan);
                      return (
                        <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 relative flex flex-col justify-between shadow-sm animate-fade-in hover:shadow-md transition-all">
                          <button 
                            onClick={() => setSelectedSlogansToCompare(selectedSlogansToCompare.filter(s => s.slogan !== item.slogan))}
                            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                              {item.vibe}
                            </span>
                            
                            <p className="text-base font-medium text-slate-800 dark:text-slate-200 mt-4 mb-2 italic">
                              "{item.slogan}"
                            </p>

                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {item.tags.map(t => (
                                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Critique in the card itself if available */}
                          {aiAnalysis && (
                            <div className="mt-4 pt-4 border-t border-dashed border-indigo-100 dark:border-indigo-900 space-y-3 bg-indigo-50/20 dark:bg-indigo-950/10 p-3 rounded-xl">
                              <div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block">🎯 {language === 'ar' ? 'الملائمة للعلامة التجارية' : 'Brand Fit'}</span>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">{aiAnalysis.brandFit}</p>
                              </div>
                              
                              {aiAnalysis.pros && aiAnalysis.pros.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">✅ {language === 'ar' ? 'الإيجابيات' : 'Pros'}</span>
                                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5 mt-0.5 pl-1">
                                    {aiAnalysis.pros.map((pro: string, i: number) => (
                                      <li key={i}>{pro}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {aiAnalysis.cons && aiAnalysis.cons.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">❌ {language === 'ar' ? 'السلبيات' : 'Cons'}</span>
                                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5 mt-0.5 pl-1">
                                    {aiAnalysis.cons.map((con: string, i: number) => (
                                      <li key={i}>{con}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Choice recommendation section */}
                  {comparisonResult && (
                    <div className="bg-indigo-600 text-white rounded-2xl p-5 md:p-6 shadow-lg border border-indigo-500 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/10 rounded-xl mt-1">
                          <Sparkles className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                            {language === 'ar' ? '🏆 التوصية الإستراتيجية للذكاء الاصطناعي' : '🏆 Smart AI Strategic Recommendation'}
                          </h4>
                          <p className="text-lg font-bold">
                            {comparisonResult.recommendation}
                          </p>
                          <p className="text-xs text-indigo-100 leading-relaxed border-t border-indigo-500/50 pt-3 mt-3">
                            <span className="font-semibold block text-white mb-1">📝 {language === 'ar' ? 'الحكم الإستراتيجي:' : 'Strategic Verdict:'}</span>
                            {comparisonResult.verdict}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {savedSlogans.length > 0 ? (
            filteredSlogans.length > 0 ? (
              <div className="space-y-3">
                {filteredSlogans.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: "easeOut" }}
                    className={`bg-white dark:bg-slate-900 border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      selectedItemKeys.includes(item.slogan)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5'
                        : compareMode && selectedSlogansToCompare.some(s => s.slogan === item.slogan)
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          checked={selectedItemKeys.includes(item.slogan)}
                          onChange={() => handleToggleSelectItem(item.slogan)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select slogan"
                        />
                        {compareMode && (
                          <button
                            onClick={() => {
                              const isSelected = selectedSlogansToCompare.some(s => s.slogan === item.slogan);
                              if (isSelected) {
                                setSelectedSlogansToCompare(selectedSlogansToCompare.filter(s => s.slogan !== item.slogan));
                              } else {
                                setSelectedSlogansToCompare([...selectedSlogansToCompare, item]);
                              }
                            }}
                            className={`p-0.5 rounded-full border transition-all cursor-pointer ${
                              selectedSlogansToCompare.some(s => s.slogan === item.slogan)
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-500'
                            }`}
                            title={selectedSlogansToCompare.some(s => s.slogan === item.slogan) ? "Deselect from comparison" : "Select for comparison"}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                        )}
                        <span className="text-[9px] uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          {item.vibe}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-350 pt-1">"{item.slogan}"</p>
                      <AssetTagsEditor
                        tags={item.tags || []}
                        onChange={(newTags) => onUpdateSlogan({ ...item, tags: newTags })}
                      />
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => onUpdateSlogan({ ...item, isFavorite: !item.isFavorite })}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          item.isFavorite
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500'
                        }`}
                        title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => downloadSlogan(item)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Download Text"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyText(item.slogan, `slog-${idx}`)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                      >
                        {copiedIndex === `slog-${idx}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onRemoveSlogan(item.slogan)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 bg-white dark:bg-slate-900">
                No matching slogans found for "{searchQuery}".
              </div>
            )
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
              No saved slogans yet.
            </div>
          )}
        </div>
      )}

      {/* E. SAVED BRAND KITS */}
      {activeTab === 'brand-kits' && (
        <div className="space-y-4 animate-fade-in">
          {savedKits.length > 0 ? (
            filteredKits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredKits.map((kit, idx) => (
                  <motion.div
                    key={kit.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: "easeOut" }}
                    className={`bg-white dark:bg-slate-900 border p-6 rounded-3xl space-y-4 relative transition-all ${
                      selectedItemKeys.includes(kit.id)
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/5'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItemKeys.includes(kit.id)}
                        onChange={() => handleToggleSelectItem(kit.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Select brand kit"
                      />
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1">
                      <button
                        onClick={() => onUpdateKit({ ...kit, isFavorite: !kit.isFavorite })}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          kit.isFavorite
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500'
                        }`}
                        title={kit.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-4 h-4 ${kit.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => downloadBrandKit(kit)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                        title="Download Brand Kit Text"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveKit(kit.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1 pl-6">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Brand Book Identity</span>
                      <h4 className="font-display font-bold text-xl text-slate-900 dark:text-white">{kit.name}</h4>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[kit.colors.primary, kit.colors.secondary, kit.colors.accent, kit.colors.background, kit.colors.text].map((color, colorIdx) => (
                        <div 
                          key={colorIdx} 
                          className="h-10 rounded-lg border border-slate-200/50"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    <div className="flex gap-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Heading typography</span>
                        <span className="font-bold text-slate-850 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>{kit.typography.heading}</span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Body typography</span>
                        <span className="font-medium text-slate-850 dark:text-white" style={{ fontFamily: 'var(--font-sans)' }}>{kit.typography.body}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2 mt-2">
                      <AssetTagsEditor
                        tags={kit.tags || []}
                        onChange={(newTags) => onUpdateKit({ ...kit, tags: newTags })}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 bg-white dark:bg-slate-900">
                No matching brand guidelines found for "{searchQuery}".
              </div>
            )
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
              No saved brand guidelines. Save them in the Brand Guidelines generator tab to view them here!
            </div>
          )}
        </div>
      )}

      {/* NEW INTERACTIVE COLOR PALETTE TAB */}
      {activeTab === 'colors' && (
        <div className="space-y-4 animate-fade-in">
          <ColorPaletteGenerator
            language={language}
            user={user}
            onDeductCredits={onDeductCredits}
            onSaveBrandKit={onSaveBrandKit}
            onOpenLogin={() => {}}
          />
        </div>
      )}

      {/* E.5 SOCIAL BRANDING TAB */}
      {activeTab === 'social-branding' && (
        <SocialBrandingTab savedKits={savedKits} isAr={language === 'ar'} />
      )}

      {/* F. BILLING TAB */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h3 className="font-display font-bold text-slate-850 dark:text-white text-base">
                {language === 'ar' ? 'شراء رصيد توليد الذكاء الاصطناعي' : 'Purchase AI Generation Credits'}
              </h3>
              {!user?.hasPurchasedCredits && (
                <span className="text-xs font-black text-amber-700 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full animate-pulse inline-flex items-center gap-1 self-start sm:self-auto">
                  <span>🎁</span> {language === 'ar' ? 'أول شحن يمنحك الضعف (الرصيد × 2)!' : 'First recharge grants DOUBLE (Credits × 2)!'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'ar' 
                ? 'اشترِ حزم الرصيد بنظام الدفع الفردي. رصيدك صالح دائماً ولا ينتهي أبداً.'
                : 'Purchase pay-as-you-go credit packages. Purchased credits never expire and are ready for instant use.'}
            </p>

            {/* Banner for Billing tab */}
            {!user?.hasPurchasedCredits && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-4 rounded-xl text-white text-xs font-bold flex items-center justify-between gap-3 shadow border border-amber-300">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-white animate-bounce shrink-0" />
                  <span>
                    {language === 'ar' 
                      ? 'عرض ترحيبي خاص: عند إتمام أول عملية شحن، سيتم مضاعفة الرصيد المضاف تلقائياً ×2!'
                      : 'Special Welcome Offer: Your first purchase is automatically doubled! Multiply any package by 2!'}
                  </span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded font-mono font-black shrink-0">X2 BONUS</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3 relative overflow-hidden">
                <span className="absolute top-1 right-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 select-none">
                  {language === 'ar' ? 'باي بال مُعدّ' : 'PayPal Configured'}
                </span>
                <span className="block text-xs font-semibold text-slate-400 pt-1">{language === 'ar' ? 'حزمة البداية' : 'Starter Pack'}</span>
                <span className="block text-xl font-bold text-slate-850 dark:text-white">100 {t.credits}</span>
                <span className="block text-lg font-bold text-indigo-600">$3</span>
                <button 
                  onClick={() => simulateBuyCredits(100, 3)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition animate-pulse"
                >
                  {language === 'ar' ? 'شراء الحزمة' : 'Buy Pack'}
                </button>
              </div>

              <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/5 text-center space-y-3 relative overflow-hidden">
                <span className="absolute top-1 right-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 select-none">
                  {language === 'ar' ? 'باي بال مُعدّ' : 'PayPal Configured'}
                </span>
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {language === 'ar' ? 'شائع' : 'Best Seller'}
                </span>
                <span className="block text-xs font-semibold text-indigo-500 mt-2">{language === 'ar' ? 'حزمة النمو' : 'Growth Pack'}</span>
                <span className="block text-xl font-bold text-slate-850 dark:text-white">500 {t.credits}</span>
                <span className="block text-lg font-bold text-indigo-600">$12</span>
                <button 
                  onClick={() => simulateBuyCredits(500, 12)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition animate-pulse"
                >
                  {language === 'ar' ? 'شراء الحزمة' : 'Buy Pack'}
                </button>
              </div>

              <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/5 text-center space-y-3 relative overflow-hidden">
                <span className="absolute top-1 right-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 select-none">
                  {language === 'ar' ? 'باي بال مُعدّ' : 'PayPal Configured'}
                </span>
                <span className="block text-xs font-semibold text-indigo-500 mt-2">{language === 'ar' ? 'الحزمة الفائقة' : 'Power Pack'}</span>
                <span className="block text-xl font-bold text-slate-850 dark:text-white">1500 {t.credits}</span>
                <span className="block text-lg font-bold text-indigo-600">$30</span>
                <button 
                  onClick={() => simulateBuyCredits(1500, 30)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition animate-pulse"
                >
                  {language === 'ar' ? 'شراء الحزمة' : 'Buy Pack'}
                </button>
              </div>

              <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/5 text-center space-y-3 relative overflow-hidden">
                <span className="absolute top-1 right-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 select-none">
                  {language === 'ar' ? 'باي بال مُعدّ' : 'PayPal Configured'}
                </span>
                <span className="block text-xs font-semibold text-indigo-500 mt-2">{language === 'ar' ? 'حزمة الوكالات' : 'Elite Agency Pack'}</span>
                <span className="block text-xl font-bold text-slate-850 dark:text-white">4000 {t.credits}</span>
                <span className="block text-lg font-bold text-indigo-600">$60</span>
                <button 
                  onClick={() => simulateBuyCredits(4000, 60)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition animate-pulse"
                >
                  {language === 'ar' ? 'شراء الحزمة' : 'Buy Pack'}
                </button>
              </div>
            </div>
            {purchaseSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs font-semibold animate-fade-in">
                {purchaseSuccess}
              </div>
            )}
          </div>

          {/* PayPal Configuration Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="bg-[#0070ba]/10 p-2.5 rounded-xl text-[#0070ba]">
                <Key className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-bold text-slate-850 dark:text-white text-base">
                  {language === 'ar' ? 'إعدادات بوابة دفع PayPal' : 'PayPal Payment Gateway Settings'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ar'
                    ? 'تخصيص الرمز التعريفي (Client ID) الحقيقي الخاص بك لتلقي المدفوعات في متجرك.'
                    : 'Configure your active PayPal Client ID to route payments directly to your PayPal account.'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'ar' ? 'معرف العميل لباي بال (PayPal Client ID)' : 'PayPal Client ID'}
                </label>
                <input
                  type="text"
                  value={paypalKeyInput}
                  onChange={(e) => {
                    setPaypalKeyInput(e.target.value);
                    setPaypalSaveStatus('idle');
                  }}
                  placeholder={
                    language === 'ar'
                      ? 'أدخل معرف العميل الحقيقي (مثال: Client ID يبدأ بـ Ad أو Af...)'
                      : 'Enter your real PayPal Client ID (e.g., starting with Ad or Af...)'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Informative alert explaining 403 errors */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950/40 rounded-xl p-4 text-xs space-y-2 leading-relaxed text-slate-600 dark:text-slate-400">
                <div className="flex gap-2 font-bold text-indigo-600 dark:text-indigo-400 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {language === 'ar'
                      ? 'دليل استكشاف الأخطاء وإصلاحها (خطأ 403 NOT_AUTHORIZED):'
                      : 'Troubleshooting Authorization Errors (403 NOT_AUTHORIZED):'}
                  </span>
                </div>
                <p>
                  {language === 'ar'
                    ? 'إذا ظهرت لك مشكلة عدم تفعيل أو فشل الاتصال ببوابة الدفع، فهذا يعني غالباً أحد الأمرين:'
                    : 'If the PayPal buttons throw a 403 authorization error, it is almost always due to:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1">
                  <li>
                    <strong>{language === 'ar' ? 'بيئة غير متطابقة: ' : 'Environment Mismatch: '}</strong>
                    {language === 'ar'
                      ? 'محاولة الدفع بحساب Sandbox (تجريبي) بينما المفتاح حقيقي (Live)، أو العكس.'
                      : 'Trying to pay with a Sandbox buyer account while using a Live Client ID (or vice versa).'}
                  </li>
                  <li>
                    <strong>{language === 'ar' ? 'تفعيل ميزة المدفوعات القياسية: ' : 'Enable Standard Checkout: '}</strong>
                    {language === 'ar'
                      ? 'يجب تفعيل خيار (Accept Payments) و (Standard Checkout) لتطبيقك في لوحة مطوري باي بال.'
                      : 'Ensure "Accept Payments" and "Standard Checkout" features are fully enabled for your App in developer.paypal.com.'}
                  </li>
                  <li>
                    <strong>{language === 'ar' ? 'دعم العملة: ' : 'USD Currency: '}</strong>
                    {language === 'ar'
                      ? 'يجب أن يدعم حساب باي بال التجاري الخاص بك استقبال عملة الدولار الأمريكي (USD).'
                      : 'Your merchant account must support receiving payments in USD.'}
                  </li>
                </ul>
              </div>

              {paypalSaveStatus === 'saved' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl p-3 text-xs leading-relaxed animate-fade-in">
                  {language === 'ar'
                    ? 'تم حفظ المفتاح بنجاح! سيتم استخدام الرمز التعريفي الحقيقي الخاص بك للمدفوعات الآن.'
                    : 'PayPal Client ID saved successfully! The gateway is now updated.'}
                </div>
              )}

              {paypalSaveStatus === 'cleared' && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl p-3 text-xs leading-relaxed animate-fade-in">
                  {language === 'ar' ? 'تمت إزالة الرمز المخصص. تم تفعيل الرمز الافتراضي.' : 'Custom Client ID removed. Using default Sandbox credentials.'}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {localStorage.getItem('brandforge_paypal_client_id') && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('brandforge_paypal_client_id');
                      setPaypalKeyInput('');
                      setPaypalSaveStatus('cleared');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    {language === 'ar' ? 'حذف المفتاح' : 'Clear Custom ID'}
                  </button>
                )}
                <button
                  onClick={() => {
                    localStorage.setItem('brandforge_paypal_client_id', paypalKeyInput.trim());
                    setPaypalSaveStatus('saved');
                  }}
                  disabled={!paypalKeyInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ الرمز' : 'Save PayPal ID'}
                </button>
              </div>
            </div>
          </div>

          {/* Saved Payment Methods & Card Management section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-left">
                <h3 className="font-display font-bold text-slate-850 dark:text-white text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {language === 'ar' ? 'وسائل الدفع المحفوظة' : 'Saved Payment Methods'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ar' 
                    ? 'أضف أو حدّث بطاقات الائتمان لتسهيل عمليات الترقية وشراء الرصيد مستقبلاً.'
                    : 'Manage saved credit and debit cards to expedite future premium upgrades or credit refills.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingCard(!isAddingCard)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                {isAddingCard 
                  ? (language === 'ar' ? 'إلغاء' : 'Cancel') 
                  : (language === 'ar' ? 'إضافة بطاقة جديدة' : 'Add New Card')}
              </button>
            </div>

            {/* Add New Card Form */}
            {isAddingCard && (
              <form onSubmit={handleAddNewCard} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/25 space-y-4 text-left animate-fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {language === 'ar' ? 'تفاصيل البطاقة الجديدة' : 'New Card Credentials'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      {language === 'ar' ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newCardName}
                      onChange={(e) => { setNewCardName(e.target.value); setAddCardError(''); }}
                      placeholder={user?.displayName || "Alex Morgan"}
                      className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      {language === 'ar' ? 'رقم البطاقة (16 رقماً)' : 'Card Number (16 Digits)'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={newCardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4111 2222 3333 4444"
                        className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white font-mono"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-indigo-500 font-mono">
                        {newCardNumber.replace(/\s/g, '').startsWith('4') ? 'Visa' : 
                         /^5[1-5]/.test(newCardNumber.replace(/\s/g, '')) ? 'Mastercard' :
                         /^3[47]/.test(newCardNumber.replace(/\s/g, '')) ? 'Amex' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      {language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newCardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      {language === 'ar' ? 'رمز الأمان (CVV)' : 'Security Code (CVV)'}
                    </label>
                    <input
                      type="password"
                      required
                      value={newCardCvv}
                      onChange={handleCvvChange}
                      placeholder="•••"
                      maxLength={3}
                      className="w-full text-xs px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-white font-mono text-center"
                    />
                  </div>
                </div>

                {addCardError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl text-xs font-semibold">
                    {addCardError}
                  </div>
                )}

                {addCardSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs font-semibold">
                    {addCardSuccess}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddingCard(false); setAddCardError(''); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    {language === 'ar' ? 'حفظ بطاقة الدفع' : 'Save Payment Card'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Saved Cards */}
            {savedCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {savedCards.map((card) => (
                  <div 
                    key={card.id}
                    className={`p-6 rounded-2xl border transition duration-300 relative overflow-hidden flex flex-col justify-between h-48 group ${
                      card.isDefault 
                        ? 'border-indigo-500/40 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-lg shadow-indigo-600/10' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {/* Background glows for premium look */}
                    <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/5 dark:bg-white/[0.02] rounded-full blur-2xl group-hover:scale-125 transition duration-500"></div>
                    <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

                    {/* Top Row: Brand & Status */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        {/* Interactive chip design */}
                        <div className="w-8 h-6 bg-amber-400/20 dark:bg-amber-400/15 rounded-md border border-amber-400/30 flex flex-col justify-between p-1">
                          <div className="grid grid-cols-3 gap-0.5 w-full h-1/2">
                            <span className="bg-amber-400/40 rounded-sm"></span>
                            <span className="bg-amber-400/40 rounded-sm"></span>
                            <span className="bg-amber-400/40 rounded-sm"></span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 w-full h-1/3">
                            <span className="bg-amber-400/40 rounded-sm"></span>
                            <span className="bg-amber-400/40 rounded-sm"></span>
                          </div>
                        </div>

                        <span className="font-display font-black tracking-wider uppercase text-xs">
                          {card.brand === 'visa' ? 'Visa' : 
                           card.brand === 'mastercard' ? 'Mastercard' : 
                           card.brand === 'amex' ? 'Amex' : 'Card'}
                        </span>
                      </div>

                      {card.isDefault ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          <Check className="w-3 h-3" />
                          {language === 'ar' ? 'الافتراضية' : 'Primary'}
                        </span>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultCard(card.id)}
                            className="px-2 py-1 bg-slate-200/60 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold transition cursor-pointer"
                          >
                            {language === 'ar' ? 'تعيين كافتراضية' : 'Set Default'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1.5 bg-slate-200/60 dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                            title={language === 'ar' ? 'حذف' : 'Remove Card'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Card Number */}
                    <div className="z-10 font-mono tracking-widest text-base sm:text-lg my-3 text-center sm:text-left select-all">
                      {card.cardNumber}
                    </div>

                    {/* Bottom Row: Holder & Expiration */}
                    <div className="flex items-end justify-between z-10">
                      <div>
                        <div className={`text-[8px] uppercase tracking-widest font-semibold ${card.isDefault ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {language === 'ar' ? 'حامل البطاقة' : 'Cardholder'}
                        </div>
                        <div className="font-semibold text-xs truncate max-w-[150px]">
                          {card.cardholderName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[8px] uppercase tracking-widest font-semibold ${card.isDefault ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {language === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}
                        </div>
                        <div className="font-mono font-bold text-xs">
                          {card.expiry}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
                <div>{language === 'ar' ? 'لا توجد وسائل دفع محفوظة.' : 'No saved payment methods.'}</div>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(true)}
                  className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                >
                  {language === 'ar' ? 'أضف بطاقتك الأولى الآن' : 'Add your first card now'}
                </button>
              </div>
            )}

            {/* PCI Compliance Trust Badges */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {language === 'ar' 
                    ? 'مشفر من الطرفين (SSL 256-bit). لا نقوم بتخزين تفاصيل بطاقتك الكاملة أبداً.' 
                    : 'End-to-end 256-bit SSL Encrypted. We never store your full card details.'}
                </span>
              </div>
              <div className="flex gap-3 font-semibold uppercase tracking-wider">
                <span>PCI-DSS Compliant</span>
                <span>•</span>
                <span>Secure Gateway</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* G. HISTORY TIMELINE TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-display font-bold text-slate-850 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            Workspace Logs & Generation History
          </h3>

          {historyLogs.length > 0 ? (
            <div className="flow-root text-xs">
              <ul className="-mb-8">
                {historyLogs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== historyLogs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100 dark:bg-slate-800" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-3 items-start">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            {log.type[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-slate-800 dark:text-slate-350">
                              Forged <span className="font-bold text-indigo-600">{log.type.toUpperCase()}</span> with parameters: "{log.prompt}"
                            </p>
                          </div>
                          <div className="text-right whitespace-nowrap text-[10px] text-rose-500 font-bold">
                            -{log.creditsConsumed} Credits
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent usage logs available. Use any generator above to see logs populate!
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedItemKeys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col md:flex-row items-center gap-4 bg-slate-950/95 backdrop-blur-md text-white border border-slate-800 px-6 py-4 rounded-3xl shadow-2xl max-w-2xl w-11/12 animate-fade-in"
        >
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <span className="text-xs font-semibold bg-indigo-600 px-3 py-1.5 rounded-xl whitespace-nowrap">
              {selectedItemKeys.length} {language === 'ar' ? 'محدد' : 'Selected'}
            </span>
            <button
              onClick={() => setSelectedItemKeys([])}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Clear'}
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-800" />

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Bulk Tag Trigger */}
            <div className="relative flex items-center gap-2">
              {showBulkTagField ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBulkTag(bulkTagInput);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'أضف وسم...' : 'Enter tag...'}
                    value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    className="text-xs bg-slate-800 border border-slate-700 text-white rounded-xl py-1.5 px-3 focus:outline-none focus:border-indigo-500 w-28"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    {language === 'ar' ? 'حفظ' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkTagField(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowBulkTagField(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'إضافة وسم' : 'Bulk Tag'}
                </button>
              )}
            </div>

            {/* Download Archive */}
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Download className="w-3.5 h-3.5" />
              {language === 'ar' ? 'تحميل الأرشيف' : 'Download Archive'}
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all cursor-pointer border border-rose-500/30 hover:border-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {language === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Checkout Modal Overlay */}
      {checkoutModal && (
        <CheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={() => setCheckoutModal(null)}
          onSuccess={checkoutModal.onSuccess}
          itemName={checkoutModal.itemName}
          price={checkoutModal.price}
          language={language}
          userEmail={user?.email}
          userDisplayName={user?.displayName}
        />
      )}

    </div>
  );
}
