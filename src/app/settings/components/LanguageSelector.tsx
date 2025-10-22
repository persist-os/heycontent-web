'use client';

import React, { useState } from 'react';
import { useLanguagePreference } from '@/hooks/useTranslation';
import { Globe, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { T } from '@/components/translation/T';
import { LANGUAGES } from '@/lib/language-constants';

export default function LanguageSelector() {
  const { language, setLanguage, isLoading } = useLanguagePreference();
  const [searchQuery, setSearchQuery] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageChange = async (newLanguageCode: string) => {
    if (newLanguageCode === language) return;

    setIsChanging(true);
    try {
      await setLanguage(newLanguageCode);
      
      const newLang = LANGUAGES.find(l => l.code === newLanguageCode);
      
      if (newLanguageCode === 'en') {
        toast.success('Language changed to English');
      } else {
        toast.success(
          `Language changed to ${newLang?.name}. The interface will translate as you explore! ✨`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error('Failed to change language. Please try again.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium">
            <T context="settings.language.title">Language</T>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            <T context="settings.language.subtitle">Choose your preferred language. The first time you select a language, the interface will translate progressively as you use it.</T>
          </p>
        </div>
        <Globe className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {/* Current Language Display */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{currentLanguage.name}</div>
              <div className="text-2xl">{currentLanguage.nativeName}</div>
            </div>
            <Check className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Language Selector with Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            <T context="settings.language.select_label">Select Language</T>
          </label>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-1">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isLoading || isChanging}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${lang.code === language 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                  ${(isLoading || isChanging) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{lang.name}</div>
                    <div className="text-lg">{lang.nativeName}</div>
                  </div>
                  {lang.code === language && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <T context="settings.language.no_results">No languages found matching "{searchQuery}"</T>
            </div>
          )}
        </div>

        {/* Info Box */}
        {language !== 'en' && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <div className="text-2xl">✨</div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  <T context="settings.language.progressive_title">Progressive Translation</T>
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  <T context="settings.language.progressive_description">The first time you select {currentLanguage.name}, the interface will translate itself as you explore. Each translation is cached for instant loading next time!</T>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

