"use client";
import React, { useState, useEffect } from "react";
import FileSender from "@/components/FileSender";
import FileReceiver from "@/components/FileReceiver";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { nanoid } from "nanoid";

export default function App() {
  // Default to hostname with port 5000 so it works across LAN.
  // On dev replace `localhost` with your machine LAN IP when testing on phone.
  const defaultServer = (() => {
    try {
      if (process.env.NODE_ENV === "production") {
        // Replace with your Heroku URL
        return "https://droplink-socket.onrender.com";
      }
      return `https://droplink-socket.onrender.com`;
    } catch {
      return "https://droplink-socket.onrender.com";
    }
  })();

  const [serverUrl, setServerUrl] = useState(defaultServer);
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("sender"); // 'sender' | 'receiver'
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // const id = Math.random().toString(36).substring(2, 8);
    // console.log(id);
    // setRoomId(id);

    // if nickname auto-empty, set a quick random one
    if (!nickname)
      setNickname(`user-${Math.floor(Math.random() * 9000 + 1000)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate a short 3-char room id when the user selects the sender role
  useEffect(() => {
    if (role === "sender" && !roomId) {
      setRoomId(nanoid(3));
    }
  }, [role, roomId]);

  const joinRoom = (e) => {
    e.preventDefault();
    if (!serverUrl || !roomId) {
      // if sender hasn't provided an id, generate one automatically
      if (role === "sender") {
        const id = nanoid(3)
        setRoomId(id)
        setJoined(true)
        return
      }
      alert("Please provide signaling server URL and room id.");
      return;
    }
    setJoined(true);
  };

  // generateId removed: we auto-generate when role === 'sender'

  const copyRoomId = async () => {
    if (!roomId) return
    try {
      await navigator.clipboard.writeText(roomId)
    } catch (e) {
      console.error("copy failed", e)
    }
  }

  const leaveRoom = () => {
    // child components should close connections on unmount,
    // here we only toggle the UI state.
    setJoined(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-purple-950 dark:via-background dark:to-violet-950 flex flex-col">
      <header className="py-8 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 text-transparent bg-clip-text">
          📡 P2P File Share
        </h1>
        <p className="mt-2 text-muted-foreground">
          Direct browser-to-browser transfers over the same network. No server
          storage.
        </p>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {!joined ? (
          <Card className="border-purple-200/50 dark:border-purple-800/30 bg-white/50 dark:bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-600 to-violet-600 text-transparent bg-clip-text">
                Join Room
              </CardTitle>
              <CardDescription>
                Connect with others to share files securely and quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinRoom} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor="roomId">Room ID</Label>
                      <Input
                        id="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter or generate a room id"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {role === "sender"
                          ? "Tip: Generate a room id and share it with receivers to start a group transfer."
                          : "Enter the room id provided by the sender."}
                      </p>
                    </div>
                    {/* Manual Generate button removed - room id is auto-generated for senders */}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Your name or device"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={setRole}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sender" id="sender" />
                        <Label htmlFor="sender">Sender</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receiver" id="receiver" />
                        <Label htmlFor="receiver">Receiver</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    Join as {role === "sender" ? "Sender" : "Receiver"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{nickname}</Badge>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-2">
                    <code className="rounded px-2 py-1 bg-purple-50 text-sm font-mono text-purple-700">{roomId}</code>
                    <Button variant="ghost" size="icon" onClick={copyRoomId} aria-label="Copy room id">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setJoined(false)}>
                    Leave
                  </Button>
                  <Button variant="destructive" onClick={leaveRoom}>
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {role === "sender" ? (
                <FileSender serverUrl={serverUrl} roomId={roomId} />
              ) : (
                <FileReceiver serverUrl={serverUrl} roomId={roomId} />
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Make sure both devices are on the same Wi-Fi or mobile hotspot.</p>
      </footer>
    </div>
  );
}

/* Inline styles to keep file self-contained. Replace with Tailwind/CSS as needed. */
const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0b1220",
    color: "#e6eef8",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    padding: "28px 28px 6px",
    textAlign: "center",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  form: {
    width: 520,
    background: "#071029",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 6px 20px rgba(2,6,23,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: "#9FB0C8",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #123041",
    background: "#071A2B",
    color: "#E6EEF8",
    outline: "none",
  },
  roleRow: {
    display: "flex",
    gap: 18,
    marginTop: 6,
    alignItems: "center",
  },
  roleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#E6EEF8",
  },
  actions: {
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  primaryBtn: {
    padding: "10px 16px",
    background: "#2563EB",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  panel: {
    width: 920,
    maxWidth: "95vw",
    background: "#071029",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 20px rgba(2,6,23,0.6)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
    color: "#9FB0C8",
  },
  content: {
    display: "flex",
    gap: 12,
  },
  ghostBtn: {
    padding: "8px 10px",
    background: "transparent",
    border: "1px solid #123041",
    borderRadius: 8,
    color: "#9FB0C8",
    cursor: "pointer",
  },
  footer: {
    padding: 12,
    textAlign: "center",
    color: "#7B8794",
  },
};
