export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {children}
    </div>
  )
}
