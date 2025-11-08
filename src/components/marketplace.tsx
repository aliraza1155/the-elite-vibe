import React from 'react';
import Link from 'next/link';
import { AIModel } from '@/types';

// Model Card Component
interface ModelCardProps {
  model: AIModel;
  onView: (model: AIModel) => void;
  onPurchase?: (model: AIModel) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onView }) => {
  const totalImages = model.media.sfw.images + model.media.nsfw.images;
  const totalVideos = model.media.sfw.videos.total + model.media.nsfw.videos.total;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Media Preview */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500 overflow-hidden">
        {model.files.sfw.images[0] ? (
          <img src={model.files.sfw.images[0]} alt={model.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="font-semibold">AI Model</span>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            model.status === 'approved' 
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
              : model.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
          </span>
        </div>

        {/* Niche Badge */}
        <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
          {model.niche}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">{model.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{model.description}</p>

        {/* Media Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-green-600 dark:text-green-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
            <span className="text-sm">{totalImages} Images</span>
          </div>
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{totalVideos} Videos</span>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Framework:</span>
            <span className="font-medium">{model.technicalSpecs.framework}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Size:</span>
            <span className="font-medium">{model.technicalSpecs.modelSize}</span>
          </div>
        </div>

        {/* Pricing & Action */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">${model.pricing.amount}/month</div>
          <button onClick={() => onView(model)} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 font-medium text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Filter Section Component
interface FilterSectionProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ filters, onFilterChange }) => {
  const niches = ['Art & Design', 'Photography', 'Writing', 'Coding', 'Music', 'Video', '3D Modeling', 'Animation', 'Game Development', 'Business', 'Marketing', 'Other'];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">Filters</h3>
      
      {/* Niche Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Niche</label>
        <select 
          value={filters.niche || ''}
          onChange={(e) => onFilterChange({ ...filters, niche: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Niches</option>
          {niches.map(niche => (
            <option key={niche} value={niche}>{niche}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
        <div className="flex space-x-2">
          <input 
            type="number" 
            placeholder="Min" 
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
          />
          <input 
            type="number" 
            placeholder="Max" 
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
        <select 
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );
};

// Search Bar Component
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, placeholder = "Search AI models..." }) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  );
};