"use client"
import { useAIRecommendations } from "./useAIRecommendations"
import { useBlockchainVerification } from "./useBlockchainVerification"
import { useRPADrawManagement } from "./useRPADrawManagement"

const BhagyachakraPage = ({ id }) => {
  const { recommendations } = useAIRecommendations(id)
  const { isVerified, verifyDraw } = useBlockchainVerification(id)
  const { automateDrawTasks } = useRPADrawManagement(id)

  // Function to handle draw management tasks
  const handleDrawManagement = () => {
    automateDrawTasks()
    verifyDraw()
  }

  return (
    <div>
      <h1>Bhagyachakra Draw {id}</h1>
      <p>Recommendations: {recommendations.join(", ")}</p>
      <p>Draw Verified: {isVerified ? "Yes" : "No"}</p>
      <button onClick={handleDrawManagement}>Manage Draw</button>
      {/* rest of code here */}
    </div>
  )
}

export default BhagyachakraPage
