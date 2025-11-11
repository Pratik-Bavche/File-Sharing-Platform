"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import { QRCodeCanvas } from "qrcode.react";
import bcrypt from "bcryptjs";
import {
  Upload,
  File,
  Copy,
  Check,
  Shield,
  Download,
  Share2,
  AlertCircle,
  X,
  FolderOpen,
} from "lucide-react";
import { generateDownloadUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import ReceiveSection from "@/components/receive-section";
import TextSection from "@/components/text-section";
import JSZip from "jszip";
import { uploadFile as vercelUploadFile } from "@/lib/vercel-blob";

const addDoc = async (collection: any, data: any) => {
  // Mock Firestore operation
  console.log("Saving to Firestore:", data);
};

const collection = (db: any, name: string) => ({ name });
const serverTimestamp = () => new Date();

interface FileWithProgress {
  file: File;
  progress: number;
  url?: string;
  uniqueName: string;
}

import { redirect } from "next/navigation";

export default function Xpeero() {
  redirect("/home");
 return(
  <></>
  );
}
