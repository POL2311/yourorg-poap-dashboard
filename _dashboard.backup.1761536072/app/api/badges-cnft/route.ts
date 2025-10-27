// app/api/badges-cnft/route.ts
import { NextResponse } from 'next/server'

type HeliusAsset = {
  id: string // asset id (para cNFT es tree+leaf hash)
  interface?: string // 'V1_NFT' | 'CompressedNFT' | ...
  compression?: { compressed: boolean }
  grouping?: Array<{ group_key: 'collection'; group_value: string }>
  content?: {
    metadata?: {
      name?: string
      description?: string
      attributes?: Array<{ trait_type?: string; value?: string }>
    }
    links?: { image?: string; external_url?: string }
  }
}

const API = 'https://api.helius.xyz'
const KEY = process.env.HELIUS_API_KEY!
const NET = (process.env.HELIUS_NETWORK || 'mainnet').toLowerCase() // mainnet|devnet

const ALLOWED_COLLECTIONS = (process.env.BADGE_COLLECTIONS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

function pickCollection(asset: HeliusAsset) {
  const g = asset.grouping?.find(g => g.group_key === 'collection')
  return g?.group_value
}

function attributesToMap(attrs?: Array<{ trait_type?: string; value?: string }>) {
  const map: Record<string,string> = {}
  attrs?.forEach(a => {
    if (!a) return
    if (a.trait_type) map[a.trait_type] = String(a.value ?? '')
  })
  return map
}

function pickRarityFromAttrs(attrs: Record<string,string>) {
  const r = (attrs['rarity'] || attrs['Rarity'] || '').toLowerCase()
  if (['legendary','epic','rare','uncommon','common'].includes(r)) return r as any
  return 'common' as const
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const owner = searchParams.get('owner') // public key del usuario

  if (!KEY) {
    return NextResponse.json({ success:false, error:'Falta HELIUS_API_KEY' }, { status:500 })
  }
  if (!owner) {
    return NextResponse.json({ success:false, error:'owner (public key) requerido' }, { status:400 })
  }

  try {
    // ===== 1) Paginación completa (paginationToken) =====
    let paginationToken: string | undefined = undefined
    const assets: HeliusAsset[] = []

    // limit razonable por página
    const limit = 100

    while (true) {
      const url = new URL(`${API}/v0/addresses/${owner}/assets`)
      url.searchParams.set('api-key', KEY)
      url.searchParams.set('limit', String(limit))
      // displayOptions para obtener metadata enriquecida
      url.searchParams.set('displayOptions', JSON.stringify({ showCollectionMetadata: true }))
      if (paginationToken) url.searchParams.set('paginationToken', paginationToken)
      if (NET === 'devnet') url.searchParams.set('network', 'devnet') // para devnet

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(`Helius error ${res.status}: ${t}`)
      }
      const data = await res.json() as {
        result: HeliusAsset[]
        paginationToken?: string
      } | HeliusAsset[] // Helius puede devolver array directo en algunas variantes

      // Normaliza resultado
      const pageItems = Array.isArray(data) ? data : (data.result || [])
      assets.push(...pageItems)

      paginationToken = Array.isArray(data) ? undefined : data.paginationToken
      if (!paginationToken || pageItems.length === 0) break
    }

    // ===== 2) Filtrar por colección (opcional) y quedarnos con NFTs/cNFTs =====
    const filtered = assets.filter(a => {
      // Interfaz de NFT o cNFT
      const isNftLike =
        a.interface?.toLowerCase().includes('nft') ||
        a.compression?.compressed === true

      if (!isNftLike) return false

      if (ALLOWED_COLLECTIONS.length === 0) return true
      const col = pickCollection(a)
      return col ? ALLOWED_COLLECTIONS.includes(col) : false
    })

    // ===== 3) Mapear a badges desbloqueados =====
    const unlockedBadges = filtered.map(a => {
      const name = a.content?.metadata?.name || 'NFT'
      const desc = a.content?.metadata?.description || 'NFT obtenido'
      const image = a.content?.links?.image || ''
      const attrsMap = attributesToMap(a.content?.metadata?.attributes)
      const rarity = pickRarityFromAttrs(attrsMap)

      return {
        id: a.id,                          // asset id (cNFT) o mint id (NFT)
        name,
        description: desc,
        icon: 'nft',
        rarity,
        unlocked: true,
        imageUrl: image,
        progress: undefined,
        target: undefined,
      }
    })

    // ===== 4) (Opcional) Badges bloqueados por catálogo simple =====
    // Si quieres gamificar por conteo total:
    const total = unlockedBadges.length
    const catalog = [
      { id:'collector-5',  name:'Coleccionista', desc:'Posee 5 POAPs',  rarity:'uncommon', target:5 },
      { id:'enthusiast-10',name:'Entusiasta',    desc:'Posee 10 POAPs', rarity:'rare',     target:10 },
    ]
    const lockedBadges = catalog
      .filter(c => total < c.target)
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.desc,
        icon: 'catalog',
        rarity: c.rarity as 'common'|'uncommon'|'rare'|'epic'|'legendary',
        unlocked: false,
        imageUrl: undefined,
        progress: Math.min(total, c.target),
        target: c.target,
      }))

    // ===== 5) Respuesta estandarizada para tu UI =====
    return NextResponse.json({
      success: true,
      data: {
        totalClaims: total,
        level: {
          level: Math.max(1, Math.floor(1 + total / 5)),
          name: total >= 10 ? 'Avanzado' : total >= 5 ? 'Intermedio' : 'Novato',
          color: '#a78bfa',
        },
        badges: [...unlockedBadges, ...lockedBadges],
      },
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' } })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ success:false, error: e?.message ?? 'internal error' }, { status:500 })
  }
}
