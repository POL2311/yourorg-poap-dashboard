import MarketNavbar from '@/components/ui/MarketNavbar' // navbar especial del market

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketNavbar />
      {children}
    </>
  )
}