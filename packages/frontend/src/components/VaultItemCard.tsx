// src/components/VaultItemCard.tsx

import { useState } from 'react';
import type { DecryptedVaultItem } from '@/types';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Check, Copy, Edit2, Eye, EyeOff, Globe, KeyRound, Shield, Star, Trash2, User } from 'lucide-react';

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  viewMode: 'grid' | 'list';
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export function VaultItemCard({ item, viewMode, onEdit, onDelete }: VaultItemCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);
  const copyToClipboard = useCopyToClipboard();
  
  const handleCopy = (text: string, type: 'username' | 'password') => {
    copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (item.decryptionError) {
    return (
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-red-400">Decryption Failed</h3>
            <p className="text-sm text-red-400/80">Could not decrypt this item. The data may be corrupt or the vault key is incorrect.</p>
        </div>
    );
  }
  
  const { title, username, password, url, category, favorite } = item.decryptedData;

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <div className="group relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
                {favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              </div>
              <p className="text-sm text-gray-400 truncate">{username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleCopy(username, 'username')} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors" title="Copy username">
              {copied === 'username' ? <Check className="w-4 h-4 text-green-400" /> : <User className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={() => handleCopy(password, 'password')} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors" title="Copy password">
              {copied === 'password' ? <Check className="w-4 h-4 text-green-400" /> : <KeyRound className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={() => onEdit(item)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors" title="Edit Item">
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={() => onDelete(item)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Item">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GRID VIEW (DEFAULT)
  return (
    <div className="group relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
                {favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              </div>
              {category && <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-md mt-1">{category}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(item)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-110" title="Edit Item">
              <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-400" />
            </button>
            <button onClick={() => onDelete(item)} className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110" title="Delete Item">
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group/item hover:border-blue-500/30 transition-colors">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-300 font-mono truncate">{username}</span>
            <button onClick={() => handleCopy(username, 'username')} className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-110">
              {copied === 'username' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400 group-hover/item:text-blue-400" />}
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group/item hover:border-blue-500/30 transition-colors">
            <KeyRound className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-300 font-mono truncate">{showPassword ? password : '••••••••••••'}</span>
            <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-110">
              {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={() => handleCopy(password, 'password')} className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-110">
              {copied === 'password' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400 group-hover/item:text-blue-400" />}
            </button>
          </div>
          {url && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-400 hover:text-blue-300 truncate transition-colors">
                {url}
              </a>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/50">
          <p className="text-xs text-gray-500">Modified: {new Date(item.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}