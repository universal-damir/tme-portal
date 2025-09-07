'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Type, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  Table,
  Minus,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Check
} from 'lucide-react';
import { CustomPage, ContentBlock, ContentBlockType } from '@/types/company-services';
import { FormSection } from '../../cost-overview/ui/FormSection';

interface CustomPageSectionProps {
  customPages: CustomPage[];
  onChange: (pages: CustomPage[]) => void;
}

export const CustomPageSection: React.FC<CustomPageSectionProps> = ({
  customPages = [],
  onChange
}) => {
  const [enabled, setEnabled] = useState(customPages.length > 0);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set(customPages.length > 0 ? [customPages[0].id] : [])
  );
  const [draggedBlock, setDraggedBlock] = useState<{ pageId: string; blockId: string } | null>(null);

  // Update enabled state when customPages prop changes (e.g., when form is loaded with existing data)
  useEffect(() => {
    const hasPages = customPages.length > 0;
    setEnabled(hasPages);
    
    // If pages exist, expand at least the first one for visibility
    if (hasPages && customPages[0]?.id) {
      setExpandedPages(prev => {
        const newSet = new Set(prev);
        newSet.add(customPages[0].id);
        return newSet;
      });
    }
  }, [customPages.length]); // React to changes in number of pages

  // Generate unique IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle enable/disable
  const handleToggleEnabled = () => {
    if (!enabled) {
      // When enabling, add a default page if none exist
      if (customPages.length === 0) {
        const newPage: CustomPage = {
          id: generateId(),
          enabled: true,
          order: 0,
          blocks: []
        };
        onChange([newPage]);
        setExpandedPages(new Set([newPage.id]));
      }
    }
    setEnabled(!enabled);
  };

  // Add new page
  const addPage = () => {
    const newPage: CustomPage = {
      id: generateId(),
      enabled: true,
      order: customPages.length,
      blocks: []
    };
    onChange([...customPages, newPage]);
    setExpandedPages(new Set([...expandedPages, newPage.id]));
  };

  // Remove page
  const removePage = (pageId: string) => {
    const updatedPages = customPages.filter(p => p.id !== pageId);
    onChange(updatedPages);
    const newExpanded = new Set(expandedPages);
    newExpanded.delete(pageId);
    setExpandedPages(newExpanded);
    
    // Disable section if no pages left
    if (updatedPages.length === 0) {
      setEnabled(false);
    }
  };

  // Update page
  const updatePage = (pageId: string, updates: Partial<CustomPage>) => {
    onChange(customPages.map(p => 
      p.id === pageId ? { ...p, ...updates } : p
    ));
  };

  // Toggle page expansion
  const togglePageExpansion = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  // Add content block to page
  const addBlock = (pageId: string, type: ContentBlockType) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;

    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      order: page.blocks.length,
      content: getDefaultContent(type)
    };

    updatePage(pageId, {
      blocks: [...page.blocks, newBlock]
    });
  };

  // Get default content for block type
  const getDefaultContent = (type: ContentBlockType) => {
    switch (type) {
      case 'heading':
        return { text: 'New Heading' };
      case 'paragraph':
        return { text: 'Enter your text here...' };
      case 'numberedList':
        return { items: ['Item 1', 'Item 2', 'Item 3'] };
      case 'table':
        return {
          table: {
            rows: [
              [{ value: 'Header 1', isHeader: true, align: 'left' }, { value: 'Header 2', isHeader: true, align: 'left' }],
              [{ value: 'Cell 1', isHeader: false, align: 'left' }, { value: 'Cell 2', isHeader: false, align: 'left' }]
            ],
            columnWidths: [50, 50]
          }
        };
      default:
        return {};
    }
  };

  // Update block content
  const updateBlock = (pageId: string, blockId: string, content: any) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;

    updatePage(pageId, {
      blocks: page.blocks.map(b => 
        b.id === blockId ? { ...b, content } : b
      )
    });
  };

  // Remove block
  const removeBlock = (pageId: string, blockId: string) => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;

    updatePage(pageId, {
      blocks: page.blocks.filter(b => b.id !== blockId)
    });
  };

  // Move block up/down
  const moveBlock = (pageId: string, blockId: string, direction: 'up' | 'down') => {
    const page = customPages.find(p => p.id === pageId);
    if (!page) return;

    const blockIndex = page.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newBlocks = [...page.blocks];
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;

    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    [newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]];
    
    // Update order numbers
    newBlocks.forEach((block, index) => {
      block.order = index;
    });

    updatePage(pageId, { blocks: newBlocks });
  };

  // Render content block editor
  const renderBlockEditor = (page: CustomPage, block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => updateBlock(page.id, block.id, {
              ...block.content,
              text: e.target.value
            })}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
            style={{ fontFamily: 'Inter, sans-serif' }}
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            placeholder="Enter heading text"
          />
        );

      case 'paragraph':
        return (
          <textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlock(page.id, block.id, {
              ...block.content,
              text: e.target.value
            })}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200 min-h-[100px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
            onFocus={(e) => e.target.style.borderColor = '#243F7B'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            placeholder="Enter paragraph text"
          />
        );

      case 'numberedList':
        return (
          <div className="space-y-2">
            {(block.content.items || []).map((item, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-sm font-medium mt-2" style={{ color: '#243F7B' }}>
                  {`${index + 1}.`}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...(block.content.items || [])];
                    newItems[index] = e.target.value;
                    updateBlock(page.id, block.id, {
                      ...block.content,
                      items: newItems
                    });
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder={`Item ${index + 1}`}
                />
                <button
                  onClick={() => {
                    const newItems = (block.content.items || []).filter((_, i) => i !== index);
                    updateBlock(page.id, block.id, {
                      ...block.content,
                      items: newItems
                    });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newItems = [...(block.content.items || []), ''];
                updateBlock(page.id, block.id, {
                  ...block.content,
                  items: newItems
                });
              }}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: '#243F7B' }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Item
            </button>
          </div>
        );

      case 'table':
        const tableData = block.content.table || { rows: [], columnWidths: [] };
        return (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-1">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={cell.value}
                              onChange={(e) => {
                                const newRows = [...tableData.rows];
                                newRows[rowIndex][cellIndex] = {
                                  ...cell,
                                  value: e.target.value
                                };
                                updateBlock(page.id, block.id, {
                                  ...block.content,
                                  table: { ...tableData, rows: newRows }
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none transition-all duration-200"
                              style={{ 
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: cell.isHeader ? 600 : 400
                              }}
                              onFocus={(e) => e.target.style.borderColor = '#243F7B'}
                              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                              placeholder={cell.isHeader ? 'Header' : 'Cell'}
                            />
                            <div className="flex items-center gap-2">
                              {/* Alignment buttons */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    const newRows = [...tableData.rows];
                                    newRows[rowIndex][cellIndex] = {
                                      ...cell,
                                      align: 'left'
                                    };
                                    updateBlock(page.id, block.id, {
                                      ...block.content,
                                      table: { ...tableData, rows: newRows }
                                    });
                                  }}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    (cell.align || 'left') === 'left' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'hover:bg-gray-100 text-gray-600'
                                  }`}
                                  title="Align Left"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newRows = [...tableData.rows];
                                    newRows[rowIndex][cellIndex] = {
                                      ...cell,
                                      align: 'center'
                                    };
                                    updateBlock(page.id, block.id, {
                                      ...block.content,
                                      table: { ...tableData, rows: newRows }
                                    });
                                  }}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    cell.align === 'center' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'hover:bg-gray-100 text-gray-600'
                                  }`}
                                  title="Align Center"
                                >
                                  <AlignCenter className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newRows = [...tableData.rows];
                                    newRows[rowIndex][cellIndex] = {
                                      ...cell,
                                      align: 'right'
                                    };
                                    updateBlock(page.id, block.id, {
                                      ...block.content,
                                      table: { ...tableData, rows: newRows }
                                    });
                                  }}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    cell.align === 'right' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'hover:bg-gray-100 text-gray-600'
                                  }`}
                                  title="Align Right"
                                >
                                  <AlignRight className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Header checkbox */}
                              <label className="flex items-center gap-1 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={cell.isHeader || false}
                                  onChange={(e) => {
                                    const newRows = [...tableData.rows];
                                    newRows[rowIndex][cellIndex] = {
                                      ...cell,
                                      isHeader: e.target.checked
                                    };
                                    updateBlock(page.id, block.id, {
                                      ...block.content,
                                      table: { ...tableData, rows: newRows }
                                    });
                                  }}
                                  className="w-3 h-3"
                                />
                                Header
                              </label>
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="p-1 align-top">
                        <button
                          onClick={() => {
                            const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
                            updateBlock(page.id, block.id, {
                              ...block.content,
                              table: { ...tableData, rows: newRows }
                            });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const columnCount = tableData.rows[0]?.length || 2;
                  const newRow = Array(columnCount).fill(null).map(() => ({
                    value: '',
                    isHeader: false,
                    align: 'left' as const
                  }));
                  updateBlock(page.id, block.id, {
                    ...block.content,
                    table: {
                      ...tableData,
                      rows: [...tableData.rows, newRow]
                    }
                  });
                }}
                className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#243F7B' }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Row
              </button>
              <button
                onClick={() => {
                  const newRows = tableData.rows.map(row => [
                    ...row,
                    { value: '', isHeader: false, align: 'left' as const }
                  ]);
                  updateBlock(page.id, block.id, {
                    ...block.content,
                    table: { ...tableData, rows: newRows }
                  });
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#D2BC99', color: '#243F7B' }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Column
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FormSection 
      title="Custom Pages" 
      isOptional={true}
      defaultOpen={enabled}
    >
      <div className="space-y-4">
        {/* Enable/Disable Checkbox */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleToggleEnabled}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-left flex items-center focus:outline-none transition-all duration-200 h-[42px]"
          style={{ 
            fontFamily: 'Inter, sans-serif',
            borderColor: enabled ? '#243F7B' : '#e5e7eb'
          }}
          onFocus={(e) => e.target.style.borderColor = '#243F7B'}
          onBlur={(e) => e.target.style.borderColor = enabled ? '#243F7B' : '#e5e7eb'}
        >
          <div className="flex items-center space-x-3 w-full">
            <div 
              className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center"
              style={{ 
                borderColor: enabled ? '#243F7B' : '#d1d5db',
                backgroundColor: enabled ? '#243F7B' : 'white'
              }}
            >
              {enabled && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-medium text-gray-900 text-sm">
              Add custom pages to PDF
            </span>
          </div>
        </motion.button>

        {/* Custom Pages Content - Only shown when enabled */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {customPages.map((page, pageIndex) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border-2 border-gray-200 rounded-lg overflow-hidden"
                  style={{ borderColor: expandedPages.has(page.id) ? '#243F7B' : '#e5e7eb' }}
                >
                  {/* Page Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => togglePageExpansion(page.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
                      >
                        {expandedPages.has(page.id) ? (
                          <ChevronUp className="w-5 h-5" style={{ color: '#243F7B' }} />
                        ) : (
                          <ChevronDown className="w-5 h-5" style={{ color: '#243F7B' }} />
                        )}
                      </button>
                      <span className="font-medium text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Custom Page {pageIndex + 1}
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => updatePage(page.id, { enabled: !page.enabled })}
                          className="p-2 hover:bg-gray-200 rounded transition-all duration-200"
                          title={page.enabled ? 'Hide from PDF' : 'Show in PDF'}
                        >
                          {page.enabled ? (
                            <Eye className="w-5 h-5" style={{ color: '#243F7B' }} />
                          ) : (
                            <EyeOff className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => removePage(page.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Page Content */}
                  <AnimatePresence>
                    {expandedPages.has(page.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 py-4 space-y-4"
                      >
                        {/* Content Blocks */}
                        {page.blocks.map((block, blockIndex) => (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-gray-50 rounded-lg space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GripVertical className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-medium" style={{ color: '#243F7B' }}>
                                  {block.type.charAt(0).toUpperCase() + block.type.slice(1).replace(/([A-Z])/g, ' $1')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => moveBlock(page.id, block.id, 'up')}
                                  disabled={blockIndex === 0}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveBlock(page.id, block.id, 'down')}
                                  disabled={blockIndex === page.blocks.length - 1}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeBlock(page.id, block.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-all duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {renderBlockEditor(page, block)}
                          </motion.div>
                        ))}

                        {/* Add Block Buttons */}
                        <div className="flex flex-wrap gap-2 pt-4">
                          <button
                            onClick={() => addBlock(page.id, 'heading')}
                            className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 flex items-center gap-2"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <Type className="w-4 h-4" />
                            Heading
                          </button>
                          <button
                            onClick={() => addBlock(page.id, 'paragraph')}
                            className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 flex items-center gap-2"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <AlignLeft className="w-4 h-4" />
                            Paragraph
                          </button>
                          <button
                            onClick={() => addBlock(page.id, 'numberedList')}
                            className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 flex items-center gap-2"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <ListOrdered className="w-4 h-4" />
                            Numbered List
                          </button>
                          <button
                            onClick={() => addBlock(page.id, 'table')}
                            className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 flex items-center gap-2"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <Table className="w-4 h-4" />
                            Table
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {/* Add Page Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addPage}
                  className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                  style={{ backgroundColor: '#243F7B', fontSize: '14px' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Another Custom Page
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormSection>
  );
};