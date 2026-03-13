import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents } from 'react-leaflet'

function LocationPicker({ location, onPick }) {
  useMapEvents({
    click: (event) => {
      onPick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    },
  })

  return null
}

export default function LocationPickerMap({ location, onPick }) {
  return (
    <MapContainer
      key={`${location.latitude}-${location.longitude}`}
      center={[location.latitude, location.longitude]}
      zoom={16}
      scrollWheelZoom
      style={{ height: '260px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={[location.latitude, location.longitude]}
        radius={300}
        pathOptions={{ color: '#0ea5e9', fillColor: '#38bdf8', fillOpacity: 0.2 }}
      />
      <CircleMarker
        center={[location.latitude, location.longitude]}
        radius={8}
        pathOptions={{ color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.95 }}
      />
      <LocationPicker location={location} onPick={onPick} />
    </MapContainer>
  )
}
