"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Share2, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import ShareCards from "@/components/share-cards";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState("");

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-User P2P Sharing",
      description:
        "Direct peer-to-peer file sharing — create or join a room and send files to multiple receivers at once. Transfers are encrypted and go directly between browsers.",
      link: "/p2p",
      color: "bg-purple-500/10",
      textColor: "text-purple-500",
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Quick Share",
      description:
        "Instant secure one-time links — upload a file, copy the link, and share. Links are encrypted and time-limited for safety.",
      link: "/share",
      color: "bg-violet-500/10",
      textColor: "text-violet-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <img
            src={"/xpeero-logo.png"}
            alt="xpeero"
            className="mx-auto mb-8 h-16 w-auto bg-transparent"
          />
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-violet-600 mb-6">
            Share Files Securely and Fast
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Choose how you want to share your files - direct peer-to-peer or
            through quick share links
          </p>
        </motion.div>

        {/* Feature Cards (replaced by ShareCards for a richer UI) */}
        <div className="max-w-4xl mx-auto">
          <ShareCards />
        </div>

        {/* Benefits Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose xpeero?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center p-6 rounded-lg bg-card"
            >
              <div className="bg-green-500/10 text-green-500 p-3 rounded-lg mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground text-center">
                Direct peer-to-peer transfers for maximum speed
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center p-6 rounded-lg bg-card"
            >
              <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-lg mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Sharing</h3>
              <p className="text-muted-foreground text-center">
                End-to-end encryption for all file transfers
              </p>
            </motion.div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start sharing?</h2>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/p2p">Try P2P Sharing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/share">Quick Share</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 w-full mt-24 border-t flex items-center justify-center gap-4">
        <img
          src={"/xpeero-logo.png"}
          alt="xpeero"
          className="mx-auto h-8 w-[auto] bg-transparent"
        />
        <div className="container mx-auto px-4 text-center text-muted-foreground w-[60vh]">
          <p>© {new Date().getFullYear()} xpeero. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
