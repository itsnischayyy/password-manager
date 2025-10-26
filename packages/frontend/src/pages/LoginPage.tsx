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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Step 1: Authenticate with the server
      const response = await api.post<LoginResponse>('/auth/login', {
        email: data.email,
        password: data.password, // Password sent for verification hash
      });

      const { accessToken, user, wrappedVK, saltForKEK } = response.data;
      
      // Step 2: Client-side key derivation (KEK from master password)
      const saltBytes = crypto.base64ToBytes(saltForKEK);
      const kek = await crypto.deriveKeyFromPassword(data.password, saltBytes);
      
      // Step 3: Unwrap (decrypt) the Vault Key (VK)
      const vaultKey = await crypto.unwrapKey(kek, wrappedVK);
      
      // Step 4: Set the authentication state, including the in-memory vault key
      setAuth(accessToken, user, vaultKey);

      toast.success(`Welcome back, ${user.displayName || user.email}!`);
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(message);
      form.setError("password", { type: "manual", message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Master Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="underline">Sign up</Link>
        </div>
      </CardContent>
    </Card>
  );
}