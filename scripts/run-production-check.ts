import { ProductionReadinessChecker } from "./production-readiness-check"
import { ProductionIssuesFixer } from "./fix-production-issues"
import { DeploymentChecklist } from "./deployment-checklist"

async function runCompleteProductionCheck() {
  console.log("🚀 MAHAKAVYA PRODUCTION READINESS ANALYSIS")
  console.log("=".repeat(60))
  console.log("")

  try {
    // Step 1: Run production readiness check
    console.log("📊 STEP 1: Production Readiness Assessment")
    console.log("-".repeat(40))
    const checker = new ProductionReadinessChecker()
    const readinessResult = await checker.runAllChecks()

    console.log("\n")

    // Step 2: Run automated fixes if needed
    if (readinessResult.score < 90 || readinessResult.criticalIssues > 0) {
      console.log("🔧 STEP 2: Automated Issue Resolution")
      console.log("-".repeat(40))
      const fixer = new ProductionIssuesFixer()
      await fixer.executeAllFixes()
    } else {
      console.log("✅ STEP 2: Automated Issue Resolution")
      console.log("-".repeat(40))
      console.log("✅ No automated fixes needed - application is well-configured!")
    }

    console.log("\n")

    // Step 3: Generate deployment checklist
    console.log("📋 STEP 3: Deployment Checklist")
    console.log("-".repeat(40))
    const checklist = new DeploymentChecklist()
    const checklistResult = await checklist.generateChecklist()

    console.log("\n")
    console.log("🎯 FINAL PRODUCTION ASSESSMENT")
    console.log("=".repeat(60))

    // Calculate overall readiness
    const overallScore = Math.round(
      readinessResult.score * 0.6 +
        (checklistResult.readyForDeployment
          ? 40
          : (checklistResult.completedRequired / checklistResult.requiredItems) * 40),
    )

    console.log(`📈 Readiness Score: ${overallScore}%`)
    console.log(`🚨 Critical Issues: ${readinessResult.criticalIssues}`)
    console.log(`📋 Deployment Ready: ${checklistResult.readyForDeployment ? "YES" : "NO"}`)

    if (overallScore >= 90 && readinessResult.criticalIssues === 0) {
      console.log("\n🎉 EXCELLENT! Your application is PRODUCTION-READY!")
      console.log("\n✅ Key Strengths:")
      console.log("• Robust architecture with Next.js 14 + TypeScript")
      console.log("• Comprehensive security implementation")
      console.log("• Complete database schema with RLS policies")
      console.log("• Full-featured social platform capabilities")
      console.log("• Modern UI/UX with responsive design")
      console.log("• Enterprise-grade API infrastructure")

      console.log("\n🚀 Ready for immediate deployment!")

      console.log("\n📝 Next Steps:")
      console.log("1. Configure environment variables (.env.example → .env.local)")
      console.log("2. Run database migrations (npm run db:migrate)")
      console.log("3. Create admin user (npm run setup:admin)")
      console.log("4. Deploy to your platform (vercel --prod)")
    } else if (overallScore >= 70) {
      console.log("\n✅ GOOD! Your application is mostly ready for production.")
      console.log("\nAddress the remaining items in the checklist above.")
    } else {
      console.log("\n⚠️ NEEDS ATTENTION: Complete the required items before deployment.")
      console.log("\nFocus on the critical issues and required checklist items.")
    }

    console.log("\n" + "=".repeat(60))

    return {
      readinessScore: readinessResult.score,
      overallScore,
      criticalIssues: readinessResult.criticalIssues,
      deploymentReady: checklistResult.readyForDeployment,
      ready: overallScore >= 90 && readinessResult.criticalIssues === 0,
    }
  } catch (error) {
    console.error("❌ Error running production check:", error)
    return {
      readinessScore: 0,
      overallScore: 0,
      criticalIssues: 999,
      deploymentReady: false,
      ready: false,
    }
  }
}

// Main execution
if (require.main === module) {
  runCompleteProductionCheck().catch(console.error)
}

export { runCompleteProductionCheck }
