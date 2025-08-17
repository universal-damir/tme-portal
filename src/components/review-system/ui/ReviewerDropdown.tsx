// Reviewer Selection Dropdown Component
// Safe UI component with TME design system integration

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Crown, Check, X } from 'lucide-react';
import { Reviewer } from '@/types/review-system';
import { useReviewSystemConfig } from '@/lib/config/review-system';
import Image from 'next/image';

interface ReviewerDropdownProps {
  value?: number;
  onChange: (reviewerId: number, reviewer: Reviewer) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  documentType?: string;
}

export const ReviewerDropdown: React.FC<ReviewerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select a checker...',
  disabled = false,
  error,
  className = '',
  documentType
}) => {
  const config = useReviewSystemConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Don't render if feature is disabled
  if (!config.canShowReviewComponents || !config.showReviewerDropdown) {
    return null;
  }

  // Fetch reviewers on mount
  useEffect(() => {
    const fetchReviewers = async () => {
      setIsLoading(true);
      setFetchError(null);
      
      try {
        const url = documentType ? `/api/reviewers?documentType=${encodeURIComponent(documentType)}` : '/api/reviewers';
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          // Sort reviewers by employee_code (lowest to highest)
          const sortedReviewers = (data.reviewers || []).sort((a: Reviewer, b: Reviewer) => {
            // Extract numeric part from employee codes for proper numeric sorting
            const getNumericCode = (code: string) => {
              const match = code.match(/\d+/);
              return match ? parseInt(match[0], 10) : 0;
            };
            
            const codeA = getNumericCode(a.employee_code);
            const codeB = getNumericCode(b.employee_code);
            
            return codeA - codeB;
          });
          
          setReviewers(sortedReviewers);
        } else {
          setFetchError(data.error || 'Failed to load reviewers');
        }
      } catch (error) {
        setFetchError('Network error - please try again');
        console.error('Failed to fetch reviewers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewers();
  }, [documentType]);

  const selectedReviewer = reviewers.find(r => r.id === value);

  const handleSelect = (reviewer: Reviewer, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onChange(reviewer.id, reviewer);
    setIsOpen(false);
  };

  const handleRetry = () => {
    // Re-fetch reviewers
    const event = new Event('retry-fetch-reviewers');
    window.dispatchEvent(event);
  };

  return (
    <div className={`relative ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Label */}
      <label className="block text-sm font-medium mb-1" style={{ color: '#243F7B' }}>
        Select Checker *
      </label>

      {/* Dropdown Button */}
      <motion.button
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !isLoading) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 h-[42px]
          flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
            : 'bg-white hover:shadow-sm cursor-pointer'
          }
          ${error 
            ? 'border-red-300 focus:border-red-500' 
            : 'border-gray-200 focus:border-[#243F7B]'
          }
          ${isOpen ? 'shadow-md' : ''}
        `}
        style={{
          borderColor: isOpen ? '#243F7B' : error ? '#ef4444' : '#e5e7eb'
        }}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#243F7B' }}></div>
              <span className="text-sm text-gray-500">Loading reviewers...</span>
            </>
          ) : selectedReviewer ? (
            <>
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={`/api/photos/${encodeURIComponent(selectedReviewer.employee_code)}`}
                  alt={selectedReviewer.full_name}
                  width={24}
                  height={24}
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = 'relative w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0';
                      parent.innerHTML = `<span class="text-white text-xs font-medium">${selectedReviewer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>`;
                    }
                  }}
                />
                {selectedReviewer.is_universal && (
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-3 h-3" style={{ color: '#D2BC99' }} />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  <span style={{ color: '#243F7B' }}>{selectedReviewer.employee_code}</span>
                  <span className="text-gray-900"> {selectedReviewer.full_name.split(' ')[0]}</span>
                </span>
              </div>
            </>
          ) : fetchError ? (
            <>
              <X className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Error loading reviewers</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto"
            >
              {/* Loading State */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 mx-auto mb-2" style={{ borderColor: '#243F7B' }}></div>
                  <p className="text-sm text-gray-600">Loading reviewers...</p>
                </div>
              )}

              {/* Error State */}
              {fetchError && (
                <div className="p-4 text-center">
                  <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600 mb-3">{fetchError}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRetry}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200"
                    style={{ backgroundColor: '#243F7B' }}
                  >
                    Try Again
                  </motion.button>
                </div>
              )}

              {/* Reviewers List */}
              {!isLoading && !fetchError && (
                <div className="py-2">
                  {reviewers.length === 0 ? (
                    <div className="p-4 text-center">
                      <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No reviewers available</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Contact your administrator if this seems incorrect
                      </p>
                    </div>
                  ) : (
                    reviewers.map((reviewer) => (
                      <motion.button
                        key={reviewer.id}
                        type="button"
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        onClick={(e) => handleSelect(reviewer, e)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={`/api/photos/${encodeURIComponent(reviewer.employee_code)}`}
                            alt={reviewer.full_name}
                            width={32}
                            height={32}
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.className = 'relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0';
                                parent.innerHTML = `<span class="text-white text-sm font-medium">${reviewer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>`;
                              }
                            }}
                          />
                          {reviewer.is_universal && (
                            <div className="absolute -top-1 -right-1">
                              <Crown className="w-3 h-3" style={{ color: '#D2BC99' }} />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              <span style={{ color: '#243F7B' }}>{reviewer.employee_code}</span>
                              <span className="text-gray-900"> {reviewer.full_name.split(' ')[0]}</span>
                            </p>
                            {value === reviewer.id && (
                              <Check className="w-4 h-4" style={{ color: '#243F7B' }} />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};