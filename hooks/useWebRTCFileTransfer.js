import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function useWebRTCFileTransfer(serverUrl, roomId, role) {
  const socket = useRef(null);
  const peerConnections = useRef(new Map()); // Store multiple peer connections
  const dataChannels = useRef(new Map()); // Store multiple data channels
  const pendingChannelOpenResolvers = useRef(new Map()); // Resolve when dataChannel opens per peer
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState({}); // Track progress per peer
  const [peers, setPeers] = useState([]); // Track connected peers in the room
  const [connectionStates, setConnectionStates] = useState({}); // Track per-peer RTCPeerConnection states
  const [transferStatus, setTransferStatus] = useState({}); // Track transfer status per file
  const fileQueue = useRef([]); // Queue for multiple files
  const isTransferring = useRef(false); // Flag to track if transfer is in progress

  useEffect(() => {
    socket.current = io(serverUrl);

    // Join room with role information
    socket.current.emit("join-room", { roomId, role });

    // Handle peer joining the room
    socket.current.on("peer-joined", ({ peerId, peerRole }) => {
      if (role === 'sender' && peerRole === 'receiver') {
        // Create new peer connection for the receiver
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Set up ICE candidate handling for this peer
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.current.emit("candidate", { roomId, peerId, candidate: e.candidate });
          }
        };

        peerConnections.current.set(peerId, pc);
        setPeers(prev => [...prev, peerId]);
        console.log(`New receiver joined: ${peerId}`);
      }
    });

    // Handle peer leaving
    socket.current.on("peer-left", ({ peerId }) => {
      if (peerConnections.current.has(peerId)) {
        peerConnections.current.get(peerId).close();
        peerConnections.current.delete(peerId);
        dataChannels.current.delete(peerId);
        setPeers(prev => prev.filter(p => p !== peerId));
        setProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[peerId];
          return newProgress;
        });
      }
    });

    // Handle receiving offer (for receivers)
    socket.current.on("offer", async ({ offer, from: peerId }) => {
      if (role === 'receiver') {
        console.log('Received offer from:', peerId);
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Set up data channel handling before setting remote description
        pc.ondatachannel = (event) => {
          console.log('Received data channel');
          const channel = event.channel;
          const chunks = [];
          let metadata = null;
          let receivedSize = 0;
          
          channel.onopen = () => {
            console.log('Data channel opened with sender:', peerId);
          };
          
          channel.onmessage = (e) => {
            try {
              const jsonMessage = JSON.parse(e.data);
              if (jsonMessage.type === 'metadata') {
                metadata = jsonMessage.data;
                console.log('Receiving file:', metadata);
                setProgress(prev => ({ ...prev, [peerId]: 0 }));
              } else if (jsonMessage.type === 'end') {
                const blob = new Blob(chunks, { type: metadata?.type || 'application/octet-stream' });
                const file = new File([blob], metadata.name, {
                  type: metadata.type,
                  lastModified: metadata.lastModified
                });
                onFileReceived?.(file, metadata, peerId);
                setProgress(prev => ({ ...prev, [peerId]: 100 }));
                chunks.length = 0; // Clear chunks array
              }
            } catch {
              // If it's not JSON, it's file data
              chunks.push(e.data);
              if (metadata) {
                receivedSize += e.data.byteLength;
                setProgress(prev => ({
                  ...prev,
                  [peerId]: Math.round((receivedSize / metadata.size) * 100)
                }));
              }
            }
          };

          dataChannels.current.set(peerId, channel);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.current.emit("candidate", { roomId, peerId, candidate: e.candidate });
          }
        };

        peerConnections.current.set(peerId, pc);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.emit("answer", { roomId, peerId, answer });
      }
    });

    // Handle receiving answer (for sender)
    socket.current.on("answer", async ({ answer, from: peerId }) => {
      if (role === 'sender' && peerConnections.current.has(peerId)) {
        await peerConnections.current.get(peerId).setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    // Handle ICE candidates
    socket.current.on("candidate", async ({ candidate, from: peerId }) => {
      try {
        if (peerConnections.current.has(peerId)) {
          await peerConnections.current.get(peerId).addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    // Get current peers in room
    socket.current.on("room-peers", ({ peers: roomPeers }) => {
      const relevantPeers = roomPeers.filter(p => 
        (role === 'sender' && p.role === 'receiver') ||
        (role === 'receiver' && p.role === 'sender')
      );
      setPeers(relevantPeers.map(p => p.id));
    });

    return () => {
      // Clean up all connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      dataChannels.current.clear();
      socket.current.disconnect();
    };
  }, [serverUrl, roomId]);

  // If peers arrive and there are queued files, start processing
  useEffect(() => {
    if (peers.length > 0 && fileQueue.current.length > 0 && !isTransferring.current) {
      processNextFile();
    }
  }, [peers]);

  // Process the next file in queue
  const processNextFile = async () => {
    if (fileQueue.current.length === 0 || isTransferring.current) {
      return;
    }

    isTransferring.current = true;
    const currentFile = fileQueue.current[0];
    // mark as in-progress
    setTransferStatus(prev => ({
      ...prev,
      [currentFile.name]: { status: 'in-progress', timestamp: new Date() }
    }));
    // initialize progress for peers
    peers.forEach(pid => setProgress(prev => ({ ...prev, [pid]: 0 })) );
    
    try {
      await sendSingleFile(currentFile);
      // Remove the processed file from queue
      fileQueue.current.shift();
      setTransferStatus(prev => ({
        ...prev,
        [currentFile.name]: { status: 'completed', timestamp: new Date() }
      }));
    } catch (error) {
      console.error('Error sending file:', error);
      setTransferStatus(prev => ({
        ...prev,
        [currentFile.name]: { status: 'failed', error: error.message, timestamp: new Date() }
      }));
    }

    isTransferring.current = false;
    // Process next file if any
    processNextFile();
  };

  // Ensure a RTCPeerConnection exists for a given peer (create on demand)
  const ensurePeerConnection = (peerId) => {
    if (peerConnections.current.has(peerId)) return peerConnections.current.get(peerId);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.current.emit("candidate", { roomId, peerId, candidate: e.candidate });
      }
    };

    // For receivers (when this client is a receiver) the remote side will create the datachannel
    pc.ondatachannel = (event) => {
      console.log('ondatachannel (ensure) from peer', peerId);
      const channel = event.channel;
      const chunks = [];
      let metadata = null;
      let receivedSize = 0;

      channel.onopen = () => {
        console.log('data channel opened (ensure) with sender:', peerId);
        setConnectionStates(prev => ({ ...prev, [peerId]: 'connected' }));
      };

      channel.onmessage = (e) => {
        try {
          const jsonMessage = JSON.parse(e.data);
          if (jsonMessage.type === 'metadata') {
            metadata = jsonMessage.data;
            console.log('Receiving file (ensure):', metadata);
            setProgress(prev => ({ ...prev, [peerId]: 0 }));
          } else if (jsonMessage.type === 'end') {
            const blob = new Blob(chunks, { type: metadata?.type || 'application/octet-stream' });
            const file = new File([blob], metadata.name, {
              type: metadata.type,
              lastModified: metadata.lastModified
            });
            // call global/window callback if present (backwards compat)
            if (typeof window.onFileReceived === 'function') window.onFileReceived(file, metadata, peerId);
            setProgress(prev => ({ ...prev, [peerId]: 100 }));
            chunks.length = 0;
          }
        } catch {
          // not JSON -> binary chunk
          chunks.push(e.data);
          if (metadata) {
            receivedSize += e.data.byteLength;
            setProgress(prev => ({
              ...prev,
              [peerId]: Math.round((receivedSize / metadata.size) * 100)
            }));
          }
        }
      };

      dataChannels.current.set(peerId, channel);
    };

    pc.onconnectionstatechange = () => {
      setConnectionStates(prev => ({ ...prev, [peerId]: pc.connectionState }));
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        try { pc.close(); } catch (e) {}
        peerConnections.current.delete(peerId);
        dataChannels.current.delete(peerId);
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  // Add files to queue and start processing
  const sendFile = async (files) => {
    if (!files) return;

    const fileArray = Array.isArray(files) ? files : [files];
    
    // Add files to queue and update status
    fileArray.forEach(file => {
      fileQueue.current.push(file);
      setTransferStatus(prev => ({
        ...prev,
        [file.name]: { status: 'queued', timestamp: new Date() }
      }));
    });

    // Start processing if not already transferring
    // If peers are connected start processing now, otherwise wait until peers arrive
    if (!isTransferring.current && peers.length > 0) {
      processNextFile();
    }
  };

  // Send a single file to all peers
  const sendSingleFile = async (file) => {
    const metadata = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      lastModified: file.lastModified,
      id: Math.random().toString(36).substr(2, 9) // Unique ID for this transfer
    };
    console.log('Preparing to send file:', metadata);

    // Send to peers sequentially to avoid negotiation/race issues
    for (const peerId of peers) {
      // ensure a PC exists for this peer (create on demand)
      const pc = ensurePeerConnection(peerId);
      if (!pc) {
        console.log('Failed to create or get peer connection for:', peerId);
        continue;
      }

      try {
        await sendToPeer(peerId, pc, file, metadata);
      } catch (err) {
        console.error('Error sending to peer', peerId, err);
      }
    }
  };

  // Send file to a single peer: creates datachannel, negotiates offer/answer, waits for open, streams
  const sendToPeer = (peerId, pc, file, metadata) => {
    return new Promise(async (resolve, reject) => {
      try {
        // if a channel already exists and is open, reuse it
        let existing = dataChannels.current.get(peerId);
        if (existing && existing.readyState === 'open') {
          console.log('Reusing existing data channel for', peerId);
          await streamOverChannel(existing, peerId, file, metadata);
          return resolve();
        }

        const dataChannel = pc.createDataChannel('file-transfer');
        dataChannel.binaryType = 'arraybuffer';
        dataChannels.current.set(peerId, dataChannel);
        setProgress(prev => ({ ...prev, [peerId]: 0 }));

        dataChannel.onerror = (err) => console.error('DataChannel error', peerId, err);
        dataChannel.onclose = () => console.log('DataChannel closed for', peerId);

        // When open, stream the file
        dataChannel.onopen = async () => {
          try {
            setConnectionStates(prev => ({ ...prev, [peerId]: 'connected' }));
            await streamOverChannel(dataChannel, peerId, file, metadata);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        // create offer and send
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.current.emit('offer', { roomId, peerId, offer });

        // fallback timeout if channel doesn't open
        const openTimeout = setTimeout(() => {
          if (dataChannel.readyState !== 'open') {
            reject(new Error('Data channel open timeout'));
          }
        }, 20000);

        // clear timeout when channel opens or closes
        const cleanup = () => clearTimeout(openTimeout);
        dataChannel.addEventListener('open', cleanup, { once: true });
        dataChannel.addEventListener('close', cleanup, { once: true });
      } catch (err) {
        reject(err);
      }
    });
  };

  // Stream file chunks over an opened data channel
  const streamOverChannel = async (dataChannel, peerId, file, metadata) => {
    const chunkSize = 16 * 1024;
    let offset = 0;

    // send metadata
    dataChannel.send(JSON.stringify({ type: 'metadata', data: metadata }));
    await new Promise(resolve => setTimeout(resolve, 50));

    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      const buffer = await slice.arrayBuffer();

      if (dataChannel.readyState !== 'open') throw new Error('Channel closed during transfer');

      dataChannel.send(buffer);
      offset += buffer.byteLength;

      const p = Math.round((offset / file.size) * 100);
      setProgress(prev => ({ ...prev, [peerId]: p }));

      if (offset % (chunkSize * 8) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    if (dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({ type: 'end' }));
      setProgress(prev => ({ ...prev, [peerId]: 100 }));
    }
  };

  // Receiver: set up handler for receiving files
  const receiveFile = (onFileReceived) => {
    // We don't need to do anything here because the ondatachannel handler
    // is already set up in the "offer" event handler above.
    // This is just to store the callback for when we receive a file
    window.onFileReceived = onFileReceived;
  };

  return { 
    sendFile, 
    receiveFile, 
    connected, 
    progress,
    peers,
    connectionStates,
    totalPeers: peers.length,
    transferStatus, // Status of each file transfer
    queueLength: fileQueue.current.length // Number of files in queue
  };
}
