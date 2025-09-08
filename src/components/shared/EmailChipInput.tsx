'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User } from 'lucide-react';
import Image from 'next/image';

interface TeamMember {
  email: string;
  name: string;
  department: string;
  designation: string;
  employeeCode?: string;
  photoUrl?: string;
  label: string;
}

interface EmailChip {
  email: string;
  name: string;
  isTeamMember: boolean;
  employeeCode?: string;
  photoUrl?: string;
}

interface EmailChipInputProps {
  value: string; // Comma-separated emails
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  fieldId?: string; // Unique identifier for each field
}

// Function to get initials from name or email
const getInitials = (name: string): string => {
  // Check if it's an email address
  if (name.includes('@')) {
    // For emails, use first two characters of the email
    return name.substring(0, 2).toUpperCase();
  }
  
  // For names, use first and last name initials
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Photo Avatar Component
interface PhotoAvatarProps {
  photoUrl?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md';
  isTeamMember?: boolean;
}

const PhotoAvatar: React.FC<PhotoAvatarProps> = ({ photoUrl, name, size = 'sm', isTeamMember }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base'
  };
  
  if (photoUrl && !imageError && isTeamMember) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
        <Image
          src={photoUrl}
          alt={name}
          width={size === 'xs' ? 24 : size === 'sm' ? 32 : 40}
          height={size === 'xs' ? 24 : size === 'sm' ? 32 : 40}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  
  // Fallback to initials for team members, simple icon for external emails
  if (!isTeamMember) {
    // Minimal blue email icon for non-team members
    return (
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Mail size={size === 'xs' ? 16 : size === 'sm' ? 18 : 20} style={{ color: '#243F7B' }} />
      </div>
    );
  }
  
  // Colored initials for team members without photos
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: getColorFromName(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

// Function to generate color based on name
const getColorFromName = (name: string): string => {
  const colors = [
    '#243F7B', '#D2BC99', '#4B5563', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const EmailChipInput: React.FC<EmailChipInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "Type email address...",
  className = "",
  autoFocus = false,
  fieldId = ""
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [suggestions, setSuggestions] = useState<TeamMember[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [emailChips, setEmailChips] = useState<EmailChip[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/team/emails');
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.teamEmails || []);
        }
      } catch (error) {
        console.error('Failed to fetch team emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Parse value prop into email chips
  useEffect(() => {
    const emails = value.split(',').map(e => e.trim()).filter(e => e);
    const chips: EmailChip[] = emails.map(email => {
      const teamMember = teamMembers.find(m => m.email === email);
      return {
        email,
        name: teamMember?.name || email, // Show full email for non-team members
        isTeamMember: !!teamMember,
        employeeCode: teamMember?.employeeCode,
        photoUrl: teamMember?.photoUrl
      };
    });
    setEmailChips(chips);
  }, [value, teamMembers]);

  // Update suggestions based on input
  useEffect(() => {
    if (inputValue.length >= 2) {
      // Show suggestions only after 2+ characters are typed
      const filtered = teamMembers.filter(member => {
        // Don't suggest already added emails
        if (emailChips.some(chip => chip.email === member.email)) {
          return false;
        }
        return member.email.toLowerCase().includes(inputValue.toLowerCase()) ||
               member.name.toLowerCase().includes(inputValue.toLowerCase());
      });
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      // Don't show suggestions for less than 2 characters
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [inputValue, teamMembers, emailChips]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        // Add current input as email if valid
        if (inputValue && inputValue.includes('@')) {
          addEmail(inputValue);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue]);

  const addEmail = useCallback((email: string) => {
    if (!email || !email.includes('@')) return;
    
    const teamMember = teamMembers.find(m => m.email === email);
    const newChip: EmailChip = {
      email,
      name: teamMember?.name || email, // Show full email for non-team members
      isTeamMember: !!teamMember,
      employeeCode: teamMember?.employeeCode,
      photoUrl: teamMember?.photoUrl
    };

    const updatedChips = [...emailChips, newChip];
    const newValue = updatedChips.map(c => c.email).join(', ');
    onChange(newValue);
    setInputValue('');
    setShowSuggestions(false);
  }, [emailChips, teamMembers, onChange]);

  const removeEmail = useCallback((index: number) => {
    const updatedChips = emailChips.filter((_, i) => i !== index);
    const newValue = updatedChips.map(c => c.email).join(', ');
    onChange(newValue);
  }, [emailChips, onChange]);

  const selectSuggestion = useCallback((member: TeamMember) => {
    addEmail(member.email);
    inputRef.current?.focus();
  }, [addEmail]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && emailChips.length > 0) {
      // Remove last chip when backspace on empty input
      removeEmail(emailChips.length - 1);
    } else if (e.key === 'Enter' || e.key === ',' || (e.key === 'Tab' && inputValue.includes('@'))) {
      // Add support for Tab key when typing an email
      if (e.key === 'Tab' && !inputValue.includes('@')) {
        return; // Let Tab work normally if not typing an email
      }
      e.preventDefault();
      if (showSuggestions && selectedIndex >= 0) {
        selectSuggestion(suggestions[selectedIndex]);
      } else if (inputValue && inputValue.includes('@')) {
        addEmail(inputValue);
      }
    } else if (e.key === ' ' && inputValue.includes('@') && !inputValue.includes(' ')) {
      // Add email when pressing space after a valid email
      e.preventDefault();
      addEmail(inputValue);
    } else if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }
  }, [inputValue, emailChips, showSuggestions, selectedIndex, suggestions, removeEmail, selectSuggestion, addEmail]);

  const handleInputFocus = () => {
    // Only show suggestions if user has typed 2+ characters
    if (inputValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div 
        className={`min-h-[42px] px-2 py-1 rounded-lg border-2 border-gray-200 focus-within:border-[#243F7B] transition-all duration-200 ${className}`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Email Chips */}
          <AnimatePresence>
            {emailChips.map((chip, index) => (
              <motion.div
                key={`${chip.email}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 group hover:bg-blue-100 transition-colors"
                style={{ borderColor: '#243F7B20' }}
              >
                {/* Profile Photo/Initial */}
                <PhotoAvatar 
                  photoUrl={chip.photoUrl}
                  name={chip.name}
                  size="xs"
                  isTeamMember={chip.isTeamMember}
                />
                
                {/* Name */}
                <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                  {chip.name}
                </span>
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeEmail(index);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-red-100 transition-colors"
                >
                  <X size={14} className="text-gray-500 hover:text-red-500" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setIsFocused(true);
              handleInputFocus();
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={emailChips.length === 0 ? placeholder : "Type email and press Enter or comma..."}
            className="flex-1 min-w-[200px] outline-none bg-transparent text-sm py-1"
            autoFocus={autoFocus}
          />
        </div>
      </div>

      {/* Helper text for email input - only show when this field is focused */}
      <AnimatePresence>
        {isFocused && inputValue.length > 0 && !showSuggestions && inputValue.includes('@') && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-40 mt-1 px-3 py-2 rounded-lg border text-xs right-0"
            style={{ backgroundColor: '#D2BC9910', borderColor: '#D2BC99' }}
          >
            <span style={{ color: '#243F7B' }}>
              Press <kbd className="px-1.5 py-0.5 mx-1 bg-white rounded border border-gray-300 font-mono text-xs">Enter</kbd> 
              <kbd className="px-1.5 py-0.5 mx-1 bg-white rounded border border-gray-300 font-mono text-xs">Tab</kbd>
              <kbd className="px-1.5 py-0.5 mx-1 bg-white rounded border border-gray-300 font-mono text-xs">Space</kbd> 
              or <kbd className="px-1.5 py-0.5 mx-1 bg-white rounded border border-gray-300 font-mono text-xs">,</kbd> 
              to add
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border-2"
            style={{ borderColor: '#243F7B', maxHeight: '280px', overflowY: 'auto' }}
          >
            <div className="p-2 border-b text-xs text-gray-500 font-medium">
              Suggested Contacts
            </div>
            {suggestions.map((member, index) => (
              <motion.div
                key={member.email}
                whileHover={{ backgroundColor: '#f9fafb' }}
                onClick={() => selectSuggestion(member)}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? 'bg-gray-50' : ''
                }`}
              >
                {/* Profile Photo/Initial */}
                <PhotoAvatar 
                  photoUrl={member.photoUrl}
                  name={member.name}
                  size="md"
                  isTeamMember={true}
                />
                
                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: '#243F7B' }}>
                    {member.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {member.email}
                  </div>
                  {member.designation && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {member.designation} • {member.department}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300" 
            style={{ borderTopColor: '#243F7B' }} />
        </div>
      )}
    </div>
  );
};

export default EmailChipInput;