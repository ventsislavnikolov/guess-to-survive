import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const activeTheme = theme ?? "system";

  return (
    <fieldset
      aria-label="Theme"
      className="inline-flex rounded-md border border-border/80 bg-muted/40 p-0.5"
    >
      <legend className="sr-only">Theme</legend>
      <Button
        aria-label="Light theme"
        aria-pressed={activeTheme === "light"}
        className={cn(
          "h-7 px-2.5",
          activeTheme === "light" ? "bg-background shadow-sm" : "bg-transparent"
        )}
        onClick={() => setTheme("light")}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Sun className="h-3.5 w-3.5" />
      </Button>
      <Button
        aria-label="Dark theme"
        aria-pressed={activeTheme === "dark"}
        className={cn(
          "h-7 px-2.5",
          activeTheme === "dark" ? "bg-background shadow-sm" : "bg-transparent"
        )}
        onClick={() => setTheme("dark")}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Moon className="h-3.5 w-3.5" />
      </Button>
      <Button
        aria-label="System theme"
        aria-pressed={activeTheme === "system"}
        className={cn(
          "h-7 px-2.5",
          activeTheme === "system"
            ? "bg-background shadow-sm"
            : "bg-transparent"
        )}
        onClick={() => setTheme("system")}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Monitor className="h-3.5 w-3.5" />
      </Button>
    </fieldset>
  );
}
