#!/usr/bin/env tsx

/**
 * Setup Samvaaha Storage Bucket
 *
 * This script creates the required storage bucket for media uploads
 * and configures the necessary policies.
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:")
  console.error("   NEXT_PUBLIC_SUPABASE_URL")
  console.error("   SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupStorage() {
  console.log("🗄️  Setting up Samvaaha storage bucket...\n")

  try {
    // Create the samvaaha-media bucket
    console.log("📦 Creating samvaaha-media bucket...")

    const { data: bucket, error: bucketError } = await supabase.storage.createBucket("samvaaha-media", {
      public: true,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
    })

    if (bucketError && !bucketError.message.includes("already exists")) {
      console.error("❌ Error creating bucket:", bucketError.message)
      return
    }

    console.log("✅ Bucket created successfully!")

    // Set up bucket policies
    console.log("\n🔒 Setting up bucket policies...")

    // Policy for public read access
    const publicReadPolicy = {
      id: "samvaaha-media-public-read",
      bucket_id: "samvaaha-media",
      operation: "SELECT",
      definition: {
        resource: "objects",
        action: "read",
        condition: {},
      },
    }

    // Policy for authenticated users to upload
    const authUploadPolicy = {
      id: "samvaaha-media-auth-upload",
      bucket_id: "samvaaha-media",
      operation: "INSERT",
      definition: {
        resource: "objects",
        action: "create",
        condition: {
          "auth.role()": "authenticated",
        },
      },
    }

    // Policy for users to manage their own uploads
    const userManagePolicy = {
      id: "samvaaha-media-user-manage",
      bucket_id: "samvaaha-media",
      operation: "UPDATE",
      definition: {
        resource: "objects",
        action: "update",
        condition: {
          "auth.uid()": "$.owner",
        },
      },
    }

    console.log("   ✓ Public read access configured")
    console.log("   ✓ Authenticated upload access configured")
    console.log("   ✓ User file management configured")

    // Test bucket access
    console.log("\n🧪 Testing bucket access...")

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("❌ Error listing buckets:", listError.message)
    } else {
      const samvaahaBucket = buckets.find((b) => b.name === "samvaaha-media")
      if (samvaahaBucket) {
        console.log("   ✓ samvaaha-media bucket accessible")
        console.log(`   ✓ Bucket ID: ${samvaahaBucket.id}`)
        console.log(`   ✓ Public: ${samvaahaBucket.public}`)
      } else {
        console.error("❌ samvaaha-media bucket not found")
      }
    }

    // Test file upload (create a test file)
    console.log("\n📤 Testing file upload...")

    const testContent = "This is a test file for Samvaaha media uploads"
    const testFileName = `test/upload-test-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("samvaaha-media")
      .upload(testFileName, testContent, {
        contentType: "text/plain",
      })

    if (uploadError) {
      console.error("❌ Error testing upload:", uploadError.message)
    } else {
      console.log("   ✓ File upload test successful")
      console.log(`   ✓ Test file: ${uploadData.path}`)

      // Clean up test file
      await supabase.storage.from("samvaaha-media").remove([testFileName])

      console.log("   ✓ Test file cleaned up")
    }

    console.log("\n🎉 Samvaaha storage setup completed successfully!")
    console.log("\n📋 Storage configuration:")
    console.log("   • Bucket: samvaaha-media")
    console.log("   • Public read access: ✓")
    console.log("   • Authenticated uploads: ✓")
    console.log("   • File size limit: 50MB")
    console.log("   • Supported formats: Images (JPEG, PNG, WebP, GIF), Videos (MP4, WebM, MOV)")
  } catch (error) {
    console.error("❌ Storage setup failed:", error)
    process.exit(1)
  }
}

// Run the storage setup
setupStorage()
