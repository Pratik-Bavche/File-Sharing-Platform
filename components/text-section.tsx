"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { nanoid } from "nanoid"
import { QRCodeCanvas } from "qrcode.react"
import bcrypt from "bcryptjs"
import { FileText, Copy, Check, Shield, Share2, AlertCircle, Type, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock functions - replace with your actual implementations
const saveText = async (text: string, uniqueId: string) => {
  // Simulate save delay
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return `https://example.com/text/${uniqueId}`
}

const addDoc = async (collection: any, data: any) => {
  // Mock Firestore operation
  console.log("Saving to Firestore:", data)
}

const collection = (db: any, name: string) => ({ name })
const serverTimestamp = () => new Date()

export default function TextSection() {
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [textUrl, setTextUrl] = useState("")
  const [error, setError] = useState("")
  const [shareCode, setShareCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState("")
  const [textLength, setTextLength] = useState(0)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    setTextLength(newText.length)
    setSuccess("")
    setTextUrl("")
    setError("")
    setShareCode("")
    setCopied(false)
  }

  const handleSave = async () => {
    if (!text.trim()) return

    setSaving(true)
    setSuccess("")
    setTextUrl("")
    setError("")
    setShareCode("")
    setCopied(false)

    try {
      const uniqueId = nanoid(12)
      const url = await saveText(text, uniqueId)
      setSuccess("Text saved successfully!")
      setTextUrl(url)

      const code = nanoid(6).toUpperCase()
      setShareCode(code)

      // Firestore save
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
      let passwordHash = undefined
      if (password) {
        passwordHash = await bcrypt.hash(password, 8)
      }

      await addDoc(collection({}, "texts"), {
        code,
        url,
        text: text.trim(),
        textLength: text.length,
        createdAt: serverTimestamp(),
        expiresAt,
        ...(passwordHash ? { passwordHash } : {}),
      })

      // Save mapping on server so other browsers/devices can fetch it.
      const textMeta = {
        url,
        text: text.trim(),
        textLength: text.length,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
        type: "text",
        ...(passwordHash ? { passwordHash } : {}),
      };

      try {
        await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, meta: textMeta }),
        });
      } catch (err) {
        console.warn("Failed to save text mapping to server:", err);
      }

      try {
        localStorage.setItem(`xpeero_code_${code}`, JSON.stringify(textMeta));
      } catch (e) {}

      // Clear textarea and password after successful save
      setText("")
      setPassword("")
      setTextLength(0)
    } catch (err) {
      setError("Save failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (textUrl) {
      await navigator.clipboard.writeText(textUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getWordCount = () => {
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }

  const getCharacterCount = () => {
    return text.length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-center text-slate-800">Share Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Input Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Type className="w-4 h-4 mr-2" />
                Your Text Content
              </label>
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span>{getWordCount()} words</span>
                <span>{getCharacterCount()} characters</span>
              </div>
            </div>
            <Textarea
              placeholder="Paste or type your text here... (supports up to 10,000 characters)"
              value={text}
              onChange={handleTextChange}
              className="min-h-[200px] bg-white/50 resize-none"
              maxLength={10000}
            />
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Maximum 10,000 characters</span>
              <span className={textLength > 9000 ? "text-orange-600" : ""}>
                {textLength}/10,000
              </span>
            </div>
          </div>

          {/* Password Protection */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Password Protection (Optional)</label>
            </div>
            <Input
              type="password"
              placeholder="Enter password to protect your text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/50"
            />
            <p className="text-xs text-slate-500">
              Add a password to ensure only people with the password can view your text
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            size="lg"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Share Text
              </>
            )}
          </Button>

          {/* Success State */}
          <AnimatePresence>
            {success && textUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>

                {/* Text Preview */}
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Text Preview</h3>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {text.length > 300 ? `${text.substring(0, 300)}...` : text}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500">{getWordCount()} words</span>
                    <span className="text-xs text-slate-500">{getCharacterCount()} characters</span>
                  </div>
                </div>

                {/* Text Link */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Text Link
                    </h3>
                    <Button onClick={handleCopy} variant="outline" size="sm" className="h-8 bg-transparent">
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
                    <p className="text-sm text-slate-700 break-all font-mono">{textUrl}</p>
                  </div>
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
                        className="text-2xl font-bold py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                      >
                        {shareCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      Share this code for easy access to your text
                    </p>
                  </div>
                )}

                {/* QR Code */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 text-center">QR Code</h3>
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-white rounded-xl shadow-lg border"
                    >
                      <QRCodeCanvas value={textUrl} size={160} level="M" includeMargin={true} />
                    </motion.div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">Scan to view your text</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
} 