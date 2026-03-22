#!/bin/bash
cd "/Users/sick/Documents/Cursor/RECOMMEND AI"
pkill -f "node app.js" 2>/dev/null
sleep 1
echo "🚀 Starting Synq with logs..."
node app.js

