import React from 'react'

const layout = ({children}:{children: React.ReactNode}) => {
  return (
    <div>
      <aside className="bg-blue-900 text-white w-1/5 p-4">
        <h1 className="text-2xl font-bold mb-6">Railway comfort indicator</h1>
        <nav className="flex flex-col gap-4">
          <button className="text-left hover:bg-blue-700 p-2 rounded">Home</button>
          <details className="group">
            <summary className="cursor-pointer hover:bg-blue-700 p-2 rounded">Measurement</summary>
            <div className="pl-4 space-y-2">
              <button className="hover:underline">Assessment</button>
              <button className="hover:underline">Regular Train</button>
            </div>
          </details>
          <button className="text-left hover:bg-blue-700 p-2 rounded">Training</button>
          <details className="group">
            <summary className="cursor-pointer hover:bg-blue-700 p-2 rounded">Data & Analytics</summary>
            <div className="pl-4 space-y-2">
              <button className="hover:underline">Analytics Maps</button>
              <button className="hover:underline">Search Data</button>
              <button className="hover:underline">Station</button>
              <button className="hover:underline">Device</button>
            </div>
          </details>
          <button className="text-left hover:bg-blue-700 p-2 rounded">Setting</button>
        </nav>
      </aside>
      {children}
    </div>
  )
}

export default layout
