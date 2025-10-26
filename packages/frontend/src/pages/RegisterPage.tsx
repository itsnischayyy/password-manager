import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/state/authStore';
import * as crypto from '@/lib/crypto';
import api from '@/lib/api';
import type { LoginResponse } from '@/types';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(12, { message: "Password must be at least 12 characters long." }),
  displayName: z.string().optional(),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange', // Validate on change for better UX
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // --- ZERO-KNOWLEDGE REGISTRATION FLOW ---
      // All cryptographic materials are generated on the client before calling the API.
      // The server NEVER sees the master password.

      // 1. Generate salt for the Key Encryption Key (KEK)
      const saltForKEK = crypto.generateRandomBytes(crypto.PBKDF2_PARAMS.saltLen);
      
      // 2. Derive the KEK from the master password. This key never leaves the client.
      const kek = await crypto.deriveKeyFromPassword(data.password, saltForKEK);
      
      // 3. Generate a new random Vault Key (VK). This is the master encryption key.
      const vaultKey = await crypto.generateAESKey();
      
      // 4. Wrap (encrypt) the VK with the KEK. This is what's stored on the server.
      const wrappedVK = await crypto.wrapKey(kek, vaultKey);
      
      // 5. Separately, create a password verifier for authentication.
      const { pbkdf2Hash, pbkdf2Salt, pbkdf2Params } = await crypto.createPasswordVerifier(data.password);
      
      // 6. Register the user by sending only the public cryptographic artifacts.
      await api.post('/auth/register', {
        email: data.email,
        displayName: data.displayName,
        pbkdf2Hash,
        pbkdf2Salt,
        pbkdf2Params,
        saltForKEK: crypto.bytesToBase64(saltForKEK),
        wrappedVK,
      });

      toast.success("Account created successfully! Logging you in...");

      // 7. Automatically log the user in after successful registration.
      const loginResponse = await api.post<LoginResponse>('/auth/login', { 
        email: data.email, 
        password: data.password 
      });
      console.log(loginResponse);
      
      // 8. Set the auth state with the live, in-memory vault key.
      setAuth(loginResponse.data.accessToken, loginResponse.data.user, vaultKey);

      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      console.log(error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              className={`${form.formState.errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              {...form.register("email")} 
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input 
              id="displayName" 
              placeholder="John Doe" 
              {...form.register("displayName")} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Master Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Enter a strong password"
              className={`${form.formState.errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
              {...form.register("password")} 
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create an account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}