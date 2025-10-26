// src/components/VaultItemForm.tsx

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import type { DecryptedVaultItem, VaultItemDecryptedData } from '@/types';
import { useAuthStore } from '@/state/authStore';
import { useVaultStore } from '@/state/vaultStore';
import * as crypto from '@/lib/crypto';
import api from '@/lib/api';
import { toast } from 'sonner';
import { PasswordStrength } from './PasswordStrength';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const vaultItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  category: z.string().optional(),
  favorite: z.boolean().optional(),
});

const generatePassword = (length = 16) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
};

const categories = ['Development', 'Email', 'Cloud', 'Finance', 'Social', 'Work', 'Personal', 'Other'];

interface VaultItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: DecryptedVaultItem;
}

export function VaultItemForm({ isOpen, onClose, itemToEdit }: VaultItemFormProps) {
  const vaultKey = useAuthStore(state => state.vaultKey);
  const { addEncryptedItem, updateDecryptedItem } = useVaultStore();

  const form = useForm<VaultItemDecryptedData>({
    resolver: zodResolver(vaultItemSchema),
    defaultValues: itemToEdit?.decryptedData || { title: '', username: '', password: '', url: '', notes: '', category: 'Other', favorite: false },
  });

  // --- THIS IS THE CORRECTED SECTION ---
  const { watch } = form; // 'watch' is destructured from the top-level 'form' object
  const { isSubmitting, errors } = form.formState; // 'isSubmitting' and 'errors' come from 'form.formState'
  const passwordValue = watch('password');
  // --- END OF CORRECTION ---

  useEffect(() => {
    form.reset(itemToEdit?.decryptedData || { title: '', username: '', password: '', url: '', notes: '', category: 'Other', favorite: false });
  }, [itemToEdit, isOpen, form]);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue('password', newPassword, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: VaultItemDecryptedData) => {
    if (!vaultKey) {
      toast.error("Security session expired. Please log in again.");
      return;
    }
    try {
      const plaintextBytes = crypto.textToBytes(JSON.stringify(data));
      const { cipher, iv, tag } = await crypto.aesGcmEncrypt(vaultKey, plaintextBytes);
      const payload = { encryptedBlob: cipher, iv, tag };

      if (itemToEdit) {
        const response = await api.put(`/vault/${itemToEdit.id}`, payload);
        updateDecryptedItem({ ...response.data, decryptedData: data });
        toast.success("Item updated successfully!");
      } else {
        const response = await api.post('/vault', payload);
        addEncryptedItem(response.data);
        toast.success("Item created successfully!");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save item.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl sm:max-w-xl text-white scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">{itemToEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Title</Label>
                <Input id="title" {...form.register('title')} placeholder="e.g., GitHub, Gmail" />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
            </div>
            
            <div>
                <Label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">Category</Label>
                <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            
            <div>
                <Label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username / Email</Label>
                <Input id="username" {...form.register('username')} placeholder="username@example.com" />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
            </div>
            
            <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</Label>
                <div className="flex gap-2">
                    <Input id="password" type="text" {...form.register('password')} placeholder="Enter or generate password" className="font-mono"/>
                    <Button type="button" onClick={handleGeneratePassword} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 flex-shrink-0">
                        <RefreshCw className="w-4 h-4 mr-2"/> Generate
                    </Button>
                </div>
                {passwordValue && <div className="mt-3"><PasswordStrength password={passwordValue} /></div>}
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
                <Label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">Website URL (Optional)</Label>
                <Input id="url" {...form.register('url')} placeholder="https://example.com"/>
                {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>}
            </div>

            <div>
                <Label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</Label>
                <Textarea id="notes" {...form.register('notes')} placeholder="Any additional notes..."/>
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Controller
                    control={form.control}
                    name="favorite"
                    render={({ field }) => (
                        <Checkbox id="favorite" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
                <Label htmlFor="favorite" className="text-sm text-gray-300 cursor-pointer">Mark as favorite</Label>
            </div>

            <DialogFooter className="flex gap-3 pt-4 sm:justify-between">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {itemToEdit ? 'Save Changes' : 'Add Item'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}