var descriptionSection = document.getElementById('description-section');
var descriptionBody = document.getElementById('description-body');
var closeButton = document.getElementById('close-btn');
closeButton.onclick = function(e) {
    descriptionSection.classList.remove('open');
}

var stationsData = [];

var map = L.map('map', {
    center:[-18.009669, 31.080442],
    zoom:17
});

let layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
   attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
   subdomains: 'abcd',
   maxZoom: 20,
   minZoom: 0
});

layer.addTo(map);

let markers = [];
let stations = L.markerClusterGroup({
    // iconCreateFunction:function(cluster) {
    //     return L.divIcon({html:`<div class="marker-cluster"><div>${cluster.getChildCount()}</div></div>`})
    // }
});

// load the csv data
d3.csv('stations.csv')
.then(data => {
    data.forEach((station, index)=> {
        station.id = index;

        return station;
    });

    console.log(data);

    getMarkers(data);
    stationsData = JSON.parse(JSON.stringify(data));
    // console.log(markers);
    // stations.addLayers(markers);

    map.addLayer(stations);
})
.catch(error => console.error);

function getMarkers(data) {
    data.map(station => {
        let icon = L.divIcon({
            className:'div-icon',
            html:'<div class="marker-icon"></div><span>' + station.Name + '</span>',
            popupAnchor: [80, -4],
        });

        let popupContent = getPopupContent(station);

        let marker = L.marker([
            parseFloat(station.latitude),
            parseFloat(station.longitude) 
        ], { 
            icon:icon, 
            title:station.Name,
            id:station.id
        }).bindPopup(popupContent)

        marker.on('click', function(e) {
            console.log("Marker was clicked");
            updateDescriptionSection(station);
        });


        stations.addLayer(marker);
    });

}

function getPopupContent(station) {
    return `<div class="popup">
        <div class="popup-header">${station.Name}</div>
        <div class="popup-body">
            <b>Description</b>
            <div>${station.Description}</div>
        </div>
    </div>`;
}

function updateDescriptionSection(station) {
    let images = station.images.split(',').map(image => {
        image = image.trim();
        
        return `<img src="images/${image}" alt="" srcset=""></img>`;
    });

    descriptionBody.innerHTML = `
        <div class="section-header">
            ${station.Name}
        </div>
        <div class="section-info">
            <div class="item">
                <div class="item-header">Power</div>
                <p>${station.Power}</p>
            </div>
            <div class="item">
                <div class="item-header">Description</div>
                <p>
                    ${station.Description}
                </p>
            </div>
        </div>
        <div class="image-section">
            ${images.join()}
        </div>`;

        if(!descriptionSection.classList.contains('open')) {
            descriptionSection.classList.add('open');
        }
    
}

map.on('click', function(e) {
    if(descriptionSection.classList.contains('open')) { descriptionSection.classList.remove('open'); }
});

// Search Mare
var inputSearch = document.getElementById("station-query");
var stationSuggestions = document.getElementById("station-suggestion");

inputSearch.oninput = function(e) {
    let text = e.target.value;

    if(text == "") {
        stationSuggestions.innerHTML = "";
    } else {
        // filter the data
        let results = searchStations(text);
        createListItems(results);
    }
}

function searchStations(value) {
    value = value.toLowerCase();

    return stationsData.filter(station => {
        if(station.Name.toLowerCase().includes(value) ){
            return station;
        }
        return false;
    });
}

function createListItems(filteredStation) {
	console.log(filteredStation);

	if(filteredStation.length == 0) {
		stationSuggestions.innerHTML = "";
		stationSuggestions.innerHTML = "<p class='text-danger'>No results Found</p>";
	}else {
		let docFrag = document.createDocumentFragment();

		// create a list of items
		filteredStation.forEach(station => {
			let coordinates = [parseFloat(station.latitude), parseFloat(station.longitude)];
			// address = station.s;

			var list = document.createElement('li');
            list.className = 'suggestion-item'
            list.setAttribute('data-coord', coordinates);
            list.setAttribute('data-zoom', 16);
            list.setAttribute("data-id", station.id);
			list.setAttribute('data-title', station.Name);

			list.innerHTML =  station.Name  + "<span class='text-muted'>, " + station.Power + "</span>";
			// <small>'+ address;+'</small>';

            list.addEventListener('click',flyToMarker);

            docFrag.appendChild(list);
		});

		// append the document frag to suggestions tab
        stationSuggestions.classList.remove("collapse");
		stationSuggestions.innerHTML = "";
		stationSuggestions.append(docFrag);
	}
}

function flyToMarker(e) {
    let { id, title, coord }= e.target.dataset;
	let coordinates = coord.split(',').map(coord => parseFloat(coord));

    console.log(coordinates);
    

    inputSearch.value = title;

    // hide the 
	stationSuggestions.classList.add("collapse");

	// fly to the give location
	map.flyTo(coordinates, 18);

    // // find the marker
    // let station = stationsData.find(station => )
    let marker = stations.getLayers().find(aMarker => aMarker.options.id == id);

    // // on movend toggle popup
    map.once("moveend", function(e) {
        // toggle popup 
        if(marker) {
            // marker.togglePopup();
            marker.fire('click');
        }
    });

}