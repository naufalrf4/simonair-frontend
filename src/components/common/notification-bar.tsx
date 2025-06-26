import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Bell, Mail, CheckCircle, Info, CheckCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMediaQuery } from 'react-responsive';

type NotificationType = 'info' | 'event' | 'reminder' | 'success' | 'default';

export interface Notification {
  id: string;
  userId: string;
  deviceId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const sampleNotifications: Notification[] = [
  {
    id: 'notif-2',
    userId: 'user-a1',
    deviceId: 'device-x1',
    type: 'event',
    title: 'Batas Parameter Tercapai',
    message: 'Nilai TDS melebihi batas maksimum pada kolam A.',
    isRead: false,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'user-a1',
    deviceId: 'device-x1',
    type: 'success',
    title: 'Kalibrasi Berhasil',
    message: 'Kalibrasi sensor DO telah berhasil disimpan di perangkat.',
    isRead: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    userId: 'user-a1',
    deviceId: 'device-x1',
    type: 'reminder',
    title: 'Periksa Suhu',
    message: 'Suhu air mendekati batas bawah untuk ikan nila.',
    isRead: false,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'event':
    case 'reminder':
      return <Mail className="h-4 w-4 text-primary/80" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-400" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function Notifications({ notifications: initialNotifications = sampleNotifications }: { notifications?: Notification[] }) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const navigate = useNavigate();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  // "Lihat semua notifikasi" footer button
  const handleSeeAll = () => {
    // if no unread, remove all notifications for demonstration (state only)
    if (notifications.every((n) => n.isRead)) {
      setNotifications([]);
    }
    navigate({ to: '/notifications' });
  };

  if (isMobile) {
    return (
      <Link
        to="/notifications"
        className="relative"
        aria-label="Notifikasi"
        tabIndex={0}
      >
        <Button
          variant="ghost"
          className="relative p-0 w-10 h-10 rounded-full hover:bg-primary/10 transition-colors duration-200"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-white text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative p-0 w-10 h-10 rounded-full hover:bg-primary/10 transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-white text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-w-xs p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between py-3 px-4">
          <span className="text-base font-semibold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-destructive/90 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                {unreadCount} Baru
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 flex items-center gap-1"
            onClick={markAllAsRead}
            tabIndex={0}
            disabled={unreadCount === 0}
            aria-label="Tandai semua telah dibaca"
          >
            <CheckCheck className="w-4 h-4" />
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto divide-y divide-border/70">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex gap-3 px-4 py-3 items-start rounded-none transition-colors duration-200",
                  !notification.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted opacity-60"
                )}
              >
                <div className="flex-shrink-0 mt-1">{getTypeIcon(notification.type)}</div>
                <div className="flex flex-col min-w-0">
                  <span className={cn(
                    'font-semibold truncate pr-4',
                    !notification.isRead ? 'text-primary' : 'text-muted-foreground line-through'
                  )}>
                    {notification.title}
                  </span>
                  <span className={cn(
                    "text-xs break-words",
                    !notification.isRead ? "text-muted-foreground" : "text-muted-foreground/70 line-through"
                  )}>{notification.message}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">{timeAgo(notification.createdAt)}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-3 flex justify-center">
          <Button
            variant="outline"
            className="w-full text-sm font-medium"
            onClick={handleSeeAll}
            tabIndex={0}
          >
            Lihat semua notifikasi
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Notifications;
