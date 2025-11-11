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
  const [activeTab, setActiveTab] = useState<"upload" | "receive" | "text">(
    "upload"
  );

  // Handle URL parameters
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const code = params.get("code");

      if (tab === "receive" || tab === "text" || tab === "upload") {
        setActiveTab(tab);
      }

      // If code is provided and we're on the receive tab
      if (code) {
        // Always switch to receive tab when a code is provided
        setActiveTab("receive");
        // Emit event after state updates
        setTimeout(() => {
          const receiveEvent = new CustomEvent("receive-code", {
            detail: code,
          });
          window.dispatchEvent(receiveEvent);
        }, 0);
      }
    };

    // Handle initial URL params
    handleUrlParams();

    // Also handle browser back/forward navigation
    window.addEventListener("popstate", handleUrlParams);
    return () => window.removeEventListener("popstate", handleUrlParams);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedMeta, setUploadedMeta] = useState<any>(null);
  const [qrSize, setQrSize] = useState<number>(160);

  // Responsive QR code sizing
  useEffect(() => {
    const updateQrSize = () => {
      const w = window.innerWidth;
      if (w <= 420) setQrSize(120);
      else if (w <= 640) setQrSize(140);
      else setQrSize(160);
    };
    updateQrSize();
    window.addEventListener("resize", updateQrSize);
    return () => window.removeEventListener("resize", updateQrSize);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getTotalFileSize = () => {
    return files.reduce(
      (total, fileWithProgress) => total + fileWithProgress.file.size,
      0
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const newFiles: FileWithProgress[] = selectedFiles.map((file) => ({
        file,
        progress: 0,
        uniqueName: `${uuidv4()}-${file.name}`,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      setSuccess("");
      setDownloadUrl("");
      setError("");
      setShareCode("");
      setCopied(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const newFiles: FileWithProgress[] = droppedFiles.map((file) => ({
        file,
        progress: 0,
        uniqueName: `${uuidv4()}-${file.name}`,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      setSuccess("");
      setDownloadUrl("");
      setError("");
      setShareCode("");
      setCopied(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setSuccess("");
    setDownloadUrl("");
    setError("");
    setShareCode("");
    setCopied(false);

    try {
      let uploadedFiles = [];
      let finalUrl = "";
      if (files.length === 1) {
        // Single file: upload directly
        setFiles((prev) => prev.map((f, i) => ({ ...f, progress: 25 })));
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
        const url = await vercelUploadFile(
          files[0].file,
          files[0].uniqueName,
          expiresAt
        );
        setFiles((prev) =>
          prev.map((f, i) => ({
            ...f,
            progress: 100,
            url: i === 0 ? url : f.url,
          }))
        );
        uploadedFiles = [
          {
            name: files[0].file.name,
            url,
            size: files[0].file.size,
            type: files[0].file.type,
          },
        ];
        finalUrl = url;
      } else {
        // Multiple files: zip and upload
        setFiles((prev) => prev.map((f, i) => ({ ...f, progress: 25 })));
        const zip = new JSZip();
        for (let i = 0; i < files.length; i++) {
          zip.file(files[i].file.name, files[i].file);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipName = `xpeero-${nanoid(8)}.zip`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
        const url = await vercelUploadFile(zipBlob, zipName, expiresAt);
        setFiles((prev) =>
          prev.map((f, i) => ({
            ...f,
            progress: 100,
            url: i === 0 ? url : f.url,
          }))
        );
        uploadedFiles = files.map((f) => ({
          name: f.file.name,
          size: f.file.size,
        }));
        finalUrl = url;
      }

      setSuccess(
        `Successfully uploaded ${files.length} file${
          files.length > 1 ? "s" : ""
        }!`
      );
      setDownloadUrl(
        "https://drop-link-file.vercel.app" + `/link/` + shareCode
      );

      const code = nanoid(6).toUpperCase();
      setShareCode(code);

      // Firestore save
      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes, matching Vercel Blob expiry
      let passwordHash = undefined;
      if (password) {
        passwordHash = await bcrypt.hash(password, 8);
      }

      await addDoc(collection({}, "files"), {
        code,
        url: finalUrl,
        files: uploadedFiles,
        totalFiles: files.length,
        totalSize: getTotalFileSize(),
        createdAt: serverTimestamp(),
        expiresAt,
        type: files.length === 1 ? "file" : "zip",
        ...(passwordHash ? { passwordHash } : {}),
      });

      // Save mapping on server (in-memory) so other browsers/devices can fetch it.
      const fileMeta = {
        url: finalUrl,
        files: uploadedFiles,
        totalFiles: files.length,
        totalSize: getTotalFileSize(),
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        type: files.length === 1 ? "file" : "zip",
        ...(passwordHash ? { passwordHash } : {}),
      };

      try {
        // POST to our simple API so other clients can lookup by code
        await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, meta: fileMeta }),
        });
      } catch (err) {
        // Swallow errors but keep localStorage fallback
        console.warn("Failed to save mapping to server API:", err);
      }

      // Local fallback for the same browser
      try {
        localStorage.setItem(`xpeero_code_${code}`, JSON.stringify(fileMeta));
      } catch (e) {
        // ignore
      }

      setUploadedMeta(fileMeta);

      // Clear file input and password after successful upload
      setFiles([]);
      setPassword("");
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (shareCode) {
      setDownloadUrl(
        "https://drop-link-file.vercel.app" + `/link/${shareCode}`
      );
    }
  }, [shareCode]);
  const handleCopy = async (textToCopy: string) => {
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex items-start justify-center p-4 pt-20">
        <div className="w-full max-w-6xl px-4">
          {activeTab === "upload" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-6"
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                  Upload & Share
                </h1>
                <p className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto">
                  Upload files and get secure share links and QR codes. Share
                  quickly without an account — links auto-expire for privacy.
                </p>
              </motion.div>

              <div className="flex flex-col lg:flex-row gap-8 mx-auto w-full">
                {/* Left: Upload Form */}
                <div className="w-full lg:w-1/2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Card className="shadow-lg border border-border/50 bg-card/95 backdrop-blur-xl">
                      <CardHeader className="pb-6">
                        <CardTitle className="text-center text-slate-800">
                          Upload Your File
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Upload Area */}
                        <motion.div
                          className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                            transition-all duration-300 ease-in-out
                            ${
                              dragOver
                                ? "border-blue-400 bg-blue-50 scale-[1.02]"
                                : files.length > 0
                                ? "border-green-300 bg-green-50"
                                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                            }
                          `}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            multiple
                          />

                          <div className="flex flex-col items-center space-y-4">
                            {files.length === 0 ? (
                              <>
                                <div className="p-3 bg-blue-100 rounded-full">
                                  <Upload className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-900">
                                    Drop your file here or click to browse
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Supports all file types up to 100MB
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="p-3 bg-green-100 rounded-full">
                                  <FolderOpen className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                  <p className="font-semibold text-slate-900">
                                    Selected Files
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Click to remove
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {files.map((fileWithProgress, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs flex items-center"
                                    >
                                      <X
                                        className="w-3 h-3 mr-1 cursor-pointer"
                                        onClick={() => removeFile(index)}
                                      />
                                      {fileWithProgress.file.name}
                                      <span className="ml-1 text-slate-500">
                                        (
                                        {formatFileSize(
                                          fileWithProgress.file.size
                                        )}
                                        )
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>

                        {/* Password Protection */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-slate-600" />
                            <label className="text-sm font-medium text-slate-700">
                              Password Protection (Optional)
                            </label>
                          </div>
                          <Input
                            type="password"
                            placeholder="Enter password to protect your file"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/50"
                          />
                          <p className="text-xs text-slate-500">
                            Add a password to ensure only people with the
                            password can download your files
                          </p>
                        </div>

                        {/* Upload Button */}
                        <Button
                          onClick={handleUpload}
                          disabled={files.length === 0 || uploading}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50"
                          size="lg"
                        >
                          {uploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Uploading {files.length} file
                              {files.length > 1 ? "s" : ""}...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload {files.length} File
                              {files.length !== 1 ? "s" : ""}
                            </>
                          )}
                        </Button>

                        {/* File List with Progress */}
                        {files.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900 flex items-center">
                              <FolderOpen className="w-4 h-4 mr-2" />
                              Files to Upload ({files.length})
                            </h3>
                            <div className="space-y-2 max-h-40 md:max-h-56 overflow-y-auto">
                              {files.map((fileWithProgress, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                                >
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate">
                                        {fileWithProgress.file.name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {formatFileSize(
                                          fileWithProgress.file.size
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {uploading && (
                                      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(index)}
                                      disabled={uploading}
                                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-slate-500 text-center">
                              Total size: {formatFileSize(getTotalFileSize())}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Right: Success State */}
                {success && downloadUrl && (
                  <div className="w-full lg:w-1/2 flex flex-col gap-6">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <Alert className="border-green-200 bg-green-50">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {success}
                        </AlertDescription>
                      </Alert>

                      {/* Share Code Card */}
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-green-900">
                            Your Share Code
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-green-200">
                            <code className="text-xl font-mono font-bold text-green-600">
                              {shareCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(shareCode)}
                              className="hover:bg-green-100 w-full sm:w-auto"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-green-600 mt-2">
                            Share this code to let others download your files
                          </p>
                        </CardContent>
                      </Card>

                      {/* File Summary */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FolderOpen className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">
                            Files Included
                          </h3>
                        </div>
                        <div className="space-y-1">
                          {(
                            uploadedMeta?.files as
                              | { name: string; size: number }[]
                              | undefined
                          )?.map((fileWithProgress, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-blue-800 truncate flex-1">
                                {fileWithProgress.name}
                              </span>
                              <span className="text-blue-600 ml-2">
                                {formatFileSize(fileWithProgress.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-blue-200">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className="text-blue-900">Total:</span>
                            <span className="text-blue-700">
                              {uploadedMeta?.totalFiles} files,{" "}
                              {formatFileSize(uploadedMeta?.totalSize)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Share Information */}
                      <div className="space-y-3">
                        {/* Share Code Display */}
                        <div className="flex flex-col items-center space-y-2">
                          <h3 className="font-semibold text-slate-900 flex items-center">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Code
                          </h3>
                          <div className="flex items-center space-x-2">
                            <code className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 text-xl font-mono font-bold text-blue-600">
                              {shareCode}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(shareCode)}
                              className="h-8 bg-transparent"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Code
                                </>
                              )}
                            </Button>
                          </div>
                          {password && (
                            <p className="text-xs text-orange-600 flex items-center justify-center">
                              <Shield className="w-3 h-3 mr-1" />
                              Password protection enabled
                            </p>
                          )}
                        </div>

                        {/* Share Link */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-700">
                              Direct Link
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(downloadUrl)}
                              className="h-7 w-full sm:w-auto"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border text-xs font-mono text-slate-600 break-all">
                            {downloadUrl}
                          </div>
                          <p className="text-xs text-center text-slate-500">
                            {password
                              ? "Password required to access content"
                              : "Anyone with this link can access the content"}
                          </p>
                        </div>

                        <p className="text-xs text-slate-500 text-center mt-2">
                          {password
                            ? "Recipients will need to enter the password to access the content"
                            : "Anyone with the code or link can access the content"}
                        </p>
                      </div>

                      {/* Share Code */}
                      {shareCode && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-slate-900 flex items-center">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Code
                          </h3>
                          <div className="flex justify-center">
                            <Badge
                              variant="outline"
                              className="text-2xl font-bold py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0"
                            >
                              {shareCode}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 text-center">
                            Share this code for easy access to your file
                          </p>
                        </div>
                      )}

                      {/* QR Code */}
                      {!password && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-slate-900 text-center">
                            QR Code
                          </h3>
                          <div className="flex justify-center">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="p-4 bg-white rounded-xl shadow-lg border"
                            >
                              <QRCodeCanvas
                                value={downloadUrl}
                                size={qrSize}
                                level="M"
                                includeMargin={true}
                              />
                            </motion.div>
                          </div>
                          <p className="text-xs text-slate-500 text-center">
                            Scan to download your ZIP file
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center mt-8 text-sm text-slate-500"
              >
                <p>Files are automatically deleted after 30 minutes</p>
              </motion.div>
            </>
          )}

          {activeTab === "receive" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                  Receive Files
                </h1>
                <p className="text-slate-600 text-lg">
                  Enter share codes to download files instantly
                </p>
              </motion.div>

              <ReceiveSection />
            </>
          )}

          {activeTab === "text" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <h1 className="text-4xl font-bold text-slate-900 mb-3">
                  Share Text
                </h1>
                <p className="text-slate-600 text-lg">
                  Paste and share text content with instant links and QR codes
                </p>
              </motion.div>

              <TextSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
