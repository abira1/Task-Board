import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useServices } from '../contexts/ServiceContext';
import { QuotationItem } from '../contexts/QuotationContext';

interface ServiceSelectorProps {
  onServiceSelect: (service: {
    id: string;
    name: string;
    description: string;
    defaultPrice: number;
  }) => void;
  disabled?: boolean;
  className?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  onServiceSelect,
  disabled = false,
  className = ''
}) => {
  const { activeServices, loading } = useServices();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter services based on search term
  const filteredServices = activeServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group services by category
  const groupedServices = filteredServices.reduce((groups, service) => {
    const category = service.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, typeof filteredServices>);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleServiceSelect = (service: typeof activeServices[0]) => {
    onServiceSelect({
      id: service.id,
      name: service.name,
      description: service.description,
      defaultPrice: service.defaultPrice
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <button
          disabled
          className="w-full px-4 py-3 bg-[#f5f0e8] text-[#7a7067] rounded-lg border border-[#f5f0e8] flex items-center justify-center"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#d4a5a5] mr-2"></div>
          Loading services...
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors flex items-center justify-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Services
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#f5f0e8] rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-[#f5f0e8]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7a7067]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] text-sm"
              />
            </div>
          </div>

          {/* Services List */}
          <div className="max-h-60 overflow-y-auto">
            {Object.keys(groupedServices).length === 0 ? (
              <div className="p-4 text-center text-[#7a7067]">
                {searchTerm ? 'No services match your search' : 'No active services available'}
              </div>
            ) : (
              Object.entries(groupedServices).map(([category, services]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-4 py-2 bg-[#f9f6f1] border-b border-[#f5f0e8]">
                    <h4 className="text-xs font-medium text-[#7a7067] uppercase tracking-wider">
                      {category}
                    </h4>
                  </div>

                  {/* Services in Category */}
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service)}
                      className="w-full px-4 py-3 text-left hover:bg-[#f9f6f1] transition-colors border-b border-[#f5f0e8] last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#3a3226] truncate">
                            {service.name}
                          </div>
                          <div className="text-xs text-[#7a7067] mt-1 line-clamp-2">
                            {service.description}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <span className="text-sm font-medium text-[#d4a5a5]">
                            ${service.defaultPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {activeServices.length > 0 && (
            <div className="p-3 border-t border-[#f5f0e8] bg-[#f9f6f1]">
              <p className="text-xs text-[#7a7067] text-center">
                {activeServices.length} service{activeServices.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
