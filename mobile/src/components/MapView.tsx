import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, StyleProp, ViewStyle, DimensionValue } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { theme } from "../theme";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  icon?: string;
  pulse?: boolean;
}

export interface MapRef {
  moveMarker: (id: string, lat: number, lng: number) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (pts: Array<[number, number]>) => void;
}

interface Props {
  markers?: MapMarker[];
  polyline?: Array<[number, number]>;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: DimensionValue;
  fitOnLoad?: boolean;
  interactive?: boolean;
  onMapPress?: (lat: number, lng: number) => void;
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

function buildHtml(
  markers: MapMarker[],
  polyline: Array<[number, number]>,
  center: { lat: number; lng: number },
  zoom: number,
  interactive: boolean,
  fitOnLoad: boolean,
): string {
  const markerJs = markers
    .map((m) => {
      const iconHtml = m.icon
        ? `<span style="font-size:${m.pulse ? 22 : 26}px">${m.icon}</span>`
        : `<span style="font-size:18px;font-weight:800;color:#fff">${(m.label || "").slice(0, 2).toUpperCase()}</span>`;
      const color = m.color || "#00B4D8";
      return `var mk = L.marker([${m.lat},${m.lng}],{icon:L.divIcon({className:'',html:'<div id="mk-${m.id}" style="width:38px;height:38px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.5)">${iconHtml}</div>',iconSize:[38,38],iconAnchor:[19,19]})});
mk.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:'${m.id}'}))});
mk.addTo(map);`;
    })
    .join("\n");

  const polyJs = polyline.length
    ? `L.polyline([${polyline
        .map(([a, b]) => `[${a},${b}]`)
        .join(",")}],{color:'${theme.accentBright}',weight:4,opacity:.9,dashArray:'2 8'}).addTo(map);`
    : "";

  const shouldFit = fitOnLoad && polyline.length >= 2 && polyline.every(([a, b]) => a !== 0 || b !== 0);
  const fitJs = shouldFit
    ? `map.fitBounds([${polyline
        .map(([a, b]) => `[${a},${b}]`)
        .join(",")}],{padding:[50,50]});`
    : "";

  const tapJs = interactive
    ? `map.on('click',function(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'tap',lat:e.latlng.lat,lng:e.latlng.lng}))});`
    : "";

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body,#map{height:100%;width:100%;margin:0;padding:0;background:${theme.bg};overflow:hidden}
${markers.map((m) => (m.pulse ? `@keyframes pbPulse{0%{box-shadow:0 0 0 0 rgba(34,211,238,.6)}100%{box-shadow:0 0 0 26px rgba(34,211,238,0)}} #mk-${m.id}{animation:pbPulse 1.8s infinite}` : "")).join("\n")}
.leaflet-tile-pane{-webkit-filter:brightness(.9);filter:brightness(.9)}
</style>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true,attributionControl:false,zoomSnap:0.1}).setView([${center.lat},${center.lng}],${zoom});
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19}).addTo(map);
${polyJs}
${markerJs}
${fitJs}
${tapJs}
window.PBR={
  moveMarker:function(id,lat,lng){
    var el=document.getElementById('mk-'+id); if(!el){return;}
    var p=el.closest('.leaflet-marker-icon'); if(!p){return;}
    p.style.transform='translate3d('+map.latLngToLayerPoint([lat,lng]).x+'px,'+map.latLngToLayerPoint([lat,lng]).y+'px,0)';
  },
  flyTo:function(lat,lng,zoom){map.flyTo([lat,lng],zoom||16,{duration:.8})},
  fitBounds:function(pts){map.fitBounds(pts,{padding:[60,60]})}
};
</script>
</body></html>`;
}

export const MapView = forwardRef<MapRef, Props>(function MapView(
  {
    markers = [],
    polyline = [],
    center = { lat: -17.8018, lng: 177.4534 },
    zoom = 11,
    height = 320,
    fitOnLoad = false,
    interactive = false,
    onMapPress,
    onMarkerPress,
    style,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () => buildHtml(markers, polyline, center, zoom, interactive, fitOnLoad),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(markers), JSON.stringify(polyline), center.lat, center.lng, zoom, interactive, fitOnLoad],
  );

  useImperativeHandle(ref, () => ({
    moveMarker: (id, lat, lng) =>
      webRef.current?.injectJavaScript(`window.PBR && window.PBR.moveMarker(${JSON.stringify(id)}, ${lat}, ${lng}); true;`),
    flyTo: (lat, lng, z) =>
      webRef.current?.injectJavaScript(`window.PBR && window.PBR.flyTo(${lat}, ${lng}, ${z ?? 16}); true;`),
    fitBounds: (pts) =>
      webRef.current?.injectJavaScript(`window.PBR && window.PBR.fitBounds(${JSON.stringify(pts)}); true;`),
  }));

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === "tap" && onMapPress) onMapPress(data.lat, data.lng);
      if (data.type === "marker" && onMarkerPress) onMarkerPress(data.id);
    } catch {
      // ignore
    }
  };

  return (
    <WebView
      ref={webRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={[styles.web, { height }, style]}
      onMessage={onMessage}
      allowsInlineMediaPlayback
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
});

const styles = StyleSheet.create({
  web: { backgroundColor: theme.bg, flexShrink: 1 },
});
