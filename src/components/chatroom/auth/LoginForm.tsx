'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { loginStart, loginSuccess, User } from '@/lib/redux/slices/authSlice';
import { toast, useToast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/redux-hooks';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    dispatch(loginStart());

    // Simulation d'une authentification
    setTimeout(() => {
      const user: User = {
        id: `${role}_${Date.now()}`,
        name,
        email,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      };

      dispatch(loginSuccess(user));
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${name} !`,
      });

      if (role === 'teacher') {
        router.push('/list/chatroom/dashboard');
      } else {
        router.push('/list/chatroom/student');
      }
      
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">📚</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EduChat Live
          </CardTitle>
          <CardDescription className="text-gray-600">
            Plateforme de classes virtuelles interactives
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nom complet
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 transition-all focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 transition-all focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Vous êtes :
                </Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as 'teacher' | 'student')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="teacher" id="teacher" className="peer sr-only" />
                    <Label
                      htmlFor="teacher"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 cursor-pointer transition-all"
                    >
                      <span className="text-2xl mb-2">👨‍🏫</span>
                      <span className="font-medium">Professeur</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="student" id="student" className="peer sr-only" />
                    <Label
                      htmlFor="student"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 cursor-pointer transition-all"
                    >
                      <span className="text-2xl mb-2">👨‍🎓</span>
                      <span className="font-medium">Élève</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 py-6 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
