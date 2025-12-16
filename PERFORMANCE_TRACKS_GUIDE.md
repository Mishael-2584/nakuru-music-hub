# Performance Tracks & Scores - Complete Guide

## Overview
The Performance Tracks & Scores feature allows you to sell digital backing tracks and sheet music scores through your shop. Customers can preview audio and PDF scores before purchasing, and receive download links via email after payment.

---

## 🎯 How It Works

### **For Admins (Product Management)**

#### 1. **Creating a Performance Track Product**

1. Go to **Admin Panel → Shop → Product Manager**
2. Click **"Add New Product"**
3. Select category: **"Performance Tracks & Scores"**
4. Fill in basic product details:
   - Product Name (e.g., "Amazing Grace - Full Band")
   - Description
   - Price
   - Stock settings

#### 2. **Uploading Files**

For each product, you can upload:

**A. Preview Audio (Required for preview)**
- **Purpose**: Short audio preview customers can listen to before buying
- **File Types**: MP3, WAV, M4A, OGG, FLAC
- **Max Size**: 10MB
- **Location**: Stored in `preview-audio/` folder
- **Usage**: Customers can play this in the product preview

**B. Full Audio Track (Required for digital delivery)**
- **Purpose**: Complete backing track sent to customers after purchase
- **File Types**: MP3, WAV, M4A, OGG, FLAC
- **Max Size**: 100MB
- **Location**: Stored in `backing-tracks/` folder
- **Usage**: Download link sent in order confirmation email

**C. Score Preview PDF (Optional)**
- **Purpose**: First page of sheet music shown as preview
- **File Type**: PDF only
- **Max Size**: 50MB
- **Location**: Stored in `score-previews/` folder
- **Usage**: Customers can view first page before purchasing

**D. Part Name (Optional)**
- **Purpose**: For multi-part songs (e.g., "Vocal Part", "Guitar Part", "Piano Part")
- **Usage**: Displayed as a badge on the product card
- **Example**: If you have a song with 3 parts, create 3 separate products:
  - "Song Name - Vocal Part"
  - "Song Name - Guitar Part"
  - "Song Name - Piano Part"

#### 3. **Marking as Digital Product**

- Check **"Is Digital Product"** checkbox
- This ensures:
  - No shipping address required
  - Download link included in order email
  - Product marked as digital in order confirmation

---

### **For Customers (Shopping Experience)**

#### 1. **Browsing Products**

- Navigate to **Shop** page
- Click on **"Performance Tracks & Scores"** tab
- Products show:
  - Product image
  - Part name badge (if specified)
  - Price
  - Availability status

#### 2. **Previewing Products**

When clicking on a product, customers see:

**A. Audio Preview Player**
- Play/Pause button
- Progress bar showing playback position
- Stop button (appears when playing)
- Shows "Preview" badge

**B. Score Preview Button**
- Click to open PDF preview in a modal
- Shows first page of the score
- Message: "This is a preview of the first page. Purchase to download the full score."

#### 3. **Purchasing**

1. Add product to cart
2. Proceed to checkout
3. Fill in customer details (no shipping address needed for digital products)
4. Complete payment
5. Receive order confirmation email with:
   - Order details
   - **Digital Downloads section** with download button for each purchased track
   - Download links are valid indefinitely

---

## 📧 Email Delivery

### Order Confirmation Email Includes:

1. **Standard Order Information**
   - Order number
   - Customer details
   - Item list with quantities

2. **Digital Downloads Section** (for digital products only)
   - Separate section titled "🎵 Digital Downloads"
   - Each purchased track listed with:
     - Product name
     - Quantity (if multiple)
     - **Download button** linking directly to the audio file
   - Note: "Download links are valid indefinitely. Please save your files after downloading."

3. **Payment Instructions**
   - M-Pesa Paybill details
   - Bank transfer information

---

## 🗂️ File Storage Structure

Files are organized in the `images` bucket with subfolders:

```
images/
├── backing-tracks/          # Full audio tracks (100MB max)
│   └── [timestamp]-[random].mp3
├── preview-audio/           # Preview audio clips (10MB max)
│   └── preview-[timestamp]-[random].mp3
└── score-previews/          # PDF score previews (50MB max)
    └── score-[timestamp]-[random].pdf
```

---

## ✅ Implementation Status

### **✅ Completed Features:**

1. **Database Schema**
   - ✅ `audio_file_url` - Full track URL
   - ✅ `audio_filename` - Full track filename
   - ✅ `preview_audio_url` - Preview audio URL
   - ✅ `preview_audio_filename` - Preview audio filename
   - ✅ `score_preview_url` - PDF preview URL
   - ✅ `score_preview_filename` - PDF preview filename
   - ✅ `part_name` - Part/instrument name
   - ✅ `is_digital_product` - Digital product flag
   - ✅ `audio_file_url` in `shop_order_items` - For email delivery

