#!/bin/bash
# ============================================
# ROMUO.CH - Script de mise à jour Backend
# Usage: ./update_backend.sh
# ============================================

set -e  # Stop on error

BACKEND_FILE="/app/backend/server.py"
BACKUP_DIR="/app/backend/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ROMUO.CH - Backend Update Script        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Create backup directory
echo -e "${YELLOW}[1/4] Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"

# Step 2: Backup current server.py
echo -e "${YELLOW}[2/4] Backing up current server.py...${NC}"
if [ -f "$BACKEND_FILE" ]; then
    cp "$BACKEND_FILE" "$BACKUP_DIR/server_backup_$TIMESTAMP.py"
    echo -e "${GREEN}   ✓ Backup saved: server_backup_$TIMESTAMP.py${NC}"
else
    echo -e "${RED}   ✗ No existing server.py found${NC}"
fi

# Step 3: Check if new code file exists
NEW_CODE_FILE="/app/backend/server_new.py"
if [ -f "$NEW_CODE_FILE" ]; then
    echo -e "${YELLOW}[3/4] Applying new code from server_new.py...${NC}"
    cp "$NEW_CODE_FILE" "$BACKEND_FILE"
    rm "$NEW_CODE_FILE"  # Clean up
    echo -e "${GREEN}   ✓ New code applied${NC}"
else
    echo -e "${YELLOW}[3/4] No server_new.py found, keeping current code${NC}"
fi

# Step 4: Restart backend
echo -e "${YELLOW}[4/4] Restarting backend service...${NC}"
sudo supervisorctl restart backend
sleep 2

# Verify service is running
if sudo supervisorctl status backend | grep -q "RUNNING"; then
    echo -e "${GREEN}   ✓ Backend service restarted successfully${NC}"
else
    echo -e "${RED}   ✗ Backend service failed to start${NC}"
    echo -e "${YELLOW}   Rolling back to previous version...${NC}"
    if [ -f "$BACKUP_DIR/server_backup_$TIMESTAMP.py" ]; then
        cp "$BACKUP_DIR/server_backup_$TIMESTAMP.py" "$BACKEND_FILE"
        sudo supervisorctl restart backend
    fi
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Backend update completed!             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Test with: ${YELLOW}curl http://localhost:8001/api/vehicles${NC}"
