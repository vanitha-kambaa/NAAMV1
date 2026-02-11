#!/bin/bash
echo "=== Fixing iOS Bundle URL Issue ==="
echo ""
echo "Step 1: Stopping any running Metro/Expo processes..."
pkill -f "expo\|metro" || true
sleep 2

echo ""
echo "Step 2: Cleaning build artifacts..."
cd ios
rm -rf build
cd ..

echo ""
echo "Step 3: Rebuilding and installing on device..."
echo "This will:"
echo "  - Start Metro bundler"
echo "  - Build the app"
echo "  - Install on your connected device"
echo "  - Connect device to Metro automatically"
echo ""
echo "Make sure your iPhone is:"
echo "  ✓ Connected via USB"
echo "  ✓ Unlocked"
echo "  ✓ On the same Wi-Fi network as your Mac"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

npx expo run:ios --device
