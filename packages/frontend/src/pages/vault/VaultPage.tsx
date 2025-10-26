// src/pages/VaultPage.tsx

import { useCallback, useEffect, useState, useMemo } from "react";
import { useVaultStore } from "@/state/vaultStore";
import api from "@/lib/api";
import type { VaultItem, DecryptedVaultItem } from "@/types";
import { toast } from "sonner";
import { VaultItemCard } from "@/components/VaultItemCard";
import { Button } from "@/components/ui/button";
import { VaultItemForm } from "@/components/VaultItemForm";
import { Loader2, Plus, Grid, List, Search, Lock, Star, Shield, TrendingUp } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useAuthStore } from "@/state/authStore";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const categories = ['All', 'Development', 'Email', 'Cloud', 'Finance', 'Social', 'Work', 'Personal', 'Other'];

export function VaultPage() {
  const { decryptedItems, isLoading, error, setEncryptedItems, removeDecryptedItem } = useVaultStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [itemToDelete, setItemToDelete] = useState<DecryptedVaultItem | null>(null);

  const fetchVault = useCallback(async () => {
    try {
      const response = await api.get<VaultItem[]>('/vault');
      await setEncryptedItems(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch vault.');
    }
  }, [setEncryptedItems]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);
  
  const handleEdit = (item: DecryptedVaultItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  }

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/vault/${itemToDelete.id}`);
      removeDecryptedItem(itemToDelete.id);
      toast.success(`"${itemToDelete.decryptedData.title}" deleted successfully.`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete item.");
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredItems = useMemo(() => {
    return decryptedItems.filter(item => {
      if (item.decryptionError) return true; // Always show decryption errors
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = item.decryptedData.title.toLowerCase().includes(lowerQuery) ||
                            item.decryptedData.username.toLowerCase().includes(lowerQuery) ||
                            (item.decryptedData.url && item.decryptedData.url.toLowerCase().includes(lowerQuery));
      const matchesCategory = selectedCategory === 'All' || item.decryptedData.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [decryptedItems, searchQuery, selectedCategory]);
  
  const favoriteItems = useMemo(() => decryptedItems.filter(item => !item.decryptionError && item.decryptedData.favorite), [decryptedItems]);

  return (
    <div className="relative min-h-screen text-white bg-slate-950">
      <AnimatedBackground />
      <div className="container mx-auto px-4 sm:px-6 py-8 relative z-10">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2"><Lock className="w-8 h-8 text-blue-400" /><span className="text-3xl font-bold text-white">{decryptedItems.length}</span></div>
            <p className="text-sm text-gray-400">Total Items</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2"><Star className="w-8 h-8 text-purple-400" /><span className="text-3xl font-bold text-white">{favoriteItems.length}</span></div>
            <p className="text-sm text-gray-400">Favorites</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2"><Shield className="w-8 h-8 text-green-400" /><span className="text-3xl font-bold text-white">100%</span></div>
            <p className="text-sm text-gray-400">Secure (Placeholder)</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2"><TrendingUp className="w-8 h-8 text-yellow-400" /><span className="text-3xl font-bold text-white">+0</span></div>
            <p className="text-sm text-gray-400">This Month (Placeholder)</p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search passwords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" />
          </div>
          <div className="flex gap-3">
            <div className="flex bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-1">
              <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Grid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
            <Button onClick={handleAddNew} className="px-6 py-4 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-500/25">
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Add Item</span>
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${selectedCategory === category ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/50 border border-slate-700/50'}`}>
                {category}
                </button>
            ))}
        </div>

        <VaultItemForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} itemToEdit={editingItem} />

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="ml-4 text-lg">Decrypting your vault...</p>
          </div>
        )}
        {error && <p className="text-red-400 text-center">{error}</p>}

        {!isLoading && !error && (
            <>
                {/* Favorites Section */}
                {favoriteItems.length > 0 && selectedCategory === 'All' && !searchQuery && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <h2 className="text-xl font-bold text-white">Favorites</h2>
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {favoriteItems.map(item => (
                                <VaultItemCard key={item.id} item={item} viewMode={viewMode} onEdit={handleEdit} onDelete={setItemToDelete} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Items Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">{searchQuery ? 'Search Results' : selectedCategory === 'All' ? 'All Items' : selectedCategory}</h2>
                        <span className="text-sm text-gray-400">{filteredItems.length} items</span>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
                            <p className="text-gray-400 mb-6">{searchQuery ? 'Try adjusting your search' : 'Add your first password to get started'}</p>
                            <Button onClick={handleAddNew} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-medium transition-all hover:scale-105 inline-flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Add Your First Item
                            </Button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {filteredItems.map(item => (
                                <VaultItemCard key={item.id} item={item} viewMode={viewMode} onEdit={handleEdit} onDelete={setItemToDelete} />
                            ))}
                        </div>
                    )}
                </div>
            </>
        )}

        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the vault item for "{itemToDelete?.decryptedData.title}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}