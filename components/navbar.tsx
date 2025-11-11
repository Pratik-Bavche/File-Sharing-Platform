"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileText, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId = "upload" | "receive" | "text";

interface Tab {
  id: TabId;
  label: string;
  icon: JSX.Element;
}

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: readonly Tab[] = [
  {
    id: "upload",
    label: "Upload Files",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    id: "receive",
    label: "Receive Files",
    icon: <Download className="h-4 w-4" />,
  },
  {
    id: "text",
    label: "Share Text",
    icon: <FileText className="h-4 w-4" />,
  },
] as const;

export function Navbar({ activeTab, onTabChange }: NavbarProps): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center"
            >
              <span className="flex items-center space-x-3">
                <img src="/xpeero-logo.png" alt="xpeero" className="h-8 w-auto bg-transparent" />
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:block">
            <div className="relative flex items-center rounded-lg bg-muted p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="relative flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-pill"
                        className="absolute inset-0 rounded-md bg-background shadow-sm"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-2">
                      {tab.icon}
                      <span
                        className={cn(
                          "transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {tab.label}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden"
            >
              <div className="space-y-1 pb-4 pt-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-primary"
                      )}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

Navbar.displayName = "Navbar";

export default Navbar;
            