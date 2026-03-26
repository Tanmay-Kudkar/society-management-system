import { GoogleMap, MarkerF, CircleF, useJsApiLoader } from '@react-google-maps/api'

const mapContainerStyle = { height: '260px', width: '100%' }

export default function LocationPickerMap({ location, onPick }) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-login-location-picker',
    googleMapsApiKey,
  })

  if (!googleMapsApiKey) {
    return (
      <div className="flex h-[260px] items-center justify-center text-center text-sm text-[var(--text-secondary)]">
        Google Maps API key missing. Set VITE_GOOGLE_MAPS_API_KEY.
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[var(--text-secondary)]">
        Failed to load Google Maps.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[var(--text-secondary)]">
        Loading map...
      </div>
    )
  }

  const center = { lat: location.latitude, lng: location.longitude }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={16}
      onClick={(event) => {
        const lat = event.latLng?.lat()
        const lng = event.latLng?.lng()
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        onPick({ latitude: lat, longitude: lng })
      }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <CircleF
        center={center}
        radius={300}
        options={{
          strokeColor: '#0ea5e9',
          fillColor: '#38bdf8',
          fillOpacity: 0.2,
        }}
      />
      <MarkerF position={center} />
    </GoogleMap>
  )
}
