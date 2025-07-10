/**
 * ASR-GoT Backend Server
 * Node.js + Express + WebSocket + PostgreSQL
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// WebSocket Server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 900000; // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;

const rateLimit = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientId);
  
  if (now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

app.use(rateLimit);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      websocket: 'active'
    }
  });
});

// Session Management Routes
app.post('/api/sessions', async (req, res) => {
  try {
    const { topic, field, userId } = req.body;
    
    const session = await prisma.researchSession.create({
      data: {
        id: uuidv4(),
        topic: topic || 'Untitled Research',
        field: field || 'General Science',
        userId: userId || null,
        currentStage: 0,
        graphData: { nodes: [], edges: [], metadata: {} },
        parameters: {},
        stageResults: [],
        researchContext: { topic, field },
        apiUsage: { geminiCalls: 0, sonarCalls: 0, totalCost: 0 }
      }
    });
    
    // Broadcast session creation
    io.emit('session-created', {
      sessionId: session.id,
      topic: session.topic,
      field: session.field,
      timestamp: session.createdAt
    });
    
    res.json({ sessionId: session.id, session });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await prisma.researchSession.findUnique({
      where: { id: sessionId },
      include: {
        nodes: true,
        edges: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.put('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    const session = await prisma.researchSession.update({
      where: { id: sessionId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
    
    // Broadcast session update
    io.to(`session-${sessionId}`).emit('session-updated', {
      sessionId,
      changes: updateData,
      timestamp: new Date().toISOString()
    });
    
    res.json({ session });
  } catch (error) {
    console.error('Session update error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Graph Data Routes
app.post('/api/sessions/:sessionId/nodes', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const nodeData = req.body;
    
    const node = await prisma.graphNode.create({
      data: {
        ...nodeData,
        sessionId,
        confidence: nodeData.confidence || [0.5, 0.5, 0.5, 0.5]
      }
    });
    
    // Broadcast node creation
    io.to(`session-${sessionId}`).emit('node-created', {
      sessionId,
      node,
      timestamp: new Date().toISOString()
    });
    
    res.json({ node });
  } catch (error) {
    console.error('Node creation error:', error);
    res.status(500).json({ error: 'Failed to create node' });
  }
});

app.post('/api/sessions/:sessionId/edges', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const edgeData = req.body;
    
    const edge = await prisma.graphEdge.create({
      data: {
        ...edgeData,
        sessionId,
        confidence: edgeData.confidence || 0.5
      }
    });
    
    // Broadcast edge creation
    io.to(`session-${sessionId}`).emit('edge-created', {
      sessionId,
      edge,
      timestamp: new Date().toISOString()
    });
    
    res.json({ edge });
  } catch (error) {
    console.error('Edge creation error:', error);
    res.status(500).json({ error: 'Failed to create edge' });
  }
});

// API Usage Tracking
app.post('/api/usage', async (req, res) => {
  try {
    const { sessionId, userId, service, tokens, cost, endpoint } = req.body;
    
    const usage = await prisma.apiUsage.create({
      data: {
        sessionId: sessionId || null,
        userId: userId || null,
        service,
        tokens: tokens || 0,
        cost: cost || 0,
        endpoint: endpoint || null
      }
    });
    
    res.json({ usage });
  } catch (error) {
    console.error('Usage tracking error:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

// Bias Audit Routes
app.post('/api/sessions/:sessionId/bias-audit', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const auditData = req.body;
    
    const result = await prisma.biasAuditResult.create({
      data: {
        ...auditData,
        sessionId
      }
    });
    
    // Broadcast bias audit result
    io.to(`session-${sessionId}`).emit('bias-audit-result', {
      sessionId,
      result,
      timestamp: new Date().toISOString()
    });
    
    res.json({ result });
  } catch (error) {
    console.error('Bias audit error:', error);
    res.status(500).json({ error: 'Failed to create bias audit result' });
  }
});

// WebSocket Connection Handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join session room
  socket.on('join-session', async (sessionId) => {
    try {
      socket.join(`session-${sessionId}`);
      
      // Record session event
      await prisma.sessionEvent.create({
        data: {
          sessionId,
          type: 'client-connected',
          data: { socketId: socket.id, timestamp: new Date().toISOString() }
        }
      });
      
      socket.emit('session-joined', { sessionId });
      socket.to(`session-${sessionId}`).emit('user-joined', { socketId: socket.id });
      
      console.log(`Client ${socket.id} joined session ${sessionId}`);
    } catch (error) {
      console.error('Join session error:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });
  
  // Handle graph updates
  socket.on('graph-update', async (data) => {
    try {
      const { sessionId, type, payload } = data;
      
      // Record the event
      await prisma.sessionEvent.create({
        data: {
          sessionId,
          type: 'graph-update',
          data: { updateType: type, payload, timestamp: new Date().toISOString() }
        }
      });
      
      // Broadcast to all clients in session
      socket.to(`session-${sessionId}`).emit('graph-updated', {
        type,
        payload,
        timestamp: new Date().toISOString(),
        from: socket.id
      });
      
    } catch (error) {
      console.error('Graph update error:', error);
      socket.emit('error', { message: 'Failed to process graph update' });
    }
  });
  
  // Handle stage transitions
  socket.on('stage-transition', async (data) => {
    try {
      const { sessionId, fromStage, toStage, success, error } = data;
      
      // Update session in database
      await prisma.researchSession.update({
        where: { id: sessionId },
        data: { currentStage: toStage }
      });
      
      // Record the event
      await prisma.sessionEvent.create({
        data: {
          sessionId,
          type: 'stage-transition',
          data: { fromStage, toStage, success, error, timestamp: new Date().toISOString() }
        }
      });
      
      // Broadcast to all clients in session
      io.to(`session-${sessionId}`).emit('stage-transitioned', {
        fromStage,
        toStage,
        success,
        error,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Stage transition error:', error);
      socket.emit('error', { message: 'Failed to process stage transition' });
    }
  });
  
  // Handle LLM streaming
  socket.on('llm-stream', async (data) => {
    try {
      const { sessionId, stage, content, isComplete } = data;
      
      // Broadcast to all clients in session
      socket.to(`session-${sessionId}`).emit('llm-stream', {
        stage,
        content,
        isComplete,
        timestamp: new Date().toISOString(),
        from: socket.id
      });
      
    } catch (error) {
      console.error('LLM stream error:', error);
      socket.emit('error', { message: 'Failed to process LLM stream' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Notify other clients in all rooms this socket was in
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('session-')) {
        socket.to(room).emit('user-left', { socketId: socket.id });
      }
    });
  });
});

// System Metrics Collection
const collectSystemMetrics = async () => {
  try {
    const activeUsers = io.engine.clientsCount;
    const activeSessions = await prisma.researchSession.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    const totalNodes = await prisma.graphNode.count();
    const totalEdges = await prisma.graphEdge.count();
    
    const apiCalls = await prisma.apiUsage.groupBy({
      by: ['service'],
      _count: { service: true },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const apiCallsObj = apiCalls.reduce((acc, item) => {
      acc[item.service] = item._count.service;
      return acc;
    }, {});
    
    await prisma.systemMetrics.create({
      data: {
        activeUsers,
        activeSessions,
        totalNodes,
        totalEdges,
        apiCalls: apiCallsObj,
        systemLoad: process.cpuUsage ? process.cpuUsage().system / 1000000 : null
      }
    });
    
  } catch (error) {
    console.error('Metrics collection error:', error);
  }
};

// Collect metrics every 5 minutes
if (process.env.ENABLE_METRICS === 'true') {
  setInterval(collectSystemMetrics, 5 * 60 * 1000);
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  
  // Close WebSocket connections
  io.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close database connections
  await prisma.$disconnect();
  console.log('Database connections closed');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 ASR-GoT Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🗄️  Database connected via Prisma`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
});

export default app;