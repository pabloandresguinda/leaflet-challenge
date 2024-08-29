// URL for the GeoJSON data
const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson";

// Fetch the GeoJSON data
d3.json(earthquakeUrl).then(data => {
    createFeatures(data.features);
});

function createFeatures(earthquakeData) {

    function onEachFeature(feature, layer) {
        layer.bindPopup(`<h3>Magnitude: ${feature.properties.mag}</h3><hr><p>Location: ${feature.properties.place}</p><p>Depth: ${feature.geometry.coordinates[2]} km</p>`);
    }

    function markerSize(magnitude) {
        return magnitude * 4;
    }

    function markerColor(depth) {
        return depth > 90 ? "#ff5f65" :
               depth > 70 ? "#fca35d" :
               depth > 50 ? "#fdb72a" :
               depth > 30 ? "#f7db11" :
               depth > 10 ? "#dcf400" :
                            "#a3f600";
    }

    // Create a layer for the markers
    let markers = L.markerClusterGroup();

    let heatArray = [];

    earthquakeData.forEach(feature => {
        let latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        let depth = feature.geometry.coordinates[2];
        let magnitude = feature.properties.mag;

        // Add to heat map array
        heatArray.push([latlng[0], latlng[1], magnitude]);

        // Add markers to the cluster group
        markers.addLayer(L.circleMarker(latlng, {
            radius: markerSize(magnitude),
            fillColor: markerColor(depth),
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`<h3>Magnitude: ${magnitude}</h3><hr><p>Location: ${feature.properties.place}</p><p>Depth: ${depth} km</p>`));
    });

    let heat = L.heatLayer(heatArray, {
        radius: 25,
        blur: 15,
        maxZoom: 17
    });

    createMap(markers, heat);
}

function createMap(markers, heat) {

    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    });

    let satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    });

    let baseMaps = {
        "Street Map": street,
        "Satellite Map": satellite
    };

    let overlayMaps = {
        "Earthquakes": markers,
        "Heatmap": heat
    };

    let myMap = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [street, markers, heat]
    });

    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    // Add Legend
    let legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend"),
            grades = [0, 10, 30, 50, 70, 90],
            colors = [
                "#a3f600",
                "#dcf400",
                "#f7db11",
                "#fdb72a",
                "#fca35d",
                "#ff5f65"
            ];

        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
    };

    legend.addTo(myMap);
}