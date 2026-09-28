import React from 'react';

export interface CategorySelectProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`px-2 py-1.5 bg-[#1e1e1e] border-b border-[#2e2e2e] ${className}`}>
      <select
        value={selectedCategory}
        onChange={(e) => onSelectCategory(e.target.value)}
        data-testid="category-select"
        aria-label="Filter Node Styles by Category"
        className="w-full bg-[#252525] border border-[#383838] text-slate-200 text-xs px-2 py-1 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        {/* Desktop TikZiT Parity (tikzstyles.cpp:141-152, stylepalette.cpp:233):
            Empty string "" entry represents all categories */}
        <option value="">(all)</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
};
