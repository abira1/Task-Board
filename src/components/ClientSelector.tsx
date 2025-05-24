import React, { useState, useEffect } from 'react';
import { Client, useClients } from '../contexts/ClientContext';
import { SearchIcon, UserIcon, BuildingIcon, XIcon } from 'lucide-react';
import Avatar from './Avatar';

interface ClientSelectorProps {
  selectedClientId?: string;
  onClientSelect: (client: Client) => void;
  disabled?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientSelect,
  disabled = false
}) => {
  const { clients, loading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.companyName.toLowerCase().includes(searchLower) ||
      (client.contactPersonName && client.contactPersonName.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    );
  });

  // Set initial selected client if selectedClientId is provided
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [selectedClientId, clients]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    onClientSelect(client);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    setSearchTerm('');
    // Notify parent component that no client is selected
    onClientSelect(null as any);
  };

  return (
    <div className="relative">
      <label className="block text-[#3a3226] text-sm font-medium mb-2">
        Client
      </label>
      
      {selectedClient ? (
        <div className="flex items-center justify-between bg-[#f5f0e8] rounded-lg p-3 border border-[#f5f0e8]">
          <div className="flex items-center">
            {selectedClient.handledBy?.avatar ? (
              <Avatar
                src={selectedClient.handledBy.avatar}
                alt={selectedClient.handledBy.name}
                size="sm"
                className="mr-3"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#d4a5a5] flex items-center justify-center text-white mr-3">
                <BuildingIcon className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="font-medium text-[#3a3226]">{selectedClient.companyName}</p>
              {selectedClient.contactPersonName && (
                <p className="text-sm text-[#7a7067]">{selectedClient.contactPersonName}</p>
              )}
            </div>
          </div>
          
          {!disabled && (
            <button
              onClick={handleClearSelection}
              className="text-[#7a7067] hover:text-[#3a3226]"
              title="Clear selection"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-[#7a7067]" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-[#f5f0e8] rounded-lg border border-[#f5f0e8] focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.length > 0) {
                setShowDropdown(true);
              } else {
                setShowDropdown(false);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Dropdown for client selection */}
      {showDropdown && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[#7a7067]">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-4 text-center text-[#7a7067]">
              {searchTerm ? 'No clients found' : 'Start typing to search clients'}
            </div>
          ) : (
            <ul>
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  className="cursor-pointer hover:bg-[#f5f0e8] transition-colors"
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="flex items-center p-3">
                    {client.handledBy?.avatar ? (
                      <Avatar
                        src={client.handledBy.avatar}
                        alt={client.handledBy.name}
                        size="sm"
                        className="mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#d4a5a5] flex items-center justify-center text-white mr-3">
                        <BuildingIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[#3a3226]">{client.companyName}</p>
                      {client.contactPersonName && (
                        <p className="text-sm text-[#7a7067]">{client.contactPersonName}</p>
                      )}
                      {client.email && (
                        <p className="text-xs text-[#7a7067]">{client.email}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
