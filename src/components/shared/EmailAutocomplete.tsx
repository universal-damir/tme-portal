'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Mail, Building2, User } from 'lucide-react';

interface TeamMember {
  email: string;
  name: string;
  department: string;
  designation: string;
  label: string;
}

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const EmailAutocomplete: React.FC<EmailAutocompleteProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = "Enter email addresses...",
  className = "",
  autoFocus = false
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [suggestions, setSuggestions] = useState<TeamMember[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Parse current input to get the email being typed
  useEffect(() => {
    const emails = value.split(',').map(e => e.trim());
    const lastEmail = emails[emails.length - 1];
    setCurrentInput(lastEmail);

    // Show suggestions if typing and has at least 2 characters
    if (lastEmail.length >= 2) {
      const filtered = teamMembers.filter(member => 
        member.email.toLowerCase().includes(lastEmail.toLowerCase()) ||
        member.name.toLowerCase().includes(lastEmail.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, teamMembers]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = useCallback((member: TeamMember) => {
    const emails = value.split(',').map(e => e.trim());
    emails[emails.length - 1] = member.email;
    const newValue = emails.join(', ') + ', ';
    onChange(newValue);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (onKeyDown) {
        onKeyDown(e);
      }
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, onKeyDown]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 h-[42px] ${className}`}
        onFocus={(e) => {
          e.target.style.borderColor = '#243F7B';
          // Show all team members if field is empty or only has commas/spaces
          const trimmedValue = value.replace(/,\s*/g, '').trim();
          if (trimmedValue.length === 0 && teamMembers.length > 0) {
            setSuggestions(teamMembers.slice(0, 10)); // Show first 10 members
            setShowSuggestions(true);
          }
        }}
        autoFocus={autoFocus}
      />
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border-2"
            style={{ borderColor: '#243F7B', maxHeight: '240px', overflowY: 'auto' }}
          >
            {suggestions.map((member, index) => (
              <motion.div
                key={member.email}
                whileHover={{ backgroundColor: '#f3f4f6' }}
                onClick={() => selectSuggestion(member)}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
                style={{
                  backgroundColor: index === selectedIndex ? '#f3f4f6' : undefined
                }}
              >
                <div className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#243F7B' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: '#243F7B' }}>
                        {member.name}
                      </span>
                      {member.designation && (
                        <span className="text-xs text-gray-500">
                          {member.designation}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-600">
                        {member.email}
                      </span>
                      {member.department && (
                        <span className="text-xs px-2 py-0.5 rounded-full" 
                          style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}>
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>
                  {value.includes(member.email) && (
                    <Check size={16} className="flex-shrink-0" style={{ color: '#10b981' }} />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300" 
            style={{ borderTopColor: '#243F7B' }} />
        </div>
      )}
    </div>
  );
};

export default EmailAutocomplete;