"use client"
import React, { useEffect, useState } from "react";
import useWebRTCFileTransfer from "@/hooks/useWebRTCFileTransfer";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Clock, File, FileText, FileImage, FileVideo, FileAudio } from "lucide-react";
import { formatBytes, getFileIcon } from "@/lib/utils";

export default function FileReceiver({ serverUrl, roomId }) {
  const { receiveFile, progress, connectionStates } = useWebRTCFileTransfer(serverUrl, roomId, "receiver");
  const [receivedFiles, setReceivedFiles] = useState([]);

  useEffect(() => {
    if (!receiveFile) return;
    receiveFile((file, metadata, senderId) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      // Add to received files list
      setReceivedFiles(prev => [...prev, {
        name: file.name,
        size: file.size,
        type: file.type,
        sender: senderId,
        timestamp: new Date()
      }]);
    });
  }, [receiveFile]);

  return (
    <Card className="w-full border-purple-200/50 dark:border-purple-800/30 bg-white/50 dark:bg-background/50 backdrop-blur-sm">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-purple-200/50">
              <AvatarFallback className="bg-purple-50 text-purple-700 font-medium">
                RX
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-violet-600 text-transparent bg-clip-text">
                File Receiver
              </h3>
              <p className="text-sm text-muted-foreground">Ready to receive files</p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Download className="mr-1 h-4 w-4" />
            {Object.values(connectionStates || {}).some(s => s === 'connected') ? 'Connected to sender' : 'Ready to receive'}
          </Badge>
        </div>

        {progress && Object.keys(progress).length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Incoming Transfers</h4>
            {Object.keys(progress).map(senderId => (
              <div key={senderId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-purple-200/50">
                      <AvatarFallback className="bg-purple-50 text-purple-700 text-xs">
                        {senderId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{senderId.slice(0, 6)}...</span>
                  </div>
                  <span className="text-sm font-medium">
                    {progress[senderId] || 0}%
                  </span>
                </div>
                <Progress value={progress[senderId] || 0} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {receivedFiles.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Received Files</h4>
                <Badge variant="secondary">
                  {receivedFiles.length} {receivedFiles.length === 1 ? 'file' : 'files'}
                </Badge>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {receivedFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <FileIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(file.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-purple-200/50">
                            <AvatarFallback className="bg-purple-50 text-purple-700 text-xs">
                              {file.sender.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Badge variant="secondary">
                            {formatBytes(file.size)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}