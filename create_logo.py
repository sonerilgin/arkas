#!/usr/bin/env python3
"""
Arkas Lojistik logo generator - Creates circular logos for PWA/desktop app
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_circular_logo(size=512):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw circular background - Arkas blue colors
    outer_color = (30, 58, 138)  # #1e3a8a
    inner_color = (59, 130, 246)  # #3b82f6
    
    # Outer circle
    draw.ellipse([0, 0, size, size], fill=outer_color)
    
    # Inner circle for gradient effect
    margin = size // 16
    draw.ellipse([margin, margin, size-margin, size-margin], fill=inner_color)
    
    # Try to load a font, fallback to default if not available
    try:
        # Try different font paths that might exist
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/System/Library/Fonts/Arial.ttf',
            '/Windows/Fonts/arial.ttf'
        ]
        
        font_large = None
        font_small = None
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                font_large = ImageFont.truetype(font_path, size // 10)
                font_small = ImageFont.truetype(font_path, size // 18)
                break
        
        if font_large is None:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
            
    except Exception:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw ARKAS text
    arkas_text = "ARKAS"
    bbox_arkas = draw.textbbox((0, 0), arkas_text, font=font_large)
    text_width_arkas = bbox_arkas[2] - bbox_arkas[0]
    text_height_arkas = bbox_arkas[3] - bbox_arkas[1]
    
    x_arkas = (size - text_width_arkas) // 2
    y_arkas = (size // 2) - text_height_arkas - (size // 20)
    
    draw.text((x_arkas, y_arkas), arkas_text, fill='white', font=font_large)
    
    # Draw LOJİSTİK text
    lojistik_text = "LOJİSTİK"
    bbox_lojistik = draw.textbbox((0, 0), lojistik_text, font=font_small)
    text_width_lojistik = bbox_lojistik[2] - bbox_lojistik[0]
    
    x_lojistik = (size - text_width_lojistik) // 2
    y_lojistik = (size // 2) + (size // 20)
    
    draw.text((x_lojistik, y_lojistik), lojistik_text, fill=(224, 242, 254), font=font_small)  # #e0f2fe
    
    # Draw a simple truck icon at the bottom
    truck_y = size - (size // 4)
    truck_size = size // 16
    
    # Truck body
    truck_body = [
        size//2 - truck_size*2, truck_y,
        size//2 + truck_size*2, truck_y,
        size//2 + truck_size*2, truck_y + truck_size,
        size//2 - truck_size*2, truck_y + truck_size
    ]
    draw.polygon(truck_body, fill='white')
    
    # Truck wheels
    wheel_radius = truck_size // 3
    draw.ellipse([
        size//2 - truck_size, truck_y + truck_size - wheel_radius,
        size//2 - truck_size + wheel_radius*2, truck_y + truck_size + wheel_radius
    ], fill='white')
    
    draw.ellipse([
        size//2 + truck_size - wheel_radius, truck_y + truck_size - wheel_radius,
        size//2 + truck_size + wheel_radius, truck_y + truck_size + wheel_radius
    ], fill='white')
    
    return img

def main():
    # Create logos in different sizes
    sizes = [16, 32, 64, 128, 192, 512]
    
    output_dir = '/app/frontend/public'
    
    for size in sizes:
        logo = create_circular_logo(size)
        
        if size == 16:
            # Create favicon.ico (multi-size)
            logo.save(f'{output_dir}/favicon.ico', format='ICO', sizes=[(16,16), (32,32), (64,64)])
        else:
            logo.save(f'{output_dir}/logo{size}.png', format='PNG')
    
    print("✅ Arkas Lojistik logos created successfully!")
    print("Generated files:")
    for size in sizes:
        if size == 16:
            print(f"  - favicon.ico (16x16, 32x32, 64x64)")
        else:
            print(f"  - logo{size}.png ({size}x{size})")

if __name__ == "__main__":
    main()