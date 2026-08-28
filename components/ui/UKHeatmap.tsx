// UK sunset heatmap — server component, no JS sent to browser

const QUALITY_COLOR: Record<string, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#4A5A78',
}

// Great Britain outline — clockwise from Land's End
// Projected onto viewBox 0 0 260 400
// x = (lng + 6.8) / 8.8 * 260  |  y = (59.2 - lat) / 9.3 * 400
const UK_PATH = [
  'M32,393',                              // Land's End
  'L78,380 L128,370',                     // south coast: Plymouth → Weymouth
  'L195,360 L230,356',                    // Brighton → Dungeness
  'L242,346 L244,336',                    // Dover → N Foreland
  'L231,318',                             // Thames estuary
  'L239,268 L209,267',                    // Norfolk → The Wash (concavity)
  'L204,240 L199,218',                    // Humber → Flamborough
  'L183,202 L159,180',                    // Whitby → Tyne
  'L142,150 L108,140',                    // Berwick → Edinburgh (Firth of Forth)
  'L125,126 L115,117',                    // Fife → Dundee
  'L139,88 L141,64',                      // Aberdeen → Fraserburgh
  'L118,52 L105,24 L55,24',              // Moray → John o'Groats → Cape Wrath
  'L30,75 L18,107',                       // Torridon → Ardnamurchan
  'L38,120 L39,145',                      // Oban → Tarbert
  'L32,169',                              // Mull of Kintyre
  'L60,161',                              // Ayr (simplified Firth of Clyde east)
  'L47,186 L96,186',                      // Galloway SW → Solway Firth
  'L103,220 L109,233',                    // Barrow → Blackpool
  'L70,253 L65,261',                      // Anglesey → NW Wales
  'L76,292',                              // Aberystwyth / Cardigan Bay
  'L42,315 L47,324',                      // Pembroke / St David's
  'L81,327 L120,334',                     // Swansea → Bristol Channel
  'L65,355',                              // Hartland / N Devon
  'Z',                                    // closes to Land's End
].join(' ')

interface HeatmapLocation {
  id:        string
  name:      string
  slug:      string
  latitude:  number
  longitude: number
  score:     number | null
  quality:   string | null
}

interface Props {
  locations: HeatmapLocation[]
}

function toSvg(lat: number, lng: number) {
  const x = (lng + 6.8) / 8.8 * 260
  const y = (59.2 - lat) / 9.3 * 400
  return { x: Math.round(x * 2) / 2, y: Math.round(y * 2) / 2 }
}

export function UKHeatmap({ locations }: Props) {
  const scored   = locations.filter(l => l.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const unscored = locations.filter(l => l.score === null)

  return (
    <svg
      viewBox="0 0 260 400"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      aria-label="Map of UK locations and tonight's sunset scores"
      role="img"
    >
      <defs>
        <filter id="hm-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>

      {/* UK silhouette */}
      <path
        d={UK_PATH}
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Unscored — barely visible placeholder dots */}
      {unscored.map(loc => {
        const { x, y } = toSvg(loc.latitude, loc.longitude)
        return (
          <circle key={loc.id} cx={x} cy={y} r={1.8} fill="rgba(255,255,255,0.12)" />
        )
      })}

      {/* Scored — layered glow rings */}
      {scored.map(loc => {
        const { x, y } = toSvg(loc.latitude, loc.longitude)
        const color = QUALITY_COLOR[loc.quality ?? 'poor'] ?? '#4A5A78'
        const showLabel = (loc.score ?? 0) >= 70

        return (
          <g key={loc.id} aria-label={`${loc.name}: ${loc.score}`}>
            {/* Outer diffuse bloom */}
            <circle cx={x} cy={y} r={10} fill={color} opacity={0.14} filter="url(#hm-glow)" />
            {/* Halo */}
            <circle cx={x} cy={y} r={5}  fill={color} opacity={0.22} />
            {/* Core */}
            <circle cx={x} cy={y} r={2.5} fill={color} opacity={0.92} />
            {showLabel && (
              <text
                x={x} y={y - 7}
                textAnchor="middle"
                fontSize="5.5"
                fill={color}
                opacity={0.80}
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                letterSpacing="-0.2"
              >
                {loc.score}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
