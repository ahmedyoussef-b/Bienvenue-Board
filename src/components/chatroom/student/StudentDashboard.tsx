'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Video, LogOut, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { useLogoutMutation } from '@/lib/redux/api/authApi';
import { type Notification, removeNotification } from '@/lib/redux/slices/notificationSlice';
import { selectCurrentUser, selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';

export default function StudentDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [logout] = useLogoutMutation();
  const { notifications } = useAppSelector(state => state.notifications);

  const pendingInvitations = notifications.filter(
    (n): n is Notification & { actionUrl: string } => n.type === 'session_invite' && !!n.actionUrl && !n.read
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role !== Role.STUDENT) {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleJoinSession = (invitation: Notification & { actionUrl: string }) => {
    router.push(invitation.actionUrl);
    dispatch(removeNotification(invitation.id));
  };

  const handleDeclineInvitation = (invitationId: string) => {
    dispatch(removeNotification(invitationId));
  };
  
  if (!user) {
      return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  EduChat Live
                </h1>
                <p className="text-sm text-gray-600">Espace élève</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <img
                  src={user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-right">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-gray-500">Élève</p>
                </div>
              </div>
              
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bonjour, {user.name} !
            </h2>
            <p className="text-lg text-gray-600">
              Vous recevrez des notifications lorsque vos professeurs lanceront des sessions.
            </p>
          </div>

          {pendingInvitations.length > 0 && (
            <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-white to-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Bell className="w-5 h-5" />
                  Invitations en attente ({pendingInvitations.length})
                </CardTitle>
                <CardDescription>
                  Cliquez pour rejoindre une session ou décliner l'invitation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Invitation pour {invitation.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {invitation.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Il y a {Math.floor((Date.now() - new Date(invitation.timestamp).getTime()) / 60000)} min</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 animate-pulse">
                          Nouveau
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleJoinSession(invitation)}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          Rejoindre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                        >
                          Décliner
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingInvitations.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune invitation pour le moment
                </h3>
                <p className="text-gray-600 mb-6">
                  Vous recevrez une notification dès qu'un professeur lancera une session.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  En attente de sessions...
                </div>
              </CardContent>
            </Card>
          )}

          {notifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {notification.title}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
