import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { roleConfigs } from '@/constants/navigation';
import { useAuth, UserRole } from '@/features/authentication/context/AuthContext';
import { cn } from '@/lib/utils';
import { useRouter } from '@tanstack/react-router';
import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Notifications } from './notification-bar';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 4) return 'Selamat Malam';
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function getUserInitial(user: { name?: string } | undefined): string {
  if (!user?.name) return '';
  return user.name.charAt(0).toUpperCase();
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Dashboard';

  const formatSegment = (segment: string): string =>
    segment
      .replace(/-/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const lastSegment = segments[segments.length - 1];
  const isLastSegmentId = /^\d+$/.test(lastSegment);
  const managementResources = ['users'];

  if (isLastSegmentId) {
    const resource = segments[segments.length - 2] || '';
    return `Detail ${formatSegment(resource)}`;
  } else if (segments.length > 1) {
    return segments.map(formatSegment).join(' ');
  } else {
    const segment = segments[0];
    if (managementResources.includes(segment)) {
      return `Manajemen ${formatSegment(segment)}`;
    }
    return formatSegment(segment);
  }
}

export function Navbar() {
  const router = useRouter();
  const { location } = router.state;
  const { user, logout, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  const userRole = user?.user_type?.toLowerCase() as UserRole | undefined;
  const roleConfig = userRole ? roleConfigs[userRole] || { title: userRole } : { title: '' };

  useEffect(() => {
    setPageTitle(getPageTitle(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.navigate({ to: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <header
        className={cn(
          'hidden md:flex sticky top-0 z-50 w-full px-4 lg:px-6 border-b border-border bg-background transition-all duration-200',
          scrolled ? 'shadow-sm bg-background/80 backdrop-blur-sm' : 'bg-background',
        )}
        style={{ minHeight: '4.5rem' }}
      >
        <div className="flex w-full items-center justify-between" style={{ height: '4.5rem' }}>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            <img src="/images/simonair.png" alt="" className="h-24" />
          </h1>
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <>
      {/* DESKTOP */}
      <header
        className={cn(
          'hidden md:flex sticky top-0 z-50 w-full px-4 lg:px-6 border-b border-border bg-background transition-all duration-200',
          scrolled ? 'shadow-sm bg-background/80 backdrop-blur-sm' : 'bg-background',
        )}
        style={{ minHeight: '4.5rem' }}
      >
        <div className="flex w-full items-center justify-between" style={{ height: '4.5rem' }}>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            <img src="/images/simonair.png" alt="" className="h-36" />
          </h1>
          <div className="flex items-center gap-4">
            {/* <Notifications /> */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative pl-2 pr-0 hover:bg-primary/10 focus:bg-primary/10 transition-colors duration-200 group"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 mr-2 border border-border ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                          {getUserInitial(user)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="hidden md:flex flex-col items-start mr-2">
                      <span className="text-sm font-medium leading-none text-foreground">
                        {user?.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px] group-hover:text-primary/80 transition-colors duration-200">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuLabel className="p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge
                        variant="outline"
                        className="mt-1 w-fit px-2.5 py-0.5 font-medium text-primary border-primary/20 bg-primary/10"
                      >
                        {roleConfig.title || userRole || 'User'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <div className="p-1" />
                  <div className="p-1">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center py-2.5 text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer transition-colors duration-200 rounded-md"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Keluar</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE */}
      <header
        className={cn(
          'sticky top-0 z-30 flex md:hidden w-full px-5 py-3 transition-all duration-200',
          scrolled ? 'shadow-md bg-background/90 backdrop-blur-md' : 'bg-background',
        )}
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-primary/20 ring-2 ring-primary/10 shadow-sm">
              <AvatarFallback className="bg-primary/15 text-primary font-semibold text-lg">
                {getUserInitial(user ?? undefined)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              {/* <span className="text-sm font-bold text-foreground leading-tight">
                Halo, {user?.name?.split(' ')[0] || ''}
              </span> */}
              {/* <span className="text-xs font-medium text-muted-foreground/80">{getGreeting()}</span> */}
            </div>
          </div>
          <div className="flex items-center">
            <Notifications />
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