2. **Admin Panel**
   - ✅ File upload for preview audio (10MB limit)
   - ✅ File upload for full audio (100MB limit)
   - ✅ File upload for score preview PDF (50MB limit)
   - ✅ Part name input field
   - ✅ Digital product checkbox
   - ✅ File validation and error handling

3. **Customer Shop**
   - ✅ Audio preview player with play/pause/stop
   - ✅ Progress bar for audio playback
   - ✅ PDF score preview modal
   - ✅ Part name badge on product cards
   - ✅ Category name updated to "Performance Tracks & Scores"

4. **Email System**
   - ✅ Digital downloads section in order confirmation
   - ✅ Download buttons for each purchased track
   - ✅ Proper handling of digital vs physical products

5. **Storage Policies**
   - ✅ Admin upload permissions for all file types
   - ✅ Public read access for previews
   - ✅ Public read access for downloads
   - ✅ Admin update/delete permissions

---

## 🚀 How to Use (Step-by-Step)

### **Creating Your First Performance Track:**

1. **Prepare Your Files:**
   - Create a short preview (30-60 seconds) of your backing track
   - Have the full backing track ready
   - (Optional) Create a PDF with just the first page of your score

2. **Create the Product:**
   ```
   Admin Panel → Shop → Product Manager → Add New Product
   ```

3. **Fill Product Details:**
   - Name: "Amazing Grace - Full Band"
   - Category: "Performance Tracks & Scores"
   - Price: 500 (KES)
   - Description: "Professional backing track for Amazing Grace"
   - Part Name: "Full Band" (optional)

4. **Upload Files:**
   - Click "Choose Preview Audio" → Select your preview file
   - Click "Choose Full Audio Track" → Select your full track
   - (Optional) Click "Choose Score Preview PDF" → Select PDF
   - Wait for uploads to complete (green checkmarks appear)

5. **Mark as Digital:**
   - Check "Is Digital Product" checkbox

6. **Save:**
   - Click "Create Product"
   - Product is now live in the shop!

### **For Multi-Part Songs:**

If a song has multiple parts (Vocal, Guitar, Piano), create separate products:

**Product 1:**
- Name: "Amazing Grace - Vocal Part"
- Part Name: "Vocal Part"
- Upload vocal-specific audio files

**Product 2:**
- Name: "Amazing Grace - Guitar Part"
- Part Name: "Guitar Part"
- Upload guitar-specific audio files

**Product 3:**
- Name: "Amazing Grace - Piano Part"
- Part Name: "Piano Part"
- Upload piano-specific audio files

Customers can purchase each part separately!

---

## 🔍 Testing the Feature

### **Test as Admin:**
1. Create a test product with all file types
2. Verify files upload successfully
3. Check product appears in shop

### **Test as Customer:**
1. Browse to Performance Tracks & Scores category
2. Click on a product
3. Test audio preview player
4. Test PDF score preview
5. Add to cart and complete checkout
6. Check email for download link
7. Verify download link works

---

## ⚠️ Important Notes

1. **File Sizes:**
   - Preview audio: Keep under 10MB for fast loading
   - Full audio: Can be up to 100MB
   - PDF preview: Keep under 50MB

2. **File Formats:**
   - Audio: MP3 recommended for best compatibility
   - PDF: Standard PDF format

3. **Storage:**
   - All files stored in Supabase Storage
   - Public URLs generated automatically
   - Files are accessible indefinitely

4. **Email Delivery:**
   - Download links sent immediately after order
   - Links remain valid forever
   - Customers should save files after downloading

5. **Multi-Part Songs:**
   - Each part must be a separate product
   - Use "Part Name" to distinguish them
   - Customers can buy individual parts or all parts

---

## 🐛 Troubleshooting

### **Upload Fails:**
- Check file size (must be under limits)
- Verify file format is supported
- Check internet connection
- Try compressing the file

### **Preview Not Playing:**
- Verify preview audio URL is set
- Check browser console for errors
- Ensure file is publicly accessible

### **Email Not Received:**
- Check spam folder
- Verify email address is correct
- Check Supabase Edge Function logs

### **Download Link Not Working:**
- Verify `audio_file_url` is saved in order items
- Check storage bucket permissions
- Ensure file wasn't deleted

---

## 📊 Database Fields Reference

### `shop_products` table:
- `audio_file_url` - Full track download URL
- `audio_filename` - Full track filename
- `preview_audio_url` - Preview audio URL
- `preview_audio_filename` - Preview audio filename
- `score_preview_url` - PDF preview URL
- `score_preview_filename` - PDF preview filename
- `part_name` - Part/instrument name
- `is_digital_product` - Boolean flag

### `shop_order_items` table:
- `audio_file_url` - Snapshot of download URL at time of purchase

---

## 🎉 You're All Set!

The Performance Tracks & Scores feature is fully implemented and ready to use. Start creating your products and selling digital music content!

For questions or issues, check the troubleshooting section above or review the implementation files.
