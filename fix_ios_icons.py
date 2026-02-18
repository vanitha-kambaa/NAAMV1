#!/usr/bin/env python3
"""
Script to remove alpha channel from iOS app icons.
This fixes the "Invalid large app icon" error from App Store Connect.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: PIL (Pillow) is not installed.")
    print("Please install it by running: pip3 install Pillow")
    sys.exit(1)

# Background color for iOS icons (green from app.json)
BACKGROUND_COLOR = (11, 178, 76)  # #0bb24c in RGB

def remove_alpha_channel(input_path, output_path, background_color):
    """Remove alpha channel by compositing onto solid background."""
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Create a new image with RGB mode (no alpha)
        rgb_img = Image.new('RGB', img.size, background_color)
        
        # Composite the original image onto the background
        rgb_img.paste(img, mask=img.split()[3])  # Use alpha channel as mask
        
        # Save as RGB PNG (no alpha channel)
        rgb_img.save(output_path, 'PNG', optimize=True)
        
        print(f"✓ Fixed: {os.path.basename(input_path)}")
        return True
    except Exception as e:
        print(f"✗ Error processing {input_path}: {e}")
        return False

def main():
    # Path to iOS app icons
    icons_dir = Path(__file__).parent / "ios" / "NAAM" / "Images.xcassets" / "AppIcon.appiconset"
    
    if not icons_dir.exists():
        print(f"ERROR: Icons directory not found: {icons_dir}")
        sys.exit(1)
    
    # Get all iOS icon files (not macOS or watchOS)
    ios_icon_files = [
        f for f in icons_dir.glob("icon-ios-*.png")
        if f.is_file()
    ]
    
    if not ios_icon_files:
        print("ERROR: No iOS icon files found!")
        sys.exit(1)
    
    print(f"Found {len(ios_icon_files)} iOS icon files to process...")
    print(f"Background color: RGB{BACKGROUND_COLOR} (#0bb24c)\n")
    
    # Process each icon
    success_count = 0
    for icon_file in ios_icon_files:
        # Create a temporary file
        temp_file = icon_file.with_suffix('.tmp.png')
        
        # Remove alpha channel
        if remove_alpha_channel(icon_file, temp_file, BACKGROUND_COLOR):
            # Replace original with fixed version
            temp_file.replace(icon_file)
            success_count += 1
    
    print(f"\n✓ Successfully fixed {success_count}/{len(ios_icon_files)} icon files!")
    print("\nNext steps:")
    print("1. Clean your Xcode build folder (Product > Clean Build Folder)")
    print("2. Rebuild your app")
    print("3. Archive and upload to App Store Connect")

if __name__ == "__main__":
    main()
