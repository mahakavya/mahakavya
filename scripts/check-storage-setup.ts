import { createSupabaseServerActionClient } from "@/lib/supabase"

interface BucketInfo {
  id: string
  name: string
  public: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

interface PolicyInfo {
  id: string
  name: string
  command: string
  table_name: string
  definition: string
}

async function checkStorageSetup() {
  console.log("🔍 Checking storage setup...\n")

  try {
    const supabase = createSupabaseServerActionClient()

    // Check if buckets exist
    console.log("📦 Checking storage buckets:")
    const { data: buckets, error: bucketsError } = await supabase
      .from("storage.buckets")
      .select("*")
      .in("id", ["posts", "reels", "chat", "campaigns"])

    if (bucketsError) {
      console.error("❌ Error fetching buckets:", bucketsError.message)
      return
    }

    const expectedBuckets = ["posts", "reels", "chat", "campaigns"]
    const existingBuckets = buckets?.map((b) => b.id) || []

    expectedBuckets.forEach((bucketId) => {
      const bucket = buckets?.find((b) => b.id === bucketId) as BucketInfo | undefined
      if (bucket) {
        console.log(
          `✅ ${bucketId}: ${bucket.public ? "Public" : "Private"}, Size limit: ${bucket.file_size_limit ? `${Math.round(bucket.file_size_limit / (1024 * 1024))}MB` : "None"}`,
        )
      } else {
        console.log(`❌ ${bucketId}: Missing`)
      }
    })

    // Check RLS policies
    console.log("\n🔒 Checking RLS policies:")
    const { data: policies, error: policiesError } = await supabase.rpc("get_storage_policies")

    if (policiesError) {
      console.log("⚠️  Could not fetch policies (this is normal if RPC function doesn't exist)")
    } else {
      const policyCount = policies?.length || 0
      console.log(`✅ Found ${policyCount} storage policies`)
    }

    // Test upload permissions (if authenticated)
    console.log("\n🧪 Testing upload permissions:")
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log(`✅ Authenticated as: ${user.email}`)

      // Test each bucket
      for (const bucketId of expectedBuckets) {
        try {
          const testFile = new Blob(["test"], { type: "text/plain" })
          const testPath = `${user.id}/test-${Date.now()}.txt`

          const { error: uploadError } = await supabase.storage.from(bucketId).upload(testPath, testFile)

          if (uploadError) {
            console.log(`❌ ${bucketId}: Upload failed - ${uploadError.message}`)
          } else {
            console.log(`✅ ${bucketId}: Upload successful`)

            // Clean up test file
            await supabase.storage.from(bucketId).remove([testPath])
          }
        } catch (error) {
          console.log(`❌ ${bucketId}: Upload test failed - ${error}`)
        }
      }
    } else {
      console.log("⚠️  Not authenticated - skipping upload tests")
    }

    // Check storage usage
    console.log("\n📊 Storage usage:")
    for (const bucketId of expectedBuckets) {
      try {
        const { data: files, error } = await supabase.storage.from(bucketId).list("", { limit: 1000 })

        if (error) {
          console.log(`❌ ${bucketId}: Could not list files - ${error.message}`)
        } else {
          const fileCount = files?.length || 0
          const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0
          console.log(`📁 ${bucketId}: ${fileCount} files, ${Math.round(totalSize / 1024)}KB total`)
        }
      } catch (error) {
        console.log(`❌ ${bucketId}: Error checking usage - ${error}`)
      }
    }

    console.log("\n✅ Storage setup check complete!")
  } catch (error) {
    console.error("❌ Error during storage setup check:", error)
  }
}

// Run the check
checkStorageSetup().catch(console.error)
