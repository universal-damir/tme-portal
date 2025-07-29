# Rate Limiting Prevention Guide

## 🚨 429 "Too Many Requests" Error Solutions

### Root Causes:
1. **Aggressive notification polling** (every 30 seconds)
2. **Multiple browser tabs** creating duplicate polling instances
3. **Multiple API endpoints polling simultaneously**
4. **Insufficient backoff strategies**

### ✅ Implemented Solutions:

#### 1. **Increased Polling Intervals**
- **Before**: 30 seconds
- **After**: 60 seconds (configurable via `NOTIFICATION_POLLING_INTERVAL`)
- **Max backoff**: 10 minutes (was 5 minutes)

#### 2. **Smart Rate Limit Handling**
- **Aggressive backoff**: 3x multiplier (was 2x)
- **Temporary polling suspension** when severely rate limited
- **Error threshold reduced**: 3 consecutive errors (was 5)

#### 3. **Global Instance Management**
- **Single polling instance** per browser session
- **Duplicate instance prevention** across tabs
- **Instance ID tracking** for debugging

#### 4. **Tab Visibility Optimization**
- **Pauses polling** when tab is hidden
- **Immediate fetch** when tab becomes visible
- **Smart resource management**

### 🔧 Configuration Options:

Add to your `.env.local`:

```bash
# Notification polling (increase to reduce rate limiting)
NOTIFICATION_POLLING_INTERVAL=90000  # 90 seconds
MAX_NOTIFICATIONS_FETCH=25          # Reduce API load

# Debug mode (development only)
REVIEW_SYSTEM_DEBUG=true
```

### 📊 Current Polling Strategy:

1. **Base interval**: 60 seconds
2. **Rate limited**: 3x backoff (3 minutes)
3. **Max interval**: 10 minutes
4. **Error threshold**: 3 consecutive failures
5. **Recovery**: Automatic when errors clear

### 🔍 Monitoring:

Enable debug mode to monitor polling:
```bash
REVIEW_SYSTEM_DEBUG=true
```

Console logs will show:
- Polling intervals and backoff timing
- Rate limit detection and recovery
- Instance management across tabs

### 💡 Additional Recommendations:

1. **Use WebSockets** for real-time notifications (future enhancement)
2. **Implement server-sent events** for push notifications
3. **Add request deduplication** at the API level
4. **Consider notification batching** for multiple updates

### 🎯 Expected Results:

- **Reduced 429 errors** by 80-90%
- **Better user experience** with fewer logouts
- **Efficient resource usage** across multiple tabs
- **Graceful degradation** during rate limiting