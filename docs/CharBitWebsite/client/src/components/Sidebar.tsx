import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useThemeContext, type Theme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Search, 
  PlusCircle, 
  Heart, 
  Users, 
  UserPlus, 
  MessageCircle, 
  Hash,
  Settings,
  LogOut,
  Menu,
  CheckCircle,
  Palette,
  Star
} from "lucide-react";
import { 
  SiYoutube, 
  SiInstagram, 
  SiX, 
  SiTiktok, 
  SiFacebook 
} from "react-icons/si";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: PlusCircle, label: "Create Character", href: "/create" },
  { icon: Heart, label: "Favorites", href: "/favorites" },
  { icon: Users, label: "Following", href: "/following" },
  { icon: UserPlus, label: "Friends", href: "/friends" },
  { icon: MessageCircle, label: "Messages", href: "/messages" },
  { icon: Hash, label: "Tag Explorer", href: "/tags" },
];

const themes: { name: string; value: Theme; color: string }[] = [
  { name: "Black", value: "black", color: "bg-black" },
  { name: "White", value: "white", color: "bg-white border border-gray-300" },
  { name: "Midnight", value: "midnight", color: "bg-blue-900" },
  { name: "Neon", value: "neon", color: "bg-gradient-to-r from-pink-500 to-cyan-500" },
  { name: "Pinky", value: "pinky", color: "bg-pink-400" },
  { name: "Bob", value: "bob", color: "bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600" },
];

const platformIcons = {
  youtube: SiYoutube,
  instagram: SiInstagram,
  x: SiX,
  tiktok: SiTiktok,
  facebook: SiFacebook,
};

function UserProfile({ user }: { user: any }) {
  const verifiedPlatforms = user.verifications?.filter((v: any) => v.isVerified) || [];
  
  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-3 mb-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.profileImageUrl} alt={user.username || user.firstName} />
          <AvatarFallback>
            {(user.username || user.firstName || user.email || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold truncate">
              {user.username ? `@${user.username}` : user.firstName || "User"}
            </span>
            {user.isCreator && (
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {user.isCreator ? "Creator Profile" : "User Profile"}
          </div>
        </div>
      </div>
      
      {verifiedPlatforms.length > 0 && (
        <div className="flex items-center space-x-1 mb-2">
          {verifiedPlatforms.slice(0, 3).map((verification: any) => {
            const IconComponent = platformIcons[verification.platform as keyof typeof platformIcons];
            return IconComponent ? (
              <IconComponent 
                key={verification.platform}
                className="w-3 h-3 text-muted-foreground"
              />
            ) : null;
          })}
          {verifiedPlatforms.length > 3 && (
            <span className="text-xs text-muted-foreground">+{verifiedPlatforms.length - 3}</span>
          )}
        </div>
      )}
      
      <div className="text-xs text-muted-foreground space-y-1">
        <div>0 Followers • 0 Following</div>
        <div>0 Characters Created</div>
      </div>
    </div>
  );
}

function ThemeSelector() {
  const { theme, switchTheme } = useThemeContext();
  
  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Palette className="w-4 h-4" />
        <h3 className="font-semibold">Theme</h3>
      </div>
      <div className="max-h-32 overflow-y-auto pr-2">
        <div className="grid grid-cols-3 gap-2">
          {themes.map((themeOption) => (
            <Button
              key={themeOption.value}
              variant="ghost"
              size="sm"
              onClick={() => switchTheme(themeOption.value)}
              className={`w-8 h-8 p-0 rounded border-2 transition-colors ${
                theme === themeOption.value ? "border-primary" : "border-transparent"
              }`}
              title={themeOption.name}
            >
              <div className={`w-full h-full rounded ${themeOption.color}`} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarContent() {
  const [location] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/explore", icon: Search, label: "Explore" },
    { href: "/create", icon: PlusCircle, label: "Create" },
    { href: "/creator/apply", icon: Star, label: "Creator Application" },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/following", icon: UserPlus, label: "Following" },
    { href: "/friends", icon: Users, label: "Friends" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/tags", icon: Hash, label: "Tags" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">C</span>
          </div>
          <span className="text-2xl font-bold">CharBit</span>
        </Link>
      </div>

      {/* User Profile */}
      {user && (
        <div className="px-6 mb-6">
          <UserProfile user={user} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start"
                  size="lg"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Theme Selector */}
      <div className="px-6 mb-6">
        <ThemeSelector />
      </div>

      {/* Settings & Logout */}
      <div className="px-6 pb-6">
        <Separator className="mb-4" />
        <div className="space-y-2">
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start" size="lg">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
            size="lg"
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full w-64 bg-card border-r flex-col z-40 overflow-y-auto ${className}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full overflow-y-auto">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
