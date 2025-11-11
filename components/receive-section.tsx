"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, File, AlertCircle, Check, Lock, FolderOpen, FileText, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import bcrypt from "bcryptjs"
import { QRCodeCanvas } from "qrcode.react"

interface FileInfo {
  name: string
  size: number
  url: string
}

interface FileData {
  filename?: string
  size?: number
  hasPassword: boolean
  downloadUrl: string
  files?: FileInfo[]
  totalFiles?: number
  totalSize?: number
  type?: "file" | "text"
  text?: string
  textLength?: number
  passwordHash?: string
  url?: string // Added for text links
}

export default function ReceiveSection() {
  const [shareCode, setShareCode] = useState("")

  // Listen for code from URL parameters
  useEffect(() => {
    const handleReceiveCode = (e: CustomEvent<string>) => {
      setShareCode(e.detail)
      handleReceive()
    }

    window.addEventListener('receive-code', handleReceiveCode as EventListener)
    return () => {
      window.removeEventListener('receive-code', handleReceiveCode as EventListener)
    }
  }, [])
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [error, setError] = useState("")
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [passwordOk, setPasswordOk] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleReceive = async () => {
    if (!shareCode.trim()) return;
    setLoading(true);
    setError("");
    setFileData(null);
    setShowPasswordInput(false);

    try {
      // First try localStorage for backwards compatibility
      let fileMeta: any = null;
      try {
        const meta = localStorage.getItem(`xpeero_code_${shareCode}`) || localStorage.getItem(`droplink_code_${shareCode}`);
        if (meta) fileMeta = JSON.parse(meta);
      } catch (e) {
        // ignore localStorage parse errors
      }

      // If not in localStorage, try server API
      if (!fileMeta) {
        try {
          const res = await fetch(`/api/share?code=${encodeURIComponent(shareCode)}`);
          if (res.ok) {
            const json = await res.json();
            fileMeta = json.meta;
          }
        } catch (e) {
          // network error, will be handled below
        }
      }

      if (!fileMeta) throw new Error("File not found or code is invalid");

      // Check expiration
      if (fileMeta.expiresAt && Date.now() > fileMeta.expiresAt) {
        throw new Error("This file has expired.");
      }

      if (fileMeta.passwordHash) {
        setShowPasswordInput(true);
        setPasswordRequired(true);
        setFileData({
          ...fileMeta,
          hasPassword: true,
          downloadUrl: fileMeta.url,
          type: fileMeta.type,
          files: fileMeta.files,
          totalFiles: fileMeta.totalFiles,
          totalSize: fileMeta.totalSize,
        });
        setLoading(false);
        return;
      }

      setFileData({
        ...fileMeta,
        hasPassword: false,
        downloadUrl: fileMeta.url,
        type: fileMeta.type,
        files: fileMeta.files,
        totalFiles: fileMeta.totalFiles,
        totalSize: fileMeta.totalSize,
      });
    } catch (err) {
      setError( "File not found or code is invalid");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileData) return

    // Handle password verification first
    if (fileData.hasPassword && !passwordOk) {
      if (!password) {
        setError("Password is required")
        return
      }
      // Check password
      let fileMeta: any = null
      try {
        const meta = localStorage.getItem(`xpeero_code_${shareCode}`) || localStorage.getItem(`droplink_code_${shareCode}`)
        if (meta) fileMeta = JSON.parse(meta)
      } catch (e) {
        // ignore parse errors
      }

      if (!fileMeta) {
        try {
          const res = await fetch(`/api/share?code=${encodeURIComponent(shareCode)}`)
          if (res.ok) {
            const json = await res.json()
            fileMeta = json.meta
          }
        } catch (e) {
          // swallow
        }
      }

      if (!fileMeta) {
        setError("File not found or code is invalid")
        return
      }
      try {
        const ok = await bcrypt.compare(password, fileMeta.passwordHash)
        if (!ok) {
          setError("Incorrect password")
          setPassword("")
          return
        }
        // Password verified successfully
        setPasswordOk(true)
        setError("")
        // Update file data with content after password verification
        setFileData({
          ...fileData,
          text: fileMeta.text, // For text content
          files: fileMeta.files, // For file content
          downloadUrl: fileMeta.blobUrl // Use the actual blob URL for download
        })
        return // Exit here, let user initiate download with the download button
      } catch (err) {
        setError("Failed to verify password. Please try again.")
        return
      }
    }

    // Handle actual download/view after password verification
    try {
      if (fileData.type === 'text') {
        // For text content, it's already shown in the UI
        return
      } else if (fileData.type === 'file' && fileData.files?.length === 1) {
        // For single files, trigger direct download
        const link = document.createElement('a')
        link.href = fileData.downloadUrl
        link.download = fileData.files[0].name || 'download'
        link.click()
      } else {
        // For multiple files (ZIP), open in new tab
        window.open(fileData.downloadUrl, '_blank')
      }
    } catch (err) {
      setError("Download failed. Please try again.")
    }
  }

  const handleCopyText = async () => {
    if (fileData?.type === "text" && fileData.text) {
      await navigator.clipboard.writeText(fileData.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  const handleCopyLink = async () => {
    if (fileData?.url) {
      await navigator.clipboard.writeText(fileData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-center text-slate-800">Receive File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Share Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Enter Share Code</label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter 6-digit code (e.g., ABC123)"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                className="bg-white/50 text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={handleReceive}
                disabled={!shareCode.trim() || loading}
                className="px-6"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password Input */}
          {showPasswordInput && !passwordOk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <label className="text-sm font-medium text-slate-700">Password Required</label>
                </div>
                <Input
                  type="password"
                  placeholder="Enter file password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDownload();
                    }
                  }}
                />
                <Button 
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Unlock Content
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {/* File Info */}
          {fileData && (!fileData.hasPassword || passwordOk) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {passwordOk ? "Password verified! Content unlocked." : "File found successfully!"}
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    {fileData.type === "text" ? (
                      <FileText className="w-6 h-6 text-blue-600" />
                    ) : (
                      <FolderOpen className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {fileData.type === "text" 
                        ? "Shared Text Content"
                        : fileData.filename || `ZIP Archive (${fileData.totalFiles} files)`
                      }
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {fileData.type === "text" ? (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {fileData.textLength} characters
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {fileData.text ? Math.ceil(fileData.text.split(/\s+/).length) : 0} words
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {fileData.totalFiles ? `${fileData.totalFiles} files` : formatFileSize(fileData.size || 0)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(fileData.totalSize || fileData.size || 0)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {fileData.hasPassword && (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Files List or Text Content */}
              {fileData.type === "text" && fileData.text ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Text Content
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-lg border max-h-40 overflow-y-auto relative">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {fileData.text}
                    </p>
                    <Button
                      onClick={handleCopyText}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 h-7"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Text Link */}
                  {fileData.url && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Text Link
                        </h3>
                        <Button onClick={handleCopyLink} variant="outline" size="sm" className="h-8 bg-transparent">
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="p-3 bg-slate-100 rounded-lg border">
                        <p className="text-sm text-slate-700 break-all font-mono">{fileData.url}</p>
                      </div>
                    </div>
                  )}
                  {/* QR Code for Text Link */}
                  {fileData.url && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-900 text-center">QR Code</h3>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-xl shadow-lg border">
                          <QRCodeCanvas value={fileData.url} size={160} level="M" includeMargin={true} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 text-center">Scan to view your text</p>
                    </div>
                  )}
                </div>
              ) : fileData.files && fileData.files.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <File className="w-4 h-4 mr-2" />
                    Files in Archive
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {fileData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Download Button: only show if passwordOk for protected files, or always for unprotected */}
              {(!fileData.hasPassword || passwordOk) && (
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {fileData.type === "text" ? "View Text" : "Download ZIP File"}
                </Button>
              )}
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 