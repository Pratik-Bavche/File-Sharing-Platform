"use client";
import React, { useState, useCallback } from "react";
import { Users, Upload, File, FileText, FileImage, FileVideo, FileAudio } from "lucide-react";
import { useDropzone } from "react-dropzone";
import useWebRTCFileTransfer from "@/hooks/useWebRTCFileTransfer";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatBytes, getFileIcon } from "@/lib/utils";

export default function FileSender({ serverUrl, roomId }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { sendFile, progress, peers, totalPeers, transferStatus, connectionStates } =
    useWebRTCFileTransfer(serverUrl, roomId, "sender");

  const onDrop = useCallback((acceptedFiles) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    setIsDragging(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendFiles = () => {
    if (selectedFiles.length > 0) sendFile(selectedFiles);
  };

  return (
    <Card className="w-full border-purple-200/50 dark:border-purple-800/30 bg-white/50 dark:bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-purple-200/50">
              <AvatarFallback className="bg-purple-50 text-purple-700 font-medium">
                TX
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 text-transparent bg-clip-text">
                File Sender
              </CardTitle>
              <CardDescription>
                Share files with connected receivers
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
            <Users className="h-4 w-4" />
            {totalPeers} receiver{totalPeers !== 1 ? 's' : ''} connected
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div 
          {...getRootProps()} 
          className={cn(
            "flex flex-col items-center justify-center h-36 sm:h-48 px-4 transition-all border-2 border-dashed rounded-lg cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-950/30",
            isDragging || isDragActive ? "border-purple-500 bg-purple-100/50 dark:bg-purple-950/30 scale-[1.02]" : "border-purple-300/25 dark:border-purple-700/25",
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn(
            "w-10 h-10 mb-4 transition-all",
            isDragging || isDragActive ? "text-purple-500 animate-bounce" : "text-muted-foreground"
          )} />
          <p className="mb-2 text-sm font-medium text-center">
            {isDragging || isDragActive ? (
              <span className="text-purple-500">Drop your files here</span>
            ) : (
              <span>Drag and drop files here, or click to select files</span>
            )}
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Share any type of file
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected Files</h4>
              <Badge variant="secondary">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
            <ScrollArea className="h-[200px] w-full rounded-md border">
              <div className="p-4 space-y-2">
                {selectedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <FileIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span className="truncate">{file.type || 'Unknown type'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {transferStatus[file.name] ? (
                          <Badge
                            variant={
                              transferStatus[file.name].status === "completed"
                                ? "success"
                                : transferStatus[file.name].status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {transferStatus[file.name].status}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              onClick={handleSendFiles}
              disabled={selectedFiles.length === 0 || !totalPeers}
              className="w-full"
            >
              Send {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
              to {totalPeers} receiver{totalPeers !== 1 ? "s" : ""}
            </Button>
          </div>
        )}

        {peers.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Transfer Progress</h4>
            <div className="space-y-4">
              {peers.map((peerId) => (
                <div key={peerId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-purple-200/50">
                        <AvatarFallback className="bg-purple-50 text-purple-700 text-xs">
                          {peerId.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{peerId.slice(0, 6)}...</span>
                      <Badge variant={connectionStates?.[peerId] === 'connected' ? 'success' : 'secondary'}>
                        {connectionStates?.[peerId] === 'connected' ? 'Connected' : (connectionStates?.[peerId] || 'Connecting')}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{progress[peerId] || 0}%</span>
                  </div>
                  <Progress value={progress[peerId] || 0} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
