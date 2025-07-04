import { QuoteCard } from '@/components/quote-card';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute right-6 top-6 z-10">
        <ThemeSwitcher />
      </div>

      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,hsl(var(--background))_40%,hsl(var(--accent))_100%)] opacity-30 dark:opacity-10"></div>
      
      <div className="container z-0 flex max-w-2xl flex-col items-center justify-center space-y-8 px-4 text-center">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in-0 slide-in-from-top-10 duration-700">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            Bienvenue Board
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Welcome to your personal board. Here's a dose of inspiration to start your day.
          </p>
        </div>
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-10 duration-700 delay-200">
          <QuoteCard />
        </div>
      </div>
    </div>
  );
}
