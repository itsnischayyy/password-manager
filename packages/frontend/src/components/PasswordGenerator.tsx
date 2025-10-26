import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

// Simple password generator. An enterprise version would have more options (length, symbols, etc.)
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

interface PasswordGeneratorProps {
    onPasswordGenerated: (password: string) => void;
}

export function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const copyToClipboard = useCopyToClipboard();

  const handleGenerate = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    onPasswordGenerated(newPassword);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="text"
        value={password}
        onChange={(e) => {
            setPassword(e.target.value);
            onPasswordGenerated(e.target.value);
        }}
        placeholder="Generate or type a password"
        className="font-mono"
      />
      <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(password)} disabled={!password}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button type="button" variant="secondary" size="icon" onClick={handleGenerate}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}