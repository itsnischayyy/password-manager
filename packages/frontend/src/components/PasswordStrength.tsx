// src/components/PasswordStrength.tsx

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pass?: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-gray-600' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);
  
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength.score ? strength.color : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength.score > 2 ? 'text-gray-300' : 'text-gray-400'}`}>{strength.label}</p>
    </div>
  );
};