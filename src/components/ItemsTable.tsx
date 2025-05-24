import React, { useState } from 'react';
import { PlusIcon, Trash2Icon, EditIcon, CheckIcon, XIcon } from 'lucide-react';

export interface Item {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount: number;
}

interface ItemsTableProps {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  readOnly?: boolean;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ 
  items, 
  onItemsChange,
  readOnly = false
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleAddItem = () => {
    const newItem: Item = {
      id: `item_${Date.now()}`,
      description: '',
      quantity: 1,
      unit: '',
      rate: 0,
      amount: 0
    };
    
    onItemsChange([...items, newItem]);
    setEditingItemId(newItem.id);
    setEditingItem(newItem);
  };

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setEditingItem({ ...item });
  };

  const handleDeleteItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    
    // Calculate amount
    const amount = editingItem.quantity * editingItem.rate;
    const updatedItem = { ...editingItem, amount };
    
    // Update items array
    onItemsChange(
      items.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
    
    // Reset editing state
    setEditingItemId(null);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItem(null);
  };

  const handleEditingItemChange = (field: keyof Item, value: any) => {
    if (!editingItem) return;
    
    const updatedItem = { ...editingItem, [field]: value };
    
    // Auto-calculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : editingItem.quantity;
      const rate = field === 'rate' ? parseFloat(value) || 0 : editingItem.rate;
      updatedItem.amount = quantity * rate;
    }
    
    setEditingItem(updatedItem);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#f5f0e8]">
        <thead className="bg-[#f5f0e8]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#3a3226] uppercase tracking-wider">Description</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[#3a3226] uppercase tracking-wider w-20">Quantity</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[#3a3226] uppercase tracking-wider w-20">Unit</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider w-24">Rate</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider w-24">Amount</th>
            {!readOnly && (
              <th className="px-4 py-3 text-right text-xs font-medium text-[#3a3226] uppercase tracking-wider w-20">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#f5f0e8]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[#f9f6f1]">
              {editingItemId === item.id ? (
                // Editing mode
                <>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-[#d4a5a5] rounded focus:outline-none focus:ring-1 focus:ring-[#d4a5a5]"
                      value={editingItem?.description || ''}
                      onChange={(e) => handleEditingItemChange('description', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-full px-2 py-1 bg-white border border-[#d4a5a5] rounded focus:outline-none focus:ring-1 focus:ring-[#d4a5a5] text-center"
                      value={editingItem?.quantity || 0}
                      onChange={(e) => handleEditingItemChange('quantity', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-[#d4a5a5] rounded focus:outline-none focus:ring-1 focus:ring-[#d4a5a5] text-center"
                      value={editingItem?.unit || ''}
                      onChange={(e) => handleEditingItemChange('unit', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-2 py-1 bg-white border border-[#d4a5a5] rounded focus:outline-none focus:ring-1 focus:ring-[#d4a5a5] text-right"
                      value={editingItem?.rate || 0}
                      onChange={(e) => handleEditingItemChange('rate', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${editingItem?.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={handleSaveItem}
                      className="text-green-600 hover:text-green-800 mr-2"
                      title="Save"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </td>
                </>
              ) : (
                // View mode
                <>
                  <td className="px-4 py-3 text-sm text-[#3a3226]">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-center text-[#3a3226]">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-center text-[#7a7067]">{item.unit || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#3a3226]">${item.rate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#3a3226]">${item.amount.toFixed(2)}</td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-[#3a3226] hover:text-[#d4a5a5] mr-2"
                        title="Edit Item"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[#3a3226] hover:text-red-500"
                        title="Delete Item"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {!readOnly && (
        <div className="mt-4">
          <button
            onClick={handleAddItem}
            className="inline-flex items-center px-3 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Item
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemsTable;
