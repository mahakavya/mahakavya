import React from 'react'

type Props = { groupId: string }

export const RPAManageButton: React.FC<Props> = ({ groupId }) => {
  return (
    <button className="px-2 py-1 bg-slate-100 rounded">Manage RPA {groupId}</button>
  )
}

export default RPAManageButton
