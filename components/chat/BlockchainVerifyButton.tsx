import React from 'react'

type Props = { groupId: string }

export const BlockchainVerifyButton: React.FC<Props> = ({ groupId }) => {
  return (
    <button className="px-2 py-1 bg-slate-100 rounded">Verify {groupId}</button>
  )
}

export default BlockchainVerifyButton
